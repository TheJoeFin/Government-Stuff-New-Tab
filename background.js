// Government Stuff New Tab Extension - Background Service Worker
// Implements Legistar aggregation for Milwaukee government calendars

const LEGISTAR_CLIENTS = ["milwaukee", "milwaukeecounty"]
const CACHE_KEY = "legistar_calendar_cache"
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours fallback window
const SOURCE_LABELS = {
  milwaukee: "City of Milwaukee",
  milwaukeecounty: "Milwaukee County",
}

const SOURCE_COLORS = {
  milwaukee: "#0077be",
  milwaukeecounty: "#ffa500",
}

const GRANICUS_VIDEO_BASES = {
  milwaukee: "https://milwaukee.granicus.com/player/clip/",
}

class StorageLayer {
  constructor() {
    this.session = chrome.storage.session ?? null
    this.local = chrome.storage.local
  }

  async get(key) {
    if (this.session) {
      const data = await this.session.get(key)
      if (data && Object.prototype.hasOwnProperty.call(data, key)) {
        return data[key]
      }
    }
    const fallback = await this.local.get(key)
    return fallback[key]
  }

  async set(key, value) {
    if (this.session) {
      await this.session.set({ [key]: value })
      return
    }
    await this.local.set({ [key]: value })
  }
}

class LegistarApiClient {
  constructor() {
    this.baseUrl = "https://webapi.legistar.com/v1/"
    this.maxRetries = 3
  }

  async fetchClientEvents(client) {
    const url = this.buildEventsUrl(client)
    console.log(`[Legistar] Fetching events for ${client}: ${url}`)

    const payload = await this.fetchWithRetry(url)
    const count = Array.isArray(payload) ? payload.length : 0
    console.log(`[Legistar] Received ${count} raw events for ${client}`)
    if (count > 0) {
      console.log(`[Legistar] First raw event for ${client}:`, payload[0])
    }
    return Array.isArray(payload) ? payload : []
  }

  async fetchSingleEvent(client, eventId) {
    const url = `${this.baseUrl}${client}/Events/${eventId}`
    console.log(`[Legistar] Fetching single event: ${url}`)
    return await this.fetchWithRetry(url)
  }

