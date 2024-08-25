browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateText') {
        browser.storage.local.get(['translationService', 'apiKey', 'targetLang']).then(result => {
            const targetLang = result.targetLang || 'EN';
            switch (result.translationService) {
                case 'googleFree':
                    translateWithGoogleFree(request.text, targetLang)
                        .then(sendResponse)
                        .catch(error => sendResponse({ error: error.message }));
                    break;
                case 'googleCloud':
                    if (!result.apiKey) {
                        sendResponse({ error: 'Google Cloud API Key not found. Please set it in the extension popup.' });
                    } else {
                        translateWithGoogleCloud(request.text, result.apiKey, targetLang)
                            .then(sendResponse)
                            .catch(error => sendResponse({ error: error.message }));
                    }
                    break;
                case 'deepl':
                    if (!result.apiKey) {
                        sendResponse({ error: 'DeepL API Key not found. Please set it in the extension popup.' });
                    } else {
                        translateWithDeepL(request.text, result.apiKey, targetLang)
                            .then(sendResponse)
                            .catch(error => sendResponse({ error: error.message }));
                    }
                    break;
                default:
                    sendResponse({ error: 'Invalid translation service selected.' });
            }
        });
        return true; // Indicates that the response is asynchronous
    }
});

async function translateWithGoogleFree(texts, targetLang) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(texts)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Translate API error: ${response.status}`);
        }
        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join('');
        return { translatedText, error: '' };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: '', error: error.message };
    }
}

async function translateWithGoogleCloud(texts, apiKey, targetLang) {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: texts,
                target: targetLang,
            }),
        });
        if (!response.ok) {
            throw new Error(`Google Cloud Translation API error: ${response.status}`);
        }
        const data = await response.json();
        const translatedText = data.data.translations.map(t => t.translatedText).join('\n');
        return { translatedText, error: '' };
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: '', error: error.message };
    }
}

// Keep the existing translateWithDeepL function
async function translateWithDeepL(texts, apiKey, targetLang) {
    const url = 'https://api-free.deepl.com/v2/translate';
    try {
        // Ensure texts is an array
        const textArray = Array.isArray(texts) ? texts : [texts];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: textArray,
                target_lang: targetLang,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error status:', response.status);
            console.error('Error data:', errorData);
            throw new Error(`DeepL API error: ${response.status || errorData}`);
        }

        const data = await response.json();
        if (data.translations && data.translations.length > 0) {
            return {
                translatedText: data.translations.map(t => t.text).join('\n'),
                error: ''
            };
        } else {
            return { translatedText: '', error: 'Translation failed' };
        }
    } catch (error) {
        console.error('Translation error:', error);
        return { translatedText: '', error: error.message };
    }
}
