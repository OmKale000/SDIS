document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dashboardView = document.getElementById('dashboard-view');
    const settingsView = document.getElementById('settings-view');
    const headerTitleEl = document.getElementById('header-title-text');
    const footerSettingsBtn = document.getElementById('settings-footer-btn');

    const risksDetectedEl = document.getElementById('risks-detected');
    const riskScoreEl = document.getElementById('risk-score');
    const riskStatusTextEl = document.getElementById('risk-status-text');
    const cleanCookiesBtn = document.getElementById('clean-cookies-btn');
    const cleanAutofillBtn = document.getElementById('clean-autofill-btn');
    const logContainer = document.getElementById('risk-log-container'); // NEW
    
    // Settings Toggles
    const scanningToggle = document.getElementById('scanning-toggle');
    const darkModeSettingsToggle = document.getElementById('dark-mode-settings-toggle');
    const darkModeIcon = document.getElementById('dark-mode-icon');
    
    // --- Utility Functions ---

    /**
     * Displays a temporary message box in the popup.
     */
    function showMessage(message, type = 'success') {
        const messageBox = document.getElementById('message-box');
        messageBox.textContent = message;
        messageBox.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
        
        // Show the box
        messageBox.style.opacity = '1';
        
        // Hide the box after 3 seconds
        setTimeout(() => {
            messageBox.style.opacity = '0';
        }, 3000);
    }

    /**
     * Toggles between Dashboard and Settings views.
     */
    function switchView(view) {
        if (view === 'settings') {
            dashboardView.classList.add('hidden');
            settingsView.classList.remove('hidden');
            headerTitleEl.innerHTML = '<span style="font-size: 1.2rem; margin-right: 5px;">&larr;</span> Settings';
            headerTitleEl.style.cursor = 'pointer';
            loadSettings();
        } else {
            settingsView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            headerTitleEl.textContent = 'SDIS Sentinel';
            headerTitleEl.style.cursor = 'default';
        }
    }
    
    // --- 1. Dashboard Logic (Metrics & Log) ---

    function updateDashboardMetrics(riskData) {
        const totalRisks = riskData.totalRisks;
        const totalInputs = riskData.totalInputs;
        let riskScore = 0;

        if (totalInputs > 0) {
            riskScore = Math.min(100, Math.round((totalRisks / totalInputs) * 100));
        }

        risksDetectedEl.textContent = totalRisks;
        riskScoreEl.textContent = `${riskScore}%`;

        // Update Risk Status Text and Color
        if (riskScore >= 20) {
            riskStatusTextEl.textContent = '🔴 High Risk';
            riskStatusTextEl.style.color = '#ef4444';
        } else if (riskScore > 0) {
            riskStatusTextEl.textContent = '🟡 Moderate Risk';
            riskStatusTextEl.style.color = '#f59e0b';
        } else {
            riskStatusTextEl.textContent = '🟢 All Clear';
            riskStatusTextEl.style.color = '#10b981';
        }
    }

    // NEW: Renders the risk log history
    function renderRiskLog(log) {
        const noRiskMessage = document.getElementById('no-risk-message');
        logContainer.innerHTML = ''; 
        logContainer.appendChild(noRiskMessage); // Always keep this reference

        if (log.length === 0) {
            noRiskMessage.style.display = 'block';
            return;
        }
        noRiskMessage.style.display = 'none';

        log.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'log-entry';
            item.style.cssText = `
                display: flex; justify-content: space-between; align-items: center; 
                padding: 10px 0; border-bottom: 1px solid #e5e7eb;
                ${index === 0 ? 'border-top: none;' : ''}
            `;
            // Adjust border for dark mode if needed
            if (document.body.classList.contains('dark')) {
                 item.style.borderBottom = '1px solid #34495e';
            }


            item.innerHTML = `
                <div style="flex-grow: 1;">
                    <span style="font-weight: 700; color: #ef4444; font-size: 0.9rem;">🚨 ${entry.type}</span>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 2px;" class="log-text">
                        ${entry.action} on <span style="font-weight: 600;">${entry.domain}</span>
                    </div>
                </div>
                <div style="font-size: 0.75rem; color: #9ca3af; flex-shrink: 0;">${entry.time}</div>
            `;
            // Prepend new items before the no-risk message if it exists
            logContainer.insertBefore(item, noRiskMessage);
        });
    }

    // Function to load and display risk data and the new log
    function loadRiskData() {
        // ADDED 'sdis_lite_recent_risks' to fetch list
        chrome.storage.local.get(['sdis_lite_risk_data', 'sdis_lite_recent_risks'], (result) => {
            let riskData = result.sdis_lite_risk_data;
            if (!riskData) {
                riskData = { totalRisks: 0, totalInputs: 0 };
            }
            updateDashboardMetrics(riskData);

            const riskLog = result.sdis_lite_recent_risks || [];
            renderRiskLog(riskLog);
        });
    }

    // --- 2. Dashboard Logic (Cleanup Buttons) ---
    
    function handleCleanup(type) {
        const btn = type === 'cookies' ? cleanCookiesBtn : cleanAutofillBtn;
        btn.disabled = true;
        btn.style.opacity = 0.7;

        chrome.runtime.sendMessage({ action: 'cleanData', type: type }, (response) => {
            btn.disabled = false;
            btn.style.opacity = 1;

            if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message;
                if (errorMsg.includes('closed before a response')) {
                    showMessage('Cleanup operation started (Timeout Warning). Check back in a moment.', 'error');
                } else {
                    showMessage(`Error: ${errorMsg}`, 'error');
                }
                void chrome.runtime.lastError;
                return;
            }
            
            if (response.includes('Error') || response.includes('failed')) {
                 showMessage(response, 'error');
            } else {
                showMessage(response);
            }
        });
    }

    cleanCookiesBtn.addEventListener('click', () => handleCleanup('cookies'));
    cleanAutofillBtn.addEventListener('click', () => handleCleanup('autofill'));
    
    // --- 3. Settings Logic ---

    function loadDarkModeSetting() {
        chrome.storage.local.get(['sdis_lite_dark_mode_enabled'], (result) => {
            const isDark = result.sdis_lite_dark_mode_enabled === true;
            if (isDark) {
                document.body.classList.add('dark');
                darkModeIcon.textContent = '☀️';
            } else {
                document.body.classList.remove('dark');
                darkModeIcon.textContent = '🌙';
            }
            darkModeSettingsToggle.checked = isDark;
        });
    }

    function loadSettings() {
        chrome.storage.local.get(['sdis_lite_scanning_enabled', 'sdis_lite_dark_mode_enabled'], (result) => {
            let isScanningEnabled = result.sdis_lite_scanning_enabled;
            if (typeof isScanningEnabled !== 'boolean') {
                isScanningEnabled = true;
            }
            scanningToggle.checked = isScanningEnabled;

            const isDark = result.sdis_lite_dark_mode_enabled === true;
            darkModeSettingsToggle.checked = isDark;
        });
    }

    scanningToggle.addEventListener('change', (event) => {
        const isEnabled = event.target.checked;
        chrome.storage.local.set({ 'sdis_lite_scanning_enabled': isEnabled }, () => {
            showMessage(isEnabled ? 'Scanning Enabled' : 'Scanning Disabled');
        });
    });

    function handleDarkModeToggle(event) {
        const isDark = event.target.checked;
        chrome.storage.local.set({ 'sdis_lite_dark_mode_enabled': isDark }, () => {
            loadDarkModeSetting();
            const otherToggle = event.target.id === 'dark-mode-settings-toggle' ? darkModeIcon.parentNode : darkModeSettingsToggle;
            if (otherToggle.tagName !== 'BUTTON') { 
                otherToggle.checked = isDark;
            }
        });
    }
    
    darkModeSettingsToggle.addEventListener('change', handleDarkModeToggle);
    darkModeIcon.parentNode.addEventListener('click', (e) => {
        e.preventDefault();
        const newState = !darkModeSettingsToggle.checked;
        darkModeSettingsToggle.checked = newState;
        handleDarkModeToggle({ target: { checked: newState, id: 'dark-mode-icon-button' } });
    });


    // --- 4. Initialization ---

    // View Switching Listeners
    headerTitleEl.addEventListener('click', () => {
        if (!settingsView.classList.contains('hidden')) {
            switchView('dashboard');
        }
    });
    footerSettingsBtn.addEventListener('click', () => switchView('settings'));
    
    // Initial load
    loadRiskData();
    loadDarkModeSetting();
    
    // Listen for storage changes (for real-time update of log)
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.sdis_lite_risk_data) {
            updateDashboardMetrics(changes.sdis_lite_risk_data.newValue || { totalRisks: 0, totalInputs: 0 });
        }
        if (changes.sdis_lite_recent_risks) { // NEW listener
            renderRiskLog(changes.sdis_lite_recent_risks.newValue || []);
        }
    });

    // Ensure the initial view is the dashboard
    switchView('dashboard');
});