  async fetchWithRetry(url, attempt = 0) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Legistar request failed: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      if (attempt >= this.maxRetries - 1) {
        console.warn(
          `[Legistar] Fetch failed after retries (${attempt + 1}) for ${url}:`,
          error,
        )
        throw error
      }
      const delay = Math.pow(2, attempt) * 500
      console.warn(
        `[Legistar] Fetch failed (attempt ${attempt + 1}) for ${url}. Retrying in ${delay}ms`,
        error,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.fetchWithRetry(url, attempt + 1)
    }
  }

  buildEventsUrl(client) {
    const searchParams = new URLSearchParams()
    searchParams.set("$filter", this.buildUpcomingFilter())
    searchParams.set("$orderby", "EventDate asc")
    searchParams.set("$top", "200")
    return `${this.baseUrl}${client}/Events?${searchParams.toString()}`
  }

  buildUpcomingFilter() {
    const lookback = this.getPreviousWeekMonday()
    const formatted = this.formatDateForFilter(lookback)
    console.log(
      "[Legistar API] Building filter with lookback date:",
      lookback.toISOString(),
      "formatted:",
      formatted,
    )
    return `EventDate ge datetime'${formatted}'`
  }

  getPreviousWeekMonday() {
    const today = new Date()
    const currentDay = today.getDay()
    // Calculate days back to last Monday (1-7 days)
    const daysToLastMonday = currentDay === 0 ? 6 : currentDay - 1
    // Then go back another 7 days to get previous week's Monday
    const daysToSubtract = daysToLastMonday + 7
    const previousMonday = new Date(today)
    previousMonday.setDate(today.getDate() - daysToSubtract)
    previousMonday.setHours(0, 0, 0, 0)
    console.log(
      "[Legistar API] getPreviousWeekMonday:",
      "today =",
      today.toDateString(),
      "result =",
      previousMonday.toDateString(),
    )
    return previousMonday
  }

  formatDateForFilter(date) {
    const pad = (value) => String(value).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}`
  }
}

class EventNormalizer {
  constructor(source) {
    this.source = source
    this.sourceLabel = SOURCE_LABELS[source] ?? source
  }

  normalize(events) {
    return events.map((event) => this.toNormalizedEvent(event)).filter(Boolean)
  }

  toNormalizedEvent(event) {
    if (!event) return null

    const eventId = event.EventId ?? event.EventGuid
    const key = `${this.source}-${eventId}`

    const startDate = this.combineDateTime(
      event.EventDate,
      event.EventTime,
      event.EventDate,
    )

    if (!startDate) return null

    const endDate = this.combineDateTime(
      event.EventEnd,
      event.EventEnd,
      event.EventDate,
    )

    const agendaUrl =
      event.EventAgendaFile ||
      (event.EventInSiteAgendaLink &&
      event.EventInSiteAgendaLink !== event.EventInSiteURL
        ? event.EventInSiteAgendaLink
        : null)
    const minutesUrl = event.EventMinutesFile
    const videoUrl =
      event.EventVideoPath ||
      event.EventVideoHtml5Path ||
      (event.EventMedia && GRANICUS_VIDEO_BASES[this.source]
        ? `${GRANICUS_VIDEO_BASES[this.source]}${event.EventMedia}`
        : null)

    return {
      id: key,
      rawEventId: eventId,
      source: this.source,
      sourceLabel: this.sourceLabel,
      sourceColor: SOURCE_COLORS[this.source],
      bodyName: event.EventBodyName,
      bodyId: event.EventBodyId,
      title: event.EventName || event.EventBodyName || "Government Meeting",
      category: event.EventTypeName,
      location: event.EventLocation || "TBD",
      startDateTime: startDate,
      endDateTime: endDate,
      agendaUrl,
      minutesUrl,
      videoUrl,
      meetingUrl: event.EventInSiteURL || null,
      lastModified: this.normalizeDateValue(
        event.EventLastModifiedUtc || event.EventLastModified,
      ),
      richText: event.EventAgendaNote || "",
    }
  }

  combineDateTime(primary, timeString, fallbackDate) {
    const baseDate =
      this.parseLegistarDate(primary) ?? this.parseLegistarDate(fallbackDate)

    if (!baseDate) return null

    if (timeString) {
      const timeAsDate = this.parseLegistarDate(timeString)
      if (timeAsDate) {
        baseDate.setHours(
          timeAsDate.getHours(),
          timeAsDate.getMinutes(),
          timeAsDate.getSeconds(),
          0,
        )
      } else if (typeof timeString === "string") {
        const parsed = this.parseTimeString(timeString)
        if (parsed) {
          baseDate.setHours(
            parsed.hours,
            parsed.minutes,
            parsed.seconds ?? 0,
            0,
          )
        }
      }
    }

    return baseDate.toISOString()
  }

  parseTimeString(value) {
    if (typeof value !== "string") return null
    const trimmed = value.trim()

    const meridiemMatch = /^\s*(\d{1,2}):(\d{2})\s*([AP]M)\s*$/i.exec(trimmed)
    if (meridiemMatch) {
      let hours = parseInt(meridiemMatch[1], 10)
      const minutes = parseInt(meridiemMatch[2], 10)
      const period = meridiemMatch[3].toUpperCase()
      if (period === "PM" && hours < 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      return { hours, minutes, seconds: 0 }
    }

    const twentyFourMatch = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(
      trimmed,
    )
    if (twentyFourMatch) {
      const hours = parseInt(twentyFourMatch[1], 10)
      const minutes = parseInt(twentyFourMatch[2], 10)
      const seconds = parseInt(twentyFourMatch[3] ?? "0", 10)
      if (hours < 24 && minutes < 60 && seconds < 60) {
        return { hours, minutes, seconds }
      }
    }

    return null
  }

  parseLegistarDate(value) {
    if (!value) return null

    if (value instanceof Date) {
      return new Date(value.getTime())
    }

    if (typeof value === "number") {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return null

      const msMatch = /Date\(([-+]?\d+)(?:[-+]\d+)?\)/i.exec(trimmed)
      if (msMatch) {
        const timestamp = parseInt(msMatch[1], 10)
        if (!Number.isNaN(timestamp)) {
          const date = new Date(timestamp)
          return Number.isNaN(date.getTime()) ? null : date
        }
      }

      const numeric = Number(trimmed)
      if (!Number.isNaN(numeric)) {
        const fromNumber = new Date(
          trimmed.length <= 10 ? numeric * 1000 : numeric,
        )
        if (!Number.isNaN(fromNumber.getTime())) {
          return fromNumber
        }
      }

      const fromString = new Date(trimmed)
      if (!Number.isNaN(fromString.getTime())) {
        return fromString
      }
    }

    return null
  }

  normalizeDateValue(value) {
    const parsed = this.parseLegistarDate(value)
    return parsed ? parsed.toISOString() : null
  }
}

class EventConsolidator {
  deduplicate(events) {
    const map = new Map()
    events.forEach((event) => {
      const key = this.buildKey(event)
      if (!map.has(key)) {
        map.set(key, event)
        return
      }
      const existing = map.get(key)
      map.set(key, this.merge(existing, event))
    })
    return Array.from(map.values())
  }

  buildKey(event) {
    const parts = [event.source, event.bodyId, event.startDateTime]
    return parts.filter(Boolean).join("::")
  }

  merge(a, b) {
    const prioritized = { ...a }
    const preferB = (field) => {
      if (b[field] && !a[field]) {
        prioritized[field] = b[field]
      }
    }

    ;["agendaUrl", "minutesUrl", "videoUrl", "meetingUrl", "richText"].forEach(
      preferB,
    )

    return prioritized
  }
}

class LegistarAggregator {
  constructor(storage) {
    this.storage = storage
    this.apiClient = new LegistarApiClient()
    this.consolidator = new EventConsolidator()
  }

  async getEvents({ forceRefresh = false } = {}) {
    const cached = await this.storage.get(CACHE_KEY)
    const now = Date.now()

    if (cached && !forceRefresh) {
      const age = now - (cached.fetchedAt ?? 0)
      if (age < CACHE_TTL_MS && Array.isArray(cached.events)) {
        return { ...cached, fromCache: true }
      }
    }

    try {
      const fresh = await this.sync()
      return { ...fresh, fromCache: false }
    } catch (error) {
      console.error("Legistar sync failed", error)
      if (cached && now - (cached.fetchedAt ?? 0) < CACHE_MAX_AGE_MS) {
        return { ...cached, fromCache: true, stale: true }
      }
      throw error
    }
  }

  async sync() {
    const now = new Date()

    const fetchPromises = LEGISTAR_CLIENTS.map(async (client) => {
      try {
        const events = await this.apiClient.fetchClientEvents(client)
        const normalizer = new EventNormalizer(client)
        const normalizedRaw = normalizer.normalize(events)
        console.log(
          `[Legistar] Normalized raw count for ${client}: ${normalizedRaw.length}`,
        )
        const upcoming = this.filterUpcomingEvents(normalizedRaw)
        console.log(
          `[Legistar] Upcoming events for ${client}: ${upcoming.length}`,
        )
        return { status: "fulfilled", value: upcoming }
      } catch (error) {
        console.error(`Failed to fetch Legistar events for ${client}`, error)
        return { status: "rejected", reason: error }
      }
    })

    const results = await Promise.all(fetchPromises)
    const successful = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)

    if (!successful.length) {
      console.warn(
        "[Legistar] No upcoming meetings returned from Legistar sources",
      )
    }

    const consolidated = this.consolidator
      .deduplicate(successful)
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))

    console.log(
      `[Legistar] Consolidated ${consolidated.length} total events across clients`,
    )

    const payload = {
      events: consolidated,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
    }

    await this.storage.set(CACHE_KEY, payload)
    console.log(
      `[Legistar] Cache updated at ${new Date(payload.fetchedAt).toISOString()}`,
    )
    return payload
  }

  filterUpcomingEvents(events) {
    const now = new Date()
    const horizon = new Date(now.getTime())
    horizon.setDate(horizon.getDate() + 90)

    // Allow events from previous Monday onwards
    const previousMonday = this.getPreviousWeekMonday()

    console.log(
      "[Legistar] filterUpcomingEvents: now =",
      now.toISOString(),
      "previousMonday =",
      previousMonday.toISOString(),
      "horizon =",
      horizon.toISOString(),
    )
    console.log("[Legistar] Filtering", events.length, "events")

    const isWithinWindow = (eventDate) => {
      if (!eventDate) return false
      const date = new Date(eventDate)
      if (Number.isNaN(date.getTime())) return false
      return date >= previousMonday && date <= horizon
    }

    const filtered = events.filter((event) => {
      const sourceDate =
        event.startDateTime || event.EventDate || event.eventDate
      const within = isWithinWindow(sourceDate)
      if (!within && sourceDate) {
        const debugDate = new Date(sourceDate)
        if (!Number.isNaN(debugDate.getTime())) {
          const delta = (debugDate - previousMonday) / (1000 * 60 * 60 * 24)
          console.log(
            "[Legistar] EXCLUDING event:",
            event.title || event.EventBodyName,
            "date:",
            sourceDate,
            "delta from prevMonday:",
            delta.toFixed(1),
            "days",
          )
        }
      }
      return within
    })

    console.log("[Legistar] After filtering:", filtered.length, "events remain")

    return filtered
  }

  getPreviousWeekMonday() {
    const today = new Date()
    const currentDay = today.getDay()
    const daysToLastMonday = currentDay === 0 ? 6 : currentDay - 1
    const daysToSubtract = daysToLastMonday + 7
    const previousMonday = new Date(today)
    previousMonday.setDate(today.getDate() - daysToSubtract)
    previousMonday.setHours(0, 0, 0, 0)
    return previousMonday
  }
}

const storageLayer = new StorageLayer()
const aggregator = new LegistarAggregator(storageLayer)

if (chrome?.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("Government Stuff New Tab Extension installed")

    if (details.reason === "install") {
      chrome.storage.sync.set({
        settings: {
          showSidebar: true,
          autoLocation: false,
          theme: "light",
        },
      })
    }
  })
}

if (chrome?.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    aggregator
      .sync()
      .catch((error) => console.warn("Startup Legistar sync failed", error))
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    sendResponse({ status: "ignored" })
    return
  }

  if (message.type === "legistar:getEvents") {
    aggregator
      .getEvents({ forceRefresh: Boolean(message.forceRefresh) })
      .then((payload) => {
        sendResponse({ status: "ok", data: payload })
      })
      .catch((error) => {
        sendResponse({
          status: "error",
          error: error?.message ?? "Unknown Legistar error",
        })
      })
    return true
  }

  if (message.type === "legistar:getEventDetail") {
    const { client, eventId } = message
    if (!client || !eventId) {
      sendResponse({ status: "error", error: "Missing client or eventId" })
      return false
    }
    aggregator.apiClient
      .fetchSingleEvent(client, eventId)
      .then((raw) => {
        const videoUrl =
          raw.EventVideoPath ||
          raw.EventVideoHtml5Path ||
          (raw.EventMedia && GRANICUS_VIDEO_BASES[client]
            ? `${GRANICUS_VIDEO_BASES[client]}${raw.EventMedia}`
            : null)
        const minutesUrl = raw.EventMinutesFile || null
        sendResponse({ status: "ok", data: { videoUrl, minutesUrl } })
      })
      .catch((error) => {
        sendResponse({
          status: "error",
          error: error?.message ?? "Unknown Legistar error",
        })
      })
    return true
  }

  sendResponse({ status: "ignored" })
  return false
})
