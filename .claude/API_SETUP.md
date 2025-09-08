# Google Civic Information API Setup

This extension can use the real Google Civic Information API to fetch live government data. Follow these steps to set up your API key.

## 🔑 Getting Your API Key

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - If you don't have a project, click "Create Project"
   - Give it a name like "Government Tab Extension"
   - Select your project

3. **Enable the Google Civic Information API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Civic Information API"
   - Click on it and press "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (it will look like: `AIzaSyB...`)

5. **Secure Your API Key (Optional but Recommended)**
   - Click the edit icon next to your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Civic Information API"
   - Save changes

## 🔧 Using Your API Key

1. **Open the Extension**
   - Install the extension in Chrome
   - Open a new tab (or use test.html)

2. **Enter Your API Key**
   - Click the Settings button (⚙️) in the top right
   - Paste your API key in the "Google Civic Information API Key" field
   - The key will be saved automatically

3. **Test with Real Data**
   - Enter an address in the sidebar (e.g., "1600 Pennsylvania Ave, Washington DC")
   - Click "Update" to fetch real government data
   - Try your own address to see your local representatives!

## 📍 Testing Addresses

Try these addresses to test the API:

- **White House**: `1600 Pennsylvania Ave, Washington DC`
- **New York City**: `New York, NY`
- **Los Angeles**: `Los Angeles, CA`
- **Your address**: Enter your full address for local representatives

## 🚫 Without API Key

- The extension works without an API key using sample data
- You'll see Milwaukee, WI government officials as example data
- All features work normally, just with static information

## 💰 API Costs

- Google Civic Information API has generous free quotas
- Most personal use will stay within free limits
- Check [Google Cloud Pricing](https://cloud.google.com/civic-information/pricing) for details

## 🔒 Privacy & Security

- Your API key is stored locally in the browser
- No data is sent to any servers except Google's official API
- Address queries are sent to Google to fetch representative data
- All communication uses HTTPS encryption

## 🛠️ Troubleshooting

**"Invalid API key" error:**
- Double-check you copied the full API key
- Make sure the Google Civic Information API is enabled
- Check if your API key has restrictions that block the request

**"Invalid address" error:**
- Try a more specific address with state/country
- Use well-known addresses like "New York, NY"
- Make sure the address format is correct

**No data returned:**
- Some areas may have limited representative data
- Try a major city address to test
- Check browser console (F12) for detailed error messages