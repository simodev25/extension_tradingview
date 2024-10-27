// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.indicator-properties-dialog

console.log("This prints to the console of the service worker (background script)")
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.includes('https://www.tradingview.com/chart')) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content-script.js']
    });
  }
});
// Ecouter les messages envoyés depuis le content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sendInputFields') {
        console.log('Données reçues du content script:', message.inputValues);

        // Stocker les données reçues dans une variable
        inputFieldsData = message.inputValues;
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sendReportTable') {
        console.log('Données reçues send Report Table:', message.inputValues);
        // Stocker les données reçues dans une variable
        reportTable = message.result;
        console.log(reportTable)
    }
});
// Ecouter les requêtes venant du popup pour envoyer les données stockées
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getInputFields') {
        // Envoyer les données stockées au popup
        sendResponse({ inputValues: inputFieldsData });
    }
});