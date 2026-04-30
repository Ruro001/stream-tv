## 🛡️ About Ruro Gadget
Ruro TV is a flagship software project under the **Ruro Gadget** brand. We focus on bridging the gap between hardware engineering (Mechatronics)Since you are building **Ruro TV** as the digital centerpiece of your **Ruro Gadget** brand—and given your background as a Mechatronics student—your README should look like a professional engineering project.

Here is a customized README designed for your `stream-tv` repository. It combines your technical expertise in Python/Automation with your new "Iframe-free" streaming architecture.

---

# 📺 Ruro TV
**A Production-Grade, AI-Enhanced Streaming Platform**  
*Part of the Ruro Gadget Ecosystem*

---


## 🚀 Overview
**Ruro TV** is a high-performance streaming web application designed to eliminate the limitations of third-party `iframe` embeds. By implementing a custom video engine powered by **Shaka Player** and **HLS.js**, Ruro TV provides a "Netflix-style" experience with full control over playback, buffering, and user interface.

This project showcases the intersection of **Mechatronics Engineering logic** and **Modern Web Development**, featuring an AI-driven discovery layer powered by the Gemini API.

## ✨ Key Features
*   **Engine-Based Playback:** Custom implementation of Shaka Player for HLS (`.m3u8`) and Native HTML5 for `.mp4`—no more iframe overlays.
*   **Netflix-Style UI:** Custom Tailwind CSS controls with auto-hiding logic, seeker bars, and playback speed adjustment.
*   **Intelligent Resume:** Automated watch history that saves your `currentTime` to local storage every 5 seconds.
*   **Adaptive Streaming:** Optimized for variable network conditions (tested on Airtel 4G+/5G infrastructure).
*   **AI Integration:** Leverages the **Gemini API** for metadata enrichment and smart content suggestions.

## 🛠️ Technical Stack
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Streaming:** Shaka Player / HLS.js
*   **AI Engine:** Google Gemini SDK
*   **Styling:** Tailwind CSS + Framer Motion (for smooth UI transitions)
*   **Backend Logic:** Python-based automation for metadata scraping (optional integration)

## 🔧 Installation & Setup

**Prerequisites:** Node.js v18.0+ and an active Gemini API Key.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/Ruro001/stream-tv.git](https://github.com/Ruro001/stream-tv.git)
    cd stream-tv
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```


3.  **Run Development Mode:**
    ```bash
    npm run dev
    ```

## 📐 Project Architecture
```mermaid
graph LR
    A[Ruro tv] --> B{Stream Resolver}
    B -->|HLS| C[Shaka Engine]
    B -->|MP4| D[HTML5 Native]
    C & D --> E[Custom UI Overlay]
    E --> F[Local Persistence]
