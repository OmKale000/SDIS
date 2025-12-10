// Regex patterns for sensitive data detection
const SENSITIVE_REGEX = [
    { type: 'Email Address', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ },
    { type: 'Phone Number', regex: /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/ },
    { type: 'Date of Birth', regex: /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/ },
    { type: 'Credit Card', regex: /((\d{4}[- ]?){3}\d{4})/ } 
];

// Map to track which input elements have an 'input' event listener attached
const trackedInputs = new WeakSet();

// --- A. Utility Functions (Alerts) ---

/**
 * Displays a transient, styled alert near the specified element.
 * @param {HTMLElement} element The element to place the alert next to.
 * @param {string} text The alert message.
 * @param {string} color The background color (e.g., '#dc2626' for red).
 */
function displayAlert(element, text, color) {
    // Standard inline alert (used for quick, local detection)
    const existingAlert = element.nextElementSibling;
    if (existingAlert && existingAlert.classList.contains('sdis-lite-alert')) {
        existingAlert.remove();
    }
    
    const alertElement = document.createElement('span');
    alertElement.className = 'sdis-lite-alert';
    alertElement.textContent = text;
    
    alertElement.style.cssText = `
        color: white;
        background-color: ${color}; 
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        margin-left: 10px;
        display: inline-block;
        opacity: 1;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 99999;
        transition: opacity 0.5s ease;
    `;

    element.parentNode.insertBefore(alertElement, element.nextSibling);

    setTimeout(() => {
        alertElement.style.opacity = '0';
        setTimeout(() => alertElement.remove(), 500); 
    }, 4000);
}


/**
 * Displays the detailed AI-driven risk analysis alert.
 * @param {HTMLElement} element The element to place the alert next to.
 * @param {number} score The AI risk score (0-100).
 * @param {string} analysis The AI analysis text.
 */
