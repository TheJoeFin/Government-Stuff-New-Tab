// Extension options page (options_page in manifest.json). Mirrors the
// in-app settings pane (see NewTabApp's populateSettingsPane/
// setupSettingsPaneEvents in script.js) so the two stay in sync, reading
// and writing the exact same chrome.storage keys. This page runs
// standalone though - it doesn't load civic/calendar data, so address
// changes here just persist lastAddress for the new tab page to pick up
// next time it opens.

const DEFAULT_BACKGROUND_COLOR = "#0077be"

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    addressInput: document.getElementById("pane-address-input"),
    locateBtn: document.getElementById("pane-locate-btn"),
    updateAddressBtn: document.getElementById("pane-update-address"),
    clearCacheBtn: document.getElementById("pane-clear-cache-btn"),
    resetDefaultsBtn: document.getElementById("pane-reset-defaults-btn"),
    currentAddress: document.getElementById("pane-current-address"),
    addressStatus: document.getElementById("pane-address-status"),
    showSidebar: document.getElementById("pane-show-sidebar"),
    autoLocation: document.getElementById("pane-auto-location"),
    themeToggle: document.getElementById("pane-theme-toggle"),
    backgroundMode: document.getElementById("pane-background-mode"),
    backgroundColor: document.getElementById("pane-background-color"),
    backgroundColorField: document.getElementById(
      "pane-background-color-field",
    ),
    backgroundCycle: document.getElementById("pane-background-cycle"),
    backgroundCycleField: document.getElementById(
      "pane-background-cycle-field",
    ),
    versionInfo: document.getElementById("pane-version-info"),
  }

  let settings = {
    showSidebar: true,
    autoLocation: false,
    theme: "light",
    apiKey: "",
    propublicaApiKey: "",
    backgroundMode: "photo",
    backgroundColor: DEFAULT_BACKGROUND_COLOR,
    backgroundCycle: "daily",
  }
  let lastAddress = ""

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", settings.theme)
    document.body.setAttribute("data-theme", settings.theme)
    els.themeToggle.textContent =
      settings.theme === "dark" ? "☀️ Light" : "🌙 Dark"
  }

  function updateBackgroundFieldsVisibility() {
    const mode = settings.backgroundMode || "photo"
    els.backgroundColorField.classList.toggle("hidden", mode !== "solid")
    els.backgroundCycleField.classList.toggle("hidden", mode !== "photo")
  }

  function showStatus(el, type, message) {
    el.classList.remove("hidden", "loading", "success", "error")
    el.classList.add(type)
    const icon = el.querySelector(".status-icon")
    const text = el.querySelector(".status-text")
    const icons = { loading: "⏳", success: "✅", error: "❌" }
    if (icon) icon.textContent = icons[type] || ""
    if (text) text.textContent = message
  }

  function hideStatus(el) {
    el.classList.remove("loading", "success", "error")
    el.classList.add("hidden")
  }

  function autoClearStatus(el, delay = 4000) {
    setTimeout(() => hideStatus(el), delay)
  }

  function saveSettings() {
    chrome.storage.sync.set({ settings })
  }

  function updateCurrentAddressDisplay() {
    if (lastAddress) {
      els.currentAddress.textContent = `Current: ${lastAddress}`
      els.currentAddress.classList.add("visible")
    } else {
      els.currentAddress.classList.remove("visible")
    }
  }

  function loadAll() {
    chrome.storage.sync.get(["settings", "lastAddress"], (result) => {
      if (result.settings) {
        settings = { ...settings, ...result.settings }
      }
      lastAddress = result.lastAddress || ""

      els.addressInput.value = lastAddress
      updateCurrentAddressDisplay()
      els.showSidebar.checked = settings.showSidebar
      els.autoLocation.checked = settings.autoLocation
      applyTheme()
      els.backgroundMode.value = settings.backgroundMode || "photo"
      els.backgroundColor.value =
        settings.backgroundColor || DEFAULT_BACKGROUND_COLOR
      els.backgroundCycle.value = settings.backgroundCycle || "daily"
      updateBackgroundFieldsVisibility()
    })

    if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
      els.versionInfo.textContent = `v${chrome.runtime.getManifest().version}`
    }
  }

  // --- Location ---
  els.updateAddressBtn.addEventListener("click", () => {
    const addr = els.addressInput.value.trim()
    if (!addr) {
      showStatus(els.addressStatus, "error", "Please enter an address.")
      return
    }
    lastAddress = addr
    chrome.storage.sync.set({ lastAddress: addr }, () => {
      updateCurrentAddressDisplay()
      showStatus(
        els.addressStatus,
        "success",
        "Address saved. It will load next time you open a new tab.",
      )
      autoClearStatus(els.addressStatus)
    })
  })

  els.addressInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      els.updateAddressBtn.click()
    }
  })

  els.locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showStatus(
        els.addressStatus,
        "error",
        "Geolocation is not supported by this browser.",
      )
      return
    }
    els.locateBtn.disabled = true
    showStatus(els.addressStatus, "loading", "Detecting your location...")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          )
          const data = await response.json()
          const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryCode}`
          els.addressInput.value = address
          lastAddress = address
          chrome.storage.sync.set({ lastAddress: address }, () => {
            updateCurrentAddressDisplay()
            showStatus(els.addressStatus, "success", `Location set to ${address}.`)
            autoClearStatus(els.addressStatus)
          })
        } catch (error) {
          showStatus(
            els.addressStatus,
            "error",
            "Could not determine address from location.",
          )
        } finally {
          els.locateBtn.disabled = false
        }
      },
      () => {
        showStatus(
          els.addressStatus,
          "error",
          "Could not access your location. Please check permissions.",
        )
        els.locateBtn.disabled = false
      },
    )
  })

  els.clearCacheBtn.addEventListener("click", () => {
    chrome.storage.local.get(null, (allData) => {
      const cacheKeys = Object.keys(allData || {}).filter((key) =>
        key.startsWith("milwaukee_"),
      )
      const finish = () => {
        showStatus(
          els.addressStatus,
          "success",
          `Cleared ${cacheKeys.length} cached item${cacheKeys.length === 1 ? "" : "s"}.`,
        )
        autoClearStatus(els.addressStatus)
      }
      if (cacheKeys.length > 0) {
        chrome.storage.local.remove(cacheKeys, finish)
      } else {
        finish()
      }
    })
  })

  els.resetDefaultsBtn.addEventListener("click", () => {
    if (
      !confirm(
        "Reset all settings? This clears your saved address, favorites, theme, background, and cached data. This cannot be undone.",
      )
    ) {
      return
    }
    chrome.storage.sync.clear(() => {
      chrome.storage.local.clear(() => {
        localStorage.clear()
        location.reload()
      })
    })
  })

  // --- Display ---
  els.showSidebar.addEventListener("change", (e) => {
    settings.showSidebar = e.target.checked
    saveSettings()
  })

  els.autoLocation.addEventListener("change", (e) => {
    settings.autoLocation = e.target.checked
    saveSettings()
  })

  els.themeToggle.addEventListener("click", (e) => {
    e.preventDefault()
    settings.theme = settings.theme === "light" ? "dark" : "light"
    applyTheme()
    saveSettings()
  })

  // --- Background ---
  els.backgroundMode.addEventListener("change", (e) => {
    settings.backgroundMode = e.target.value
    updateBackgroundFieldsVisibility()
    saveSettings()
  })

  els.backgroundColor.addEventListener("input", (e) => {
    settings.backgroundColor = e.target.value
    saveSettings()
  })

  els.backgroundCycle.addEventListener("change", (e) => {
    settings.backgroundCycle = e.target.value
    // Force a fresh pick under the new interval next time the new tab
    // page applies the background, instead of waiting out whatever
    // interval the previous setting had left
    settings.backgroundPhotoState = null
    saveSettings()
  })

  loadAll()
})
