document.addEventListener('DOMContentLoaded', initializeSettings);

const statusMessage = document.getElementById('statusMessage');
const riskScanningToggle = document.getElementById('riskScanningToggle');

/**
 * Shows a status message temporarily.
 * @param {string} message The message to display.
 */
function showStatusMessage(message) {
    statusMessage.textContent = message;
    statusMessage.style.opacity = 1;
    
    setTimeout(() => {
        statusMessage.style.opacity = 0;
    }, 1500);
}

// Function to load and set the initial state of the toggle
async function loadSettings() {
    // getScanningStatus and STORAGE_KEYS are available via utils/utils.js
    const isEnabled = await getScanningStatus();
    riskScanningToggle.checked = isEnabled;
    console.log('Initial scanning status loaded:', isEnabled);
}

// Function to save the new state on toggle change
async function saveSettings() {
    const isEnabled = riskScanningToggle.checked;
    // setStorage and STORAGE_KEYS are available via utils/utils.js
    await setStorage(STORAGE_KEYS.SCANNING_ENABLED, isEnabled);

    showStatusMessage('Settings Saved!');
    console.log('Scanning status saved:', isEnabled);
}

function initializeSettings() {
    loadSettings();
    riskScanningToggle.addEventListener('change', saveSettings);
}
