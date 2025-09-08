# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that replaces the new tab page to display government officials for a specific address. The extension uses the Google Civic Information API to fetch representative data and displays it in a hierarchical format organized by governmental divisions.

## Architecture

**Chrome Extension Structure:**
- `manifest.json` - Extension configuration using manifest v3
- `index.html` - New tab replacement page that displays government officials
- `script.js` - Main application logic for rendering officials data
- `background.js` - Service worker (currently minimal implementation)
- `options.html` - Extension options page (basic stub)
- `gapiCall.html` - Development/testing file for Google API calls

**Data Flow:**
1. Extension loads with hardcoded sample data (`sampleJSON` embedded in script.js)
2. Data is parsed from Google Civic Information API response format
3. Officials are organized by governmental divisions (country, state, county, city)
4. Each division displays its offices and associated officials with website links

**Key Data Structures:**
- `divisions` - Geographic/political divisions (US, Wisconsin, Milwaukee County, etc.)
- `offices` - Government positions within each division
- `officials` - Individual people holding those offices with contact information

## Development Notes

**Google Civic Information API:**
- API key placeholder exists in code: "YOUR_API_KEY" needs replacement for live functionality
- Current implementation uses embedded sample JSON data for Milwaukee, WI address
- API endpoint: `https://civicinfo.googleapis.com/$discovery/rest?version=v2`
- Requires address parameter and returns representatives for that location

**Code Issues to Address:**
- `background.js:6` has bug: `getElementsById` should be `getElementById`
- Extension currently uses hardcoded sample data instead of live API calls
- No error handling for API requests or invalid data
- No user interface for changing the address being queried

**Extension Loading:**
- Install as unpacked extension in Chrome for development
- No build process required - direct file serving
- Extension overrides new tab page with `chrome_url_overrides.newtab`

**Testing:**
- Use Chrome's extension developer tools for debugging
- `gapiCall.html` can be opened directly for API testing
- Check console logs for data parsing and API responses