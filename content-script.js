console.log("content-script");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchData() {
    let mainDiv = document.querySelector('div[data-outside-boundary-for="indicator-properties-dialog"]');
    if (mainDiv) {
        let boundaryForValue = mainDiv.getAttribute('data-outside-boundary-for');
        let inputFields = mainDiv.querySelectorAll('input');
        let inputValues = [];

        inputFields.forEach(input => {
            let labelDiv = input.closest('.cell-tBgV1m0B').previousElementSibling;
            let label = labelDiv ? labelDiv.textContent.trim() : 'Label non trouvé'; // Récupérer le texte du label

            // Pousser la valeur de l'input et son label dans le tableau inputValues
            inputValues.push({
                label: label, // Label associé à l'input
                value: input.value, // Valeur de l'input
                inputMode: input.getAttribute('inputmode') // Récupérer inputmode s'il existe
            });
        });

        console.log('Input Fields:', inputValues); // Affiche les valeurs et non l'objet
        chrome.runtime.sendMessage({
            action: 'sendInputFields',
            inputValues: inputValues
        });
    } else {
        console.log('Le div avec data-outside-boundary-for="indicator-properties-dialog" n\'a pas été trouvé.');
    }
}

// Fonction pour ajouter l'écouteur d'événement au bouton lorsque disponible
function addButtonListener() {
    let targetButton = document.querySelector('.apply-common-tooltip.lightButton-bYDQcOkp');

    // Vérifier si le bouton existe et si un écouteur n'a pas déjà été attaché
    if (targetButton && !targetButton.dataset.listenerAdded) {
        console.log('Bouton trouvé, ajout de l\'écouteur.');
        targetButton.addEventListener('click', function() {
            // Utiliser un léger délai après le clic pour permettre le DOM de se mettre à jour
            setTimeout(() => {
                fetchData();
            }, 1000); // Délai pour laisser le temps à l'interface de se mettre à jour
        });

        // Marquer le bouton comme ayant déjà un écouteur
        targetButton.dataset.listenerAdded = "true";
        return true; // Le bouton a été trouvé et l'écouteur ajouté
    } else {
        console.log('Le bouton spécifié n\'a pas été trouvé ou l\'écouteur est déjà ajouté.');
        return false; // Le bouton n'a pas été trouvé ou l'écouteur est déjà ajouté
    }
}

// MutationObserver pour surveiller les changements dans le DOM
const observer = new MutationObserver((mutations, observer) => {
    if (addButtonListener()) {
        // Si le bouton est trouvé, arrêter l'observation
        observer.disconnect();
    }
});

// Configurer l'observateur pour surveiller le document entier pour les ajouts d'éléments
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Tenter de trouver immédiatement le bouton, au cas où il est déjà présent
addButtonListener();
let rangeTest = 100;


