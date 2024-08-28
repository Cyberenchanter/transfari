document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveSettingsButton = document.getElementById('saveSettings');
    const translatePageButton = document.getElementById('translatePage');
    const cancelTranslationButton = document.getElementById('cancelTranslation');
    const targetLangSelect = document.getElementById('targetLang');
    const autoTranslateToggle = document.getElementById('autoTranslateToggle');
    const translationServiceSelect = document.getElementById('translationService');
    const feedbackMessage = document.getElementById('transfarifeedbackMessage'); // Feedback message element
    // Load saved settings
    browser.storage.local.get(['translationService', 'apiKey', 'targetLang', 'isAutoTranslatePage_${domain}']).then(result => {
        if (result.translationService) {
            translationServiceSelect.value = result.translationService;
        }
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.targetLang) {
            targetLangSelect.value = result.targetLang;
        }
        updateApiKeyVisibility();
    });
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        const domain = new URL(tabs[0].url).hostname;
        browser.storage.local.get([`isAutoTranslatePage_${domain}`]).then(result => {
            autoTranslateToggle.checked = result[`isAutoTranslatePage_${domain}`] || false;
        });
    });
    translationServiceSelect.addEventListener('change', updateApiKeyVisibility);

    function updateApiKeyVisibility() {
        apiKeyInput.style.display = translationServiceSelect.value === 'googleFree' ? 'none' : 'block';
    }
    
    function showFeedbackMessage(message, isSuccess) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.color = isSuccess ? 'green' : 'red';
        feedbackMessage.style.display = 'block';
        
        // Hide message after 3 seconds
        setTimeout(() => {
            feedbackMessage.style.display = 'none';
        }, 5000);
    }
    saveSettingsButton.addEventListener('click', function() {
        const translationService = translationServiceSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const targetLang = targetLangSelect.value;
        const isAutoTranslatePage = autoTranslateToggle.checked;
        
        if (translationService !== 'googleFree' && !apiKey) {
            showFeedbackMessage('Please obtain a free API Key from the service provider.', false);
            return;
        }
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            const url = new URL(tabs[0].url);
            const domain = url.hostname;

            // Save the settings per domain
            browser.storage.local.set({
                [`translationService`]: translationService,
                [`apiKey`]: apiKey,
                [`targetLang`]: targetLang,
                [`isAutoTranslatePage_${domain}`]: isAutoTranslatePage
            }).then(() => {
                showFeedbackMessage('Settings saved successfully!', true);
            }).catch(() => {
                showFeedbackMessage('Failed to save settings.', false);
            });
        });
    });

    translatePageButton.addEventListener('click', function() {
        const translationService = translationServiceSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const targetLang = targetLangSelect.value;
        const isAutoTranslatePage = autoTranslateToggle.checked;
        
        if (translationService !== 'googleFree' && !apiKey) {
            showFeedbackMessage('Please obtain a free API Key from the service provider.', false);
            return;
        }

        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            const url = new URL(tabs[0].url);
            const domain = url.hostname;

            // Save the settings per domain
            browser.storage.local.set({
                [`translationService`]: translationService,
                [`apiKey`]: apiKey,
                [`targetLang`]: targetLang,
                [`isAutoTranslatePage_${domain}`]: isAutoTranslatePage
            }).catch(() => {
                showFeedbackMessage('Failed to save settings.', false);
            });
        });
        
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
