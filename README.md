# Milwaukee Government Representatives & Officials - Chrome Extension

A Chrome extension that replaces your new tab page with a comprehensive interface showing **complete government representation** from city to federal level. Features your specific elected representatives based on your Milwaukee area address, plus a complete roster of all government officials at every level.

Perfect for Milwaukee area residents who want to stay engaged with local democracy and easily contact their elected officials, plus get comprehensive information about all government representatives.

## 🌟 What's New in v2.5.0

- **🗓️ Calendar Date Timezone Fix**: Clicking a calendar day now shows the correct date and events regardless of your timezone
  - Dates are parsed in local timezone, so users in Central Time (UTC-6) and other negative-offset zones no longer see events shifted to the previous day
  - "No events" messages and selected-date labels both display the accurate weekday and date

## ✨ What's New in v2.4.0

- **📅 Government Meeting Calendar**: Live calendar showing upcoming meetings for City of Milwaukee and Milwaukee County
  - Powered by the Legistar legislative management API
  - Weekly calendar rows display the current week and upcoming weeks at a glance
  - Click any day to filter events to that date
  - Color-coded legend distinguishes City (blue) vs. County (amber) events
  - Event detail view shows location, agenda links, minutes, and video recordings
  - 30-minute refresh cache with 24-hour fallback for offline resilience
- **🧭 Simplified Sidebar Navigation**: Redesigned sidebar with tab navigation
  - **Calendar view** (default): scrollable list of upcoming government meetings
  - **Officials view**: browse all officials at federal, state, county, and city levels
  - **Search view**: collapsible search bar filters both meetings and officials in one place
  - Full-page detail view for events and officials with a back button to return to the list
- **🔍 Chrome Search API**: Web search now uses your browser's default search provider instead of always opening Google

## Features

- **🏛️ Your Specific Representatives**: Enter your Milwaukee area address to see:
  - City Alderperson (with email and phone contact)
  - Milwaukee County Supervisor
  - Wisconsin State Assembly Representative & State Senator
  - U.S. Congressional Representative
- **📅 Government Meeting Calendar**: Upcoming City and County meetings via Legistar
  - Weekly calendar view with day filtering
  - Event details including agenda, minutes, video, and location
  - Color-coded City (blue) and County (amber) events
- **🗂️ Complete Government Roster**: Browse all officials at every level:
  - All federal cabinet members and key officials
  - All Wisconsin state constitutional officers and department heads
  - All Milwaukee County elected officials and department heads
  - All City of Milwaukee leadership and department heads
- **📞 Direct Contact**: Click-to-call phone numbers and email links
- **🌐 Quick Access**: Direct links to official websites and contact information
- **🔗 Favorite Sites**: Customizable grid of your favorite websites
- **🌙 Dark Mode**: Toggle between light and dark themes
- **🔍 Web Search**: Built-in search using your browser's default search provider
- **♿ Accessibility**: Full screen reader support and keyboard navigation

## Installation

### For End Users

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will replace your new tab page

### For Developers

```bash
git clone https://github.com/yourusername/Government-Stuff-New-Tab.git
cd Government-Stuff-New-Tab
```

Then follow the installation steps above.

## Usage

1. **Enter Your Address**: When you open a new tab, enter a Milwaukee area address
2. **View Representatives**: See all your elected officials displayed from local to federal level:
   - **City Level**: Alderperson with direct email and phone contact
   - **County Level**: Supervisor with website and contact info
   - **State Level**: Assembly Representative and State Senator
   - **Federal Level**: U.S. Congressional Representative
3. **Contact Officials**: Click email, phone, or website buttons to contact representatives directly
4. **Customize Your Experience**:
   - Add favorite websites to the main grid
   - Toggle dark/light mode
   - Choose your preferred search engine
   - Collapse/expand the government information sidebar

## Data Sources

- **Milwaukee Area API**: Provides your specific representative information including:
  - City Alderperson details with contact information
  - County Supervisor information
  - Wisconsin State Assembly and Senate representatives
  - U.S. Congressional representative data
- **Comprehensive Officials Database**: Built-in database of all government officials including:
  - Complete federal cabinet and key federal officials
  - All Wisconsin state constitutional officers and department heads
  - All Milwaukee County elected officials and department heads
  - All City of Milwaukee leadership and key officials
- **Google Civic Information API**: Available for additional government data (requires API key)
- **ProPublica Congress API**: Available for enhanced federal representative details (requires API key)

## API Configuration (Optional)

To enable additional features:

1. Click the settings icon (⚙️) in the top right
2. Optionally add API keys:
   - **Google Civic API Key**: For broader government data
   - **ProPublica API Key**: For congressional representative details

### Getting API Keys

- **Google Civic Information API**: [Google Cloud Console](https://console.cloud.google.com/)
- **ProPublica Congress API**: [ProPublica Data Store](https://www.propublica.org/datastore/api/propublica-congress-api)

## Privacy

- Your address is stored locally in Chrome extension storage
- Data is cached for 7 days to improve performance
- No personal information is shared with external services beyond API calls

## System Requirements

- Google Chrome or Chromium-based browser
- Internet connection for representative data

## Development

### File Structure

```text
├── manifest.json          # Extension configuration
├── index.html             # Main new tab page
├── script.js              # Main application logic
├── styles.css             # Styling
├── background.js          # Service worker
├── milwaukee-api.js       # Milwaukee API client
├── propublica-api.js      # ProPublica API client
├── government-officials.js # Comprehensive government officials data
├── options.html           # Settings page
├── options.js             # Settings logic
└── icons/                 # Extension icons
```

### Local Development

The extension works entirely with local files - no build process required. Simply make changes and reload the extension in Chrome.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:

- Open an issue on GitHub
- Check the browser console for error messages
- Verify your address is in Milwaukee area

## Version History

- **v2.5.0** (Latest): 🗓️ **Calendar Timezone Fix** - Calendar dates now display correctly in all timezones; timezone-safe `parseLocalDate()` helper prevents off-by-one day errors in Central Time and other negative-offset locales
- **v2.4.0**: 📅 **Government Meeting Calendar & Simplified UI** - Legistar-powered City and County meeting calendar with weekly view; redesigned sidebar with Calendar/Officials/Search tab navigation and full-page detail views
- **v2.3.0**: 🔍 **Chrome Search API** - Web search now respects the user's default browser search provider instead of hard-coding Google
- **v2.2.0**: 🔒 **Address Privacy** - Address display minimized to reduce over-the-shoulder PII exposure once location is set
- **v2.1.0**: 🌟 **Comprehensive Government Officials** - Added complete roster of all government officials at federal, state, county, and city levels with detailed contact information, responsibilities, and enhanced UI
- **v2.0.1**: Enhanced alderperson contact details, reversed representative display order (local to federal)
- **v2.0.0**: Milwaukee focus, modern UI, dark mode, comprehensive representative coverage
- **v1.0.0**: Initial release with Google Civic API integration
