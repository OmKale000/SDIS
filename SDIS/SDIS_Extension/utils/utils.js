// Utility functions for Chrome storage
const STORAGE_KEYS = {
    RISK_DATA: 'sdis_lite_risk_data',
    SCANNING_ENABLED: 'sdis_lite_scanning_enabled',
    DARK_MODE: 'sdis_lite_dark_mode_enabled' // New key for dark mode
};

const DEFAULT_RISK_DATA = {
    totalRisks: 0,
    totalInputs: 0,
    lastResetDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
};

/**
 * Retrieves data from Chrome storage.
 * @param {string} key The storage key.
 * @returns {Promise<any>} The stored value.
 */
function getStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
}

/**
 * Stores data into Chrome storage.
 * @param {string} key The storage key.
 * @param {any} value The value to store.
 * @returns {Promise<void>}
 */
function setStorage(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
    });
}

/**
 * Resets risk data if the day has changed.
 * @param {object} riskData The current risk data.
 * @returns {object} The potentially updated risk data.
 */
function checkAndResetRiskData(riskData) {
    const today = new Date().toISOString().split('T')[0];
    if (riskData.lastResetDate !== today) {
        console.log('New day detected. Resetting risk data.');
        return {
            totalRisks: 0,
            totalInputs: 0,
            lastResetDate: today
        };
    }
    return riskData;
}


/**
 * Retrieves and initializes risk data.
 * @returns {Promise<object>} The risk data.
 */
async function getRiskData() {
    let riskData = await getStorage(STORAGE_KEYS.RISK_DATA);
    if (!riskData) {
        riskData = DEFAULT_RISK_DATA;
    }
    return checkAndResetRiskData(riskData);
}

/**
 * Increments risk and input counts and saves the data.
 * @param {boolean} isRiskDetected True if sensitive data was found.
 * @returns {Promise<void>}
 */
async function incrementRiskData(isRiskDetected) {
    let riskData = await getRiskData();

    riskData.totalInputs++;
    if (isRiskDetected) {
        riskData.totalRisks++;
    }

    await setStorage(STORAGE_KEYS.RISK_DATA, riskData);
}

/**
 * Gets the current scanning status. Defaults to true (enabled).
 * @returns {Promise<boolean>}
 */
async function getScanningStatus() {
    let isEnabled = await getStorage(STORAGE_KEYS.SCANNING_ENABLED);
    // If not set, default to true (enabled)
    if (typeof isEnabled !== 'boolean') {
        isEnabled = true;
        await setStorage(STORAGE_KEYS.SCANNING_ENABLED, true);
    }
    return isEnabled;
}

/**
 * Gets the current dark mode status. Defaults to false (disabled).
 * @returns {Promise<boolean>}
 */
async function getDarkModeStatus() {
    let isDarkMode = await getStorage(STORAGE_KEYS.DARK_MODE);
    if (typeof isDarkMode !== 'boolean') {
        isDarkMode = false;
    }
    return isDarkMode;
}
