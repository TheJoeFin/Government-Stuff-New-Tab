// Government Stuff New Tab Extension
// Main application logic

const CALENDAR_SOURCE_LABELS = {
  milwaukee: "City of Milwaukee",
  milwaukeecounty: "Milwaukee County",
}

const CALENDAR_SOURCE_COLORS = {
  milwaukee: "#0077be",
  milwaukeecounty: "#ffc107",
}

const CALENDAR_STORAGE_KEY = "govtab_calendar_events_v2"
const CALENDAR_STORAGE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

class NewTabApp {
  constructor() {
    this.favorites = []
    this.currentAddress = ""
    this.civicData = null
    this.lastAddress = "" // Cache for last used address
    this.milwaukeeCache = new Map() // Smart cache for Milwaukee data
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    this.settings = {
      showSidebar: true,
      autoLocation: false,
      theme: "light", // Default theme
      apiKey: "",
      propublicaApiKey: "",
    }

    this.sidebarDetailView = {
      listSection: null,
      detailSection: null,
      detailContent: null,
      detailSubtitle: null,
      backButton: null,
    }

    this.activeOfficialDetail = null
    this.calendarViewDate = new Date()
    this.calendarViewDate.setDate(1)
    this.calendarContainer = null
    this.officialsToggleControls = null
    this.officialsListExpandedBySearch = false
    this.calendarEvents = []
    this.calendarEventIndex = new Map()
    this.selectedCalendarDate = null
    this.calendarEventsMeta = {
      fetchedAt: null,
      stale: false,
    }

    this.calendarDetailView = {
      listContainer: null,
      detailSection: null,
      detailContent: null,
      detailSubtitle: null,
      backButton: null,
      activeTrigger: null,
      activeButton: null,
    }
    this.activeCalendarEvent = null

    // Initialize theme early
    this.initializeTheme()

    // Google Civic Information API endpoints
    this.civicApiEndpoint =
      "https://www.googleapis.com/civicinfo/v2/representatives"
    this.electionsApiEndpoint =
      "https://www.googleapis.com/civicinfo/v2/elections"
    this.divisionsApiEndpoint =
      "https://www.googleapis.com/civicinfo/v2/divisionsByAddress"

    this.propublicaApi = new ProPublicaApi(this.settings.propublicaApiKey)
    this.milwaukeeApi = new MilwaukeeApi()
    this.governmentOfficials = new GovernmentOfficials()
    this.milwaukeeCouncil = new MilwaukeeCouncil()
    this.milwaukeeCountyBoard = new MilwaukeeCountyBoard()

    // Track whether user is currently editing the address
    this.editingAddress = false

    this.init()
  }

  // Initialize theme before DOM is fully loaded
  initializeTheme() {
    // Check for system preference
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches

    // Try to get saved theme from localStorage immediately
    try {
      const saved = localStorage.getItem("govtab_settings")
      if (saved) {
        const settings = JSON.parse(saved)
        this.settings.theme = settings.theme || (prefersDark ? "dark" : "light")
      } else {
        this.settings.theme = prefersDark ? "dark" : "light"
      }
    } catch (error) {
      this.settings.theme = prefersDark ? "dark" : "light"
    }

    // Apply theme immediately
    document.documentElement.setAttribute("data-theme", this.settings.theme)
    console.log("Theme initialized:", this.settings.theme)
  }

  async init() {
    try {
      console.log("Government Tab App initializing...")
      await this.loadSettings()
      console.log("Settings loaded:", this.settings)
      this.propublicaApi.apiKey = this.settings.propublicaApiKey
      await this.loadFavorites()
      console.log("Favorites loaded:", this.favorites.length, "items")
      await this.loadLastAddress()
      console.log("Last address loaded:", this.lastAddress)
      this.initializeUI()
      console.log("UI initialized")
      await this.updateVersionDisplay()
      this.bindEvents()
      console.log("Events bound")

      if (this.settings.autoLocation) {
        this.getUserLocation()
      } else if (!this.lastAddress) {
        // Show welcome message only when no saved address exists
        this.renderNoAddressMessage()
      }
      console.log("Government Tab App ready!")
    } catch (error) {
      console.error("Error initializing app:", error)
    }
  }

  // Search functionality using Chrome Search API
  handleSearch(query) {
    if (!query.trim()) return

    // Use Chrome Search API to respect user's default search provider
    if (typeof chrome !== "undefined" && chrome.search) {
      chrome.search.query(
        {
          text: query.trim(),
          disposition: "CURRENT_TAB",
        },
        () => {
          // Announce to screen reader
          this.announceToScreenReader(
            `Searching for "${query.trim()}" using your default search provider`
          )
        }
      )
    } else {
      // Fallback for testing environment - use Google
      const searchUrl =
        "https://www.google.com/search?q=" + encodeURIComponent(query.trim())
      window.location.href = searchUrl

      // Announce to screen reader
      this.announceToScreenReader(`Searching for "${query.trim()}"`)
    }
  }

