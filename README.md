# 🛡️ SDIS Sentinel – Real-Time Privacy Protection for Smarter Browsing 

A Chrome extension that delivers real-time, intelligent privacy protection by detecting risky user behavior, analyzing sensitive data exposure, and providing one-tap cleanup tools for a safer digital experience.

---

## 🚨 Why SDIS Sentinel?

Modern browsers defend against known threats but fail to protect users from **behavioral privacy risks**. People often type, paste, or submit sensitive information — such as emails, passwords, phone numbers, or credit card details — on websites that may be insecure or untrusted.

**SDIS Sentinel closes this gap** by transforming the browser into an active privacy guardian. It monitors actions in real time, detects risky patterns, and alerts users before data exposure occurs.

---

## 🧠 Core Features

| Category | Feature | Description |
|---------|---------|-------------|
| 🧩 Intelligent Detection | **Gemini AI Risk Scoring** | Uses Gemini API to analyze context and assign risk scores (0–100). |
| 🔐 Clipboard Leak Prevention | **PII Detection in Clipboard** | Identifies sensitive data in clipboard content and clears it automatically. |
| 🧾 Real-Time Feedback | **Input Monitoring** | Scans input fields and warns users instantly when personal data is detected. |
| 🧹 Proactive Cleanup | **One-Tap Cleanup** | Quickly clears cookies and autofill data for the active website. |
| ⚠️ Insecure Site Warning | **HTTP Alerts** | Displays a warning banner on insecure (HTTP) pages. |
| 📊 Behavioral Metrics | **Daily Dashboard** | Shows total risks, inputs scanned, and the current risk score. |
| 🕒 Recent Activity Log | **Risk History** | Displays the last 5 high-risk actions with timestamps and context. |

---

## 🏗️ Architecture Overview

SDIS Sentinel is designed with a modular architecture for maintainability and scalability:

| Module | File(s) | Description |
|--------|---------|-------------|
| **Content Sentinel** | `content/content.js` | Injected into all webpages; scans inputs, clipboard, and submissions using regex + context-aware logic. |
| **Background AI Processor** | `service_worker.js` | Coordinates extension state, performs Gemini AI risk scoring, and manages event logging. |
| **Dashboard & UX** | `popup/popup.html`, `popup/popup.js`, `popup/popup.css` | Offers a clean UI with risk scores, logs, and cleanup options. |
| **Storage Utilities** | `utils/utils.js` | Provides async utilities for saving logs, settings, and daily metrics. |

---

## ⚙️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Architecture | **Chrome Extension V3** | Modern runtime with service workers & content scripts. |
| AI Engine | **Gemini API (2.5-flash-preview-05-20)** | Performs contextual risk scoring. |
| Language | **JavaScript (ES6+)** | Core logic across all modules. |
| UI & Styling | **HTML5, CSS3** | Minimal and responsive interface. |
| Storage | **chrome.storage.local** | Secure and persistent data storage. |

---

## 💡 How It Works

1. **Content Sentinel** monitors user inputs and clipboard events in real time.  
2. When sensitive data is detected, **instant alerts** appear near the input field.  
3. The **Background Processor** logs the event and sends it for AI-based risk scoring.  
4. The **Dashboard** visualizes risk scores, recent actions, and daily metrics.  
5. Users can trigger **one-tap cleanup** to remove cookies or autofill data instantly.  

---

## 🚀 Installation & Setup

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-username/SDIS-Sentinel.git
cd SDIS-Sentinel
```
### **2️⃣ Load the Extension in Chrome**

1. Open chrome://extensions/

2. Enable Developer Mode

3. Click Load Unpacked

4. Select the SDIS-Sentinel project folder

### **3️⃣ Add Your Gemini API Key**

Inside service_worker.js, replace:

### **3️⃣ Add Your Gemini API Key**

Inside service_worker.js, replace:
```
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
```

---

## 🧭 Vision

SDIS Sentinel aims to make browsing safer by educating users about their digital habits.
By offering clear, actionable feedback, it empowers individuals to build stronger privacy practices and reduces accidental exposure of sensitive information.

---

## 🧰 Future Enhancements

🔄 Domain-Based Risk Profiles

🧩 Extension Sync Across Devices

🧠 Deeper AI Explanations for Risk Events

📈 Weekly Privacy Insights Dashboard

---

## 📂 Repository Structure
```
SDIS-Sentinel/
│
├── content/
│   └── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── utils/
│   └── utils.js
├── service_worker.js
├── manifest.json
├── README.md
└── icons/
    └── (extension icons)

```
---
## 👤 Author & Contact

Om Kale

📧 Email: ok176471@gmail.com

🔗 LinkedIn: linkedin.com/in/om-kale-1663a0276

🐙 GitHub: github.com/OmKale
