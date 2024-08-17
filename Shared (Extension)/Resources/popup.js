document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const translatePageButton = document.getElementById('translatePage');
    const cancelTranslationButton = document.getElementById('cancelTranslation');
    const targetLangSelect = document.getElementById('targetLang');

    // Load saved API key and language
    browser.storage.local.get(['deeplApiKey', 'targetLang']).then(result => {
        if (result.deeplApiKey) {
            apiKeyInput.value = result.deeplApiKey;
        }
        if (result.targetLang) {
            targetLangSelect.value = result.targetLang;
        }
    });

    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        const targetLang = targetLangSelect.value;
        if (apiKey) {
            browser.storage.local.set({
                deeplApiKey: apiKey,
                targetLang: targetLang
            }).then(() => {
                alert('API Key and language saved successfully!');
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
