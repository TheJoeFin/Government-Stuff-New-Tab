# Milwaukee Government Representatives Chrome Extension

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Project Overview

This is a Chrome extension (manifest v3) that replaces the new tab page with a comprehensive interface showing Milwaukee area government representatives and officials. The extension works entirely with static HTML, CSS, and JavaScript files - NO BUILD PROCESS REQUIRED.

## Working Effectively

### Essential Setup Commands
- **Clone the repository**: `git clone https://github.com/TheJoeFin/Government-Stuff-New-Tab.git`
- **Navigate to directory**: `cd Government-Stuff-New-Tab`
- **NO additional installation required** - the extension works with static files

### Load Extension for Development
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" in the top right
- Click "Load unpacked" and select the extension directory
- The extension will replace your new tab page immediately

### Test Extension Functionality
- **ALWAYS run the built-in test first**: Click the 🧪 test button in the top right of the extension
- **Run standalone tests**: Open `test-government-officials.html` directly in browser
- **Validate core data**: Should show 36 total government officials (12 federal, 9 state, 9 county, 6 city)

### Local Development Server (Optional)
If you need to serve files locally for testing:
- **Start server**: `cd [repo-root] && python3 -m http.server 8080`
- **Access extension**: http://localhost:8080/index.html
- **Access tests**: http://localhost:8080/test-government-officials.html
- **TIMING**: Server starts instantly, no wait required

## File Structure and Navigation

### Core Extension Files
```
├── manifest.json          # Extension configuration (manifest v3)
├── index.html             # Main new tab page (247 lines)
├── script.js              # Main application logic (2404 lines)
├── styles.css             # All styling (1830 lines)
├── background.js          # Service worker (25 lines)
├── options.html           # Settings page (25 lines)
├── options.js             # Settings logic (31 lines)
└── icons/                 # Extension icons
```

### API and Data Files
```
├── government-officials.js # Comprehensive officials data (641 lines)
├── milwaukee-api.js       # Milwaukee API client (172 lines)
├── propublica-api.js      # ProPublica API client (68 lines)
```

### Testing and Documentation
```
├── test-government-officials.html  # Test runner (122 lines)
├── README.md                       # Project documentation
├── .claude/CLAUDE.md              # Claude AI development notes
└── .claude/API_SETUP.md           # API configuration guide
```

## Validation and Testing

### **CRITICAL**: Always Run These Validation Steps After Changes

**1. Built-in Extension Test** (REQUIRED for all changes):
- Load extension in Chrome
- Click the 🧪 test button in top right
- **Expected**: Government Officials data loads (36 total)
- **Failure**: Network errors are expected for API calls in test environment

**2. Standalone Test File** (REQUIRED for core functionality changes):
- Open `test-government-officials.html` in browser
- **Expected**: All 5 tests pass (✅), showing data for all government levels
- **Timing**: Tests complete in under 2 seconds

**3. Manual UI Testing Scenarios** (REQUIRED after UI changes):
- **Theme Toggle**: Click 🌙 button - should switch light/dark themes
- **Settings Dialog**: Click ⚙️ button - should open settings overlay
- **Representative Details**: Click ⋯ button next to any official - should show contact info
- **Search Functionality**: Type in search box and submit - should navigate to search engine
- **Favorites Grid**: Click any favorite site tile - should navigate to site

**4. Address Input Testing** (if modifying representative logic):
- Enter address: "200 E Wells St, Milwaukee, WI 53202"
- Click "Update" button
- **Expected**: May fail with network error (normal in test environment)
- **Success Case**: Would load Milwaukee-specific representatives

### **NEVER CANCEL** - No Long-Running Operations
- **All operations complete in under 10 seconds**
- Extension loads instantly
- Tests run in under 2 seconds
- No build processes to wait for

## Common Development Tasks

### Making Code Changes
- **Direct editing**: Modify HTML, CSS, or JavaScript files directly
- **No compilation needed**: Changes are immediately available
- **Reload extension**: Go to `chrome://extensions/` and click reload button
- **Test immediately**: Always run built-in test (🧪) after changes

