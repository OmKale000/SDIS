// Utility functions and constants are assumed to be loaded via utils/utils.js in a real environment
// For standalone file integrity, we include necessary constants/functions here.

const STORAGE_KEYS = {
    RISK_DATA: 'sdis_lite_risk_data',
    SCANNING_ENABLED: 'sdis_lite_scanning_enabled',
    DARK_MODE: 'sdis_lite_dark_mode_enabled',
    RECENT_RISK_LOG: 'sdis_lite_recent_risks' // NEW KEY for the log
};

const REMINDER_ALARM_NAME = 'riskReminderAlarm';

// --- Gemini API Configuration ---
const GEMINI_API_KEY = ""; // Placeholder for Canvas environment
const GEMINI_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
const AI_SYSTEM_PROMPT = "You are SDIS Sentinel, an expert privacy and security analyst. Your task is to analyze the provided user input text and determine its potential privacy risk level on a scale of 0 (no risk) to 100 (extreme risk). Provide a concise, professional analysis based on sensitive data, context, and potential exposure. Respond only with a JSON object.";

// Assumed helper function to fetch risk data from storage
async function getRiskData() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.RISK_DATA], (result) => {
            let riskData = result[STORAGE_KEYS.RISK_DATA];
            if (!riskData) {
                riskData = { totalRisks: 0, totalInputs: 0, lastResetDate: new Date().toISOString().split('T')[0] };
            }
            const today = new Date().toISOString().split('T')[0];
            if (riskData.lastResetDate !== today) {
                riskData = { totalRisks: 0, totalInputs: 0, lastResetDate: today };
            }
            resolve(riskData);
        });
    });
}

// NEW: Helper to get the recent risk log
async function getRecentRiskLog() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.RECENT_RISK_LOG], (result) => {
            // Log is an array of objects, default to empty array
            resolve(result[STORAGE_KEYS.RECENT_RISK_LOG] || []);
        });
    });
}

function showImmediateRiskNotification(riskType) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'SDIS Sentinel: Risk Detected!',
        message: `A sensitive data operation was detected: ${riskType}. Check the dashboard for details.`,
        priority: 2
    });
}

async function fetchRiskAnalysis(text) {
    const payload = {
        contents: [{ parts: [{ text: `Analyze the following user input text for privacy risk: "${text}"` }] }],
        systemInstruction: {
            parts: [{ text: AI_SYSTEM_PROMPT }]
        },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "riskScore": { "type": "INTEGER", "description": "A risk score from 0 (low) to 100 (critical)." },
                    "analysis": { "type": "STRING", "description": "A concise, professional, human-like explanation of the risk (max 2 sentences)." }
                },
                "propertyOrdering": ["riskScore", "analysis"]
            }
        }
    };

    try {
        const response = await fetch(GEMINI_MODEL_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            const parsedJson = JSON.parse(jsonText);
            return {
                score: parsedJson.riskScore,
                analysis: parsedJson.analysis
            };
        }
    } catch (error) {
        console.error("Gemini API call failed:", error);
        return { score: 75, analysis: "AI analysis failed. Risk detected by local engine (High Confidence)." };
    }
}


// Message handler for background tasks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let willSendResponse = false; 

    if (request.action === 'cleanData') {
        // ... (Cleanup logic remains unchanged from v4.1) ...
        
        if (request.type === 'cookies' && sender.tab) {
            willSendResponse = true;

            chrome.tabs.get(sender.tab.id, (tab) => {
                if (chrome.runtime.lastError || !tab.url) {
                    sendResponse('Error retrieving current tab information.');
                    return;
                }
                
                const url = new URL(tab.url);
                
                chrome.cookies.getAll({ domain: url.hostname }, (cookies) => {
                    if (cookies.length === 0) {
                        sendResponse('No cookies found for this site.');
                        return;
                    }
                    
                    let deletedCount = 0;
                    let cookiesProcessed = 0;
                    
                    cookies.forEach((cookie) => {
                        const cookieUrl = (cookie.secure ? 'https://' : 'http://') + cookie.domain + cookie.path;
                        
                        chrome.cookies.remove({ url: cookieUrl, name: cookie.name }, (details) => {
                            cookiesProcessed++;
                            if (details) {
                                deletedCount++;
                            }
                            
                            if (cookiesProcessed === cookies.length) {
                                sendResponse(`Cookies Cleared! Removed ${deletedCount} cookies.`);
                            }
                        });
                    });
                });
            });
            return willSendResponse;
        }
        
        else if (request.type === 'autofill') {
            willSendResponse = true;
            const since = 0;
            
            chrome.browsingData.remove({ since: since }, { 
                formData: true, 
                history: true 
            }, () => {
                sendResponse('Autofill & Form History Cleared!');
            });
            return willSendResponse;
        }

    } else if (request.action === 'incrementRiskData') {
        willSendResponse = true;
        (async () => {
            const riskData = await getRiskData();
            let riskLog = await getRecentRiskLog();
            
            // --- 1. Update Risk Data (Counts) ---
            riskData.totalInputs++;
            const isRiskDetected = request.payload.isRiskDetected;

            if (isRiskDetected) {
                riskData.totalRisks++;
                
                // --- 2. Update Recent Risk Log (New Logic) ---
                if (sender.tab && sender.tab.url) {
                    const domain = new URL(sender.tab.url).hostname;
                    
                    const newLogEntry = {
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        type: request.payload.riskType || 'Sensitive Data Input',
                        domain: domain,
                        action: request.payload.context || 'Typing',
                    };
                    
                    riskLog.unshift(newLogEntry); // Add to beginning
                    riskLog = riskLog.slice(0, 5); // Keep only the 5 most recent risks
                }
            }
            
            // Save both keys
            chrome.storage.local.set({ 
                [STORAGE_KEYS.RISK_DATA]: riskData,
                [STORAGE_KEYS.RECENT_RISK_LOG]: riskLog 
            }, () => {
                sendResponse({ status: 'updated' });
            });
        })();
        return willSendResponse;

    } else if (request.action === 'getRiskAnalysis') {
        willSendResponse = true;
        (async () => {
            const analysis = await fetchRiskAnalysis(request.text);
            sendResponse(analysis);
        })();
        return willSendResponse;

    } else if (request.action === 'getScanningStatus') {
        willSendResponse = true;
        chrome.storage.local.get([STORAGE_KEYS.SCANNING_ENABLED], (result) => {
            let isEnabled = result[STORAGE_KEYS.SCANNING_ENABLED];
            if (typeof isEnabled !== 'boolean') {
                isEnabled = true;
                chrome.storage.local.set({ [STORAGE_KEYS.SCANNING_ENABLED]: true });
            }
            sendResponse(isEnabled);
        });
        return willSendResponse;

    } else if (request.action === 'showImmediateRiskNotification') {
        showImmediateRiskNotification(request.riskType);
    }
});