function displayAIAnalysis(element, score, analysis) {
    const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : '#f59e0b';
    const existingAlert = element.nextElementSibling;
    if (existingAlert && existingAlert.classList.contains('sdis-ai-alert')) {
        existingAlert.remove();
    }
    
    const alertElement = document.createElement('div');
    alertElement.className = 'sdis-ai-alert';
    alertElement.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 5px;">
            🧠 AI Risk Score: ${score}%
            <span style="font-size: 12px; margin-left: 10px; color: ${color};">
                ${score >= 75 ? '🔥 CRITICAL' : score >= 50 ? '⚠️ HIGH' : '🟡 MODERATE'}
            </span>
        </div>
        <div style="font-size: 13px; font-style: italic; line-height: 1.3;">
            "${analysis}"
        </div>
    `;
    
    alertElement.style.cssText = `
        color: white;
        background-color: ${color}; 
        padding: 10px 15px;
        border-radius: 8px;
        margin-top: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        z-index: 99999;
        max-width: 400px;
        transition: opacity 0.5s ease;
    `;

    element.parentNode.insertBefore(alertElement, element.nextSibling);

    setTimeout(() => {
        alertElement.style.opacity = '0';
        setTimeout(() => alertElement.remove(), 500); 
    }, 8000); // Keep AI analysis visible longer
}


// --- B. Real-Time Input Monitoring ---

function handleInput(event) {
    const inputElement = event.target;
    const value = inputElement.value.trim();
    let isRiskDetected = false;
    let detectedType = null;
    let context = null; // NEW: Context for logging
    
    if (value.length > 5) { 
        for (const { type, regex } of SENSITIVE_REGEX) {
            if (regex.test(value)) {
                isRiskDetected = true;
                detectedType = type;
                context = 'Input Field Typing'; // Set context for logging
                
                // Show standard inline alert
                displayAlert(inputElement, `⚠️ Possible ${type} detected!`, '#dc2626'); // Red-700
                
                // Trigger AI Analysis for complex inputs 
                if (value.length > 15) { 
                    chrome.runtime.sendMessage({
                        action: 'getRiskAnalysis',
                        text: value
                    }, (analysis) => {
                        if (analysis && analysis.score !== undefined) {
                            displayAIAnalysis(inputElement, analysis.score, analysis.analysis);
                        }
                    });
                }

                // Send notification on immediate detection
                chrome.runtime.sendMessage({
                    action: 'showImmediateRiskNotification',
                    riskType: `Input Field: ${type}`
                });
                
                break; 
            }
        }
    }

    // UPDATED: Send risk type and context for logging
    chrome.runtime.sendMessage({
        action: 'incrementRiskData',
        payload: { 
            isRiskDetected: isRiskDetected,
            riskType: detectedType, // Send the specific type detected
            context: context 
        }
    });
}

// --- C. Clipboard Sentinel ---

function handleCopy(event) {
    const selectedText = window.getSelection().toString();
    if (selectedText.length > 5) {
        let detectedType = null;
        for (const { type, regex } of SENSITIVE_REGEX) {
            if (regex.test(selectedText)) {
                detectedType = type;
                event.preventDefault();
                
                // Clear clipboard using a temporary textarea
                const tempInput = document.createElement('textarea');
                tempInput.value = 'Clipboard Cleared by SDIS Sentinel.';
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                // Display prominent site-wide warning notification
                const warningBanner = document.createElement('div');
                warningBanner.id = 'sdis-clipboard-warning';
                warningBanner.textContent = `🚨 SDIS Sentinel: Copied ${type} detected and clipboard cleared for your safety.`;
                
                warningBanner.style.cssText = `
                    position: fixed; top: 10px; right: 10px; padding: 15px 25px; 
                    background-color: #f59e0b; color: white; border-radius: 8px; 
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); font-size: 16px; 
                    font-weight: 700; z-index: 100000; opacity: 1;
                    transition: opacity 0.5s ease, transform 0.5s ease;
                    transform: translateY(0);
                `;

                document.body.appendChild(warningBanner);

                setTimeout(() => {
                    warningBanner.style.opacity = '0';
                    warningBanner.style.transform = 'translateY(-20px)';
                    setTimeout(() => warningBanner.remove(), 500);
                }, 5000);
                
                // Send notification on clipboard risk
                chrome.runtime.sendMessage({
                    action: 'showImmediateRiskNotification',
                    riskType: `Clipboard Copy: ${type}`
                });

                // UPDATED: Send risk type and context for logging
                chrome.runtime.sendMessage({
                    action: 'incrementRiskData',
                    payload: { 
                        isRiskDetected: true,
                        riskType: detectedType, 
                        context: 'Clipboard Copy' // Specific context for logging
                    }
                });

                break; 
            }
        }
    }
}

// --- D. Submission Monitoring (Non-Blocking Alert) ---

/**
 * Scans a form for sensitive data types.
 */
function checkForSensitiveData(form) {
    const detectedTypes = new Set();
    const elements = form.querySelectorAll('input:not([type="hidden"]), textarea');

    elements.forEach(element => {
        const value = element.value.trim();
        if (value.length > 5) {
            for (const { type, regex } of SENSITIVE_REGEX) {
                if (regex.test(value)) {
                    detectedTypes.add(type);
                }
            }
        }
    });

    return {
        detected: detectedTypes.size > 0,
        types: detectedTypes
    };
}

/**
 * Displays a non-blocking site-wide banner alert upon form submission.
 */
function displaySubmissionAlert(types) {
    const typeList = Array.from(types).join(', ');
    
    // Check if an alert already exists to prevent stacking
    let warningBanner = document.getElementById('sdis-submission-warning');
    if (!warningBanner) {
        warningBanner = document.createElement('div');
        warningBanner.id = 'sdis-submission-warning';
        document.body.appendChild(warningBanner);
    }
    
    warningBanner.textContent = `⚠️ Submission Alert! Detected ${typeList}. Proceeding with send, but review data.`;
    
    // Use fixed position, prominent alert styling
    warningBanner.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%); 
        padding: 15px 25px; 
        background-color: #f97316; /* Orange-500 */
        color: white; border-radius: 8px; 
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); font-size: 16px; 
        font-weight: 700; z-index: 100000; opacity: 1;
        transition: opacity 0.5s ease, transform 0.5s ease;
    `;

    // Make the alert fade away after 6 seconds
    setTimeout(() => {
        warningBanner.style.opacity = '0';
        setTimeout(() => warningBanner.remove(), 500); 
    }, 6000);
}


