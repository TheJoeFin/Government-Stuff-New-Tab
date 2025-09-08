# Milwaukee Government Representatives & Officials - Chrome Extension

A Chrome extension that replaces your new tab page with a comprehensive interface showing **complete government representation** from city to federal level. Features your specific elected representatives based on your Milwaukee area address, plus a complete roster of all government officials at every level.

Perfect for Milwaukee area residents who want to stay engaged with local democracy and easily contact their elected officials, plus get comprehensive information about all government representatives.

## 🌟 What's New in v2.1.0

- **🏛️ Comprehensive Government Officials**: Complete roster of all Milwaukee area government officials
  - **Federal Government**: President, Vice President, Cabinet members, U.S. Senators
  - **Wisconsin State Government**: Governor, Lt. Governor, Attorney General, State officials
  - **Milwaukee County Government**: County Executive, Sheriff, District Attorney, Clerk, and more
  - **City of Milwaukee Government**: Mayor, Common Council President, Police Chief, Fire Chief, and more
- **📋 Detailed Official Information**: Each official includes:
  - Full contact information (email, phone, office address)
  - Key responsibilities and duties
  - Term dates and party affiliation where applicable
  - Direct links to official websites
- **🎨 Enhanced UI**: Beautiful, organized display with collapsible sections
- **📱 Responsive Design**: Works perfectly on all screen sizes

## Features

- **🏛️ Your Specific Representatives**: Enter your Milwaukee area address to see:
  - City Alderperson (with email and phone contact)
  - Milwaukee County Supervisor
  - Wisconsin State Assembly Representative & State Senator
  - U.S. Congressional Representative
- **� Complete Government Roster**: Browse all officials at every level:
  - All federal cabinet members and key officials
  - All Wisconsin state constitutional officers and department heads
  - All Milwaukee County elected officials and department heads
  - All City of Milwaukee leadership and department heads
- **📞 Direct Contact**: Click-to-call phone numbers and email links
- **🌐 Quick Access**: Direct links to official websites and contact information
- **🔗 Favorite Sites**: Customizable grid of your favorite websites
- **🌙 Dark Mode**: Toggle between light and dark themes
- **🔍 Web Search**: Built-in search with multiple engine options (Google, Bing, DuckDuckGo, Startpage)
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

- **v2.1.0** (Latest): 🌟 **Comprehensive Government Officials** - Added complete roster of all government officials at federal, state, county, and city levels with detailed contact information, responsibilities, and enhanced UI
- **v2.0.1**: Enhanced alderperson contact details, reversed representative display order (local to federal)
- **v2.0.0**: Milwaukee focus, modern UI, dark mode, comprehensive representative coverage
- **v1.0.0**: Initial release with Google Civic API integration
