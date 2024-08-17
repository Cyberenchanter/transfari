browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translateText') {
        // Fetch the DeepL API key and target language
        browser.storage.local.get(['deeplApiKey', 'targetLang']).then(result => {
            if (result.deeplApiKey) {
                const targetLang = result.targetLang || 'EN'; // Default to 'EN' if not set
                translateWithDeepL(request.text, result.deeplApiKey, targetLang)
                    .then(sendResponse)
                    .catch(error => sendResponse({ error: error.message }));
            } else {
                sendResponse({ error: 'DeepL API Key not found. Please set it in the extension popup.' });
            }
        });
        return true; // Indicates that the response is asynchronous
    }
});

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