/**
 * Intercepts form submission events globally. (Non-blocking)
 */
function handleFormSubmit(event) {
    const form = event.target;
    const detectionResult = checkForSensitiveData(form);

    if (detectionResult.detected) {
        // Submission is allowed to proceed immediately.
        
        const detectedTypesArray = Array.from(detectionResult.types);

        // Track as a risk event 
        // UPDATED: Send risk type and context for logging
        chrome.runtime.sendMessage({
            action: 'incrementRiskData',
            payload: { 
                isRiskDetected: true,
                riskType: detectedTypesArray.join(', '), // List all types
                context: 'Form Submission' 
            }
        });

        // Display a non-blocking banner to notify the user immediately
        displaySubmissionAlert(detectionResult.types);
        
        // Send notification on submission risk
        chrome.runtime.sendMessage({
            action: 'showImmediateRiskNotification',
            riskType: `Form Submission: ${detectedTypesArray.join(', ')}`
        });
    }
    // Submission continues naturally, regardless of detection.
}

// --- E. Security Assessment ---

/**
 * Displays a non-blocking site-wide banner alert for general page warnings.
 */
function displaySiteWideWarning(text, color) {
    // Check if an alert already exists to prevent stacking
    let warningBanner = document.getElementById('sdis-site-warning');
    if (!warningBanner) {
        warningBanner = document.createElement('div');
        warningBanner.id = 'sdis-site-warning';
        document.body.appendChild(warningBanner);
    }
    
    warningBanner.textContent = `🚨 SECURITY ALERT: ${text}`;
    
    // Use fixed position, prominent alert styling at the very top of the viewport
    warningBanner.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; text-align: center;
        padding: 10px 0; 
        background-color: ${color}; 
        color: white; font-size: 14px; 
        font-weight: 700; z-index: 100000; opacity: 1;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: opacity 0.5s ease;
    `;

    // Make the alert fade away after 8 seconds
    setTimeout(() => {
        warningBanner.style.opacity = '0';
        setTimeout(() => warningBanner.remove(), 500); 
    }, 8000);
}


/**
 * Runs a basic security check on the current page.
 */
function runSecurityAssessment() {
    // Check for insecure HTTP connection
    if (window.location.protocol !== 'https:') {
        displaySiteWideWarning('INSECURE (HTTP) CONNECTION! Do not enter sensitive data.', '#ef4444'); // Red-500
    }
}


// Function to find all relevant input fields and attach listeners
function initializeMonitoring() {
    // Attach INPUT listeners
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
        if (input.type !== 'submit' && input.type !== 'button' && !trackedInputs.has(input)) {
            input.addEventListener('input', handleInput);
            trackedInputs.add(input);
        }
    });
    
    // Attach CLIPBOARD listener
    document.addEventListener('copy', handleCopy);

    // Attach SUBMIT listener
    document.addEventListener('submit', handleFormSubmit, true);
    
    // Run Security Check on load
    runSecurityAssessment();
}


// Main execution block: Check scanning status before attaching listeners
chrome.runtime.sendMessage({ action: 'getScanningStatus' }, (isEnabled) => {
    if (isEnabled) {
        initializeMonitoring();
        
        // Use MutationObserver to detect dynamically added elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Re-run initialization to catch new inputs/textareas and forms
                    initializeMonitoring(); 
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        console.log('SDIS Sentinel scanning is disabled by user settings.');
    }
});
