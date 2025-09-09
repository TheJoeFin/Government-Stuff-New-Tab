// Government Stuff New Tab Extension
// Main application logic

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
      this.bindEvents()
      console.log("Events bound")

      if (this.settings.autoLocation) {
        this.getUserLocation()
      } else {
        // Show welcome message by default
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
      chrome.search.query({
        text: query.trim(),
        disposition: "CURRENT_TAB"
      }, () => {
        // Announce to screen reader
        this.announceToScreenReader(
          `Searching for "${query.trim()}" using your default search provider`
        )
      })
    } else {
      // Fallback for testing environment - use Google
      const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query.trim())
      window.location.href = searchUrl
      
      // Announce to screen reader
      this.announceToScreenReader(
        `Searching for "${query.trim()}"`
      )
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
        name: "Google",
        url: "https://google.com",
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
        url: "https://bluesky.com",
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

  updateSidebarVisibility() {
    const container = document.querySelector(".container")
    const sidebar = document.getElementById("civic-sidebar")
    const showSidebarBtn = document.getElementById("show-sidebar-btn")

    if (this.settings.showSidebar) {
      container.classList.remove("sidebar-collapsed")
      sidebar.classList.remove("collapsed")
      showSidebarBtn.classList.add("hidden")
    } else {
      container.classList.add("sidebar-collapsed")
      sidebar.classList.add("collapsed")
      showSidebarBtn.classList.remove("hidden")
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
        this.showAddressInput()
      })

    document
      .getElementById("refresh-address-btn")
      .addEventListener("click", () => {
        if (this.currentAddress) {
          console.log(
            "Manual refresh from compact view for:",
            this.currentAddress
          )
          this.loadCivicData(this.currentAddress, true) // Force refresh
        }
      })

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

  // Favorites Management
  renderFavorites() {
    const grid = document.getElementById("favorites-grid")
    grid.innerHTML = ""

    this.favorites.forEach((favorite) => {
      const item = this.createFavoriteElement(favorite)
      grid.appendChild(item)
    })
  }

  createFavoriteElement(favorite) {
    const item = document.createElement("a")
    item.className = "favorite-item fade-in"
    item.href = favorite.url
    item.setAttribute("role", "gridcell")
    item.setAttribute("aria-label", `Visit ${favorite.name} website`)
    item.dataset.favoriteId = favorite.id

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

    // Define the division structure with both local and comprehensive officials
    const divisionStructure = {
      "City of Milwaukee": {
        color: "#ffa500",
        localReps: [],
        allOfficials: this.governmentOfficials.getOfficialsByLevel("city"),
      },
      "Milwaukee County": {
        color: "#0077be",
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

  createCompactOfficialElement(official, type, themeColor) {
    const element = document.createElement("div")
    element.className = `official compact-official ${type}-official`
    element.setAttribute("role", "listitem")

    const uniqueId = `${official.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${type}`
    element.setAttribute("aria-labelledby", `name-${uniqueId}`)

    // Main container with name and menu button
    const mainContainer = document.createElement("div")
    mainContainer.className = "official-main"

    // Name display
    const nameContainer = document.createElement("div")
    nameContainer.className = "official-name-container"

    const name = document.createElement("span")
    name.className = "official-name"
    name.id = `name-${uniqueId}`
    name.textContent = official.name || official.title

    nameContainer.appendChild(name)

    // Menu button
    const menuButton = document.createElement("button")
    menuButton.className = "official-menu-btn"
    menuButton.innerHTML = "⋯"
    menuButton.setAttribute(
      "aria-label",
      `Show details for ${official.name || official.title}`
    )
    menuButton.setAttribute("aria-expanded", "false")
    menuButton.setAttribute("aria-controls", `details-${uniqueId}`)

    mainContainer.appendChild(nameContainer)
    mainContainer.appendChild(menuButton)

    // Details panel (initially hidden)
    const detailsPanel = document.createElement("div")
    detailsPanel.className = "official-details-panel hidden"
    detailsPanel.id = `details-${uniqueId}`
    detailsPanel.setAttribute("aria-hidden", "true")

    // Build details content based on type
    if (type === "local") {
      this.buildLocalOfficialDetails(detailsPanel, official, themeColor)
    } else {
      this.buildComprehensiveOfficialDetails(detailsPanel, official, themeColor)
    }

    // Menu button click handler
    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true"
      const newState = !isExpanded

      menuButton.setAttribute("aria-expanded", newState.toString())
      detailsPanel.setAttribute("aria-hidden", (!newState).toString())

      if (newState) {
        detailsPanel.classList.remove("hidden")
        detailsPanel.classList.add("visible")
        menuButton.innerHTML = "⋀"
        menuButton.style.color = themeColor
      } else {
        detailsPanel.classList.add("hidden")
        detailsPanel.classList.remove("visible")
        menuButton.innerHTML = "⋯"
        menuButton.style.color = ""
      }

      // Announce to screen readers
      this.announceToScreenReader(
        newState
          ? `Details expanded for ${official.name || official.title}`
          : `Details collapsed`
      )
    })

    element.appendChild(mainContainer)
    element.appendChild(detailsPanel)

    return element
  }

  buildLocalOfficialDetails(panel, rep, themeColor) {
    panel.innerHTML = ""

    // Title/Office
    if (rep.office) {
      const office = document.createElement("div")
      office.className = "detail-item office"
      office.innerHTML = `<strong>Office:</strong> ${rep.office}`
      panel.appendChild(office)
    }

    // District info
    if (rep.district) {
      const district = document.createElement("div")
      district.className = "detail-item district"
      district.innerHTML = `<strong>District:</strong> ${rep.district}`
      panel.appendChild(district)
    }

    // Population (for congressional)
    if (rep.population) {
      const population = document.createElement("div")
      population.className = "detail-item population"
      population.innerHTML = `<strong>Population:</strong> ${rep.population.toLocaleString()}`
      panel.appendChild(population)
    }

    // Contact links
    const contactContainer = document.createElement("div")
    contactContainer.className = "contact-links"

    if (rep.website) {
      const websiteLink = document.createElement("a")
      websiteLink.href = rep.website
      websiteLink.target = "_blank"
      websiteLink.rel = "noopener noreferrer"
      websiteLink.textContent = "Website"
      websiteLink.className = "contact-link"
      websiteLink.style.borderColor = themeColor
      contactContainer.appendChild(websiteLink)
    }

    if (rep.email) {
      const emailLink = document.createElement("a")
      emailLink.href = `mailto:${rep.email}`
      emailLink.textContent = "Email"
      emailLink.className = "contact-link"
      emailLink.style.borderColor = themeColor
      contactContainer.appendChild(emailLink)
    }

    if (rep.phone) {
      const phoneLink = document.createElement("a")
      phoneLink.href = `tel:${rep.phone}`
      phoneLink.textContent = "Phone"
      phoneLink.className = "contact-link"
      phoneLink.style.borderColor = themeColor
      contactContainer.appendChild(phoneLink)
    }

    if (contactContainer.children.length > 0) {
      panel.appendChild(contactContainer)
    }
  }

  buildComprehensiveOfficialDetails(panel, official, themeColor) {
    panel.innerHTML = ""

    // Title
    const title = document.createElement("div")
    title.className = "detail-item title"
    title.innerHTML = `<strong>Title:</strong> ${official.title}`
    panel.appendChild(title)

    // Department
    if (official.department) {
      const dept = document.createElement("div")
      dept.className = "detail-item department"
      dept.innerHTML = `<strong>Department:</strong> ${official.department}`
      panel.appendChild(dept)
    }

    // Term info
    if (official.term_start || official.term_end) {
      const term = document.createElement("div")
      term.className = "detail-item term"
      let termText = "<strong>Term:</strong> "
      if (official.term_start && official.term_end) {
        termText += `${official.term_start} - ${official.term_end}`
      } else if (official.term_start) {
        termText += `Since ${official.term_start}`
      }
      term.innerHTML = termText
      panel.appendChild(term)
    }

    // Key responsibilities (collapsed by default)
    if (official.responsibilities && official.responsibilities.length > 0) {
      const responsibilitiesHeader = document.createElement("button")
      responsibilitiesHeader.className = "responsibilities-header"
      responsibilitiesHeader.textContent = "Key Responsibilities"
      responsibilitiesHeader.setAttribute("aria-expanded", "false")

      const responsibilitiesList = document.createElement("ul")
      responsibilitiesList.className = "responsibilities-list hidden"

      official.responsibilities.slice(0, 3).forEach((resp) => {
        // Show only first 3
        const li = document.createElement("li")
        li.textContent = resp
        responsibilitiesList.appendChild(li)
      })

      responsibilitiesHeader.addEventListener("click", () => {
        const isExpanded =
          responsibilitiesHeader.getAttribute("aria-expanded") === "true"
        responsibilitiesHeader.setAttribute(
          "aria-expanded",
          (!isExpanded).toString()
        )
        responsibilitiesList.classList.toggle("hidden")
        responsibilitiesHeader.textContent = isExpanded
          ? "Key Responsibilities"
          : "Hide Responsibilities"
      })

      panel.appendChild(responsibilitiesHeader)
      panel.appendChild(responsibilitiesList)
    }

    // Contact links
    if (official.contact) {
      const contactContainer = document.createElement("div")
      contactContainer.className = "contact-links"

      if (official.contact.website) {
        const websiteLink = document.createElement("a")
        websiteLink.href = official.contact.website
        websiteLink.target = "_blank"
        websiteLink.rel = "noopener noreferrer"
        websiteLink.textContent = "Website"
        websiteLink.className = "contact-link"
        websiteLink.style.borderColor = themeColor
        contactContainer.appendChild(websiteLink)
      }

      if (official.contact.email) {
        const emailLink = document.createElement("a")
        emailLink.href = `mailto:${official.contact.email}`
        emailLink.textContent = "Email"
        emailLink.className = "contact-link"
        emailLink.style.borderColor = themeColor
        contactContainer.appendChild(emailLink)
      }

      if (official.contact.phone) {
        const phoneLink = document.createElement("a")
        phoneLink.href = `tel:${official.contact.phone}`
        phoneLink.textContent = "Phone"
        phoneLink.className = "contact-link"
        phoneLink.style.borderColor = themeColor
        contactContainer.appendChild(phoneLink)
      }

      if (official.contact.office) {
        const office = document.createElement("div")
        office.className = "detail-item office-address"
        office.innerHTML = `<strong>Office:</strong> ${official.contact.office}`
        panel.appendChild(office)
      }

      if (contactContainer.children.length > 0) {
        panel.appendChild(contactContainer)
      }
    }
  }

  showCompactAddressDisplay() {
    const addressSection = document.getElementById("address-section")
    const addressDisplay = document.getElementById("address-display")
    const currentAddressText = document.getElementById("current-address-text")
    const locateBtn = document.getElementById("locate-btn")

    // Update the compact display with current address
    if (currentAddressText && this.currentAddress) {
      currentAddressText.textContent = this.currentAddress
    } else {
      console.error("Could not set address text:", {
        currentAddressText: !!currentAddressText,
        currentAddress: this.currentAddress,
      })
    }

    // Hide the location pin button when address is already set
    if (locateBtn && this.currentAddress) {
      locateBtn.style.display = "none"
    }

    // Hide the full address input section
    if (addressSection) {
      addressSection.classList.add("hidden")
    }

    // Show the compact address display
    if (addressDisplay) {
      addressDisplay.classList.remove("hidden")
      addressDisplay.classList.add("visible")
    }
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

    // Hide the compact address display
    if (addressDisplay) {
      addressDisplay.classList.add("hidden")
      addressDisplay.classList.remove("visible")
    }

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
    milwaukeeSection.style.borderLeft = "4px solid #0077be" // Milwaukee blue

    const header = document.createElement("div")
    header.className = "division-header"
    header.textContent = "Milwaukee County Local Officials"
    header.style.color = "#0077be"
    milwaukeeSection.appendChild(header)

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
    new NewTabApp()
  } catch (error) {
    console.error("Failed to initialize Government Tab App:", error)
  }
})
