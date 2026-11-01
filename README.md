# 🎵 Spotify Streaming History Analyzer

A sleek, privacy-first web application to analyze and visualize your personal Spotify listening history directly from your official Spotify data export ZIP file.

Built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript** — runs 100% locally in your browser with **zero installations**, **no backend**, and **zero data uploads**.

---

## 🚀 Features

- **Client-Side ZIP Parsing**: Direct upload and client-side decompression of your `.zip` archive via [JSZip](https://stuk.github.io/jszip/). Supports both standard account data and extended streaming history files. Your data never leaves your computer.
- **Date Range Overview**: Automatically detects and displays the earliest and latest streaming dates for the active analysis window.
- **Year Filter Selector**: Select any available year detected in your streaming history, or choose "All Time" to analyze your complete history.
- **Instant Metrics Cards**:
  - 🎶 **Unique Tracks**: Total number of distinct tracks listened to.
  - 🎤 **Unique Artists**: Total number of distinct artists discovered.
  - ⏱️ **Total Hours Listened**: Formatted total listening duration.
  - ▶️ **Total Plays**: Valid stream count.
- **Monthly Listening Time Bar Chart**:
  - When filtering by a specific year, displays an interactive vertical bar chart of total minutes listened per month (Jan to Dec).
  - Displays formatted minutes above each bar, yearly total badge, and detailed tooltips on hover.
- **Listening Habits Heatmap (7 × 24 Grid)**:
  - Visual activity heatmap displaying listening time distribution across all 7 days of the week and 24 hours of the day.
  - Automatically converts Spotify's UTC timestamps into your local browser timezone.
  - Identifies peak listening times and features hover/touch inspection for any hour of the week.
- **Rankings & Leaders Grid**:
  - 🎤 **Top 50 Artists** & 🎶 **Top 50 Tracks**: Side-by-side rankings with rank badges (gold/silver/bronze for Top 3), total plays, and listening duration.
  - 👑 **Top Artist & 🎵 Top Track by Month**: Year-specific tables showcasing your #1 artist and #1 song for each month.
  - 💿 **Top 10 Albums (Conditional)**: Automatically appears when album metadata is present in your data export (Extended Streaming History), showing your top albums in minutes and plays.
- **Dynamic Global Sorting**: Switch seamlessly between sorting by **Plays** or **Duration** across all rankings with a single toggle.
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
3. Request your **Account Data** or **Extended Streaming History** (Extended history includes album metadata and full lifetime listening history).
4. Once Spotify sends you the confirmation email, download the `.zip` archive.
5. Drag and drop the downloaded `.zip` file directly into the application!

---

## 🛠️ Tech Stack

- **HTML5**: Semantic document structure.
- **Vanilla CSS**: Custom dark mode design inspired by Spotify's design system, with responsive grids and CSS variables.
- **Vanilla JavaScript (ES6+)**: Asynchronous file processing, in-memory aggregation, and dynamic DOM rendering.
- **JSZip (CDN)**: In-browser `.zip` archive reading.