// Recevoir le message envoyé depuis le popup
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.action === 'applySettings') {
        const settings = request.settings;
        const maxIterations = settings.rangeTest || 500; // Assure-toi que rangeTest est défini dans settings
        let mainDiv = document.querySelector('div[data-outside-boundary-for="indicator-properties-dialog"]');

        if (mainDiv) {
            let inputFields = mainDiv.querySelectorAll('input');
            console.log("Input fields trouvés :", inputFields);
            console.log("Settings reçus :", settings);
            let bestDeepHistory
            let bestSettings = settings
            let deepHistoryData = {
                bestDeepHistory: null,
                bestSettings:bestSettings,
                deepHistory:[
                ]
            };
            for (let iteration = 0; iteration < maxIterations; iteration++) {
                console.log(`Settings pour rangeTest ${iteration}`);
                console.log("bestSettings Settings  :",bestSettings);
                const newSettings = calculeSettings(bestSettings, iteration,deepHistoryData); // On génère les nouveaux settings
                console.log("new Settings  :",newSettings);
                applySettings(inputFields, newSettings); // Applique les nouveaux settings

                 try {
                       await sleep(5000);
                       let deepHistory = await handleDeepHistory(request, sender, sendResponse);
                       deepHistoryData.deepHistory.push({
                                 deepHistory: deepHistory,
                                 settings:newSettings
                             }
                       )
                        if(deepHistory){
                            console.log("new deepHistory  :",deepHistory);
                            if (isBestDeepHistory(bestDeepHistory, deepHistory) < 0) {
                                bestDeepHistory = deepHistory;
                                bestSettings = newSettings
                                deepHistoryData.bestDeepHistory= bestDeepHistory
                                deepHistoryData.bestSettings=bestSettings
                                console.log("Nouveau meilleur DeepHistory :", bestDeepHistory);
                            }
                        }

                    } catch (error) {
                        console.error("Erreur lors de handleDeepHistory :", error);
                        // Gérer l'erreur si nécessaire
                    }

            }
            console.log("fin iteration--------------------------");

            console.log("bestDeepHistory   :",bestDeepHistory);
            console.log("bestSettings Settings  :",bestSettings);
             await sleep(5000);
            applySettings(inputFields, bestSettings);
             console.log("deepHistoryData  :",deepHistoryData);
             console.log("--------------------------");
            sendResponse({
                status: 'success',
                message: "Paramètres appliqués avec succès"
            });
        } else {
            console.warn("Le div avec data-outside-boundary-for='indicator-properties-dialog' n'a pas été trouvé.");
            sendResponse({
                status: 'failed',
                message: "Div cible introuvable"
            });
        }
    }
});
function isBestDeepHistory(bestDeepHistory, newDeepHistory) {

    if(!bestDeepHistory) return -1
    const criteria = {
        drawDown:-1,
        profitFactor:1,
        netProfit: 5,
        totalTrades:5,        // plus faible est mieux
        percentProfitable: 5 // plus élevé est mieux
    };

    // Comparer chaque critère
    let scoreBestDeepHistory = 0;
    let scoreNewDeepHistory = 0;

    for (let key in criteria) {
        const direction = criteria[key];
        if (bestDeepHistory[key] > newDeepHistory[key]) {
            scoreBestDeepHistory += direction;
        } else if (bestDeepHistory[key] < newDeepHistory[key]) {
            scoreNewDeepHistory += direction;
        }
    }

    // Déterminer le meilleur
    console.log('DeepHistory',scoreBestDeepHistory)
     console.log('NewDeepHistory',scoreNewDeepHistory)
    if (scoreBestDeepHistory > scoreNewDeepHistory) return 1;
    if (scoreNewDeepHistory > scoreBestDeepHistory) return -1;
    return 0; // Équivalent si les scores sont égaux
}

function calculeSettings(settingsArray, iteration, deepHistoryData) {
    // Récupérer les meilleures valeurs de paramètres jusqu'à présent
    const bestSettings = deepHistoryData.bestSettings;

    // Pour chaque paramètre actif, ajuster la valeur en se basant sur les meilleures performances
    const newSettingsArray = settingsArray.map((setting, index) => {
        if (!setting.active) return setting;

        const betweenStart = parseFloat(setting.betweenStart);
        const betweenEnd = parseFloat(setting.betweenEnd);
        let stepSize = parseFloat(setting.stepSize);

        // Obtenir la meilleure valeur pour ce paramètre
        const bestValue = parseFloat(bestSettings[index].field);

        // Générer une nouvelle valeur en ajustant autour de la meilleure valeur
        // Vous pouvez utiliser une distribution normale pour favoriser les valeurs proches de la meilleure
        const adjustment = randomGaussian(0, stepSize / 2);
        let newValue = bestValue + adjustment;

        // S'assurer que newValue reste dans les limites
        newValue = Math.max(betweenStart, Math.min(betweenEnd, newValue));

        return {
            ...setting,
            field: newValue.toString()
        };
    });

    return newSettingsArray;
}

// Fonction pour générer un nombre aléatoire selon une distribution normale
function randomGaussian(mean = 0, stdDev = 1) {
    let u = 1 - Math.random(); // Converting [0,1) to (0,1]
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
}

