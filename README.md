# Milwaukee Area Government Representatives - Chrome Extension

A Chrome extension that replaces your new tab page with a beautiful, functional interface showing your complete government representation from city to federal level. Simply enter your Milwaukee area address to instantly see your Alderperson, County Supervisor, State Representatives, and Congressional Representative - complete with direct contact information.

Perfect for Milwaukee area residents who want to stay engaged with local democracy and easily contact their elected officials.

## Features

- **🏛️ Complete Government Representation**: View all your elected officials from local to federal level
  - City Alderperson (with email and phone contact)
  - Milwaukee County Supervisor
  - Wisconsin State Assembly Representative
  - Wisconsin State Senator
  - U.S. Congressional Representative
- **📍 Address-Based Lookup**: Enter any Milwaukee area address to find representatives
- **📞 Direct Contact**: Click-to-call phone numbers and email links for immediate contact
- **🌐 Quick Access**: Direct links to representative websites and contact information
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

- **Milwaukee Area API**: Provides comprehensive representative information including:
  - City Alderperson details with contact information
  - County Supervisor information
  - Wisconsin State Assembly and Senate representatives
  - U.S. Congressional representative data
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

```
├── manifest.json          # Extension configuration
├── index.html             # Main new tab page
├── script.js              # Main application logic
├── styles.css             # Styling
├── background.js          # Service worker
├── milwaukee-api.js       # Milwaukee API client
├── propublica-api.js      # ProPublica API client
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

- **v2.0.1** (Latest): Enhanced alderperson contact details, reversed representative display order (local to federal)
- **v2.0.0**: Milwaukee focus, modern UI, dark mode, comprehensive representative coverage
- **v1.0.0**: Initial release with Google Civic API integration
