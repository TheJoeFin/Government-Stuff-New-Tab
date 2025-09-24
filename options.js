document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('options-form');
  const googleApiKeyInput = document.getElementById('api-key');
  const propublicaApiKeyInput = document.getElementById('propublica-api-key');
  const status = document.getElementById('status');

  // Load the saved settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (result.settings) {
      googleApiKeyInput.value = result.settings.apiKey || '';
      propublicaApiKeyInput.value = result.settings.propublicaApiKey || '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const googleApiKey = googleApiKeyInput.value.trim();
    const propublicaApiKey = propublicaApiKeyInput.value.trim();

    chrome.storage.sync.get(['settings'], (result) => {
      const newSettings = result.settings || {};
      newSettings.apiKey = googleApiKey;
      newSettings.propublicaApiKey = propublicaApiKey;
      chrome.storage.sync.set({ settings: newSettings }, () => {
        status.textContent = 'API keys saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      });
    });
  });
});