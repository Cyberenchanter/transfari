function PageTranslator() {
    
    this.textNodes = [];
    this.textNodesId = 1;
    this.wailLoadContentTimeoutId = null;
    
    this.init = () => {
        if (document.readyState == 'complete') {
            setTimeout(() => {
                browser.storage.local.get('isAutoTranslatePage').then(result => {
                    if(result.isAutoTranslatePage) {
                        this.autoTranslatePage();
                    }
                });
            }, 500);
        }
        
        const observer = new MutationObserver(list => {
            if (document.readyState == 'complete') {
                if (this.isPageTranslated()) {
                    clearTimeout(this.wailLoadContentTimeoutId);
                    this.wailLoadContentTimeoutId = setTimeout(() => {
                        this.sendNodesPartsForTranslate();
                    }, 1000);
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        document.addEventListener("readystatechange", () => {
            if (document.readyState == 'complete') {
                browser.storage.local.get('isAutoTranslatePage').then(result => {
                    if(result.isAutoTranslatePage) {
                        this.autoTranslatePage();
                    }
                });
            }
        });
    };
    
    this.isPageTranslated = () => {
        return document.body.parentNode.getAttribute("translated") ? true : false;
    };
    
    this.autoTranslatePage = () => {
        console.log("PageTranslator.autoTranslatePage");
        
        if (localStorage.getItem('htex_auto_translate') != 'true') {
            return
        }
        
        if (!this.isPageTranslated()) {
            this.requestTranslate();
        }
    };
    
    this.requestTranslate = () => {
        console.log("PageTranslator.requestTranslate");
        
        if (this.isPageTranslated()) {
            return this.cancelPageTranslation();
        }
        
        this.sendNodesPartsForTranslate();
    };
    
    this.sendNodesPartsForTranslate = () => {
        this.findAllTextNodes();
        var textNodesParts = this.splitTextNodesToParts();

        textNodesParts.forEach(textParts => {
            browser.runtime.sendMessage({
                action: 'translateText',
                text: textParts
            }).then(response => {
                if (response.error) {
                    console.error('Translation error:', response.error);
                } else {
                    this.replaceText(response.translatedText);
                }
            });
        });
    };
    
    this.translate = (message) => {
        console.log("PageTranslator.translate", message);
        
        if (message.error.length > 0) {
            console.log("PageTranslator.translate - error:", message.error);
        } else if (message.translatedText.length > 0) {
            this.replaceText(message.translatedText);
            localStorage.setItem('htex_auto_translate', 'true');
        }
    };
    
    this.findAllTextNodes = () => {
        const whitespace = /^\s*$/;
        const ignoreNode = ["style", "script", "noscript", "svg", "xml", "code"];
        
        var getTextNodes = (node) => {
            if (ignoreNode.includes(node.nodeName.toLowerCase()) || node.oldTextContent != undefined) {
                return;
            }

            if (node.nodeType == 3) {
                if (!whitespace.test(node.nodeValue)) {
                    if(node.nodeId == undefined) {
                        node.nodeId = this.textNodes.length;
                        this.textNodes.push(node);
                    }
                }
            } else if (node.nodeType == 1 && ["input", "textarea"].includes(node.nodeName.toLowerCase())) {
                if(node.nodeId == undefined && node.placeholder != undefined) {
                    node.nodeId = this.textNodes.length;
                    this.textNodes.push(node);
                }
            } else {
                for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                    getTextNodes(node.childNodes[i]);
                }
            }
        }
        
        getTextNodes(document);
    };
    
    this.splitTextNodesToParts = () => {
        var parts = [""];
        
        this.textNodes.forEach((node, id) => {
            if (node.oldTextContent != undefined) {
                return;
            }
            
            var textContent = ""
            
            if (["input", "textarea"].includes(node.nodeName.toLowerCase())) {
                if (node.placeholder != "") {
                    textContent = node.placeholder
                }
            } else {
                textContent = node.textContent.replaceAll("\n", "");
            }
            
            textContent = `[0,${id}]\n${textContent}\n`;
                
            if (parts[parts.length - 1].length + textContent.length > 990) {
                parts.push("");
            }
            
            parts[parts.length - 1] += textContent;
        });
        
        return parts;
    };
    
    this.replaceText = (translatedText) => {
        var results = translatedText.split('\n');

        for(var i = 0; i < results.length; i += 2) {
            if (results[i + 1] == undefined) {
                break;
            }
            
            var id = parseInt(results[i].replace("[0,", "").replace("[0.", "").replace("]", ""));
            var node = this.textNodes[id];

            if (["input", "textarea"].includes(node.nodeName.toLowerCase())) {
                if (node.placeholder != undefined) {
                    node.oldPlaceholder = node.placeholder
                    node.placeholder = results[i + 1]
                }
            } else if (node.textContent != undefined) {
                node.oldTextContent = node.textContent;
                node.textContent = results[i + 1] + " ";
            }
        }
        
        document.body.parentNode.setAttribute("translated", "true");
        
        this.updateContextMenu();
    };
    
    this.cancelPageTranslation = () => {
        this.textNodes.forEach(node => {
            if (node.oldTextContent != undefined) {
                node.textContent = node.oldTextContent;
                node.oldTextContent = undefined;
            } else if (node.oldPlaceholder != undefined) {
                node.placeholder = node.oldPlaceholder
                node.oldPlaceholder = undefined
            }
        });
        
        document.body.parentNode.removeAttribute("translated");
        localStorage.setItem('htex_auto_translate', 'false');
    };
    
    this.updateContextMenu = (e) => {
        console.log("PageTranslator.updateContextMenuTranslationPage");
        
        var isPageTranslated = this.isPageTranslated();
        
        // Removed content.senderMessages.sendMessageToBackground call
        // If you need to update the context menu, you should send a message to the background script
        browser.runtime.sendMessage({
            action: 'updateContextMenu',
            menuId: 'translatePage',
            updateProperties: {
                isPageTranslated: isPageTranslated
            }
        });
    };
    
    this.init();
}

const pageTranslator = new PageTranslator();

console.log('Content script loaded');
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'translate') {
        console.log('Translate action received');
        pageTranslator.requestTranslate();
    } else if (request.action === 'cancelTranslation') {
        pageTranslator.cancelPageTranslation();
    }
    return true; // Keep the message channel open for asynchronous response
});
