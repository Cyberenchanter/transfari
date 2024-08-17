document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const translatePageButton = document.getElementById('translatePage');
    const cancelTranslationButton = document.getElementById('cancelTranslation');

    // Load saved API key
    browser.storage.local.get('deeplApiKey').then(result => {
        if (result.deeplApiKey) {
            apiKeyInput.value = result.deeplApiKey;
        }
    });

    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            browser.storage.local.set({deeplApiKey: apiKey}).then(() => {
                alert('API Key saved successfully!');
            });
        } else {
            alert('Please enter a valid API Key.');
        }
    });

    translatePageButton.addEventListener('click', function() {
        console.log('Translate button clicked');
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, {action: 'translate'});
        });
    });

    cancelTranslationButton.addEventListener('click', function() {
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            browser.tabs.sendMessage(tabs[0].id, {action: 'cancelTranslation'});
        });
    });
});
