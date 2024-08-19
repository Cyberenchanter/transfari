document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveSettingsButton = document.getElementById('saveSettings');
    const translatePageButton = document.getElementById('translatePage');
    const cancelTranslationButton = document.getElementById('cancelTranslation');
    const targetLangSelect = document.getElementById('targetLang');
    const autoTranslateToggle = document.getElementById('autoTranslateToggle');
    const translationServiceSelect = document.getElementById('translationService');

    // Load saved settings
    browser.storage.local.get(['translationService', 'apiKey', 'targetLang', 'isAutoTranslatePage']).then(result => {
        if (result.translationService) {
            translationServiceSelect.value = result.translationService;
        }
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.targetLang) {
            targetLangSelect.value = result.targetLang;
        }
        if (result.isAutoTranslatePage !== undefined) {
            autoTranslateToggle.checked = result.isAutoTranslatePage;
        }
        updateApiKeyVisibility();
    });

    translationServiceSelect.addEventListener('change', updateApiKeyVisibility);

    function updateApiKeyVisibility() {
        apiKeyInput.style.display = translationServiceSelect.value === 'googleFree' ? 'none' : 'block';
    }

    saveSettingsButton.addEventListener('click', function() {
        const translationService = translationServiceSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const targetLang = targetLangSelect.value;
        const isAutoTranslatePage = autoTranslateToggle.checked;
        
        if (translationService !== 'googleFree' && !apiKey) {
            alert('Please enter a valid API Key.');
            return;
        }

        browser.storage.local.set({
            translationService: translationService,
            apiKey: apiKey,
            targetLang: targetLang,
            isAutoTranslatePage: isAutoTranslatePage
        }).then(() => {
            alert('Settings saved successfully!');
        });
    });

    translatePageButton.addEventListener('click', function() {
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
