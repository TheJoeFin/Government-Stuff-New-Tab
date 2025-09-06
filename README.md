# Milwaukee County Government Representatives - Chrome Extension

A Chrome extension that replaces the new tab page to help Milwaukee County residents stay connected with their local government representatives.

## Features

- **🏛️ Local Representatives**: View your City Alderperson and County Supervisor
- **📍 Address-Based Lookup**: Enter any Milwaukee County address to find representatives
- **🌐 Quick Access**: Direct links to representative websites and contact information
- **🔗 Favorite Sites**: Customizable grid of your favorite websites
- **🌙 Dark Mode**: Toggle between light and dark themes
- **🔍 Web Search**: Built-in search with multiple engine options (Google, Bing, DuckDuckGo, Startpage)

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

1. **Enter Your Address**: When you open a new tab, enter a Milwaukee County address
2. **View Representatives**: See your local alderperson and county supervisor
3. **Contact Information**: Click website links or email addresses to contact representatives
4. **Customize**: Add favorite websites and adjust settings as needed

## Data Sources

- **Milwaukee County API**: Provides local representative information
- **Google Civic Information API**: Available for additional government data (requires API key)
- **ProPublica Congress API**: Available for federal representative details (requires API key)

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
├── milwaukee-api.js       # Milwaukee County API client
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
- Verify your address is in Milwaukee County

## Version History

- **v2.0.0**: Milwaukee County focus, modern UI, dark mode
- **v1.0.0**: Initial release with Google Civic API integration