// Demander les données stockées dans le background (service worker)
chrome.runtime.sendMessage({ action: 'getInputFields' }, function(response) {
    if (response.inputValues) {
        console.log('Données reçues du service worker:', response.inputValues);

        // Sélectionner l'élément où les champs seront ajoutés
        const inputFieldsContainer = document.getElementById('inputFieldsList');

        // Parcourir les inputValues reçues et créer des champs dynamiques
        response.inputValues.forEach((input, index) => {
            // Créer un conteneur pour chaque groupe d'inputs
            const container = document.createElement('div');
            container.classList.add('form-group', 'step-container');

            // Ajouter la checkbox pour activer/désactiver le champ Field
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox_${index}`;
            checkbox.checked = false; // Coché par défaut

            const checkboxLabel = document.createElement('label');
            checkboxLabel.setAttribute('for', `checkbox_${index}`);
            checkboxLabel.textContent = ' Activer';

            // Créer le champ Field avec le label et la valeur de l'input reçu
            const field = document.createElement('div');
            field.classList.add('form-group', 'step-container');
            field.innerHTML = `
                <label for="field_${index}">${input.label || 'Label non trouvé'}</label>
                <input type="number" id="field_${index}" value="${input.value || 0}" >
            `;

            const stepSizeField = document.createElement('div');
            stepSizeField.classList.add('form-group', 'step-container');
            stepSizeField.innerHTML = `
                <label for="stepSize_${index}">Step-Size</label>
                <input type="number" id="stepSize_${index}" value="1" class="step-size">
            `;

            const betweenField = document.createElement('div');
            betweenField.classList.add('form-group', 'step-container');
            betweenField.innerHTML = `
                <label for="between_${index}">Between</label>
                <input type="number" id="betweenStart_${index}" value="0"> and
                <input type="number" id="betweenEnd_${index}" value="10">
            `;

            // Ajouter les checkbox et champs dans le conteneur
            container.appendChild(checkbox);
            container.appendChild(checkboxLabel);
            container.appendChild(field);
            container.appendChild(stepSizeField);
            container.appendChild(betweenField);

            // Insérer le conteneur dans le DOM du popup
            inputFieldsContainer.appendChild(container);

            // Écouteur d'événements pour activer/désactiver le champ Field
            checkbox.addEventListener('change', function() {
                const fieldInput = document.getElementById(`field_${index}`);
                fieldInput.disabled = !this.checked; // Désactive le champ si la checkbox n'est pas cochée
            });
        });

        // Ajouter un écouteur d'événement pour le bouton "Find Best Settings"
        document.getElementById('findBestSettingsButton').addEventListener('click', function() {
            const allInputValues = [];
            response.inputValues.forEach((input, index) => {
                const active = document.getElementById(`checkbox_${index}`).checked;
                const fieldValue = document.getElementById(`field_${index}`).value;
                const stepSizeValue = document.getElementById(`stepSize_${index}`).value;
                const betweenStartValue = document.getElementById(`betweenStart_${index}`).value;
                const betweenEndValue = document.getElementById(`betweenEnd_${index}`).value;

                allInputValues.push({
                    active: active,
                    label: input.label,
                    field: fieldValue,
                    stepSize: stepSizeValue,
                    betweenStart: betweenStartValue,
                    betweenEnd: betweenEndValue
                });
            });

            console.log('Paramètres collectés pour Find Best Settings:', allInputValues);

            // Envoyer les valeurs collectées au content script
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'applySettings',
                    settings: allInputValues
                });
            });
        });
    } else {
        console.log('Aucune donnée disponible.');
    }
});
