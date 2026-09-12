// Spotify Streaming History Analyzer - JavaScript Logic

let rawRecords = [];
let currentYear = new Date().getFullYear();
let activeSort = 'plays'; // 'plays' or 'duration'

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const loadingStatus = document.getElementById('loadingStatus');
const loadingMessage = document.getElementById('loadingMessage');
const dashboard = document.getElementById('dashboard');

const currentYearToggle = document.getElementById('currentYearToggle');
const currentYearLabel = document.getElementById('currentYearLabel');
const dateRangeText = document.getElementById('dateRangeText');

const sortByPlaysBtn = document.getElementById('sortByPlaysBtn');
const sortByDurationBtn = document.getElementById('sortByDurationBtn');
const artistsSortTag = document.getElementById('artistsSortTag');
const tracksSortTag = document.getElementById('tracksSortTag');

const valTracks = document.getElementById('valTracks');
const valArtists = document.getElementById('valArtists');
const valHours = document.getElementById('valHours');
const valPlays = document.getElementById('valPlays');

const artistsTableBody = document.getElementById('artistsTableBody');
const tracksTableBody = document.getElementById('tracksTableBody');

// Set current year label dynamically
currentYearLabel.textContent = `Only Current Year (${currentYear})`;

// Duration Formatter
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  const remSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(remMinutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(remSeconds).padStart(2, '0')}s`;
  }
  return `${remSeconds}s`;
}

// Drag & Drop Handlers
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

// Process Uploaded File
async function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    alert('Please upload a valid .zip file containing your Spotify data.');
    return;
  }

  showLoading(true, 'Reading ZIP file in browser...');

  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    rawRecords = [];
    const jsonFilePromises = [];

    // Find all files matching StreamingHistory_music*.json
    zip.forEach((relativePath, zipEntry) => {
      const filename = relativePath.split('/').pop();
      if (
        filename.startsWith('StreamingHistory_music') &&
        filename.endsWith('.json') &&
        !zipEntry.dir
      ) {
        jsonFilePromises.push(
          zipEntry.async('string').then((jsonText) => {
            try {
              const list = JSON.parse(jsonText);
              if (Array.isArray(list)) {
                rawRecords.push(...list);
              }
            } catch (err) {
              console.warn(`Failed to parse ${relativePath}:`, err);
            }
          })
        );
      }
    });

    if (jsonFilePromises.length === 0) {
      showLoading(false);
      alert("No 'StreamingHistory_music*.json' files found inside the uploaded ZIP!");
      return;
    }

    showLoading(true, `Extracting ${jsonFilePromises.length} streaming history files...`);
    await Promise.all(jsonFilePromises);

    showLoading(false);
    dashboard.classList.remove('hidden');
    render();
  } catch (err) {
    console.error(err);
    showLoading(false);
    alert(`Error processing ZIP file: ${err.message}`);
  }
}

function showLoading(show, message = '') {
  if (show) {
    loadingMessage.textContent = message;
    loadingStatus.classList.remove('hidden');
  } else {
    loadingStatus.classList.add('hidden');
  }
}

// Compute & Render Dashboard
function render() {
  const onlyCurrentYear = currentYearToggle.checked;
  const currentYearStr = String(currentYear);

  // Filter records
  // Must have artist, track, msPlayed >= 30,000 (30 seconds)
  const filtered = rawRecords.filter((item) => {
    if (!item.artistName || !item.trackName) return false;
    if (item.msPlayed < 30000) return false;
    if (onlyCurrentYear && item.endTime && !item.endTime.startsWith(currentYearStr)) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    dateRangeText.textContent = 'No records found for the selected filter';
    valTracks.textContent = '0';
    valArtists.textContent = '0';
    valHours.textContent = '0 hrs';
    valPlays.textContent = '0';
    artistsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No streams found.</td></tr>';
    tracksTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No streams found.</td></tr>';
    return;
  }

  // Find date range
  let oldestDate = null;
  let newestDate = null;

  const artistMap = new Map(); // artist -> { plays, duration }
  const trackMap = new Map();  // "track — artist" -> { name, plays, duration }

  let totalPlays = 0;
  let totalDurationMs = 0;

  for (const item of filtered) {
    const end = item.endTime;
    if (end) {
      if (!oldestDate || end < oldestDate) oldestDate = end;
      if (!newestDate || end > newestDate) newestDate = end;
    }

    const artist = item.artistName;
    const track = item.trackName;
    const ms = item.msPlayed || 0;

    totalPlays += 1;
    totalDurationMs += ms;

    // Aggregate Artist
    if (!artistMap.has(artist)) {
      artistMap.set(artist, { name: artist, plays: 0, duration: 0 });
    }
    const aData = artistMap.get(artist);
    aData.plays += 1;
    aData.duration += ms;

    // Aggregate Track
    const trackKey = `${track} — ${artist}`;
    if (!trackMap.has(trackKey)) {
      trackMap.set(trackKey, { name: trackKey, plays: 0, duration: 0 });
    }
    const tData = trackMap.get(trackKey);
    tData.plays += 1;
    tData.duration += ms;
  }

  // Update Active Date Range Banner
  if (oldestDate && newestDate) {
    const periodType = onlyCurrentYear ? `Current Year (${currentYear})` : 'All Time';
    dateRangeText.innerHTML = `${oldestDate} &nbsp;→&nbsp; ${newestDate} (${periodType})`;
  } else {
    dateRangeText.textContent = '—';
  }

  // Update Metric Cards
  const totalHours = (totalDurationMs / (1000 * 3600)).toFixed(1);
  valTracks.textContent = trackMap.size.toLocaleString();
  valArtists.textContent = artistMap.size.toLocaleString();
  valHours.textContent = `${Number(totalHours).toLocaleString()} hrs`;
  valPlays.textContent = totalPlays.toLocaleString();

  // Sort function helper
  const sortComparator = (a, b) => {
    if (activeSort === 'plays') {
      if (b.plays !== a.plays) return b.plays - a.plays;
      return b.duration - a.duration;
    } else {
      if (b.duration !== a.duration) return b.duration - a.duration;
      return b.plays - a.plays;
    }
  };

  // Sort and Slice Top 50
  const topArtists = Array.from(artistMap.values()).sort(sortComparator).slice(0, 50);
  const topTracks = Array.from(trackMap.values()).sort(sortComparator).slice(0, 50);

  // Update Sort Tags
  const sortLabel = activeSort === 'plays' ? 'Sorted by Plays' : 'Sorted by Duration';
  artistsSortTag.textContent = sortLabel;
  tracksSortTag.textContent = sortLabel;

  // Render Artists Table
  artistsTableBody.innerHTML = topArtists
    .map((item, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-top-${rank}` : '';
      return `
        <tr>
          <td class="col-rank"><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td class="col-name">${escapeHtml(item.name)}</td>
          <td class="col-plays">${item.plays.toLocaleString()}</td>
          <td class="col-duration">${formatDuration(item.duration)}</td>
        </tr>
      `;
    })
    .join('');

  // Render Tracks Table
  tracksTableBody.innerHTML = topTracks
    .map((item, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-top-${rank}` : '';
      return `
        <tr>
          <td class="col-rank"><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td class="col-name">${escapeHtml(item.name)}</td>
          <td class="col-plays">${item.plays.toLocaleString()}</td>
          <td class="col-duration">${formatDuration(item.duration)}</td>
        </tr>
      `;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event Listeners for Controls
currentYearToggle.addEventListener('change', () => {
  render();
});

sortByPlaysBtn.addEventListener('click', () => {
  if (activeSort !== 'plays') {
    activeSort = 'plays';
    sortByPlaysBtn.classList.add('active');
    sortByDurationBtn.classList.remove('active');
    render();
  }
});

sortByDurationBtn.addEventListener('click', () => {
  if (activeSort !== 'duration') {
    activeSort = 'duration';
    sortByDurationBtn.classList.add('active');
    sortByPlaysBtn.classList.remove('active');
    render();
  }
});
