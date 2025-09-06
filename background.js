
// Government Stuff New Tab Extension - Background Script
// Service worker for handling extension lifecycle events

chrome.runtime.onInstalled.addListener((details) => {
    console.log('Government Stuff New Tab Extension installed');
    
    if (details.reason === 'install') {
        // Set default settings on first install
        chrome.storage.sync.set({
            settings: {
                showSidebar: true,
                autoLocation: false,
                theme: 'light'
            }
        });
    }
});

// Handle any background tasks if needed in the future
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle messages from content scripts or popup if needed
    console.log('Background received message:', message);
    sendResponse({status: 'received'});
});