function applySettings(inputFields, settings) {
    inputFields.forEach((inputField, index) => {
        // Vérifier que le setting existe pour cet index
        if (settings[index].active == true  && settings[index]) {
            inputField.value = settings[index].field;
            inputField.dispatchEvent(new Event('change', {
                bubbles: true
            }));
            inputField.dispatchEvent(new Event('blur', {
                bubbles: true
            }));
            var keyCode = 13;
            var eventType = 'keydown';
            var eventDown = new KeyboardEvent(eventType, {
                key: "Enter",
                keyCode: keyCode,
                bubbles: true
            });
            inputField.dispatchEvent(eventDown);
        } else {
          //  console.warn(`Aucun setting trouvé pour l'index ${index}`);
        }
    });
}

function getValue(text) {
    const numberOnly = parseFloat(text.match(/[+-]?\d+(\.\d+)?/)[0]);
    return numberOnly;
}

async function handleDeepHistory(request, sender, sendResponse) {
    await waitForReport();

    let backtestingContainer = document.querySelector('.deep-history');
    if (backtestingContainer) {
        var reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
        if (reportContainer) {
            const result = {
                netProfit: 0,
                percentProfit: 0,
                profitFactor: 0,
                drawDown: 0,
                percentDown: 0,
                avgBars: 0,
                avgTrades: 0,
                avgTradesPercent: 0,
                totalTrades: 0
            };

            const cells = reportContainer.querySelectorAll('[class^="containerCell"]');
            cells.forEach((cell) => {
                const titleCell = cell.querySelector('[class^="firstRow"]').querySelector('[class^="title"]').innerText;
                const valueCell = cell.querySelector('[class^="secondRow"]').firstElementChild.innerText;
                const percentCell = cell.querySelector('[class^="secondRow"]').querySelector('[class*="additionalPercent"]').innerText;
                switch (titleCell) {
                    case 'Net Profit':
                        result.netProfit = getValue(valueCell);
                        result.percentProfit = getValue(percentCell);
                        break;

                    case "Max Drawdown":
                        result.drawDown = getValue(valueCell);
                        result.percentDown = getValue(percentCell);
                        break;
                    case "Avg # Bars in Trades":
                        result.avgBars = getValue(valueCell);
                        break;
                    case "Avg Trade":
                        result.avgTrades = getValue(valueCell);
                        result.avgTradesPercent = getValue(percentCell);
                        break;
                    case "Total Closed Trades":
                        result.totalTrades = getValue(valueCell);
                        break;
                    case "Profit Factor":
                        result.profitFactor = getValue(valueCell);
                        break;
                    case "Percent Profitable":
                        result.percentProfitable = getValue(valueCell);
                        break;
                }
            });
            return result;
        }
    }

}

async function waitForReport(timeout = 5000) {
    let startTime = Date.now();
    let backtestingContainer = document.querySelector('.deep-history');
    if (backtestingContainer) {
        let reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
        while (!reportContainer) {
            // Vérifier le timeout pour éviter les boucles infinies
            if (Date.now() - startTime > timeout) {
                console.warn('Timeout atteint : le rapport n\'est pas disponible.');
                return null;
            }

            await sleep(100); // Attendre 100 ms avant de vérifier à nouveau
            backtestingContainer = document.querySelector('.deep-history');
            reportContainer = backtestingContainer ? backtestingContainer.querySelector('[class^="reportContainer"]') : null;

            // Vérifier si l'icône d'état "pas de données" est présente
            const noData = backtestingContainer ? backtestingContainer.querySelector('[class*="emptyStateIcon"]') : null;
            if (noData) {
                console.warn('Pas de données disponibles.');
                return null;
            }
        }

        // console.log('Le rapport est disponible.');
        return reportContainer;
    } else {
        console.warn('Le conteneur deep-history n\'a pas été trouvé.');
        return null;
    }
}
