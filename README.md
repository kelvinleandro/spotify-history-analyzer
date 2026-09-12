# 🎵 Spotify Streaming History Analyzer

A sleek, privacy-first web application to analyze and visualize your personal Spotify listening history directly from your official Spotify data export ZIP file.

Built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript** — runs 100% locally in your browser with **zero installations**, **no backend**, and **zero data uploads**.

---

## 🚀 Features

- **Client-Side ZIP Parsing**: Direct upload and client-side decompression of your `.zip` archive via [JSZip](https://stuk.github.io/jszip/). Your data never leaves your computer.
- **Date Range Overview**: Automatically detects and displays the earliest and latest streaming dates for the active analysis window.
- **Year Filter Selector**: Select any available year detected in your streaming history, or choose "All Time" to analyze your complete history.
- **Instant Metrics Cards**:
  - 🎶 **Unique Tracks**: Total number of distinct tracks listened to.
  - 🎤 **Unique Artists**: Total number of distinct artists discovered.
  - ⏱️ **Total Hours Listened**: Formatted total listening duration.
  - ▶️ **Total Plays**: Valid stream count.
- **Top 50 Rankings (Split Screen)**:
  - Side-by-side view of **Top 50 Artists** and **Top 50 Tracks**.
  - Displays Rank badge (with gold/silver/bronze highlights for Top 3), Name, Plays, and Duration.
- **Dynamic Sorting**: Switch seamlessly between sorting by **Plays** or **Duration** without re-reading the file.
- **30-Second Rule Compliance**: In accordance with Spotify's official playback metrics, only streams with playback duration of at least 30 seconds ($\ge 30,000$ ms) are counted as a valid play.

---

## 🏃 How to Run

No installations, build steps, or package managers required!

Simply **double-click** on **[`index.html`](./index.html)** or open it in any modern browser (Chrome, Edge, Firefox, Safari, Brave).

> **Tip:** You can also use any local static server (e.g. VS Code Live Server) if you prefer.

---

## 📦 How to Get Your Spotify Data

1. Go to your [Spotify Account Privacy Settings](https://www.spotify.com/account/privacy/).
2. Scroll down to the **Download your data** section.
3. Request your **Account Data** (Streaming History).
4. Once Spotify sends you the confirmation email, download the `.zip` archive.
5. Drag and drop the downloaded `.zip` file directly into the application!

---

## 🛠️ Tech Stack

- **HTML5**: Semantic document structure.
- **Vanilla CSS**: Custom dark mode design inspired by Spotify's design system, with responsive grids and CSS variables.
- **Vanilla JavaScript (ES6+)**: Asynchronous file processing, in-memory aggregation, and dynamic DOM rendering.
- **JSZip (CDN)**: In-browser `.zip` archive reading.