### Adding New Government Officials
- **Edit file**: `government-officials.js`
- **Follow existing data structure**: Each official needs name, title, contact info
- **Test search**: Officials are searchable - ensure new entries work with search
- **Validate**: Run test file to ensure data structure is correct

### Modifying UI/Styling
- **CSS file**: `styles.css` (1830 lines) - all styles in one file
- **HTML structure**: `index.html` - semantic HTML with ARIA labels
- **Theme support**: Uses CSS custom properties for light/dark themes
- **Responsive**: Mobile-friendly design with CSS Grid and Flexbox

### API Integration Changes
- **Milwaukee API**: `milwaukee-api.js` - local representatives
- **ProPublica API**: `propublica-api.js` - congressional data
- **Google Civic API**: Integrated in main `script.js`
- **Configuration**: API keys managed through options page

## Troubleshooting Common Issues

### Extension Not Loading
- **Check Developer Mode**: Must be enabled in `chrome://extensions/`
- **Verify File Permissions**: All files must be readable
- **Check Console**: Look for JavaScript errors in Chrome DevTools

### Test Failures
- **API Network Errors**: Expected in test environment - focus on data structure validation
- **Missing Officials**: Check `government-officials.js` data integrity
- **Search Not Working**: Verify search functionality in `script.js`

### Theme/UI Issues
- **Theme Toggle Broken**: Check CSS custom properties in `styles.css`
- **Responsive Issues**: Test with Chrome DevTools device emulation
- **Accessibility Problems**: Verify ARIA labels and keyboard navigation

## API Configuration (Optional)

### Adding API Keys
- **Settings Page**: Click ⚙️ in extension or visit `options.html`
- **Google Civic API**: For real government representative data
- **ProPublica API**: For detailed congressional information
- **Local Storage**: Keys stored in Chrome extension storage

### Testing with Real APIs
- **Requires valid API keys**: See `.claude/API_SETUP.md` for setup instructions
- **Milwaukee API**: Should work without keys for Milwaukee addresses
- **Network restrictions**: Some APIs may be blocked in development environment

## Development Best Practices

### Code Style
- **Consistent formatting**: Follow existing JavaScript style in codebase
- **Semantic HTML**: Use proper ARIA labels and semantic elements
- **CSS organization**: Add new styles to existing sections in `styles.css`
- **Console logging**: Use descriptive console.log messages for debugging

### Testing Strategy
- **Always test built-in functionality first**: Use 🧪 button
- **Test responsive design**: Use Chrome DevTools device simulation
- **Validate accessibility**: Test keyboard navigation and screen reader compatibility
- **Cross-browser compatibility**: Extension is Chrome-specific but test core HTML/CSS

### Performance Considerations
- **No build optimization needed**: Static files are already optimized
- **Image assets**: Icons are in `icons/` directory - keep file sizes reasonable
- **JavaScript efficiency**: Extension loads quickly - avoid unnecessary DOM queries

## Quick Reference Commands

### Essential File Viewing
- `cat manifest.json` - Extension configuration
- `ls -la` - Project structure overview
- `wc -l *.js *.html *.css` - Code statistics (5565 total lines)

### Testing Commands
- **No command line testing** - all testing through browser interface
- **Extension validation**: Load unpacked extension in Chrome
- **Test file**: Open `test-government-officials.html` in browser

### Common File Edits
- **Government data**: Edit `government-officials.js`
- **Main functionality**: Edit `script.js`
- **Styling**: Edit `styles.css`
- **Extension config**: Edit `manifest.json`

## Summary

This Chrome extension is designed for rapid development with immediate feedback. No build processes, no package managers, no complex toolchains. Edit files, reload extension, test immediately. The built-in testing infrastructure ensures changes work correctly, and the comprehensive government officials database provides rich functionality for Milwaukee area residents.

**Remember**: Always run the 🧪 test button after making changes to validate functionality.