  // Settings and Storage Management
  async loadSettings() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.sync.get(["settings"])
        if (result.settings) {
          this.settings = { ...this.settings, ...result.settings }
        }
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem("govtab_settings")
        if (stored) {
          this.settings = { ...this.settings, ...JSON.parse(stored) }
        }
      }
    } catch (error) {
      console.log("Using default settings:", error)
    }
  }

  async saveSettings() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.sync.set({ settings: this.settings })
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem("govtab_settings", JSON.stringify(this.settings))
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  async loadFavorites() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.sync.get(["favorites"])
        this.favorites = result.favorites || this.getDefaultFavorites()
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem("govtab_favorites")
        this.favorites = stored
          ? JSON.parse(stored)
          : this.getDefaultFavorites()
      }
    } catch (error) {
      console.log("Using default favorites:", error)
      this.favorites = this.getDefaultFavorites()
    }
  }

  async saveFavorites() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.sync.set({ favorites: this.favorites })
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem("govtab_favorites", JSON.stringify(this.favorites))
      }
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }

  async loadLastAddress() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.sync.get(["lastAddress"])
        this.lastAddress = result.lastAddress || ""
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem("govtab_lastAddress")
        this.lastAddress = stored || ""
      }
    } catch (error) {
      console.log("Using default address:", error)
      this.lastAddress = ""
    }
  }

  async saveLastAddress(address) {
    this.lastAddress = address
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.sync.set({ lastAddress: address })
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem("govtab_lastAddress", address)
      }
    } catch (error) {
      console.error("Error saving last address:", error)
    }
  }

  // Smart Caching System
  getCacheKey(address) {
    return `milwaukee_${address.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
  }

  async getCachedData(address) {
    const cacheKey = this.getCacheKey(address)

    try {
      let cachedData
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get([cacheKey])
        cachedData = result[cacheKey]
      } else {
        // Fallback to localStorage for testing
        const stored = localStorage.getItem(cacheKey)
        cachedData = stored ? JSON.parse(stored) : null
      }

      if (cachedData) {
        const now = Date.now()
        const cacheAge = now - cachedData.timestamp

        console.log(
          `Cache found for "${address}", age: ${Math.round(
            cacheAge / 1000 / 60
          )} minutes`
        )

        if (cacheAge < this.cacheExpiry) {
          console.log("Using cached data")
          return cachedData.data
        } else {
          console.log("Cache expired, removing old data")
          await this.removeCachedData(address)
        }
      }

      return null
    } catch (error) {
      console.error("Error reading cache:", error)
      return null
    }
  }

  async setCachedData(address, data) {
    const cacheKey = this.getCacheKey(address)
    const cachedItem = {
      data: data,
      timestamp: Date.now(),
      address: address,
    }

    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({ [cacheKey]: cachedItem })
      } else {
        // Fallback to localStorage for testing
        localStorage.setItem(cacheKey, JSON.stringify(cachedItem))
      }
      console.log(`Data cached for "${address}"`)
    } catch (error) {
      console.error("Error saving to cache:", error)
    }
  }

  async removeCachedData(address) {
    const cacheKey = this.getCacheKey(address)

    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.remove([cacheKey])
      } else {
        // Fallback to localStorage for testing
        localStorage.removeItem(cacheKey)
      }
    } catch (error) {
      console.error("Error removing from cache:", error)
    }
  }

  async clearAllCache() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const allData = await chrome.storage.local.get(null)
        const cacheKeys = Object.keys(allData).filter((key) =>
          key.startsWith("milwaukee_")
        )
        if (cacheKeys.length > 0) {
          await chrome.storage.local.remove(cacheKeys)
          console.log(`Cleared ${cacheKeys.length} cached items`)
        }
      } else {
        // Fallback for localStorage
        const keys = Object.keys(localStorage)
        const cacheKeys = keys.filter((key) => key.startsWith("milwaukee_"))
        cacheKeys.forEach((key) => localStorage.removeItem(key))
        console.log(`Cleared ${cacheKeys.length} cached items`)
      }
    } catch (error) {
      console.error("Error clearing cache:", error)
    }
  }

  getDefaultFavorites() {
    return [
      {
        id: "1",
        name: "MKE Gov",
        url: "https://www.milwaukee.gov/",
      },
      {
        id: "2",
        name: "YouTube",
        url: "https://youtube.com",
      },
      {
        id: "3",
        name: "Gmail",
        url: "https://gmail.com",
      },
      {
        id: "4",
        name: "GitHub",
        url: "https://github.com",
      },
      {
        id: "5",
        name: "Bluesky",
        url: "https://bsky.app",
      },
      {
        id: "6",
        name: "Reddit",
        url: "https://reddit.com",
      },
    ]
  }

  // UI Initialization
  initializeUI() {
    this.applyTheme()
    this.setupSidebarDetailView()
    this.setupCalendar()
    this.setupSimplifiedCalendar() // Initialize simplified calendar weeks
    this.setupOfficialsToggle()
    this.loadCalendarEvents()
    this.renderFavorites()
    this.updateSidebarVisibility()
    this.updateSettingsUI()
    this.populateLastAddress()
  }

  applyTheme() {
    console.log("Applying theme:", this.settings.theme)

    // Set the data-theme attribute
    document.documentElement.setAttribute("data-theme", this.settings.theme)

    // DEBUG: Also set it on body for testing
    document.body.setAttribute("data-theme", this.settings.theme)

    // Update page title for debugging
    document.title = `New Tab - MKE`

    // Log the current attribute for debugging
    console.log(
      "HTML data-theme attribute:",
      document.documentElement.getAttribute("data-theme")
    )
    console.log(
      "Body data-theme attribute:",
      document.body.getAttribute("data-theme")
    )

    const themeButton = document.getElementById("theme-toggle")
    if (themeButton) {
      themeButton.textContent = this.settings.theme === "dark" ? "☀️" : "🌙"
      console.log("Theme button updated:", themeButton.textContent)
    } else {
      console.error("Theme toggle button not found during applyTheme")
    }

    // Force a repaint
    document.body.style.display = "none"
    document.body.offsetHeight // Trigger reflow
    document.body.style.display = ""
  }

  setupSidebarDetailView() {
    const listSection = document.querySelector(".sidebar .officials-section")
    const detailSection = document.getElementById("official-detail-section")
    const detailContent = document.getElementById("official-detail-content")
    const detailSubtitle = document.getElementById("official-detail-subtitle")
    const backButton = document.getElementById("official-detail-back")

    this.sidebarDetailView = {
      listSection,
      detailSection,
      detailContent,
      detailSubtitle,
      backButton,
      activeTrigger: null,
      activeButton: null,
    }

    if (detailSection && !detailSection.hasAttribute("tabindex")) {
      detailSection.setAttribute("tabindex", "-1")
    }

    if (backButton) {
      backButton.addEventListener("click", () => {
        this.closeOfficialDetail()
      })
    }

    if (detailSection) {
      detailSection.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          this.closeOfficialDetail()
        }
      })
    }

    // Ensure the list is visible by default
    this.closeOfficialDetail({ silent: true })
  }

  updateSidebarVisibility() {
    const container = document.querySelector(".container")
    const sidebar = document.getElementById("civic-sidebar")
    const showSidebarBtn = document.getElementById("show-sidebar-btn")
    const toggleSidebarBtn = document.getElementById("toggle-sidebar")

    if (this.settings.showSidebar) {
      container.classList.remove("sidebar-collapsed")
      sidebar.classList.remove("collapsed")
      showSidebarBtn.classList.add("hidden")
      if (toggleSidebarBtn) toggleSidebarBtn.classList.remove("rotated")
    } else {
      container.classList.add("sidebar-collapsed")
      sidebar.classList.add("collapsed")
      showSidebarBtn.classList.remove("hidden")
      if (toggleSidebarBtn) toggleSidebarBtn.classList.add("rotated")
    }
  }

  updateSettingsUI() {
    document.getElementById("show-sidebar").checked = this.settings.showSidebar
    document.getElementById("auto-location").checked =
      this.settings.autoLocation

    // Update search placeholder
    this.updateSearchPlaceholder()
  }

  updateSearchPlaceholder() {
    const searchInput = document.getElementById("search-input")
    if (searchInput) {
      searchInput.placeholder = "Search the web..."
      searchInput.setAttribute(
        "aria-label",
        "Search the web using your default search provider"
      )
    }
  }

  setupCalendar() {
    const grid = document.getElementById("calendar-grid")
    const label = document.getElementById("calendar-month-label")
    const prevBtn = document.getElementById("calendar-prev")
    const nextBtn = document.getElementById("calendar-next")
    const eventsContainer = document.getElementById("calendar-events")
    const header = document.querySelector(".calendar-header")
    const detailSection = document.getElementById("calendar-detail")
    const detailContent = document.getElementById("calendar-detail-content")
    const detailSubtitle = document.getElementById("calendar-detail-subtitle")
    const detailBackButton = document.getElementById("calendar-detail-back")
    const legend = document.getElementById("calendar-legend")

    if (!grid || !label || !prevBtn || !nextBtn) {
      console.warn("Calendar elements not found; skipping calendar setup")
      return
    }

    this.calendarContainer = document.querySelector(".officials-calendar")
    this.calendarGridElement = grid
    this.calendarLabelElement = label
    this.calendarEventsContainer = eventsContainer
    this.calendarLegendElement = legend
    this.calendarHeaderElement = header
    this.calendarDetailView = {
      listContainer: eventsContainer,
      detailSection,
      detailContent,
      detailSubtitle,
      backButton: detailBackButton,
      activeTrigger: null,
      activeButton: null,
    }

    if (detailBackButton) {
      detailBackButton.addEventListener("click", () =>
        this.closeCalendarEventDetail()
      )
    }

    if (eventsContainer && !eventsContainer.innerHTML.trim()) {
      eventsContainer.innerHTML = this.buildCalendarPlaceholder()
      eventsContainer.setAttribute("aria-busy", "true")
    }

    const handlePrev = () => this.changeCalendarMonth(-1)
    const handleNext = () => this.changeCalendarMonth(1)

    prevBtn.addEventListener("click", handlePrev)
    nextBtn.addEventListener("click", handleNext)

    prevBtn.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        handlePrev()
      }
    })

    nextBtn.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        handleNext()
      }
    })

    this.renderCalendar()
    this.setCalendarVisibility(true)
  }

  renderCalendar() {
    const grid =
      this.calendarGridElement || document.getElementById("calendar-grid")
    const label =
      this.calendarLabelElement ||
      document.getElementById("calendar-month-label")
    if (!grid || !label) return

    // Ensure view date is anchored to first of month
    if (!this.calendarViewDate) {
      this.calendarViewDate = new Date()
      this.calendarViewDate.setDate(1)
    }

    const viewDate = new Date(this.calendarViewDate.getTime())
    viewDate.setDate(1)

    const monthFormatter = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    })
    label.textContent = monthFormatter.format(viewDate)

    grid.innerHTML = ""

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    dayNames.forEach((day) => {
      const cell = document.createElement("div")
      cell.className = "calendar-cell is-label"
      cell.setAttribute("role", "columnheader")
      cell.textContent = day
      grid.appendChild(cell)
    })

    const firstDayOfWeek = viewDate.getDay()
    const daysInMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      0
    ).getDate()

    for (let pad = 0; pad < firstDayOfWeek; pad += 1) {
      const filler = document.createElement("div")
      filler.className = "calendar-cell is-empty"
      filler.setAttribute("aria-hidden", "true")
      filler.setAttribute("role", "presentation")
      grid.appendChild(filler)
    }

    const today = new Date()
    const isCurrentMonth =
      today.getFullYear() === viewDate.getFullYear() &&
      today.getMonth() === viewDate.getMonth()

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement("div")
      cell.className = "calendar-cell"
      cell.setAttribute("role", "gridcell")
      cell.textContent = day.toString()

      if (isCurrentMonth && today.getDate() === day) {
        cell.classList.add("is-today")
        cell.setAttribute("aria-current", "date")
      }

      const eventDateKey = this.buildDateKey(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        day
      )

      if (this.calendarEventIndex.has(eventDateKey)) {
        const eventSources = this.getEventSourcesForDate(eventDateKey)
        cell.classList.add("has-events")
        cell.dataset.date = eventDateKey
        if (eventSources.length) {
          cell.dataset.source = eventSources.join(" ")
        }
        cell.tabIndex = 0
        const describe = this.describeEventCount(eventDateKey)
        cell.setAttribute(
          "aria-label",
          `${monthFormatter.format(viewDate)} ${day}. ${describe}`
        )

        const activate = () => {
          if (this.selectedCalendarDate === eventDateKey) {
            this.clearCalendarSelection()
            return
          }
          this.selectCalendarDate(eventDateKey)
        }

        cell.addEventListener("click", activate)
        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            activate()
          }
        })

        if (this.selectedCalendarDate === eventDateKey) {
          cell.classList.add("selected")
        }
      }

      grid.appendChild(cell)
    }

    const filledSlots = firstDayOfWeek + daysInMonth
    const remainder = filledSlots % 7
    if (remainder !== 0) {
      const trailing = 7 - remainder
      for (let pad = 0; pad < trailing; pad += 1) {
        const filler = document.createElement("div")
        filler.className = "calendar-cell is-empty"
        filler.setAttribute("aria-hidden", "true")
        filler.setAttribute("role", "presentation")
        grid.appendChild(filler)
      }
    }
  }

  buildDateKey(year, monthIndex, day) {
    const pad = (value) => value.toString().padStart(2, "0")
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
  }

  buildCalendarPlaceholder() {
    return `
      <div class="calendar-placeholder">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading upcoming meetings…</p>
      </div>
    `
  }

  setCalendarVisibility(visible) {
    if (!this.calendarContainer) {
      this.calendarContainer = document.querySelector(".officials-calendar")
    }

    if (!this.calendarContainer) return

    this.calendarContainer.classList.toggle("hidden", !visible)
    if (visible) {
      this.calendarContainer.removeAttribute("aria-hidden")
    } else {
      this.calendarContainer.setAttribute("aria-hidden", "true")
    }
  }

  setCalendarStructureHidden(hidden) {
    const nodes = [
      this.calendarHeaderElement || document.querySelector(".calendar-header"),
      this.calendarGridElement || document.getElementById("calendar-grid"),
      this.calendarLegendElement || document.getElementById("calendar-legend"),
    ]

    nodes.forEach((node) => {
      if (!node) return
      node.classList.toggle("hidden", hidden)
    })
  }

  setCalendarBusyState(isBusy) {
    if (!this.calendarEventsContainer) return
    this.calendarEventsContainer.setAttribute(
      "aria-busy",
      isBusy ? "true" : "false"
    )
  }

  getCachedCalendarEvents() {
    try {
      const raw = localStorage.getItem(CALENDAR_STORAGE_KEY)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.events)) return null

      const storedFetchedAt = parsed.fetchedAt
      const fetchedAt =
        typeof storedFetchedAt === "number"
          ? storedFetchedAt
          : Date.parse(storedFetchedAt)

      if (!Number.isFinite(fetchedAt)) {
        return null
      }

      const age = Date.now() - fetchedAt
      if (age > CALENDAR_STORAGE_TTL_MS) {
        console.log(
          `[Calendar] Cached events expired (age ${(
            age /
            (60 * 60 * 1000)
          ).toFixed(1)}h)`
        )
        return null
      }

      return {
        ...parsed,
        fetchedAt,
      }
    } catch (error) {
      console.warn("[Calendar] Failed to read cached events", error)
      return null
    }
  }

  saveCalendarEventsToCache(payload) {
    if (!payload || !Array.isArray(payload.events)) return

    const record = {
      events: payload.events,
      fetchedAt: payload.fetchedAt || Date.now(),
      stale: Boolean(payload.stale),
    }

    if (payload.expiresAt) {
      record.expiresAt = payload.expiresAt
    }

    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(record))
      console.log(
        `[Calendar] Cached ${record.events.length} events in local storage`
      )
    } catch (error) {
      console.warn("[Calendar] Failed to cache calendar events", error)
    }
  }

  clearCachedCalendarEvents() {
    try {
      localStorage.removeItem(CALENDAR_STORAGE_KEY)
    } catch (error) {
      console.warn("[Calendar] Failed to clear calendar cache", error)
    }
  }

  applyCalendarPayload(payload, options = {}) {
    if (!payload || !Array.isArray(payload.events)) {
      throw new Error("Calendar payload missing events")
    }

    const fetchedAtRaw = payload.fetchedAt ?? Date.now()
    const fetchedAt =
      typeof fetchedAtRaw === "number" ? fetchedAtRaw : Date.parse(fetchedAtRaw)

    const normalizedFetchedAt = Number.isNaN(fetchedAt) ? Date.now() : fetchedAt

    this.calendarEvents = payload.events
    this.calendarEventsMeta = {
      fetchedAt: normalizedFetchedAt,
      fromCache: Boolean(
        options.fromCache !== undefined ? options.fromCache : payload.fromCache
      ),
      stale: Boolean(payload.stale),
    }

    this.calendarEventIndex = this.groupEventsByDate(payload.events)
    console.log(
      `[Calendar] Grouped events into ${this.calendarEventIndex.size} date buckets`
    )

    if (this.calendarLegendElement) {
      this.calendarLegendElement.classList.toggle(
        "hidden",
        payload.events.length === 0
      )
    }

    this.renderCalendar()
    this.renderCalendarEventsList()
  }

  async loadCalendarEvents({ forceRefresh = false } = {}) {
    if (!this.calendarEventsContainer) {
      this.calendarEventsContainer = document.getElementById("calendar-events")
    }

    if (forceRefresh) {
      this.clearCachedCalendarEvents()
    } else {
      const cached = this.getCachedCalendarEvents()
      if (cached) {
        const fetchedLabel = new Date(cached.fetchedAt).toLocaleString()
        console.log(
          `[Calendar] Using cached events from local storage (fetched ${fetchedLabel})`
        )
        try {
          this.applyCalendarPayload(cached, { fromCache: true })
          this.setCalendarBusyState(false)
          return
        } catch (error) {
          console.warn(
            "[Calendar] Cached calendar data invalid, proceeding to refetch",
            error
          )
          this.clearCachedCalendarEvents()
        }
      }
    }

    if (this.calendarEventsContainer) {
      console.log(
        `[Calendar] Loading calendar events (forceRefresh=${forceRefresh})`
      )
      this.calendarEventsContainer.innerHTML = this.buildCalendarPlaceholder()
      this.setCalendarBusyState(true)
    }

    try {
      const payload = await this.requestLegistarEvents(forceRefresh)
      console.log(
        `[Calendar] Received calendar payload:`,
        payload
          ? {
              events: Array.isArray(payload.events)
                ? payload.events.length
                : "missing",
              fromCache: payload?.fromCache,
              stale: payload?.stale,
              fetchedAt: payload?.fetchedAt,
            }
          : "null response"
      )
      if (!payload || !Array.isArray(payload.events)) {
        throw new Error("Calendar payload missing events")
      }

      this.applyCalendarPayload(payload, {
        fromCache: Boolean(payload.fromCache),
      })
      this.saveCalendarEventsToCache(payload)
    } catch (error) {
      console.error("Failed to load calendar events", error)
      if (this.calendarEvents.length) {
        this.calendarEventsMeta.stale = true
        this.renderCalendarEventsList()
      } else {
        this.renderCalendarError(error)
      }
    } finally {
      console.log("[Calendar] Calendar load complete")
      this.setCalendarBusyState(false)
    }
  }

  async requestLegistarEvents(forceRefresh) {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      console.warn(
        "[Calendar] chrome.runtime missing; using mock calendar events"
      )
      return { events: this.buildMockCalendarEvents(), fetchedAt: Date.now() }
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(
          "[Calendar] Requesting Legistar events from background worker"
        )
        const timeoutId = setTimeout(() => {
          console.error(
            "[Calendar] Timed out waiting for background response (10s)"
          )
          reject(new Error("Calendar service not responding"))
        }, 10000)
        chrome.runtime.sendMessage(
          { type: "legistar:getEvents", forceRefresh },
          (response) => {
            clearTimeout(timeoutId)
            if (chrome.runtime.lastError) {
              console.error(
                "[Calendar] chrome.runtime.lastError while loading events",
                chrome.runtime.lastError
              )
              reject(new Error(chrome.runtime.lastError.message))
              return
            }
            if (!response) {
              console.error("[Calendar] Empty response from background worker")
              reject(new Error("Empty calendar response"))
              return
            }
            if (response.status === "ok") {
              console.log(
                `[Calendar] Background worker returned ${
                  response.data?.events?.length ?? "no"
                } events`
              )
              resolve(response.data)
            } else {
              console.error(
                `[Calendar] Background worker reported error: ${response.error}`
              )
              reject(new Error(response.error || "Unknown Legistar error"))
            }
          }
        )
      } catch (error) {
        console.error("[Calendar] Unexpected error requesting events", error)
        reject(error)
      }
    })
  }

  buildMockCalendarEvents() {
    const now = new Date()
    const sample = []
    for (let i = 0; i < 4; i += 1) {
      const date = new Date(now.getTime())
      date.setDate(date.getDate() + i * 3 + 1)
      sample.push({
        id: `mock-${i}`,
        source: i % 2 === 0 ? "milwaukee" : "milwaukeecounty",
        sourceLabel:
          i % 2 === 0
            ? CALENDAR_SOURCE_LABELS.milwaukee
            : CALENDAR_SOURCE_LABELS.milwaukeecounty,
        sourceColor:
          i % 2 === 0
            ? CALENDAR_SOURCE_COLORS.milwaukee
            : CALENDAR_SOURCE_COLORS.milwaukeecounty,
        bodyName: i % 2 === 0 ? "Common Council" : "County Board",
        title: `Sample meeting ${i + 1}`,
        location: "City Hall",
        startDateTime: date.toISOString(),
        agendaUrl: "#",
      })
    }
    return sample
  }

  groupEventsByDate(events) {
    const map = new Map()
    events.forEach((event) => {
      if (!event.startDateTime) return
      const date = new Date(event.startDateTime)
      if (Number.isNaN(date.getTime())) return
      const key = this.buildDateKey(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(event)
    })

    map.forEach((value, key) => {
      value.sort(
        (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
      )
      map.set(key, value)
    })

    return map
  }

  renderCalendarEventsList() {
    if (!this.calendarEventsContainer) return

    const events = this.getEventsForCurrentView()
    const container = this.calendarEventsContainer
    container.innerHTML = ""

    const header = document.createElement("div")
    header.className = "calendar-events-header"
    const heading = document.createElement("h4")
    heading.textContent = this.buildCalendarHeading()
    heading.style.margin = "0"
    heading.style.fontSize = "0.95rem"
    heading.style.color = "var(--text-primary)"
    header.appendChild(heading)

    if (this.selectedCalendarDate) {
      const clearBtn = document.createElement("button")
      clearBtn.className = "btn-small"
      clearBtn.type = "button"
      clearBtn.textContent = "Show all"
      clearBtn.setAttribute("aria-label", "Show all meetings this month")
      clearBtn.addEventListener("click", () => this.clearCalendarSelection())
      header.appendChild(clearBtn)
    }

    container.appendChild(header)

    const statusElement = this.buildCalendarStatusElement()
    if (statusElement) {
      container.appendChild(statusElement)
    }

    if (
      this.activeCalendarEvent &&
      !events.some((event) => event.id === this.activeCalendarEvent.id)
    ) {
      this.closeCalendarEventDetail({ silent: true })
    }

    if (!events.length) {
      const empty = document.createElement("div")
      empty.className = "calendar-empty"
      empty.textContent = "No meetings found for this month."
      empty.style.fontSize = "0.85rem"
      empty.style.color = "var(--text-muted)"
      empty.style.padding = "0.5rem 0"
      container.appendChild(empty)
      return
    }

    events.forEach((event) => {
      const item = this.createCalendarEventListItem(event)
      container.appendChild(item)
    })

    // Refresh week calendar indicators after events are rendered
    this.refreshWeekCalendarIndicators()
  }

  createCalendarEventListItem(event, { onSelect } = {}) {
    const item = document.createElement("div")
    item.className = "calendar-event-item"
    const eventId = this.getCalendarEventId(event)
    if (eventId) {
      item.dataset.eventId = eventId
    }
    item.setAttribute("role", "listitem")

    if (event.sourceColor) {
      item.style.setProperty("--detail-accent", event.sourceColor)
    }

    const mainButton = document.createElement("button")
    mainButton.type = "button"
    mainButton.className = "calendar-event-main"
    mainButton.setAttribute(
      "aria-label",
      `View details for ${event.title || "meeting"}`
    )

    const title = document.createElement("span")
    title.className = "calendar-event-title"
    title.textContent = event.title || "Government meeting"

    const meta = document.createElement("div")
    meta.className = "calendar-event-meta"

    const sourceDot = document.createElement("span")
    sourceDot.className = "calendar-event-source-dot"
    sourceDot.style.backgroundColor =
      event.sourceColor ||
      CALENDAR_SOURCE_COLORS[event.source] ||
      "var(--accent-color)"
    sourceDot.setAttribute("aria-hidden", "true")

    const dateLabel = this.formatCalendarDate(event.startDateTime)
    const timeLabel = this.formatEventTime(event.startDateTime)

    const timeEl = document.createElement("span")
    timeEl.className = "calendar-event-time"
    timeEl.textContent = timeLabel

    const dateEl = document.createElement("span")
    dateEl.className = "calendar-event-date"
    dateEl.textContent = dateLabel

    const bodyEl = document.createElement("span")
    bodyEl.textContent = event.bodyName || event.sourceLabel || "Local meeting"

    meta.appendChild(sourceDot)
    meta.appendChild(timeEl)
    meta.appendChild(document.createTextNode("•"))
    meta.appendChild(dateEl)
    meta.appendChild(document.createTextNode("•"))
    meta.appendChild(bodyEl)

    const location = document.createElement("span")
    location.className = "calendar-event-location"
    location.textContent = event.location || "Location TBD"

    mainButton.appendChild(title)
    mainButton.appendChild(meta)
    mainButton.appendChild(location)

    mainButton.addEventListener("click", () => {
      if (typeof onSelect === "function") {
        onSelect({ event, item })
      } else {
        this.showCalendarEventDetail(event, item)
      }
    })

    item.appendChild(mainButton)

    return item
  }

  getCalendarEventId(event) {
    if (!event) return ""
    if (event._computedId) return event._computedId

    const fallback = `${event.source || "event"}-${event.startDateTime || ""}-${
      event.title || ""
    }`

    const candidate =
      event.id ??
      event.event_id ??
      event.eventId ??
      event.uid ??
      event.guid ??
      event.legistarEventId ??
      event.slug ??
      fallback

    const result = String(candidate)
    event._computedId = result
    return result
  }

  appendCalendarLink(wrapper, href, label, options = {}) {
    if (!href) return
    const link = document.createElement("a")
    link.href = href
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.textContent = label
    if (options.title) {
      link.title = options.title
    }
    if (options.className) {
      const classes = Array.isArray(options.className)
        ? options.className
        : [options.className]
      classes.filter(Boolean).forEach((className) => {
        link.classList.add(className)
      })
    }
    wrapper.appendChild(link)
  }

  showCalendarEventDetail(event, sourceElement) {
    // Use the new detail overlay for event details
    this.showDetailOverlay("event", event)
  }

  buildCalendarDetailContent(event) {
    const detailView = this.calendarDetailView || {}
    const content = detailView.detailContent
    if (!content) return

    content.innerHTML = ""

    const summary = document.createElement("div")
    summary.className = "calendar-detail-summary"

    const title = document.createElement("h5")
    title.textContent = event.title || "Government meeting"
    summary.appendChild(title)

    const tags = document.createElement("div")
    tags.className = "calendar-detail-tags"
    const sourceTag = document.createElement("span")
    sourceTag.className = "calendar-detail-tag"
    sourceTag.textContent = event.sourceLabel || "Legistar"
    tags.appendChild(sourceTag)

    if (event.bodyName && event.bodyName !== event.sourceLabel) {
      const bodyTag = document.createElement("span")
      bodyTag.className = "calendar-detail-tag"
      bodyTag.textContent = event.bodyName
      tags.appendChild(bodyTag)
    }

    if (event.category) {
      const categoryTag = document.createElement("span")
      categoryTag.className = "calendar-detail-tag"
      categoryTag.textContent = event.category
      tags.appendChild(categoryTag)
    }

    if (tags.childElementCount > 0) {
      summary.appendChild(tags)
    }

    const meta = document.createElement("div")
    meta.className = "calendar-detail-meta"

    const addMeta = (label, value) => {
      if (!value) return
      const row = document.createElement("span")
      const labelEl = document.createElement("span")
      labelEl.className = "calendar-detail-meta-label"
      labelEl.textContent = label
      const valueEl = document.createElement("span")
      valueEl.textContent = value
      row.appendChild(labelEl)
      row.appendChild(valueEl)
      meta.appendChild(row)
    }

    addMeta("When", this.formatCalendarDetailDateTime(event))
    addMeta("Where", event.location || "Location TBD")
    addMeta("Body", event.bodyName || event.sourceLabel)
    addMeta("Type", event.category)
    addMeta("Updated", this.formatCalendarLastModified(event.lastModified))

    if (meta.childElementCount > 0) {
      summary.appendChild(meta)
    }

    content.appendChild(summary)

    const links = this.buildCalendarDetailLinks(event)
    if (links) {
      content.appendChild(links)
    }

    if (event.richText) {
      const notes = document.createElement("div")
      notes.className = "detail-item"
      const heading = document.createElement("strong")
      heading.textContent = "Notes"
      heading.style.display = "block"
      heading.style.marginBottom = "0.5rem"
      const noteText = document.createElement("p")
      noteText.textContent = event.richText
      noteText.style.margin = "0"
      notes.appendChild(heading)
      notes.appendChild(noteText)
      content.appendChild(notes)
    }
  }

  buildCalendarDetailLinks(event) {
    const links = document.createElement("div")
    links.className = "calendar-detail-links"

    const linkItems = [
      {
        href:
          event.meetingUrl && event.meetingUrl !== event.agendaUrl
            ? event.meetingUrl
            : null,
        label: "Meeting details",
      },
      { href: event.agendaUrl, label: "Agenda" },
      { href: event.minutesUrl, label: "Minutes" },
      { href: event.videoUrl, label: "Video" },
    ]

    linkItems.forEach(({ href, label }) => {
      this.appendCalendarLink(links, href, label, {
        className: "calendar-detail-link",
        title: label,
      })
    })

    return links.childElementCount ? links : null
  }

  buildCalendarDetailSubtitle(event) {
    const when = this.formatCalendarDetailDateTime(event)
    const source = event.sourceLabel || "Local meeting"
    return `${source} • ${when}`
  }

  formatCalendarDetailDateTime(event) {
    if (!event?.startDateTime) return "TBD"
    const start = new Date(event.startDateTime)
    if (Number.isNaN(start.getTime())) return "TBD"

    const datePart = start.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const timePart = start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })

    let result = `${datePart} · ${timePart}`

    if (event.endDateTime) {
      const end = new Date(event.endDateTime)
      if (!Number.isNaN(end.getTime())) {
        const sameDay = start.toDateString() === end.toDateString()
        const endTime = end.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })
        if (sameDay) {
          result = `${datePart} · ${timePart} – ${endTime}`
        } else {
          const endDateLabel = end.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
          result = `${datePart} · ${timePart} – ${endDateLabel} ${endTime}`
        }
      }
    }

    return result
  }

  formatCalendarLastModified(value) {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  buildCalendarHeading() {
    return this.selectedCalendarDate ? "Meetings" : "Local meetings"
  }

  formatSelectedDate(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateKey
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  formatCalendarDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "TBD"
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  formatEventTime(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "All day"
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  selectCalendarDate(dateKey) {
    this.selectedCalendarDate = dateKey
    this.renderCalendar()
    this.closeCalendarEventDetail({ silent: true })
    this.renderCalendarEventsList()
    this.announceToScreenReader(
      `Showing meetings for ${this.formatSelectedDate(dateKey)}`
    )
  }

  clearCalendarSelection() {
    this.selectedCalendarDate = null
    this.renderCalendar()
    this.closeCalendarEventDetail({ silent: true })
    this.renderCalendarEventsList()
    this.announceToScreenReader("Showing all meetings for this month")
  }

  getEventsForCurrentView() {
    if (!Array.isArray(this.calendarEvents)) return []

    const start = new Date(this.calendarViewDate)
    const currentMonth = start.getMonth()
    const currentYear = start.getFullYear()

    return this.calendarEvents.filter((event) => {
      if (!event.startDateTime) return false
      const eventDate = new Date(event.startDateTime)
      if (Number.isNaN(eventDate.getTime())) return false

      const sameMonth =
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      if (!sameMonth) return false

      if (this.selectedCalendarDate) {
        const key = this.buildDateKey(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          eventDate.getDate()
        )
        return key === this.selectedCalendarDate
      }

      return true
    })
  }

  focusCalendarOnEvent(event) {
    if (!event || !event.startDateTime) return

    const eventDate = new Date(event.startDateTime)
    if (Number.isNaN(eventDate.getTime())) return

    this.calendarViewDate = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      1
    )

    this.selectedCalendarDate = this.buildDateKey(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    )

    this.renderCalendar()
    this.closeCalendarEventDetail({ silent: true })
    this.renderCalendarEventsList()
  }

  getCalendarEventElementById(eventId) {
    if (!this.calendarEventsContainer || !eventId) return null
    const items =
      this.calendarEventsContainer.querySelectorAll("[data-event-id]")
    return (
      Array.from(items).find((el) => el.dataset.eventId === String(eventId)) ||
      null
    )
  }

  getEventSourcesForDate(dateKey) {
    const events = this.calendarEventIndex.get(dateKey) || []
    const uniqueSources = new Set(
      events.map((event) => event.source).filter(Boolean)
    )
    return Array.from(uniqueSources)
  }

  describeEventCount(dateKey) {
    const events = this.calendarEventIndex.get(dateKey) || []
    if (!events.length) return "No meetings"
    const sources = this.getEventSourcesForDate(dateKey)
    const sourceLabel =
      sources.length === 1
        ? CALENDAR_SOURCE_LABELS[sources[0]] || "local government"
        : "local governments"
    return `${events.length} meeting${
      events.length === 1 ? "" : "s"
    } from ${sourceLabel}`
  }

  renderCalendarError(error) {
    if (!this.calendarEventsContainer) return
    this.calendarEventsContainer.innerHTML = ""
    const errorBlock = document.createElement("div")
    errorBlock.className = "calendar-error"
    errorBlock.style.color = "var(--danger-color)"
    errorBlock.style.fontSize = "0.85rem"
    errorBlock.style.padding = "0.5rem 0"
    errorBlock.textContent =
      "Unable to load government meetings right now. Showing cached data when available."
    this.calendarEventsContainer.appendChild(errorBlock)
  }

  buildCalendarStatusElement() {
    if (!this.calendarEventsMeta || !this.calendarEventsMeta.fetchedAt) {
      return null
    }

    const status = document.createElement("div")
    status.className = "calendar-status"

    if (this.calendarEventsMeta.stale) {
      status.classList.add("warning")
      status.textContent =
        "Showing cached meetings while we reconnect to city servers."
    } else if (this.calendarEventsMeta.fromCache) {
      status.classList.add("muted")
      const fetched = new Date(this.calendarEventsMeta.fetchedAt)
      const label = Number.isNaN(fetched.getTime())
        ? "recently"
        : fetched.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
      status.textContent = `Last updated ${label}.`
    } else {
      return null
    }

    return status
  }

  changeCalendarMonth(offset) {
    if (!Number.isInteger(offset)) return

    if (!this.calendarViewDate) {
      this.calendarViewDate = new Date()
      this.calendarViewDate.setDate(1)
    }

    const nextDate = new Date(this.calendarViewDate.getTime())
    nextDate.setMonth(this.calendarViewDate.getMonth() + offset)
    nextDate.setDate(1)
    this.calendarViewDate = nextDate
    this.selectedCalendarDate = null
    this.renderCalendar()
    this.closeCalendarEventDetail({ silent: true })
    this.renderCalendarEventsList()

    const label =
      this.calendarLabelElement ||
      document.getElementById("calendar-month-label")
    if (label && label.textContent) {
      this.announceToScreenReader(`Showing ${label.textContent} calendar`)
    }
  }

  setupOfficialsToggle() {
    const toggle = document.getElementById("officials-toggle")
    const wrapper = document.getElementById("officials-list-wrapper")
    if (!toggle || !wrapper) return

    const collapsedLabel = "Show elected officials"
    const expandedLabel = "Hide elected officials"

    this.officialsToggleControls = {
      toggle,
      wrapper,
      collapsedLabel,
      expandedLabel,
      expanded: false,
    }

    // Ensure default collapsed state without toggling animation
    this.setOfficialsListExpanded(false, { silent: true, skipFocus: true })

    toggle.addEventListener("click", () => {
      const controls = this.officialsToggleControls
      if (!controls) return
      const nextState = !controls.expanded
      this.setOfficialsListExpanded(nextState, {
        focusFirst: nextState,
      })
      // Manual toggles should clear any auto-expand flag
      this.officialsListExpandedBySearch = false
    })
  }

  setOfficialsListExpanded(expanded, options = {}) {
    const controls = this.officialsToggleControls
    if (!controls) return

    const {
      toggle,
      wrapper,
      collapsedLabel,
      expandedLabel,
      expanded: currentState,
    } = controls

    if (currentState === expanded && !options.force) return

    controls.expanded = expanded

    const label = expanded ? expandedLabel : collapsedLabel
    toggle.setAttribute("aria-expanded", expanded.toString())
    toggle.textContent = label
    toggle.setAttribute("aria-label", label)
    toggle.setAttribute("title", label)
    wrapper.classList.toggle("collapsed", !expanded)

    if (expanded && options.focusFirst && !options.skipFocus) {
      setTimeout(() => {
        const firstInteractive = wrapper.querySelector(
          ".official button, .official a, .official [tabindex]"
        )
        if (firstInteractive && typeof firstInteractive.focus === "function") {
          firstInteractive.focus({ preventScroll: true })
        }
      }, 0)
    }

    if (!options.silent) {
      const message =
        options.announceMessage ||
        (expanded ? "Officials list expanded" : "Officials list collapsed")
      this.announceToScreenReader(message)
    }
  }

  ensureOfficialsListForSearch() {
    const controls = this.officialsToggleControls
    if (!controls) return

    if (!controls.expanded) {
      this.setOfficialsListExpanded(true, { silent: true })
      this.officialsListExpandedBySearch = true
    } else {
      this.officialsListExpandedBySearch = false
    }
  }

  populateLastAddress() {
    if (this.lastAddress) {
      const addressInput = document.getElementById("address-input")
      if (addressInput) {
        addressInput.value = this.lastAddress
        this.currentAddress = this.lastAddress
        // Automatically load data for the cached address
        this.loadCivicData(this.lastAddress)
      }
    }
  }

  // Event Binding
  bindEvents() {
    console.log("Binding events...")

    // Search form
    const searchForm = document.getElementById("search-form")
    const searchInput = document.getElementById("search-input")
    if (searchForm && searchInput) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const query = searchInput.value.trim()
        if (query) {
          this.handleSearch(query)
        }
      })

      // Focus search with Ctrl+K or Cmd+K
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault()
          searchInput.focus()
        }
      })

      console.log("Search form events bound")
    } else {
      console.error("Search form elements not found")
    }

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", (e) => {
        e.preventDefault()
        console.log("Theme toggle clicked, current theme:", this.settings.theme)
        const newTheme = this.settings.theme === "light" ? "dark" : "light"
        this.settings.theme = newTheme
        console.log("New theme set to:", newTheme)
        this.applyTheme()
        this.saveSettings()
      })
      console.log("Theme toggle event bound successfully")
    } else {
      console.error("Theme toggle button not found")
    }

    // Settings modal
    const settingsBtn = document.getElementById("settings-btn")
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        console.log("Settings button clicked")
        this.showSettingsModal()
      })
      console.log("Settings button event bound")
    } else {
      console.error("Settings button not found")
    }

    const closeSettings = document.getElementById("close-settings")
    if (closeSettings) {
      closeSettings.addEventListener("click", () => {
        console.log("Close settings clicked")
        this.hideSettingsModal()
      })
    }

    // Settings checkboxes
    const showSidebar = document.getElementById("show-sidebar")
    if (showSidebar) {
      showSidebar.addEventListener("change", (e) => {
        console.log("Show sidebar changed:", e.target.checked)
        this.settings.showSidebar = e.target.checked
        this.updateSidebarVisibility()
        this.saveSettings()
      })
    }

    const autoLocation = document.getElementById("auto-location")
    if (autoLocation) {
      autoLocation.addEventListener("change", (e) => {
        console.log("Auto location changed:", e.target.checked)
        this.settings.autoLocation = e.target.checked
        this.saveSettings()
      })
    }

    // Sidebar toggle
    const toggleSidebar = document.getElementById("toggle-sidebar")
    if (toggleSidebar) {
      toggleSidebar.addEventListener("click", () => {
        console.log("Toggle sidebar clicked")
        this.settings.showSidebar = !this.settings.showSidebar
        this.updateSidebarVisibility()
        this.updateSettingsUI()
        this.saveSettings()
      })
    }

    // Show sidebar button
    const showSidebarBtn = document.getElementById("show-sidebar-btn")
    if (showSidebarBtn) {
      showSidebarBtn.addEventListener("click", () => {
        console.log("Show sidebar clicked")
        this.settings.showSidebar = true
        this.updateSidebarVisibility()
        this.updateSettingsUI()
        this.saveSettings()

        // Announce to screen readers
        this.announceToScreenReader("Representatives sidebar opened")
      })
    }

    // Add favorite
    const addFavorite = document.getElementById("add-favorite")
    if (addFavorite) {
      addFavorite.addEventListener("click", (e) => {
        e.preventDefault()
        console.log("Add favorite clicked")
        this.showFavoriteModal()
      })
    }

    // Favorite modal
    document
      .getElementById("close-favorite-modal")
      .addEventListener("click", () => {
        this.hideFavoriteModal()
      })

    document.getElementById("cancel-favorite").addEventListener("click", () => {
      this.hideFavoriteModal()
    })

    document.getElementById("save-favorite").addEventListener("click", () => {
      this.saveFavorite()
    })

    // Address input
    document.getElementById("update-address").addEventListener("click", () => {
      this.updateAddress()
    })

    document.getElementById("locate-btn").addEventListener("click", () => {
      this.getUserLocation()
    })

    // Refresh button
    document.getElementById("refresh-btn").addEventListener("click", () => {
      console.log("Manual refresh triggered")
      this.loadCalendarEvents({ forceRefresh: true })

      if (this.currentAddress) {
        console.log("Manual refresh triggered for:", this.currentAddress)
        this.loadCivicData(this.currentAddress, true) // Force refresh
      } else {
        alert("Please enter an address first")
      }
    })

    // Compact address display buttons
    document
      .getElementById("edit-address-btn")
      .addEventListener("click", () => {
        // Toggle purely on internal state for reliability
        if (this.editingAddress) {
          // Leaving edit mode
          this.showCompactAddressDisplay()
        } else {
          // Entering edit mode
          this.showAddressInput()
        }
        this.updateEditButtonState(this.editingAddress)
      })

    // Removed separate refresh control from unified bar

    document
      .getElementById("address-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.updateAddress()
        }
      })

    // Test button (for debugging)
    const testBtn = document.getElementById("test-btn")
    if (testBtn) {
      // Remove any existing onclick to avoid conflicts
      testBtn.removeAttribute("onclick")
      testBtn.addEventListener("click", () => {
        console.log("Test button clicked via event listener")
        this.testMilwaukeeApi()
      })
      console.log("Test button event bound")
    }

    // Simplified UI Event Handlers (Issue #11)
    this.setupSimplifiedUIEvents()

    // Officials local search (sidebar)
    this.setupOfficialsSearch()
    this.setupOfficialsSearchToggle()

    // Close modals on outside click
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.classList.add("hidden")
      }

      // Hide context menu when clicking outside
      if (
        !e.target.closest("#context-menu") &&
        !e.target.closest(".favorite-item")
      ) {
        this.hideContextMenu()
      }
    })

    // Context menu event handlers
    document.getElementById("context-edit").addEventListener("click", () => {
      if (this.contextMenuFavorite) {
        this.editFavorite(this.contextMenuFavorite)
        this.hideContextMenu()
      }
    })

    document.getElementById("context-delete").addEventListener("click", () => {
      if (this.contextMenuFavorite) {
        this.deleteFavorite(this.contextMenuFavorite.id)
      }
    })

    // Context menu keyboard navigation
    document.addEventListener("keydown", (e) => {
      const contextMenu = document.getElementById("context-menu")
      if (contextMenu.classList.contains("show")) {
        if (e.key === "Escape") {
          e.preventDefault()
          this.hideContextMenu()
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault()
          const items = contextMenu.querySelectorAll(".context-menu-item")
          const currentIndex = Array.from(items).indexOf(document.activeElement)
          let nextIndex

          if (e.key === "ArrowDown") {
            nextIndex = (currentIndex + 1) % items.length
          } else {
            nextIndex = (currentIndex - 1 + items.length) % items.length
          }

          items[nextIndex].focus()
        }
      }
    })
  }

  // --- Officials Search Feature ---
  setupOfficialsSearch() {
    const input = document.getElementById("official-search-input")
    const listContainer = document.getElementById("officials-list")
    if (!input || !listContainer) return

    // Debounce handler
    let debounceTimer = null
    const handleSearch = () => {
      const query = input.value.trim()
      if (query.length < 2) {
        this.clearOfficialsSearchResults()
        return
      }
      const results = this.governmentOfficials.searchOfficials(query)
      const councilHits = this.milwaukeeCouncil.searchMembers(query)
      const countyHits = this.milwaukeeCountyBoard.searchMembers(query)
      const mergedOfficials = this.dedupeOfficials([
        ...councilHits,
        ...countyHits,
        ...results,
      ])
      const meetingHits = this.searchCalendarMeetings(query)
      this.renderOfficialsSearchResults(
        { officials: mergedOfficials, meetings: meetingHits },
        query
      )
    }

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleSearch, 200)
    })

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && input.value) {
        input.value = ""
        this.clearOfficialsSearchResults()
        input.blur()
      }
    })
  }

  searchCalendarMeetings(query) {
    if (!Array.isArray(this.calendarEvents)) return []
    const normalized = query.toLowerCase()
    const unique = new Set()
    const matches = []

    this.calendarEvents.forEach((event) => {
      const eventId = this.getCalendarEventId(event)
      if (unique.has(eventId)) return

      const textFields = []
      if (typeof event.title === "string") textFields.push(event.title)
      if (typeof event.bodyName === "string") textFields.push(event.bodyName)
      if (typeof event.sourceLabel === "string")
        textFields.push(event.sourceLabel)
      if (typeof event.location === "string") textFields.push(event.location)
      if (typeof event.description === "string")
        textFields.push(event.description)
      if (typeof event.summary === "string") textFields.push(event.summary)
      if (Array.isArray(event.topics)) textFields.push(event.topics.join(" "))
      if (Array.isArray(event.keywords))
        textFields.push(event.keywords.join(" "))

      const haystack = textFields.join(" \u2022 ").toLowerCase()

      if (haystack.includes(normalized)) {
        unique.add(eventId)
        matches.push(event)
      }
    })

    matches.sort((a, b) => {
      const aDate = new Date(a.startDateTime)
      const bDate = new Date(b.startDateTime)
      return aDate - bDate
    })

    return matches.slice(0, 20)
  }

  dedupeOfficials(results = []) {
    const seen = new Set()
    return results.filter((official) => {
      const key =
        official.id || official.ocd_id || official.divisionId || official.name
      if (!key) return true
      const normalized = String(key).toLowerCase()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }

  setupOfficialsSearchToggle() {
    const toggleBtn = document.getElementById("toggle-official-search")
    const searchBlock = document.querySelector(".official-search")
    if (!toggleBtn || !searchBlock) return

    this.setOfficialsSearchVisible(!this.settings.hideOfficialsSearch, {
      silent: true,
      skipSave: true,
    })

    toggleBtn.addEventListener("click", () => {
      const currentlyVisible = toggleBtn.getAttribute("aria-pressed") === "true"
      const nextVisible = !currentlyVisible
      this.setOfficialsSearchVisible(nextVisible, {
        focusInput: nextVisible,
      })
    })
  }

  setOfficialsSearchVisible(
    isVisible,
    {
      focusInput = false,
      focusToggle = false,
      silent = false,
      skipSave = false,
    } = {}
  ) {
    const toggleBtn = document.getElementById("toggle-official-search")
    const searchBlock = document.querySelector(".official-search")
    const input = document.getElementById("official-search-input")

    if (!toggleBtn || !searchBlock) return

    const showLabel = "Show officials search"
    const hideLabel = "Hide officials search"

    toggleBtn.classList.toggle("active", isVisible)
    toggleBtn.setAttribute("aria-pressed", isVisible.toString())
    toggleBtn.textContent = isVisible ? "✖" : "🔍"
    toggleBtn.title = isVisible ? hideLabel : showLabel
    toggleBtn.setAttribute("aria-label", isVisible ? hideLabel : showLabel)

    searchBlock.classList.toggle("hidden", !isVisible)

    if (input) {
      if (isVisible) {
        if (focusInput) {
          setTimeout(() => input.focus(), 50)
        }
      } else {
        input.value = ""
        input.blur()
      }
    }

    if (!skipSave) {
      this.settings.hideOfficialsSearch = !isVisible
      this.saveSettings()
    }

    if (!silent) {
      this.announceToScreenReader(
        isVisible ? "Officials search shown" : "Officials search hidden"
      )
    }

    if (!isVisible && focusToggle && toggleBtn) {
      setTimeout(() => {
        if (toggleBtn.isConnected) {
          toggleBtn.focus({ preventScroll: true })
        }
      }, 0)
    }
  }

  setupSimplifiedUIEvents() {
    console.log("Setting up simplified UI events...")

    // Toggle search row visibility
    const toggleSearchBtn = document.getElementById("toggle-search")
    const searchRow = document.getElementById("search-row")
    if (toggleSearchBtn && searchRow) {
      toggleSearchBtn.addEventListener("click", () => {
        const isVisible = !searchRow.classList.contains("hidden")
        searchRow.classList.toggle("hidden", isVisible)
        toggleSearchBtn.setAttribute("aria-pressed", (!isVisible).toString())

        // Add/remove searching class to sidebar for calendar hiding
        const sidebar = document.getElementById("civic-sidebar")
        if (sidebar) {
          sidebar.classList.toggle("searching", !isVisible)
        }

        if (!isVisible) {
          // Focus search input when showing
          const searchInput = document.getElementById("official-search-input")
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 100)
          }
        } else {
          // Clear search input when hiding
          const searchInput = document.getElementById("official-search-input")
          if (searchInput && searchInput.value) {
            searchInput.value = ""
            searchInput.dispatchEvent(new Event("input"))
          }
        }
      })
    }

    // Officials view toggle
    const toggleOfficialsBtn = document.getElementById("toggle-officials-view")
    if (toggleOfficialsBtn) {
      toggleOfficialsBtn.addEventListener("click", () => {
        const isPressed =
          toggleOfficialsBtn.getAttribute("aria-pressed") === "true"
        toggleOfficialsBtn.setAttribute("aria-pressed", (!isPressed).toString())
        this.switchContentView(isPressed ? "events" : "officials")
      })
    }

    // Week day clicks for calendar filtering
    this.setupWeekDayClicks()

    // Detail overlay back button
    const detailBackBtn = document.getElementById("detail-back")
    if (detailBackBtn) {
      detailBackBtn.addEventListener("click", () => {
        this.hideDetailOverlay()
      })
    }

    console.log("Simplified UI events set up")
  }

  setupWeekDayClicks() {
    // Event delegation for week day clicks
    const weekContainers = [
      "current-week-days",
      "next-week-days",
      "two-weeks-out-days",
    ]

    weekContainers.forEach((containerId) => {
      const container = document.getElementById(containerId)
      if (container) {
        container.addEventListener("click", (e) => {
          const weekDay = e.target.closest(".week-day")
          if (weekDay) {
            const dateStr = weekDay.dataset.date
            if (!dateStr) return

            // Check if this day is already selected (toggle functionality)
            const isSelected = weekDay.classList.contains("selected")

            if (isSelected) {
              // Day is already selected, so clear the filter (toggle off)
              this.clearDateFilter()
            } else {
              // Day is not selected, so filter to this day (toggle on)
              // Remove selected class from all week days
              document.querySelectorAll(".week-day.selected").forEach((day) => {
                day.classList.remove("selected")
              })

              // Add selected class to clicked day
              weekDay.classList.add("selected")

              // Filter events by selected date
              this.filterEventsByDate(dateStr)
            }
          }
        })
      }
    })
  }

  switchContentView(viewType) {
    // Hide all content views
    document.querySelectorAll(".content-view").forEach((view) => {
      view.classList.remove("active")
    })

    // Show the selected view
    const targetView = document.getElementById(`${viewType}-view`)
    if (targetView) {
      targetView.classList.add("active")
    }

    // Hide/show calendar weeks based on view type
    const calendarWeeks = document.getElementById("simplified-calendar")
    if (calendarWeeks) {
      if (viewType === "officials") {
        calendarWeeks.classList.add("hidden")
      } else {
        calendarWeeks.classList.remove("hidden")
      }
    }

    // Update navigation buttons
    document.querySelectorAll(".nav-btn-icon").forEach((btn) => {
      btn.setAttribute("aria-pressed", "false")
    })

    if (viewType === "officials") {
      const officialsBtn = document.getElementById("toggle-officials-view")
      if (officialsBtn) {
        officialsBtn.setAttribute("aria-pressed", "true")
      }
    }
  }

  filterEventsByDate(dateStr) {
    console.log("Filtering events by date:", dateStr)

    const eventsContainer = document.getElementById("calendar-events")
    if (!eventsContainer) return

    // Filter events to only show those on the selected date
    const filteredEvents = this.calendarEvents.filter((event) => {
      if (!event.startDateTime) return false
      const eventDate = this.getLocalDateString(new Date(event.startDateTime))
      return eventDate === dateStr
    })

    console.log(`Found ${filteredEvents.length} events for ${dateStr}`)

    // Clear and re-render events
    eventsContainer.innerHTML = ""

    if (filteredEvents.length === 0) {
      const noEventsDiv = document.createElement("div")
      noEventsDiv.className = "no-events-message"

      const message = document.createElement("p")
      message.textContent = `No events scheduled for ${this.formatDisplayDate(
        dateStr
      )}`
      noEventsDiv.appendChild(message)

      const clearButton = document.createElement("button")
      clearButton.className = "clear-filter-btn"
      clearButton.textContent = "Show all events"
      clearButton.addEventListener("click", () => this.clearDateFilter())
      noEventsDiv.appendChild(clearButton)

      eventsContainer.appendChild(noEventsDiv)
    } else {
      filteredEvents.forEach((event) => {
        const eventElement = this.createCalendarEventListItem(event)
        eventsContainer.appendChild(eventElement)
      })

      // Add clear filter button
      const clearButton = document.createElement("button")
      clearButton.className = "clear-filter-btn"
      clearButton.textContent = "Show all events"
      clearButton.onclick = () => this.clearDateFilter()
      eventsContainer.appendChild(clearButton)
    }
  }

  clearDateFilter() {
    // Remove selected state from all week days
    document.querySelectorAll(".week-day.selected").forEach((day) => {
      day.classList.remove("selected")
    })

    // Re-render all events
    this.renderCalendarEventsList()
  }

  formatDisplayDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helper function to get consistent date string in local timezone (YYYY-MM-DD)
  getLocalDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Update version display from manifest.json
  async updateVersionDisplay() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest()
        const versionElement = document.querySelector('.version-indicator')
        if (versionElement && manifest.version) {
          versionElement.textContent = `v${manifest.version}`
          versionElement.setAttribute('aria-label', `Application version ${manifest.version}`)
          console.log(`Version updated to ${manifest.version}`)
        }
      }
    } catch (error) {
      console.warn('Could not update version display:', error)
    }
  }

  showDetailOverlay(type, data) {
    const overlay = document.getElementById("detail-overlay")
    const heading = document.getElementById("detail-heading")
    const subtitle = document.getElementById("detail-subtitle")
    const content = document.getElementById("detail-content")

    if (!overlay || !heading || !content) return

    // Set title and content based on type
    if (type === "event") {
      heading.textContent = data.name || "Meeting Details"
      if (subtitle) subtitle.textContent = data.body || ""
      content.innerHTML = this.renderEventDetail(data)
    } else if (type === "official") {
      heading.textContent = data.name || "Official Details"
      if (subtitle) subtitle.textContent = data.office || data.title || ""
      content.innerHTML = this.renderOfficialDetail(data)
    }

    overlay.classList.remove("hidden")
  }

  hideDetailOverlay() {
    const overlay = document.getElementById("detail-overlay")
    if (overlay) {
      overlay.classList.add("hidden")
    }
  }

  renderEventDetail(event) {
    // Render detailed event information with comprehensive data
    const startDate = event.startDateTime ? new Date(event.startDateTime) : null
    const endDate = event.endDateTime ? new Date(event.endDateTime) : null

    const formatDate = (date) =>
      date
        ? date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A"

    const formatTime = (date) =>
      date
        ? date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A"

    const sourceColor =
      event.sourceColor ||
      CALENDAR_SOURCE_COLORS[event.source] ||
      "var(--accent-color)"
    const sourceName =
      CALENDAR_SOURCE_LABELS[event.source] ||
      event.sourceLabel ||
      "Local Government"

    return `
      <div class="event-detail">
        <div class="event-header">
          <h4 class="event-title">${
            event.title || event.name || "Government Meeting"
          }</h4>
          <div class="event-source" style="color: ${sourceColor}">
            <span class="source-dot" style="background-color: ${sourceColor}"></span>
            ${sourceName}
          </div>
        </div>

        <div class="event-info">
          <div class="info-section">
            <h5>When</h5>
            <p class="event-date">${formatDate(startDate)}</p>
            <p class="event-time">
              ${formatTime(startDate)}${
      endDate && endDate !== startDate ? ` - ${formatTime(endDate)}` : ""
    }
            </p>
          </div>

          ${
            event.location
              ? `
            <div class="info-section">
              <h5>Where</h5>
              <p class="event-location">${event.location}</p>
            </div>
          `
              : ""
          }

          ${
            event.bodyName || event.body
              ? `
            <div class="info-section">
              <h5>Organizing Body</h5>
              <p class="event-body">${event.bodyName || event.body}</p>
            </div>
          `
              : ""
          }

          ${
            event.description
              ? `
            <div class="info-section">
              <h5>Description</h5>
              <div class="event-description">${event.description}</div>
            </div>
          `
              : ""
          }

          ${
            event.agendaUrl
              ? `
            <div class="info-section">
              <h5>Resources</h5>
              <p class="event-links">
                <a href="${event.agendaUrl}" target="_blank" rel="noopener noreferrer" class="event-link">
                  📄 View Agenda
                </a>
              </p>
            </div>
          `
              : ""
          }

          ${
            event.meetingUrl
              ? `
            <div class="info-section">
              <h5>Participation</h5>
              <p class="event-links">
                <a href="${event.meetingUrl}" target="_blank" rel="noopener noreferrer" class="event-link">
                  🔗 Join Meeting
                </a>
              </p>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `
  }

  renderOfficialDetail(official) {
    // Render detailed official information using event detail styling
    const name = official.name || "Official"
    const office = official.office || official.title || "N/A"
    const party = official.party
    const district = official.district
    const level = official.level

    // Determine source color based on level
    const levelColorMap = {
      city: "#0077be",
      county: "#ffc107",
      state: "#228b22",
      federal: "#dc143c",
    }
    const sourceColor = levelColorMap[level] || "var(--accent-color)"
    const levelLabel = level
      ? level.charAt(0).toUpperCase() + level.slice(1)
      : "Government"

    let detailHTML = `
      <div class="event-detail">
        <div class="event-header">
          <h4 class="event-title">${name}</h4>
          <div class="event-source" style="color: ${sourceColor}">
            <span class="source-dot" style="background-color: ${sourceColor}"></span>
            ${levelLabel} Official
          </div>
        </div>

        <div class="event-info">
    `

    // Basic Information Section
    if (office !== "N/A" || district || party || official.department) {
      detailHTML += `
        <div class="info-section">
          <h5>Position</h5>
          ${office !== "N/A" ? `<p class="event-body">${office}</p>` : ""}
          ${district ? `<p><strong>District:</strong> ${district}</p>` : ""}
          ${
            official.department
              ? `<p><strong>Department:</strong> ${official.department}</p>`
              : ""
          }
          ${party ? `<p><strong>Party:</strong> ${party}</p>` : ""}
        </div>
      `
    }

    // Responsibilities Section
    if (official.responsibilities && official.responsibilities.length > 0) {
      detailHTML += `
        <div class="info-section">
          <h5>Key Responsibilities</h5>
          <div class="event-description">
            <ul>`

      official.responsibilities.forEach((responsibility) => {
        detailHTML += `<li>${responsibility}</li>`
      })

      detailHTML += `
            </ul>
          </div>
        </div>
      `
    }

    // Committees Section
    if (official.committees && official.committees.length > 0) {
      detailHTML += `
        <div class="info-section">
          <h5>Committee Assignments</h5>
          <div class="event-description">`

      official.committees.forEach((committee) => {
        if (typeof committee === "string") {
          detailHTML += `<p>${committee}</p>`
        } else if (committee.name) {
          const role = committee.role
            ? `<strong>${committee.role}</strong> - `
            : ""
          detailHTML += `<p>${role}${committee.name}</p>`

          // Add committee description if available
          let description = ""
          if (
            this.milwaukeeCouncil &&
            this.milwaukeeCouncil.committeeDescriptions[committee.name]
          ) {
            description =
              this.milwaukeeCouncil.committeeDescriptions[committee.name]
          } else if (
            this.milwaukeeCountyBoard &&
            this.milwaukeeCountyBoard.committeeDescriptions[committee.name]
          ) {
            description =
              this.milwaukeeCountyBoard.committeeDescriptions[committee.name]
          }

          if (description) {
            detailHTML += `<p style="font-size: 0.9rem; color: var(--text-muted); margin-left: 1rem; font-style: italic;">${description}</p>`
          }
        }
      })

      detailHTML += `
          </div>
        </div>
      `
    }

    // Contact Information Section
    const contact = official.contact || {}
    const hasContactInfo =
      official.phones ||
      official.emails ||
      official.phone ||
      official.email ||
      contact.phone ||
      contact.email ||
      contact.office

    if (hasContactInfo) {
      detailHTML += `
        <div class="info-section">
          <h5>Contact Information</h5>`

      // Phone numbers
      if (official.phones && official.phones.length > 0) {
        detailHTML += `<p><strong>📞 Phone:</strong> ${official.phones.join(
          ", "
        )}</p>`
      } else if (official.phone) {
        detailHTML += `<p><strong>📞 Phone:</strong> ${official.phone}</p>`
      } else if (contact.phone) {
        detailHTML += `<p><strong>📞 Phone:</strong> ${contact.phone}</p>`
      }

      // Email addresses
      if (official.emails && official.emails.length > 0) {
        detailHTML += `<p><strong>📧 Email:</strong> ${official.emails
          .map((email) => `<a href="mailto:${email}">${email}</a>`)
          .join(", ")}</p>`
      } else if (official.email) {
        detailHTML += `<p><strong>📧 Email:</strong> <a href="mailto:${official.email}">${official.email}</a></p>`
      } else if (contact.email) {
        detailHTML += `<p><strong>📧 Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>`
      }

      // Office address
      if (contact.office) {
        detailHTML += `<p><strong>🏢 Office:</strong> ${contact.office}</p>`
      }

      detailHTML += `</div>`
    }

    // Website Section
    const hasWebsites =
      (official.urls && official.urls.length > 0) ||
      official.website ||
      contact.website
    if (hasWebsites) {
      detailHTML += `
        <div class="info-section">
          <h5>Resources</h5>
          <p class="event-links">`

      if (official.urls && official.urls.length > 0) {
        official.urls.forEach((url) => {
          detailHTML += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="event-link">🔗 Official Website</a><br>`
        })
      } else if (official.website) {
        detailHTML += `<a href="${official.website}" target="_blank" rel="noopener noreferrer" class="event-link">🔗 Official Website</a><br>`
      } else if (contact.website) {
        detailHTML += `<a href="${contact.website}" target="_blank" rel="noopener noreferrer" class="event-link">🔗 Official Website</a><br>`
      }

      detailHTML += `</p></div>`
    }

    // Term Information Section
    if (official.term_start || official.term_length_years || official.tenure) {
      detailHTML += `
        <div class="info-section">
          <h5>Term Information</h5>`

      if (official.term_start) {
        const startDate = new Date(official.term_start).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
        detailHTML += `<p><strong>Term Started:</strong> ${startDate}</p>`
      }

      if (official.term_length_years) {
        detailHTML += `<p><strong>Term Length:</strong> ${official.term_length_years} years</p>`
      }

      if (official.tenure) {
        detailHTML += `<p><strong>Tenure:</strong> ${official.tenure}</p>`
      }

      detailHTML += `</div>`
    }

    // Background Section
    if (official.bio || official.education || official.profession) {
      detailHTML += `
        <div class="info-section">
          <h5>Background</h5>
          <div class="event-description">`

      if (official.bio) {
        detailHTML += `<p>${official.bio}</p>`
      }

      if (official.education) {
        detailHTML += `<p><strong>Education:</strong> ${official.education}</p>`
      }

      if (official.profession) {
        detailHTML += `<p><strong>Profession:</strong> ${official.profession}</p>`
      }

      detailHTML += `</div></div>`
    }

    // Federal Officials Legislation Section
    if (official.details) {
      if (official.details.sponsored_legislation) {
        detailHTML += `
          <div class="info-section">
            <h5>Recent Sponsored Bills</h5>
            <div class="event-description">
              <ul>`

        const bills =
          official.details.sponsored_legislation.results[0]?.bills || []
        bills.slice(0, 5).forEach((bill) => {
          detailHTML += `<li><strong>${bill.number}:</strong> ${bill.title}</li>`
        })

        detailHTML += `</ul></div></div>`
      }

      if (official.details.recent_votes) {
        detailHTML += `
          <div class="info-section">
            <h5>Recent Votes</h5>
            <div class="event-description">
              <ul>`

        const votes = official.details.recent_votes.results?.votes || []
        votes.slice(0, 5).forEach((vote) => {
          detailHTML += `<li><strong>${vote.position}:</strong> ${vote.description}</li>`
        })

        detailHTML += `</ul></div></div>`
      }
    }

    detailHTML += `
        </div>
      </div>
    `

    return detailHTML
  }

  setupSimplifiedCalendar() {
    console.log("Setting up simplified calendar...")

    // Populate week days for current week, next week, and 2 weeks out
    this.populateWeekDays("current-week-days", 0)
    this.populateWeekDays("next-week-days", 1)
    this.populateWeekDays("two-weeks-out-days", 2)

    console.log("Simplified calendar set up")
  }

  populateWeekDays(containerId, weekOffset) {
    const container = document.getElementById(containerId)
    if (!container) return

    const today = new Date()
    const startOfWeek = new Date(today)

    // Get Monday of the current week
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday being 0
    startOfWeek.setDate(diff)

    // Add week offset
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7)

    container.innerHTML = ""

    // Create 7 days (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const dayElement = document.createElement("div")
      dayElement.className = "week-day"
      dayElement.dataset.date = this.getLocalDateString(date) // YYYY-MM-DD format

      const dayNumber = document.createElement("div")
      dayNumber.className = "day-number"
      dayNumber.textContent = date.getDate()

      const dayName = document.createElement("div")
      dayName.className = "day-name"
      dayName.textContent = date
        .toLocaleDateString("en-US", { weekday: "short" })
        .toLowerCase()

      dayElement.appendChild(dayNumber)
      dayElement.appendChild(dayName)

      // Check for actual events on this date
      this.addEventIndicators(dayElement, date)

      container.appendChild(dayElement)
    }
  }

  addEventIndicators(dayElement, date) {
    const dateStr = this.getLocalDateString(date)

    // Check if there are events on this date
    const eventsOnDate = this.calendarEvents.filter((event) => {
      if (!event.startDateTime) return false
      const eventDate = this.getLocalDateString(new Date(event.startDateTime))
      return eventDate === dateStr
    })

    if (eventsOnDate.length === 0) return

    // Determine event sources
    const hasCityEvents = eventsOnDate.some(
      (event) => event.source === "milwaukee"
    )
    const hasCountyEvents = eventsOnDate.some(
      (event) => event.source === "milwaukeecounty"
    )

    dayElement.classList.add("has-events")

    if (hasCityEvents && hasCountyEvents) {
      dayElement.classList.add("has-both-events")
    } else if (hasCityEvents) {
      dayElement.classList.add("has-city-events")
    } else if (hasCountyEvents) {
      dayElement.classList.add("has-county-events")
    }
  }

  refreshWeekCalendarIndicators() {
    // Refresh all week day indicators when events are updated
    this.populateWeekDays("current-week-days", 0)
    this.populateWeekDays("next-week-days", 1)
    this.populateWeekDays("two-weeks-out-days", 2)
  }

  clearOfficialsSearchResults() {
    // Clear search results containers
    const searchEventsContainer = document.getElementById("search-events-list")
    const searchOfficialsContainer = document.getElementById(
      "search-officials-list"
    )

    if (searchEventsContainer) {
      searchEventsContainer.innerHTML = ""
    }
    if (searchOfficialsContainer) {
      searchOfficialsContainer.innerHTML = ""
    }

    // Switch back to events view and show calendar
    this.switchContentView("events")
    this.setCalendarVisibility(true)
    this.closeOfficialDetail({ silent: true })
  }

  renderOfficialsSearchResults(resultSets, query) {
    // Switch to search results view
    this.switchContentView("search-results")

    // Get search results containers
    const searchEventsContainer = document.getElementById("search-events-list")
    const searchOfficialsContainer = document.getElementById(
      "search-officials-list"
    )

    if (!searchEventsContainer || !searchOfficialsContainer) return

    this.closeOfficialDetail({ silent: true })
    this.setCalendarVisibility(false)

    // Clear previous results
    searchEventsContainer.innerHTML = ""
    searchOfficialsContainer.innerHTML = ""

    const { officials = [], meetings = [] } = resultSets || {}
    const totalResults = officials.length + meetings.length

    if (totalResults === 0) {
      const empty = document.createElement("div")
      empty.className = "search-results-empty"
      empty.textContent = "No officials or meetings match your search."
      searchEventsContainer.appendChild(empty)
    } else {
      if (meetings.length) {
        meetings.forEach((event) => {
          const item = this.createCalendarEventListItem(event, {
            onSelect: () => this.showDetailOverlay("event", event),
          })
          item.classList.add("search-meeting-item")
          const button = item.querySelector(".calendar-event-main")
          if (button) {
            button.classList.add("search-meeting-button")
          }
          searchEventsContainer.appendChild(item)
        })
      }

      if (officials.length) {
        officials.forEach((official) => {
          const colorMap = {
            city: "#0077be",
            county: "#ffc107",
            state: "#228b22",
            federal: "#dc143c",
          }
          const element = this.createCompactOfficialElement(
            official,
            "comprehensive",
            colorMap[official.level] || "var(--accent-color)"
          )
          element.classList.add("search-official-item")

          const nameEl = element.querySelector(".official-name")
          if (nameEl && official.level) {
            const badge = document.createElement("span")
            badge.textContent = ` (${official.level})`
            badge.style.fontSize = "0.7rem"
            badge.style.color = "var(--text-muted)"
            nameEl.appendChild(badge)
          }

          // Override the click handler to use detail overlay instead of sidebar detail
          const button = element.querySelector("button")
          if (button) {
            // Remove existing click listeners
            button.replaceWith(button.cloneNode(true))
            const newButton = element.querySelector("button")
            newButton.addEventListener("click", () => {
              this.showDetailOverlay("official", official)
            })
          }

          searchOfficialsContainer.appendChild(element)
        })
      }
    }

    const announceParts = [
      `${totalResults} result${totalResults === 1 ? "" : "s"}`,
    ]
    if (meetings.length) {
      announceParts.push(
        `${meetings.length} meeting${meetings.length === 1 ? "" : "s"}`
      )
    }
    if (officials.length) {
      announceParts.push(
        `${officials.length} official${officials.length === 1 ? "" : "s"}`
      )
    }
    this.announceToScreenReader(
      `${announceParts.join(", ")} found for ${query}`
    )
  }

  handleMeetingSearchResultSelection(event) {
    const input = document.getElementById("official-search-input")
    if (input) {
      input.value = ""
    }

    this.clearOfficialsSearchResults()
    this.setCalendarVisibility(true)
    this.focusCalendarOnEvent(event)

    const eventId = this.getCalendarEventId(event)
    const calendarElement = this.getCalendarEventElementById(eventId)

    if (
      calendarElement &&
      typeof calendarElement.scrollIntoView === "function"
    ) {
      calendarElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }

    this.showCalendarEventDetail(event, calendarElement || null)
  }

  // Favorites Management
  renderFavorites() {
    const grid = document.getElementById("favorites-grid")
    grid.innerHTML = ""

    this.favorites.forEach((favorite) => {
      const item = this.createFavoriteElement(favorite)
      grid.appendChild(item)
    })

    // Ensure drag & drop listeners are attached (one-time)
    this.initializeFavoritesDragAndDrop()
  }

  createFavoriteElement(favorite) {
    const item = document.createElement("a")
    item.className = "favorite-item fade-in"
    item.href = favorite.url
    item.setAttribute("role", "gridcell")
    item.setAttribute("aria-label", `Visit ${favorite.name} website`)
    item.dataset.favoriteId = favorite.id
    // Enable drag and drop ordering
    item.setAttribute("draggable", "true")
    item.setAttribute("aria-grabbed", "false")

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", favorite.id)
      item.classList.add("dragging")
      item.setAttribute("aria-grabbed", "true")
    })

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging")
      item.setAttribute("aria-grabbed", "false")
      // Clean residual highlights
      document
        .querySelectorAll(".favorite-item.drag-over")
        .forEach((el) => el.classList.remove("drag-over"))
    })

    const icon = document.createElement("img")
    icon.className = "icon"
    icon.src = favorite.icon || this.getFaviconUrl(favorite.url)
    icon.alt = favorite.name
    icon.onerror = () => {
      icon.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMTYgMTJWMjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiAxNkgyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+"
    }

    const name = document.createElement("span")
    name.className = "name"
    name.textContent = favorite.name

    // Add context menu event listener
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault()
      this.showContextMenu(e, favorite)
    })

    item.appendChild(icon)
    item.appendChild(name)

    return item
  }

  // Initialize drag & drop reordering (event delegation on grid)
  initializeFavoritesDragAndDrop() {
    if (this.favoritesDnDInitialized) return
    const grid = document.getElementById("favorites-grid")
    if (!grid) return

    grid.addEventListener("dragover", (e) => {
      e.preventDefault()
      const targetItem = e.target.closest(".favorite-item")
      const dragging = grid.querySelector(".favorite-item.dragging")
      if (!dragging) return
      document
        .querySelectorAll(".favorite-item.drag-over")
        .forEach((el) => el.classList.remove("drag-over"))
      if (targetItem && targetItem !== dragging) {
        targetItem.classList.add("drag-over")
      }
      e.dataTransfer.dropEffect = "move"
    })

    grid.addEventListener("dragleave", (e) => {
      const related = e.relatedTarget
      if (!grid.contains(related)) {
        document
          .querySelectorAll(".favorite-item.drag-over")
          .forEach((el) => el.classList.remove("drag-over"))
      }
    })

    grid.addEventListener("drop", (e) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData("text/plain")
      const sourceIndex = this.favorites.findIndex((f) => f.id === sourceId)
      if (sourceIndex === -1) return

      const targetItem = e.target.closest(".favorite-item")
      let targetIndex = -1
      if (targetItem) {
        targetIndex = this.favorites.findIndex(
          (f) => f.id === targetItem.dataset.favoriteId
        )
      } else {
        // Dropped in empty area => move to end
        targetIndex = this.favorites.length - 1
      }

      if (targetIndex === -1 || targetIndex === sourceIndex) {
        // Nothing to do
        document
          .querySelectorAll(".favorite-item.drag-over")
          .forEach((el) => el.classList.remove("drag-over"))
        return
      }

      const [moved] = this.favorites.splice(sourceIndex, 1)
      // Adjust target index if item removed before it
      const insertionIndex =
        sourceIndex < targetIndex ? targetIndex : targetIndex
      this.favorites.splice(insertionIndex, 0, moved)

      // Persist & re-render
      this.saveFavorites()
      this.renderFavorites()

      // Screen reader announcement
      this.announceToScreenReader(
        `${moved.name} moved to position ${insertionIndex + 1}`
      )
    })

    this.favoritesDnDInitialized = true
  }

  getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMTYgMTJWMjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiAxNkgyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+"
    }
  }

  showFavoriteModal(favorite = null) {
    const modal = document.getElementById("favorite-modal")
    const title = document.getElementById("favorite-modal-title")
    const nameInput = document.getElementById("site-name")
    const urlInput = document.getElementById("site-url")

    // Store the element that opened this modal for focus restoration
    this.lastFocusedElement = document.activeElement

    if (favorite) {
      title.textContent = "Edit Favorite Site"
      nameInput.value = favorite.name
      urlInput.value = favorite.url
      modal.dataset.editingId = favorite.id
    } else {
      title.textContent = "Add Favorite Site"
      nameInput.value = ""
      urlInput.value = ""
      delete modal.dataset.editingId
    }

    modal.classList.remove("hidden")

    // Set up modal keyboard trap
    this.setupModalKeyboardTrap(modal)

    // Focus the first input
    setTimeout(() => {
      nameInput.focus()
    }, 100)

    // Announce modal opening to screen readers
    this.announceToScreenReader(`${title.textContent} dialog opened`)
  }

  hideFavoriteModal() {
    const modal = document.getElementById("favorite-modal")
    modal.classList.add("hidden")

    // Remove keyboard trap
    this.removeModalKeyboardTrap(modal)

    // Restore focus to the element that opened the modal
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus()
      this.lastFocusedElement = null
    }

    // Announce modal closing to screen readers
    this.announceToScreenReader("Dialog closed")
  }

  editFavorite(favorite) {
    this.showFavoriteModal(favorite)
  }

  saveFavorite() {
    const modal = document.getElementById("favorite-modal")
    const nameInput = document.getElementById("site-name")
    const urlInput = document.getElementById("site-url")

    const name = nameInput.value.trim()
    const url = urlInput.value.trim()

    if (!name || !url) {
      alert("Please enter both name and URL")
      return
    }

    let finalUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = "https://" + url
    }

    if (modal.dataset.editingId) {
      // Edit existing favorite
      const index = this.favorites.findIndex(
        (f) => f.id === modal.dataset.editingId
      )
      if (index !== -1) {
        this.favorites[index] = {
          ...this.favorites[index],
          name,
          url: finalUrl,
        }
      }
    } else {
      // Add new favorite
      const newFavorite = {
        id: Date.now().toString(),
        name,
        url: finalUrl,
      }
      this.favorites.push(newFavorite)
    }

    this.saveFavorites()
    this.renderFavorites()
    this.hideFavoriteModal()
  }

  // Context Menu Management
  showContextMenu(event, favorite) {
    const contextMenu = document.getElementById("context-menu")
    const editItem = document.getElementById("context-edit")
    const deleteItem = document.getElementById("context-delete")

    // Store the current favorite for the context menu actions
    this.contextMenuFavorite = favorite

    // Position the context menu
    contextMenu.style.left = `${event.pageX}px`
    contextMenu.style.top = `${event.pageY}px`
    contextMenu.classList.add("show")

    // Update aria labels with specific favorite name
    editItem.setAttribute("aria-label", `Edit ${favorite.name} favorite`)
    deleteItem.setAttribute("aria-label", `Delete ${favorite.name} favorite`)

    // Focus the first item for keyboard navigation
    setTimeout(() => {
      editItem.focus()
    }, 10)

    // Announce to screen reader
    this.announceToScreenReader(`Context menu opened for ${favorite.name}`)
  }

  hideContextMenu() {
    const contextMenu = document.getElementById("context-menu")
    contextMenu.classList.remove("show")
    this.contextMenuFavorite = null
  }

  deleteFavorite(favoriteId) {
    const favorite = this.favorites.find((f) => f.id === favoriteId)
    if (!favorite) return

    // Confirm deletion
    if (!confirm(`Delete "${favorite.name}" from favorites?`)) {
      return
    }

    // Remove from array
    this.favorites = this.favorites.filter((f) => f.id !== favoriteId)

    // Save and re-render
    this.saveFavorites()
    this.renderFavorites()

    // Accessibility announcement
    this.announceToScreenReader(`${favorite.name} deleted from favorites`)

    // Hide context menu
    this.hideContextMenu()
  }

  // Accessibility Methods
  setupModalKeyboardTrap(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    this.modalFocusableElements = Array.from(focusableElements)
    this.firstFocusableElement = this.modalFocusableElements[0]
    this.lastFocusableElement =
      this.modalFocusableElements[this.modalFocusableElements.length - 1]

    this.modalKeydownHandler = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === this.firstFocusableElement) {
            e.preventDefault()
            this.lastFocusableElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === this.lastFocusableElement) {
            e.preventDefault()
            this.firstFocusableElement.focus()
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        this.hideFavoriteModal()
        this.hideSettingsModal()
      }
    }

    modal.addEventListener("keydown", this.modalKeydownHandler)
  }

  removeModalKeyboardTrap(modal) {
    if (this.modalKeydownHandler) {
      modal.removeEventListener("keydown", this.modalKeydownHandler)
      this.modalKeydownHandler = null
    }
    this.modalFocusableElements = null
    this.firstFocusableElement = null
    this.lastFocusableElement = null
  }

  announceToScreenReader(message) {
    // Create or update the screen reader announcement element
    let announcer = document.getElementById("sr-announcer")
    if (!announcer) {
      announcer = document.createElement("div")
      announcer.id = "sr-announcer"
      announcer.setAttribute("aria-live", "polite")
      announcer.setAttribute("aria-atomic", "true")
      announcer.className = "visually-hidden"
      document.body.appendChild(announcer)
    }

    // Clear and set the message
    announcer.textContent = ""
    setTimeout(() => {
      announcer.textContent = message
    }, 100)
  }

  hideSettingsModal() {
    const modal = document.getElementById("settings-modal")
    modal.classList.add("hidden")

    // Remove keyboard trap
    this.removeModalKeyboardTrap(modal)

    // Restore focus
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus()
      this.lastFocusedElement = null
    }

    this.announceToScreenReader("Settings dialog closed")
  }

  showSettingsModal() {
    const modal = document.getElementById("settings-modal")

    // Store the element that opened this modal for focus restoration
    this.lastFocusedElement = document.activeElement

    modal.classList.remove("hidden")

    // Set up modal keyboard trap
    this.setupModalKeyboardTrap(modal)

    // Focus the first interactive element
    setTimeout(() => {
      const firstCheckbox = modal.querySelector('input[type="checkbox"]')
      if (firstCheckbox) {
        firstCheckbox.focus()
      }
    }, 100)

    // Announce modal opening to screen readers
    this.announceToScreenReader("Application settings dialog opened")
  }

  // Address and Location Management
  async updateAddress() {
    const addressInput = document.getElementById("address-input")
    const address = addressInput.value.trim()

    if (!address) {
      alert("Please enter an address")
      return
    }

    this.currentAddress = address
    await this.loadCivicData(address)
  }

  getUserLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()

          const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryCode}`
          document.getElementById("address-input").value = address
          this.currentAddress = address
          await this.loadCivicData(address)
        } catch (error) {
          console.error("Error getting address from coordinates:", error)
          alert("Could not determine address from location")
        }
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Could not access your location")
      }
    )
  }

  // Address Validation
  async validateAddress(address) {
    try {
      console.log("Validating address:", address)

      const params = new URLSearchParams({
        key: this.settings.apiKey,
        address: address,
      })

      const url = `${this.divisionsApiEndpoint}?${params.toString()}`
      console.log("Address validation URL:", url)

      const response = await fetch(url)
      console.log("Address validation status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("Address validation error:", errorText)

        if (response.status === 400) {
          throw new Error(
            "Invalid address format. Please try a more specific address."
          )
        } else if (response.status === 403) {
          throw new Error(
            "Invalid API key. Please check your Google Cloud Console."
          )
        } else {
          throw new Error(`Address validation failed: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log("Address validation successful:", data)

      if (!data.divisions || Object.keys(data.divisions).length === 0) {
        throw new Error("No valid divisions found for this address.")
      }

      return {
        valid: true,
        normalizedAddress: data.normalizedInput,
        divisions: data.divisions,
      }
    } catch (error) {
      console.error("Address validation failed:", error)
      return {
        valid: false,
        error: error.message,
      }
    }
  }

  // Smart Civic Data Management with Caching
  async loadCivicData(address = null, forceRefresh = false) {
    if (!address && this.currentAddress) {
      address = this.currentAddress
    }

    const container = document.getElementById("officials-list")

    if (!address) {
      console.log("No address provided")
      this.renderNoAddressMessage()
      return
    }

    // Show enhanced loading state
    this.showLoadingState(container)

    try {
      console.log("Loading data for:", address)

      this.currentAddress = address
      document.getElementById("address-input").value = address

      // Check cache first (unless force refresh)
      let milwaukeeData = null
      if (!forceRefresh) {
        milwaukeeData = await this.getCachedData(address)
      }

      // If no cached data or force refresh, fetch from API
      if (!milwaukeeData) {
        console.log("Fetching fresh data from Milwaukee API")
        milwaukeeData = await this.milwaukeeApi.getRepresentatives(address)

        // Cache the successful response
        if (milwaukeeData && milwaukeeData.isInMilwaukeeCounty) {
          await this.setCachedData(address, milwaukeeData)
        }
      } else {
        console.log("Using cached Milwaukee data")
      }

      if (milwaukeeData && milwaukeeData.isInMilwaukeeCounty) {
        this.milwaukeeData = milwaukeeData
        console.log("Milwaukee data loaded:", milwaukeeData)
        // Save the successful address to cache
        await this.saveLastAddress(address)
        this.renderMilwaukeeDataOnly()
      } else {
        this.renderNoDataMessage(address)
      }
    } catch (error) {
      console.error("Error loading Milwaukee data:", error)
      this.renderCivicDataError(error.message)
    }
  }

  showLoadingState(container) {
    container.setAttribute("aria-busy", "true")
    container.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading Local representatives...</div>
      </div>
    `
    this.announceToScreenReader("Loading Local representatives, please wait")
  }

  async loadMemberDetails() {
    if (!this.civicData || !this.settings.propublicaApiKey) {
      return
    }

    const houseMembers = await this.propublicaApi.getMembers("house")
    const senateMembers = await this.propublicaApi.getMembers("senate")
    const allMembers = [...houseMembers, ...senateMembers]

    for (const official of this.civicData.officials) {
      let bestMatch = null
      let bestScore = 0

      for (const member of allMembers) {
        const score = this.jaroWinkler(
          official.name,
          `${member.first_name} ${member.last_name}`
        )
        if (score > bestScore) {
          bestScore = score
          bestMatch = member
        }
      }

      if (bestScore > 0.8) {
        // Confidence threshold
        official.details = await this.propublicaApi.getMember(bestMatch.id)
        official.details.sponsored_legislation =
          await this.propublicaApi.getSponsoredLegislation(bestMatch.id)
        official.details.recent_votes = await this.propublicaApi.getRecentVotes(
          bestMatch.id
        )
      }
    }
  }

  async loadMilwaukeeData(address) {
    if (!address || !this.milwaukeeApi.isAddressLikelyInMilwaukee(address)) {
      console.log(
        "Address not likely in the Milwaukee area, skipping Milwaukee API"
      )
      return
    }

    try {
      console.log("Loading Local data for:", address)
      const milwaukeeData = await this.milwaukeeApi.getRepresentatives(address)

      if (milwaukeeData && milwaukeeData.isInMilwaukeeCounty) {
        this.milwaukeeData = milwaukeeData
        console.log("Milwaukee data loaded:", milwaukeeData)
      }
    } catch (error) {
      console.log("Milwaukee API error (not critical):", error.message)
      // Don't show error to user since this is supplementary data
      this.milwaukeeData = null
    }
  }

  jaroWinkler(s1, s2) {
    // jaro-winkler implementation
    let m = 0
    let i, j

    if (s1.length === 0 || s2.length === 0) {
      return 0
    }

    if (s1 === s2) {
      return 1
    }

    const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
    const s1Matches = new Array(s1.length)
    const s2Matches = new Array(s2.length)

    for (i = 0; i < s1.length; i++) {
      const low = i >= range ? i - range : 0
      const high = i + range < s2.length ? i + range : s2.length - 1

      for (j = low; j <= high; j++) {
        if (!s2Matches[j] && s1[i] === s2[j]) {
          s1Matches[i] = true
          s2Matches[j] = true
          m++
          break
        }
      }
    }

    if (m === 0) {
      return 0
    }

    let k = 0
    let t = 0
    for (i = 0; i < s1.length; i++) {
      if (s1Matches[i]) {
        for (j = k; j < s2.length; j++) {
          if (s2Matches[j]) {
            k = j + 1
            break
          }
        }
        if (s1[i] !== s2[j]) {
          t++
        }
      }
    }

    const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3

    // Winkler modification
    let p = 0.1
    let l = 0
    if (jaro > 0.7) {
      while (s1[l] === s2[l] && l < 4) {
        l++
      }
      return jaro + l * p * (1 - jaro)
    }

    return jaro
  }

  renderMilwaukeeDataOnly() {
    const container = document.getElementById("officials-list")
    container.innerHTML = ""

    this.closeOfficialDetail({ silent: true })

    // Define the division structure with both local and comprehensive officials
    const divisionStructure = {
      "City of Milwaukee": {
        color: "#0077be",
        localReps: [],
        allOfficials: this.governmentOfficials.getOfficialsByLevel("city"),
      },
      "Milwaukee County": {
        color: "#ffc107",
        localReps: [],
        allOfficials: this.governmentOfficials.getOfficialsByLevel("county"),
      },
      "Wisconsin State": {
        color: "#228b22",
        localReps: [],
        allOfficials: this.governmentOfficials.getOfficialsByLevel("state"),
      },
      "Federal Government": {
        color: "#dc143c",
        localReps: [],
        allOfficials: this.governmentOfficials
          .getOfficialsByLevel("federal")
          .filter(
            (official) =>
              !(
                official.title.includes("U.S. Senator") &&
                official.responsibilities.some((resp) =>
                  resp.includes("Wisconsin")
                )
              )
          ),
      },
    }

    // Add local representatives to their respective divisions if available
    if (this.milwaukeeData && this.milwaukeeData.representatives.length) {
      console.log(
        "Milwaukee representatives found:",
        this.milwaukeeData.representatives
      )
      this.milwaukeeData.representatives.forEach((rep) => {
        console.log(`Processing rep: ${rep.name} in division: ${rep.division}`)

        // Map old division names to new ones
        let targetDivision = rep.division
        if (rep.division === "U.S. Congress") {
          targetDivision = "Federal Government"
          console.log(`Mapping ${rep.division} to ${targetDivision}`)
        }

        if (divisionStructure[targetDivision]) {
          divisionStructure[targetDivision].localReps.push(rep)
          console.log(`Added ${rep.name} to ${targetDivision}`)
        } else {
          console.log(`Division ${targetDivision} not found in structure`)
        }
      })
    } else {
      console.log("No Milwaukee data or representatives found")
    }

    console.log("Available divisions:", Object.keys(divisionStructure))

    // Always add Wisconsin senators as local representatives for Wisconsin addresses
    const wisconsinSenators = this.governmentOfficials
      .getOfficialsByLevel("federal")
      .filter(
        (official) =>
          official.title.includes("U.S. Senator") &&
          official.responsibilities.some((resp) => resp.includes("Wisconsin"))
      )

    wisconsinSenators.forEach((senator) => {
      // Create a representative object similar to Milwaukee API format
      const senatorRep = {
        name: senator.name,
        title: senator.title,
        party: senator.party,
        division: "Federal Government",
        contact: senator.contact,
        responsibilities: senator.responsibilities,
      }
      console.log(`Adding Wisconsin senator: ${senator.name}`)
      divisionStructure["Federal Government"].localReps.push(senatorRep)
    })

    // Debug: Show what's in each division
    Object.entries(divisionStructure).forEach(([division, data]) => {
      console.log(
        `${division}: ${data.localReps.length} local reps, ${data.allOfficials.length} all officials`
      )
      if (data.localReps.length > 0) {
        console.log(
          `  Local reps: ${data.localReps.map((rep) => rep.name).join(", ")}`
        )
      }
    })

    // Render each division with integrated local + comprehensive officials
    Object.entries(divisionStructure).forEach(([division, data]) => {
      const divisionSection = document.createElement("div")
      divisionSection.className = "division-group fade-in integrated-section"
      divisionSection.style.borderLeft = `4px solid ${data.color}`

      const header = document.createElement("div")
      header.className = "division-header"
      header.textContent = division
      header.style.color = data.color
      divisionSection.appendChild(header)
      // Make headers collapsible
      this.addCollapsibleBehavior(header)

      // Add local representatives first (if any)
      if (data.localReps.length > 0) {
        const localSubheader = document.createElement("div")
        localSubheader.className = "subsection-header local-subsection"
        localSubheader.textContent = "Your Representatives"
        divisionSection.appendChild(localSubheader)

        data.localReps.forEach((rep) => {
          const officialElement = this.createCompactOfficialElement(
            rep,
            "local",
            data.color
          )
          divisionSection.appendChild(officialElement)
        })
      }

      // Add all officials for this level
      if (data.allOfficials.length > 0) {
        const allSubheader = document.createElement("div")
        allSubheader.className = "subsection-header all-subsection"
        allSubheader.textContent = `All ${division} Officials`
        divisionSection.appendChild(allSubheader)

        data.allOfficials.forEach((official) => {
          const officialElement = this.createCompactOfficialElement(
            official,
            "comprehensive",
            data.color
          )
          divisionSection.appendChild(officialElement)
        })
      }

      container.appendChild(divisionSection)
    })

    container.setAttribute("aria-busy", "false")

    // Announce completion to screen readers
    const totalLocalReps = this.milwaukeeData
      ? this.milwaukeeData.representatives.length
      : 0
    const totalAllOfficials = Object.values(
      this.governmentOfficials.getAllOfficials()
    ).reduce((sum, officials) => sum + officials.length, 0)

    this.announceToScreenReader(
      `Loaded ${totalLocalReps} local representatives and ${totalAllOfficials} government officials`
    )

    // Hide address input and show compact display
    this.showCompactAddressDisplay()
  }

  getOfficialSummary(official) {
    if (!official) return ""

    const parts = []
    const lowerParts = new Set()

    const addPart = (value) => {
      if (value === undefined || value === null) return
      const text = value.toString().trim()
      if (!text) return
      const lower = text.toLowerCase()
      if (lowerParts.has(lower)) return
      parts.push(text)
      lowerParts.add(lower)
    }

    const name = (official.name || "").trim()
    const office = (official.title || official.office || "").trim()
    const department = (official.department || "").trim()

    const isLocalRepresentative =
      official.type === "alderperson" || official.type === "supervisor"

    if (isLocalRepresentative) {
      if (office && office.toLowerCase() !== name.toLowerCase()) {
        addPart(office)
      } else if (department) {
        addPart(department)
      }

      const districtValue = official.district
      if (districtValue) {
        const districtLabel = /\d+/.test(String(districtValue))
          ? `District ${districtValue}`
          : districtValue
        const alreadyIncludesDistrict = parts.some((part) =>
          part.toLowerCase().includes(String(districtValue).toLowerCase())
        )
        if (!alreadyIncludesDistrict) {
          addPart(districtLabel)
        }
      }

      if (parts.length === 0 && department) {
        addPart(department)
      }

      return parts.join(" • ")
    }

    if (office && office.toLowerCase() !== name.toLowerCase()) {
      addPart(office)
    }

    const districtValue = official.district
    if (districtValue) {
      const districtLabel = /\d+/.test(String(districtValue))
        ? `District ${districtValue}`
        : districtValue
      const alreadyIncludesDistrict = parts.some((part) =>
        part.toLowerCase().includes(String(districtValue).toLowerCase())
      )
      if (!alreadyIncludesDistrict) {
        addPart(districtLabel)
      }
    }

    if (department && !lowerParts.has(department.toLowerCase())) {
      addPart(department)
    }

    if (official.party) {
      addPart(official.party)
    }

    return parts.join(" • ")
  }

  enrichLocalRepresentative(rep) {
    if (!rep) return rep

    const enriched = { ...rep }

    const parseDistrictNumber = (value) => {
      if (value === undefined || value === null) return NaN
      const numeric = parseInt(String(value).replace(/[^0-9]/g, ""), 10)
      return Number.isNaN(numeric) ? NaN : numeric
    }

    const normalizeName = (value) =>
      (value || "").toString().replace(/\s+/g, " ").trim().toLowerCase()

    const districtNumber = parseDistrictNumber(enriched.district)
    const normalizedName = normalizeName(enriched.name)

    const matchFromCollection = (collection) => {
      if (!collection || collection.length === 0) return null
      if (!Number.isNaN(districtNumber)) {
        const byDistrict = collection.find((member) => {
          const candidateDistrict = parseDistrictNumber(member.district)
          return (
            !Number.isNaN(candidateDistrict) &&
            candidateDistrict === districtNumber
          )
        })
        if (byDistrict) return byDistrict
      }
      if (normalizedName) {
        return collection.find(
          (member) => normalizeName(member.name) === normalizedName
        )
      }
      return null
    }

    let matched = null
    if (enriched.type === "alderperson") {
      matched = matchFromCollection(this.milwaukeeCouncil.getMembers())
    } else if (enriched.type === "supervisor") {
      matched = matchFromCollection(this.milwaukeeCountyBoard.getMembers())
    }

    if (matched) {
      if (matched.title && !enriched.office) {
        enriched.office = matched.title
      }

      if (matched.title && !enriched.title) {
        enriched.title = matched.title
      }

      if (matched.department && !enriched.department) {
        enriched.department = matched.department
      }

      if (matched.responsibilities && matched.responsibilities.length > 0) {
        enriched.responsibilities = matched.responsibilities
      }

      const contact = matched.contact || {}
      if (contact.website && !enriched.website) {
        enriched.website = contact.website
      }
      if (contact.email && !enriched.email) {
        enriched.email = contact.email
      }
      if (contact.phone && !enriched.phone) {
        enriched.phone = contact.phone
      }
      if (contact.office) {
        enriched.officeLocation = contact.office
      }
    }

    return enriched
  }

  appendDetailItem(container, label, value, className = "") {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return
    }

    const detail = document.createElement("div")
    detail.className = ["detail-item", className].filter(Boolean).join(" ")

    const labelEl = document.createElement("strong")
    labelEl.textContent = `${label}:`
    detail.appendChild(labelEl)

    const textValue =
      typeof value === "number" ? value.toLocaleString() : value.toString()
    detail.appendChild(document.createTextNode(` ${textValue}`))

    container.appendChild(detail)
  }

  appendResponsibilitiesSection(
    container,
    responsibilities,
    themeColor,
    options = {}
  ) {
    if (!Array.isArray(responsibilities) || responsibilities.length === 0)
      return

    const {
      label = "Key Responsibilities",
      limit,
      collapsed = true,
      expandedLabel,
    } = options

    const items =
      typeof limit === "number" && limit > 0
        ? responsibilities.slice(0, limit)
        : responsibilities.slice()

    if (items.length === 0) return

    const header = document.createElement("button")
    header.className = "responsibilities-header"
    const collapsedLabel = label
    const expandedText = expandedLabel || label
    header.textContent = collapsed ? collapsedLabel : expandedText
    header.setAttribute("aria-expanded", collapsed ? "false" : "true")

    if (themeColor) {
      header.style.borderColor = themeColor
      header.style.color = themeColor
    }

    const list = document.createElement("ul")
    list.className = "responsibilities-list"
    if (collapsed) list.classList.add("hidden")

    items.forEach((resp) => {
      if (!resp) return
      const item = document.createElement("li")
      item.textContent = resp
      list.appendChild(item)
    })

    header.addEventListener("click", () => {
      const isExpanded = header.getAttribute("aria-expanded") === "true"
      header.setAttribute("aria-expanded", (!isExpanded).toString())
      list.classList.toggle("hidden")
      header.textContent = !isExpanded ? expandedText : collapsedLabel
    })

    container.appendChild(header)
    container.appendChild(list)
  }

  createCompactOfficialElement(official, type, themeColor) {
    const element = document.createElement("div")
    element.className = `official compact-official ${type}-official`
    element.setAttribute("role", "listitem")

    const baseIdentifier = (official.name || official.title || "official")
      .toString()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")

    const uniqueId = `${baseIdentifier}-${type}`
    element.setAttribute("aria-labelledby", `name-${uniqueId}`)
    element.dataset.detailTheme = themeColor || ""

    const detailModel =
      type === "local"
        ? this.enrichLocalRepresentative(official)
        : { ...official }

    const mainButton = document.createElement("button")
    mainButton.type = "button"
    mainButton.className = "official-main"
    mainButton.setAttribute(
      "aria-label",
      `View details for ${
        detailModel.name || detailModel.title || "representative"
      }`
    )

    const nameContainer = document.createElement("div")
    nameContainer.className = "official-name-container"

    const name = document.createElement("span")
    name.className = "official-name"
    name.id = `name-${uniqueId}`
    name.textContent = detailModel.name || detailModel.title || "Representative"
    nameContainer.appendChild(name)

    const summaryText = this.getOfficialSummary(detailModel)
    if (summaryText) {
      const summary = document.createElement("span")
      summary.className = "official-summary"
      summary.id = `summary-${uniqueId}`
      summary.textContent = summaryText
      nameContainer.appendChild(summary)
      mainButton.setAttribute("aria-describedby", summary.id)
    }

    const indicator = document.createElement("span")
    indicator.className = "official-detail-indicator"
    indicator.setAttribute("aria-hidden", "true")
    indicator.textContent = "❯"

    mainButton.appendChild(nameContainer)
    mainButton.appendChild(indicator)

    mainButton.addEventListener("click", () => {
      this.showDetailOverlay("official", detailModel)
    })

    element.appendChild(mainButton)

    return element
  }

  showOfficialDetail(detailModel, type, themeColor, sourceElement) {
    const detailView = this.sidebarDetailView || {}
    const {
      listSection,
      detailSection,
      detailContent,
      detailSubtitle,
      backButton,
    } = detailView

    if (!detailSection || !detailContent || !listSection) {
      return
    }

    if (
      detailView.activeTrigger &&
      detailView.activeTrigger !== sourceElement
    ) {
      detailView.activeTrigger.classList.remove("active")
      detailView.activeTrigger.style.removeProperty("--detail-accent")
      detailView.activeTrigger.style.removeProperty("borderColor")
    }

    if (sourceElement) {
      sourceElement.classList.add("active")
      if (themeColor) {
        sourceElement.style.setProperty("--detail-accent", themeColor)
        sourceElement.style.borderColor = themeColor
      } else {
        sourceElement.style.removeProperty("--detail-accent")
        sourceElement.style.removeProperty("borderColor")
      }
      detailView.activeTrigger = sourceElement
      detailView.activeButton = sourceElement.querySelector(".official-main")
    } else {
      detailView.activeTrigger = null
      detailView.activeButton = null
    }

    listSection.classList.add("hidden")
    detailSection.classList.remove("hidden")

    if (themeColor) {
      detailSection.style.setProperty("--detail-accent", themeColor)
    } else {
      detailSection.style.removeProperty("--detail-accent")
    }

    detailSection.scrollTop = 0

    if (detailSubtitle) {
      let descriptor = "Government official"
      if (type === "local") {
        descriptor =
          detailModel.department || detailModel.office || "Your representative"
      } else if (detailModel.level) {
        const levelLabel = `${detailModel.level
          .charAt(0)
          .toUpperCase()}${detailModel.level.slice(1).toLowerCase()}`
        descriptor = `${levelLabel} official`
      }
      detailSubtitle.textContent = descriptor
    }

    detailContent.innerHTML = ""

    const identity = document.createElement("div")
    identity.className = "official-detail-identity"
    if (themeColor) {
      identity.style.borderColor = themeColor
    }

    const nameHeading = document.createElement("h4")
    nameHeading.textContent =
      detailModel.name || detailModel.title || "Representative"
    identity.appendChild(nameHeading)

    const roleText = detailModel.office || detailModel.title || detailModel.role
    if (roleText) {
      const role = document.createElement("div")
      role.className = "official-detail-role"
      role.textContent = roleText
      identity.appendChild(role)
    }

    const tagGroup = document.createElement("div")
    tagGroup.className = "official-detail-tags"

    const createTag = (label) => {
      const tag = document.createElement("span")
      tag.className = "official-detail-tag"
      tag.textContent = label
      if (themeColor) {
        tag.style.borderColor = themeColor
        tag.style.color = themeColor
      }
      return tag
    }

    if (detailModel.party) {
      tagGroup.appendChild(createTag(detailModel.party))
    }

    if (detailModel.level && type !== "local") {
      const levelLabel = `${detailModel.level
        .charAt(0)
        .toUpperCase()}${detailModel.level.slice(1).toLowerCase()}`
      tagGroup.appendChild(createTag(levelLabel))
    }

    if (detailModel.district && !roleText?.includes(detailModel.district)) {
      tagGroup.appendChild(createTag(detailModel.district))
    }

    if (tagGroup.childElementCount > 0) {
      identity.appendChild(tagGroup)
    }

    detailContent.appendChild(identity)

    const metadata = document.createElement("div")
    metadata.className = "official-detail-metadata"

    if (type === "local") {
      this.buildLocalOfficialDetails(metadata, detailModel, themeColor)
    } else {
      this.buildComprehensiveOfficialDetails(metadata, detailModel, themeColor)
    }

    if (metadata.childElementCount > 0) {
      detailContent.appendChild(metadata)
    }

    this.activeOfficialDetail = { official: detailModel, type, themeColor }

    if (backButton) {
      backButton.focus({ preventScroll: true })
    }

    this.announceToScreenReader(
      `Showing details for ${detailModel.name || detailModel.title}`
    )
  }

  closeOfficialDetail(options = {}) {
    const detailView = this.sidebarDetailView || {}
    const {
      listSection,
      detailSection,
      detailContent,
      detailSubtitle,
      activeTrigger,
      activeButton,
    } = detailView

    const wasVisible = detailSection
      ? !detailSection.classList.contains("hidden")
      : false

    if (activeTrigger) {
      activeTrigger.classList.remove("active")
      activeTrigger.style.removeProperty("--detail-accent")
      activeTrigger.style.removeProperty("borderColor")
      detailView.activeTrigger = null
    }

    detailView.activeButton = null

    if (detailSection) {
      detailSection.classList.add("hidden")
      detailSection.style.removeProperty("--detail-accent")
    }

    if (listSection) {
      listSection.classList.remove("hidden")
    }

    if (detailContent) {
      detailContent.innerHTML = ""
    }

    if (detailSubtitle) {
      detailSubtitle.textContent = ""
    }

    const returnFocus =
      activeButton && activeButton.isConnected ? activeButton : null

    this.activeOfficialDetail = null

    if (returnFocus) {
      setTimeout(() => {
        if (returnFocus.isConnected) {
          returnFocus.focus({ preventScroll: true })
        }
      }, 0)
    }

    if (!options.silent && wasVisible) {
      this.announceToScreenReader("Back to officials list")
    }
  }

  // Add collapsible behavior to division headers
  addCollapsibleBehavior(header) {
    if (!header) return
    header.setAttribute("role", "button")
    header.setAttribute("tabindex", "0")
    header.setAttribute("aria-expanded", "true")

    const parent = header.parentElement
    const toggle = () => {
      const expanded = header.getAttribute("aria-expanded") === "true"
      const newState = !expanded
      header.setAttribute("aria-expanded", newState.toString())
      if (parent) {
        parent.classList.toggle("collapsed", !newState ? true : false)
      }
      this.announceToScreenReader(
        `${header.textContent} section ${newState ? "expanded" : "collapsed"}`
      )
    }

    header.addEventListener("click", toggle)
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        toggle()
      }
    })
  }

  buildLocalOfficialDetails(panel, rep, themeColor) {
    panel.innerHTML = ""

    this.appendDetailItem(panel, "Department", rep.department, "department")
    this.appendDetailItem(panel, "District", rep.district, "district")
    this.appendDetailItem(
      panel,
      "Office Location",
      rep.officeLocation,
      "office-location"
    )

    if (rep.population) {
      this.appendDetailItem(panel, "Population", rep.population, "population")
    }

    const contactContainer = document.createElement("div")
    contactContainer.className = "contact-links"

    const createContactLink = (href, label) => {
      if (!href) return null
      const link = document.createElement("a")
      link.href = href
      link.textContent = label
      link.className = "contact-link"
      if (href.startsWith("http")) {
        link.target = "_blank"
        link.rel = "noopener noreferrer"
      }
      if (themeColor) {
        link.style.borderColor = themeColor
        link.style.color = themeColor
      }
      return link
    }

    const websiteLabel =
      rep.type === "alderperson"
        ? "District Website"
        : rep.type === "supervisor"
        ? "County Website"
        : "Website"

    const websiteLink = createContactLink(rep.website, websiteLabel)
    if (websiteLink) {
      contactContainer.appendChild(websiteLink)
    }

    const emailLink = createContactLink(
      rep.email ? `mailto:${rep.email}` : null,
      "Email"
    )
    if (emailLink) {
      contactContainer.appendChild(emailLink)
    }

    const phoneLink = createContactLink(
      rep.phone ? `tel:${rep.phone}` : null,
      "Phone"
    )
    if (phoneLink) {
      contactContainer.appendChild(phoneLink)
    }

    if (contactContainer.children.length > 0) {
      panel.appendChild(contactContainer)
    }

    const responsibilitiesLabel =
      rep.type === "alderperson"
        ? "Common Council Committees"
        : rep.type === "supervisor"
        ? "County Committee Service"
        : "Key Responsibilities"

    const expandedLabel =
      rep.type === "alderperson"
        ? "Hide Committees"
        : rep.type === "supervisor"
        ? "Hide Committee Service"
        : "Hide Responsibilities"

    this.appendResponsibilitiesSection(
      panel,
      rep.responsibilities || [],
      themeColor,
      {
        label: responsibilitiesLabel,
        collapsed: false,
        expandedLabel,
      }
    )
  }

  buildComprehensiveOfficialDetails(panel, official, themeColor) {
    panel.innerHTML = ""

    this.appendDetailItem(panel, "Title", official.title, "title")
    this.appendDetailItem(
      panel,
      "Department",
      official.department,
      "department"
    )
    this.appendDetailItem(panel, "District", official.district, "district")

    if (official.term_start || official.term_end) {
      const termLabel =
        official.term_start && official.term_end
          ? `${official.term_start} - ${official.term_end}`
          : official.term_start
          ? `Since ${official.term_start}`
          : official.term_end
      this.appendDetailItem(panel, "Term", termLabel, "term")
    }

    this.appendResponsibilitiesSection(
      panel,
      official.responsibilities || [],
      themeColor,
      {
        limit: 3,
        expandedLabel: "Hide Responsibilities",
      }
    )

    // Contact links
    if (official.contact) {
      const contactContainer = document.createElement("div")
      contactContainer.className = "contact-links"

      const createContactLink = (href, label) => {
        if (!href) return null
        const link = document.createElement("a")
        link.href = href
        link.textContent = label
        link.className = "contact-link"
        if (href.startsWith("http")) {
          link.target = "_blank"
          link.rel = "noopener noreferrer"
        }
        if (themeColor) {
          link.style.borderColor = themeColor
          link.style.color = themeColor
        }
        return link
      }

      const websiteLink = createContactLink(official.contact.website, "Website")
      if (websiteLink) {
        contactContainer.appendChild(websiteLink)
      }

      const emailLink = createContactLink(
        official.contact.email ? `mailto:${official.contact.email}` : null,
        "Email"
      )
      if (emailLink) {
        contactContainer.appendChild(emailLink)
      }

      const phoneLink = createContactLink(
        official.contact.phone ? `tel:${official.contact.phone}` : null,
        "Phone"
      )
      if (phoneLink) {
        contactContainer.appendChild(phoneLink)
      }

      if (contactContainer.children.length > 0) {
        panel.appendChild(contactContainer)
      }

      if (official.contact.office) {
        this.appendDetailItem(
          panel,
          "Office",
          official.contact.office,
          "office-address"
        )
      }
    }
  }

  showCompactAddressDisplay() {
    const addressSection = document.getElementById("address-section")
    const addressDisplay = document.getElementById("address-display")
    const currentAddressText = document.getElementById("current-address-text")
    const locateBtn = document.getElementById("locate-btn")

    // Update the compact display with current address
    const addressValue =
      typeof this.currentAddress === "string" && this.currentAddress.trim()
        ? this.currentAddress
        : typeof this.lastAddress === "string"
        ? this.lastAddress
        : ""

    if (currentAddressText && addressValue) {
      currentAddressText.textContent = addressValue
    } else {
      console.warn("Could not set address text:", {
        currentAddressText: !!currentAddressText,
        currentAddress: this.currentAddress,
      })
    }

    // Hide the location pin button when address is already set
    if (locateBtn && addressValue) {
      locateBtn.style.display = "none"
    }

    // Hide the full address input section (still exists below unified bar)
    if (addressSection) {
      addressSection.classList.add("hidden")
    }

    // Address display now always present in unified header; ensure no hidden classes linger
    if (addressDisplay) {
      addressDisplay.classList.remove("hidden")
      addressDisplay.classList.add("inline")
    }

    // No longer editing
    this.editingAddress = false
    this.updateEditButtonState(false)
  }

  showAddressInput() {
    const addressSection = document.getElementById("address-section")
    const addressDisplay = document.getElementById("address-display")
    const addressInput = document.getElementById("address-input")
    const locateBtn = document.getElementById("locate-btn")

    // Show the full address input section
    if (addressSection) {
      addressSection.classList.remove("hidden")
    }

    // Keep unified bar visible; do not hide addressDisplay
    if (addressDisplay) {
      addressDisplay.classList.add("inline")
    }

    // Entering edit mode
    this.editingAddress = true
    this.updateEditButtonState(true)

    // Show location pin button when no address is set or when editing
    if (locateBtn) {
      if (!this.currentAddress) {
        locateBtn.style.display = ""
      } else {
        locateBtn.style.display = "none"
      }
    }

    // Focus on the address input for better UX
    if (addressInput) {
      setTimeout(() => {
        addressInput.focus()
        addressInput.select()
      }, 300) // Wait for animation to complete
    }
  }

  updateEditButtonState(isEditing) {
    const btn = document.getElementById("edit-address-btn")
    if (!btn) return
    btn.setAttribute("aria-pressed", isEditing.toString())
    const label = isEditing ? "Hide address input" : "Set location"
    btn.textContent = isEditing ? "✖" : "📍"
    btn.setAttribute("title", label)
    btn.setAttribute("aria-label", label)
  }

  // Method to show locate button when no address is set
  showLocateButton() {
    const locateBtn = document.getElementById("locate-btn")
    if (locateBtn) {
      locateBtn.style.display = ""
    }
  }

  renderOfficials() {
    const container = document.getElementById("officials-list")
    container.innerHTML = ""

    const { divisions, offices, officials } = this.civicData

    // Group offices by division
    const divisionGroups = {}
    Object.keys(divisions).forEach((divisionId) => {
      const division = divisions[divisionId]
      divisionGroups[divisionId] = {
        name: division.name,
        offices: offices.filter((office) => office.divisionId === divisionId),
      }
    })

    // Render each division
    Object.entries(divisionGroups).forEach(([divisionId, group]) => {
      if (group.offices.length === 0) return

      const divisionElement = document.createElement("div")
      divisionElement.className = "division-group fade-in"

      const header = document.createElement("div")
      header.className = "division-header"
      header.textContent = group.name
      divisionElement.appendChild(header)
      // Make headers collapsible
      this.addCollapsibleBehavior(header)

      group.offices.forEach((office) => {
        const officeElement = document.createElement("div")
        officeElement.className = "office-group"

        const officeTitle = document.createElement("div")
        officeTitle.className = "office-title"
        officeTitle.textContent = office.name
        officeElement.appendChild(officeTitle)

        office.officialIndices.forEach((index) => {
          const official = officials[index]
          const officialElement = this.createOfficialElement(official)
          officeElement.appendChild(officialElement)
        })

        divisionElement.appendChild(officeElement)
      })

      container.appendChild(divisionElement)
    })
  }

  createOfficialElement(official) {
    const element = document.createElement("div")
    element.className = "official"
    element.style.cursor = "pointer"
    element.setAttribute("role", "button")
    element.setAttribute("tabindex", "0")
    element.setAttribute("aria-label", `View details for ${official.name}`)

    const info = document.createElement("div")
    info.className = "official-info"

    const name = document.createElement("div")
    name.className = "official-name"
    name.textContent = official.name
    info.appendChild(name)

    if (official.party) {
      const party = document.createElement("div")
      party.className = "official-party"
      party.textContent = official.party
      info.appendChild(party)
    }

    element.appendChild(info)

    if (official.urls && official.urls.length > 0) {
      const links = document.createElement("div")
      links.className = "official-links"

      const website = document.createElement("a")
      website.href = official.urls[0]
      website.target = "_blank"
      website.rel = "noopener noreferrer"
      website.textContent = "Website"
      website.addEventListener("click", (e) => {
        e.stopPropagation()
      })
      links.appendChild(website)

      element.appendChild(links)
    }

    if (official.details) {
      const detailsElement = document.createElement("div")
      detailsElement.className = "official-details"

      if (official.details.sponsored_legislation) {
        const sponsoredBillsTitle = document.createElement("h4")
        sponsoredBillsTitle.textContent = "Sponsored Bills"
        detailsElement.appendChild(sponsoredBillsTitle)

        const sponsoredBillsList = document.createElement("ul")
        sponsoredBillsList.className = "sponsored-bills-list"
        official.details.sponsored_legislation.results[0].bills
          .slice(0, 5)
          .forEach((bill) => {
            const billItem = document.createElement("li")
            billItem.textContent = bill.title
            sponsoredBillsList.appendChild(billItem)
          })
        detailsElement.appendChild(sponsoredBillsList)
      }

      if (official.details.recent_votes) {
        const recentVotesTitle = document.createElement("h4")
        recentVotesTitle.textContent = "Recent Votes"
        detailsElement.appendChild(recentVotesTitle)

        const recentVotesList = document.createElement("ul")
        recentVotesList.className = "recent-votes-list"
        official.details.recent_votes.results.votes
          .slice(0, 5)
          .forEach((vote) => {
            const voteItem = document.createElement("li")
            voteItem.textContent = `${vote.position}: ${vote.description}`
            recentVotesList.appendChild(voteItem)
          })
        detailsElement.appendChild(recentVotesList)
      }

      element.appendChild(detailsElement)
    }

    // Add click handler for details view
    const handleClick = () => {
      this.showDetailOverlay("official", official)
    }

    element.addEventListener("click", handleClick)
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleClick()
      }
    })

    return element
  }

  renderMilwaukeeData() {
    if (!this.milwaukeeData || !this.milwaukeeData.representatives.length) {
      return
    }

    const container = document.getElementById("officials-list")

    // Create Milwaukee County section
    const milwaukeeSection = document.createElement("div")
    milwaukeeSection.className = "division-group fade-in milwaukee-section"
    milwaukeeSection.style.borderLeft = "4px solid #ffc107" // Milwaukee County

    const header = document.createElement("div")
    header.className = "division-header"
    header.textContent = "Milwaukee County Local Officials"
    header.style.color = "#ffc107"
    milwaukeeSection.appendChild(header)
    // Make headers collapsible
    this.addCollapsibleBehavior(header)

    this.milwaukeeData.representatives.forEach((rep) => {
      const officialElement = this.createMilwaukeeOfficialElement(rep)
      milwaukeeSection.appendChild(officialElement)
    })

    // Insert Milwaukee section at the top or after country/state officials
    const firstDivision = container.querySelector(".division-group")
    if (firstDivision) {
      container.insertBefore(milwaukeeSection, firstDivision)
    } else {
      container.appendChild(milwaukeeSection)
    }
  }

  createMilwaukeeOfficialElement(rep) {
    const element = document.createElement("div")
    element.className = "official milwaukee-official"
    element.setAttribute("role", "listitem")
    element.setAttribute(
      "aria-labelledby",
      `official-name-${rep.name.replace(/\s+/g, "-").toLowerCase()}`
    )
    element.setAttribute(
      "aria-describedby",
      `official-office-${rep.name.replace(/\s+/g, "-").toLowerCase()}`
    )

    const info = document.createElement("div")
    info.className = "official-info"

    const name = document.createElement("div")
    name.className = "official-name"
    name.textContent = rep.name
    name.id = `official-name-${rep.name.replace(/\s+/g, "-").toLowerCase()}`

    // Add party affiliation if available
    if (rep.party) {
      name.textContent += ` (${rep.party})`
    }

    info.appendChild(name)

    const office = document.createElement("div")
    office.className = "official-office"
    office.id = `official-office-${rep.name.replace(/\s+/g, "-").toLowerCase()}`
    office.textContent = rep.office
    office.style.fontSize = "0.9em"
    office.style.color = "var(--text-muted)"
    office.style.fontWeight = "500"
    info.appendChild(office)

    // Add population info for congressional district
    if (rep.type === "congressional" && rep.population) {
      const population = document.createElement("div")
      population.className = "official-population"
      population.textContent = `Population: ${rep.population.toLocaleString()}`
      population.style.fontSize = "0.8em"
      population.style.color = "var(--text-muted)"
      population.style.marginTop = "0.2rem"
      info.appendChild(population)
    }

    element.appendChild(info)

    // Add contact links
    const links = document.createElement("div")
    links.className = "official-links"

    if (rep.website) {
      const websiteLink = document.createElement("a")
      websiteLink.href = rep.website
      websiteLink.target = "_blank"
      websiteLink.rel = "noopener noreferrer"
      websiteLink.textContent = "Website"
      websiteLink.style.marginRight = "0.5rem"
      websiteLink.setAttribute(
        "aria-label",
        `Visit ${rep.name}'s official website`
      )
      links.appendChild(websiteLink)
    }

    if (rep.email) {
      const emailLink = document.createElement("a")
      emailLink.href = `mailto:${rep.email}`
      emailLink.textContent = "Email"
      emailLink.style.marginRight = "0.5rem"
      emailLink.setAttribute("aria-label", `Send email to ${rep.name}`)
      links.appendChild(emailLink)
    }

    if (rep.phone) {
      const phoneLink = document.createElement("a")
      phoneLink.href = `tel:${rep.phone}`
      phoneLink.textContent = "Phone"
      phoneLink.setAttribute("aria-label", `Call ${rep.name} at ${rep.phone}`)
      links.appendChild(phoneLink)
    }

    if (links.children.length > 0) {
      element.appendChild(links)
    }

    return element
  }

  async loadElections() {
    const container = document.getElementById("elections-list")

    if (!this.settings.apiKey) {
      this.renderNoElectionsApiKey()
      return
    }

    try {
      console.log("Fetching elections data...")
      const url = `${this.electionsApiEndpoint}?key=${this.settings.apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Elections API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received elections data:", data)

      this.renderElections(data.elections || [])
    } catch (error) {
      console.error("Error loading elections:", error)
      this.renderElectionsError()
    }
  }

  renderElections(elections = []) {
    const container = document.getElementById("elections-list")
    container.innerHTML = ""

    if (elections.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No upcoming elections found.</p>
        </div>
      `
      return
    }

    elections.forEach((election) => {
      const element = document.createElement("div")
      element.className = "election-item fade-in"

      const date = document.createElement("div")
      date.className = "election-date"
      date.textContent = new Date(election.electionDay).toLocaleDateString()
      element.appendChild(date)

      const type = document.createElement("div")
      type.className = "election-type"
      type.textContent = election.name
      element.appendChild(type)

      container.appendChild(element)
    })
  }

  renderNoApiKeyMessage() {
    const container = document.getElementById("officials-list")
    container.innerHTML = `
      <div class="empty-state">
        <h3>Welcome to Milwaukee Area Representatives</h3>
        <p>Enter a Milwaukee Area address to see your local representatives.</p>
        <p><strong>This extension shows:</strong></p>
        <ul style="text-align: left; margin: 1rem 0;">
          <li>City Alderperson</li>
          <li>County Supervisor</li>
          <li>Contact information and websites</li>
        </ul>
        <p><small>Powered by Joe's API</small></p>
      </div>
    `
  }

  renderNoAddressMessage() {
    // Clear Milwaukee data since we have no address
    this.milwaukeeData = null
    this.currentAddress = ""

    // Use the integrated rendering approach with no local data
    this.renderMilwaukeeDataOnly()

    // Show locate button since no address is set
    this.showLocateButton()

    // Ensure address input is shown when no address is set
    this.showAddressInput()
  }

  renderNoDataMessage(address) {
    const container = document.getElementById("officials-list")
    container.innerHTML = `
      <div class="empty-state">
        <h3>Address Not Found in Milwaukee Area</h3>
        <p>No local representatives found for: <strong>${address}</strong></p>
        <p>This extension works best for Milwaukee area addresses. Please try:</p>
        <ul style="text-align: left; margin: 1rem 0;">
          <li>A more specific Milwaukee area address</li>
          <li>Including ZIP code (53xxx)</li>
          <li>City names like Milwaukee, Wauwatosa, West Allis</li>
        </ul>
        <p><strong>Showing general government officials below:</strong></p>
      </div>
    `

    // Still show comprehensive government officials data even if no local data
    this.renderAllGovernmentOfficials(container)

    // Clear current address since it didn't work for local data
    this.currentAddress = ""

    // Show address input again for retry
    this.showAddressInput()
    // Show locate button for alternative input method
    this.showLocateButton()
  }

  renderNoElectionsApiKey() {
    const container = document.getElementById("elections-list")
    container.innerHTML = `
      <div class="empty-state">
        <p>Add API key to view upcoming elections</p>
      </div>
    `
  }

  renderElectionsError() {
    const container = document.getElementById("elections-list")
    container.innerHTML = `
      <div class="empty-state">
        <p>Unable to load elections data</p>
      </div>
    `
  }

  async testMilwaukeeApi() {
    console.log("Testing Milwaukee Area API and Government Officials...")
    try {
      // Test Government Officials data first
      const allOfficials = this.governmentOfficials.getAllOfficials()
      const totalOfficials = Object.values(allOfficials).reduce(
        (sum, officials) => sum + officials.length,
        0
      )

      console.log("✅ Government Officials loaded!", {
        city: allOfficials.city.length,
        county: allOfficials.county.length,
        state: allOfficials.state.length,
        federal: allOfficials.federal.length,
        total: totalOfficials,
      })

      // Test Milwaukee API
      const testAddress = "Milwaukee, WI"
      console.log("Testing Milwaukee API with address:", testAddress)

      const milwaukeeData = await this.milwaukeeApi.getRepresentatives(
        testAddress
      )

      if (milwaukeeData && milwaukeeData.isInMilwaukeeCounty) {
        console.log("✅ Milwaukee API works! Data:", milwaukeeData)
        alert(
          `🎉 Extension v2.1.0 Working!\n\n✅ Government Officials: ${totalOfficials} total\n• Federal: ${
            allOfficials.federal.length
          }\n• State: ${allOfficials.state.length}\n• County: ${
            allOfficials.county.length
          }\n• City: ${allOfficials.city.length}\n\n✅ Milwaukee API: ${
            milwaukeeData.representatives.length
          } local reps\n${milwaukeeData.representatives
            .map((rep) => `• ${rep.name} (${rep.type})`)
            .join(
              "\n"
            )}\n\nExtension v2.1.0 ready with comprehensive government officials!`
        )
      } else {
        alert(
          `✅ Government Officials Working!\n\nLoaded ${totalOfficials} comprehensive government officials:\n• Federal: ${allOfficials.federal.length}\n• State: ${allOfficials.state.length}\n• County: ${allOfficials.county.length}\n• City: ${allOfficials.city.length}\n\n❌ Milwaukee API: No local data\n\nExtension v2.1.0 ready!`
        )
      }
    } catch (error) {
      console.error("Test failed:", error)
      alert(`❌ Test Failed\n${error.message}\n\nExtension v2.1.0`)
    }
  }

  async testApiConnection() {
    console.log("Testing API connection...")
    try {
      // Test 1: Elections API (simplest, no address required)
      const electionsUrl = `${this.electionsApiEndpoint}?key=${this.settings.apiKey}`
      console.log("1. Testing elections API:", electionsUrl)

      const electionsResponse = await fetch(electionsUrl)
      console.log("Elections API status:", electionsResponse.status)

      if (!electionsResponse.ok) {
        const electionsError = await electionsResponse.text()
        console.log("Elections API error:", electionsError)
        alert(
          `❌ Elections API Error: ${electionsResponse.status}\nCheck console for details.`
        )
        return
      }

      const electionsData = await electionsResponse.json()
      console.log("✅ Elections API works! Data:", electionsData)

      // Test 2: Address validation API
      const testAddress = "1600 Pennsylvania Avenue, Washington, DC"
      console.log("2. Testing address validation with:", testAddress)

      const divParams = new URLSearchParams({
        key: this.settings.apiKey,
        address: testAddress,
      })

      const divUrl = `${this.divisionsApiEndpoint}?${divParams.toString()}`
      console.log("Address validation URL:", divUrl)

      const divResponse = await fetch(divUrl)
      console.log("Address validation status:", divResponse.status)

      if (!divResponse.ok) {
        const divError = await divResponse.text()
        console.log("Address validation error:", divError)
        alert(
          `❌ Address Validation API Error: ${divResponse.status}\nCheck console for details.`
        )
        return
      }

      const divData = await divResponse.json()
      console.log("✅ Address validation works! Data:", divData)

      // Test 3: Representatives API
      console.log("3. Testing representatives API with:", testAddress)

      const repParams = new URLSearchParams({
        key: this.settings.apiKey,
        address: testAddress,
        includeOffices: "true",
      })

      const levels = ["country", "administrativeArea1", "locality"]
      levels.forEach((level) => {
        repParams.append("levels", level)
      })

      const repUrl = `${this.civicApiEndpoint}?${repParams.toString()}`
      console.log("Representatives API URL:", repUrl)

      const repResponse = await fetch(repUrl)
      console.log("Representatives API status:", repResponse.status)

      if (repResponse.ok) {
        const repData = await repResponse.json()
        console.log("✅ Representatives API works! Data:", repData)
        alert(
          "🎉 All APIs Working!\n✅ Elections API\n✅ Address Validation API\n✅ Representatives API\n\nCheck console for detailed logs."
        )
      } else {
        const repError = await repResponse.text()
        console.log("Representatives API error:", repError)
        alert(
          `❌ Representatives API Error: ${repResponse.status}\nElections and Address validation work, but Representatives API failed.\nCheck console for details.`
        )
      }
    } catch (error) {
      console.error("API test failed:", error)
      alert(`❌ API Test Failed: ${error.message}`)
    }
  }

  renderCivicDataError(
    message = "Unable to load government information. Please try again later."
  ) {
    const container = document.getElementById("officials-list")
    container.innerHTML = `
      <div class="empty-state">
        <p><strong>Error:</strong> ${message}</p>
        <p>Please check your address and try again.</p>
        <p><small>Click the test button (🧪) to debug API connection.</small></p>
      </div>
    `
    // Clear current address on error
    this.currentAddress = ""

    // Show address input again for retry
    this.showAddressInput()
    // Show locate button for alternative input method
    this.showLocateButton()
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Starting Government Tab App")
  try {
    window.app = new NewTabApp()
  } catch (error) {
    console.error("Failed to initialize Government Tab App:", error)
  }
})
