// Spotify Streaming History Analyzer - JavaScript Logic

let rawRecords = [];
let activeSort = 'plays'; // 'plays' or 'duration'

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const loadingStatus = document.getElementById('loadingStatus');
const loadingMessage = document.getElementById('loadingMessage');
const dashboard = document.getElementById('dashboard');
const instructionsSection = document.getElementById('instructionsSection');

const yearSelect = document.getElementById('yearSelect');
const dateRangeText = document.getElementById('dateRangeText');

const sortByPlaysBtn = document.getElementById('sortByPlaysBtn');
const sortByDurationBtn = document.getElementById('sortByDurationBtn');
const artistsSortTag = document.getElementById('artistsSortTag');
const tracksSortTag = document.getElementById('tracksSortTag');
const albumsSortTag = document.getElementById('albumsSortTag');

const valTracks = document.getElementById('valTracks');
const valArtists = document.getElementById('valArtists');
const valHours = document.getElementById('valHours');
const valPlays = document.getElementById('valPlays');

const artistsTableBody = document.getElementById('artistsTableBody');
const tracksTableBody = document.getElementById('tracksTableBody');
const albumsPanel = document.getElementById('albumsPanel');
const albumsTableBody = document.getElementById('albumsTableBody');

const monthlyChartSection = document.getElementById('monthlyChartSection');
const monthlyChartContainer = document.getElementById('monthlyChartContainer');
const chartTitle = document.getElementById('chartTitle');
const chartYearTotal = document.getElementById('chartYearTotal');

const monthlyArtistsPanel = document.getElementById('monthlyArtistsPanel');
const monthlyTracksPanel = document.getElementById('monthlyTracksPanel');
const monthlyArtistsTableBody = document.getElementById('monthlyArtistsTableBody');
const monthlyTracksTableBody = document.getElementById('monthlyTracksTableBody');
const monthlyArtistsSortTag = document.getElementById('monthlyArtistsSortTag');
const monthlyTracksSortTag = document.getElementById('monthlyTracksSortTag');

const heatmapSection = document.getElementById('heatmapSection');
const heatmapGrid = document.getElementById('heatmapGrid');
const heatmapPeakTag = document.getElementById('heatmapPeakTag');
const heatmapHoverInfo = document.getElementById('heatmapHoverInfo');

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

// Parse UTC Spotify timestamps into local Date objects
function parseRecordDate(dateStr) {
  if (!dateStr) return null;
  let iso = String(dateStr).trim();
  if (!iso.includes('T')) {
    iso = iso.replace(' ', 'T');
  }
  const parts = iso.split('T');
  if (parts.length === 2) {
    let timePart = parts[1];
    if (timePart.length === 5) {
      timePart += ':00';
    }
    if (!timePart.endsWith('Z') && !timePart.includes('+') && !timePart.includes('-', 3)) {
      timePart += 'Z';
    }
    iso = `${parts[0]}T${timePart}`;
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// Reload application when clicking brand header
const brandLink = document.querySelector('.brand');
if (brandLink) {
  brandLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.reload();
  });
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

    // Find all files matching standard or extended Spotify streaming history
    zip.forEach((relativePath, zipEntry) => {
      const filename = relativePath.split('/').pop();
      const isHistoryFile =
        (
          (filename.startsWith('StreamingHistory') && !filename.includes('podcast')) ||
          filename.startsWith('Streaming_History_Audio') ||
          filename.startsWith('endsong_')
        ) &&
        filename.endsWith('.json') &&
        !zipEntry.dir;

      if (isHistoryFile) {
        jsonFilePromises.push(
          zipEntry.async('string').then((jsonText) => {
            try {
              const list = JSON.parse(jsonText);
              if (Array.isArray(list)) {
                for (const item of list) {
                  const album = item.albumName || item.master_metadata_album_album_name || null;
                  rawRecords.push({
                    endTime: item.endTime || item.ts,
                    artistName: item.artistName || item.master_metadata_album_artist_name,
                    trackName: item.trackName || item.master_metadata_track_name,
                    albumName: album,
                    msPlayed: item.msPlayed != null ? item.msPlayed : item.ms_played,
                  });
                }
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
      alert("No Spotify streaming history JSON files found inside the uploaded ZIP!");
      return;
    }

    showLoading(true, `Extracting ${jsonFilePromises.length} streaming history files...`);
    await Promise.all(jsonFilePromises);

    populateYearSelect();

    showLoading(false);
    if (instructionsSection) {
      instructionsSection.classList.add('hidden');
    }
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

// Populate available years dynamically in the select dropdown
function populateYearSelect() {
  const yearsSet = new Set();

  for (const item of rawRecords) {
    if (!item.artistName || !item.trackName) continue;
    if (item.msPlayed < 30000) continue;
    const dateStr = item.endTime;
    if (dateStr && dateStr.length >= 4) {
      const yr = dateStr.slice(0, 4);
      if (/^\d{4}$/.test(yr)) {
        yearsSet.add(yr);
      }
    }
  }

  const sortedYears = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  const previousValue = yearSelect.value;

  yearSelect.innerHTML =
    '<option value="all">All Time</option>' +
    sortedYears.map((y) => `<option value="${y}">${y}</option>`).join('');

  if (previousValue && (previousValue === 'all' || sortedYears.includes(previousValue))) {
    yearSelect.value = previousValue;
  } else {
    yearSelect.value = 'all';
  }
}

// Compute & Render Dashboard
function render() {
  const selectedYear = yearSelect ? yearSelect.value : 'all';

  // Filter records
  // Must have artist, track, msPlayed >= 30,000 (30 seconds)
  const filtered = rawRecords.filter((item) => {
    if (!item.artistName || !item.trackName) return false;
    if (item.msPlayed < 30000) return false;
    if (selectedYear !== 'all') {
      if (!item.endTime || !item.endTime.startsWith(selectedYear)) {
        return false;
      }
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
    if (albumsTableBody) {
      albumsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No streams found.</td></tr>';
    }
    if (albumsPanel) {
      albumsPanel.classList.add('hidden');
    }
    if (monthlyChartSection) {
      monthlyChartSection.classList.add('hidden');
    }
    if (monthlyArtistsPanel) {
      monthlyArtistsPanel.classList.add('hidden');
    }
    if (monthlyTracksPanel) {
      monthlyTracksPanel.classList.add('hidden');
    }
    if (heatmapGrid) {
      heatmapGrid.innerHTML = '';
    }
    if (heatmapPeakTag) {
      heatmapPeakTag.textContent = 'Peak: —';
    }
    return;
  }

  // Days of week config for heatmap (Mon - Sun)
  const DAYS_CONFIG = [
    { dayIndex: 1, name: 'Mon', full: 'Monday' },
    { dayIndex: 2, name: 'Tue', full: 'Tuesday' },
    { dayIndex: 3, name: 'Wed', full: 'Wednesday' },
    { dayIndex: 4, name: 'Thu', full: 'Thursday' },
    { dayIndex: 5, name: 'Fri', full: 'Friday' },
    { dayIndex: 6, name: 'Sat', full: 'Saturday' },
    { dayIndex: 0, name: 'Sun', full: 'Sunday' },
  ];

  // Find date range
  let oldestDate = null;
  let newestDate = null;

  const artistMap = new Map(); // artist -> { plays, duration }
  const trackMap = new Map();  // "track — artist" -> { name, plays, duration }
  const albumMap = new Map();  // "album — artist" -> { name, plays, duration }
  const monthlyMs = new Array(12).fill(0);
  const monthlyArtists = Array.from({ length: 12 }, () => new Map());
  const monthlyTracks = Array.from({ length: 12 }, () => new Map());
  const heatmapMatrix = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ ms: 0, plays: 0 }))
  );

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
    const album = item.albumName;
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

    // Aggregate Album (if album metadata is present)
    if (album) {
      const albumKey = `${album} — ${artist}`;
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, { name: albumKey, plays: 0, duration: 0 });
      }
      const alData = albumMap.get(albumKey);
      alData.plays += 1;
      alData.duration += ms;
    }

    // Aggregate Monthly Duration & Leaders (when a specific year is selected)
    if (selectedYear !== 'all' && end && end.length >= 7) {
      const monthIdx = parseInt(end.slice(5, 7), 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyMs[monthIdx] += ms;

        // Monthly Artists
        const mArtists = monthlyArtists[monthIdx];
        if (!mArtists.has(artist)) {
          mArtists.set(artist, { name: artist, plays: 0, duration: 0 });
        }
        const aData = mArtists.get(artist);
        aData.plays += 1;
        aData.duration += ms;

        // Monthly Tracks
        const trackKey = `${track} — ${artist}`;
        const mTracks = monthlyTracks[monthIdx];
        if (!mTracks.has(trackKey)) {
          mTracks.set(trackKey, { name: trackKey, trackName: track, artistName: artist, plays: 0, duration: 0 });
        }
        const tData = mTracks.get(trackKey);
        tData.plays += 1;
        tData.duration += ms;
      }
    }

    // Aggregate Heatmap (Day of Week x Hour of Day)
    if (end) {
      const d = parseRecordDate(end);
      if (d) {
        const day = d.getDay();
        const hour = d.getHours();
        if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
          heatmapMatrix[day][hour].ms += ms;
          heatmapMatrix[day][hour].plays += 1;
        }
      }
    }
  }

  // Update Active Date Range Banner
  if (oldestDate && newestDate) {
    const periodType = selectedYear !== 'all' ? `Year ${selectedYear}` : 'All Time';
    const startDate = oldestDate.split(/[\sT]/)[0];
    const endDate = newestDate.split(/[\sT]/)[0];
    dateRangeText.innerHTML = `${startDate} &nbsp;→&nbsp; ${endDate} (${periodType})`;
  } else {
    dateRangeText.textContent = '—';
  }

  // Update Metric Cards
  const totalHours = (totalDurationMs / (1000 * 3600)).toFixed(1);
  valTracks.textContent = trackMap.size.toLocaleString();
  valArtists.textContent = artistMap.size.toLocaleString();
  valHours.textContent = `${Number(totalHours).toLocaleString()} hrs`;
  valPlays.textContent = totalPlays.toLocaleString();

  // Render Monthly Listening Chart (only when a specific year is selected)
  if (monthlyChartSection) {
    if (selectedYear === 'all') {
      monthlyChartSection.classList.add('hidden');
    } else {
      monthlyChartSection.classList.remove('hidden');
      const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMinutes = monthlyMs.map((ms) => Math.round(ms / 60000));
      const totalYearMinutes = monthlyMinutes.reduce((sum, val) => sum + val, 0);
      const maxMinutes = Math.max(...monthlyMinutes, 1);

      if (chartTitle) {
        chartTitle.textContent = `Monthly Listening Time (${selectedYear})`;
      }
      if (chartYearTotal) {
        chartYearTotal.textContent = `${totalYearMinutes.toLocaleString()} min total`;
      }

      if (monthlyChartContainer) {
        monthlyChartContainer.innerHTML = monthlyMinutes
          .map((minutes, idx) => {
            const monthName = MONTH_NAMES[idx];
            const heightPercent = maxMinutes > 0 ? ((minutes / maxMinutes) * 100).toFixed(1) : 0;
            const hours = (minutes / 60).toFixed(1);
            const safeHeight = minutes > 0 ? Math.max(3, parseFloat(heightPercent)) : 0;

            return `
              <div class="chart-col" title="${monthName} ${selectedYear}: ${minutes.toLocaleString()} min (~${hours} hrs)">
                <div class="chart-val-top">${minutes > 0 ? minutes.toLocaleString() + ' min' : '0 min'}</div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="height: ${safeHeight}%;"></div>
                </div>
                <div class="chart-col-label">${monthName}</div>
              </div>
            `;
          })
          .join('');
      }
    }
  }

  // Render Heatmap (Days of Week vs Hours of Day)
  if (heatmapGrid) {
    let maxCellMinutes = 0;
    let peakCell = null;

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const cellMins = Math.round(heatmapMatrix[d][h].ms / 60000);
        if (cellMins > maxCellMinutes) {
          maxCellMinutes = cellMins;
          peakCell = { dayIndex: d, hour: h, minutes: cellMins, plays: heatmapMatrix[d][h].plays };
        }
      }
    }

    if (heatmapPeakTag) {
      if (peakCell && peakCell.minutes > 0) {
        const dayObj = DAYS_CONFIG.find((item) => item.dayIndex === peakCell.dayIndex);
        const dayLabel = dayObj ? dayObj.name : '';
        heatmapPeakTag.textContent = `Peak: ${dayLabel} at ${String(peakCell.hour).padStart(2, '0')}:00 (${peakCell.minutes.toLocaleString()} min)`;
      } else {
        heatmapPeakTag.textContent = 'Peak: —';
      }
    }

    let gridHtml = '';

    // Header row: empty corner cell + 24 hour labels (00 to 23)
    gridHtml += '<div class="heatmap-header-cell"></div>';
    for (let h = 0; h < 24; h++) {
      gridHtml += `<div class="heatmap-header-cell">${String(h).padStart(2, '0')}</div>`;
    }

    // 7 rows for days of the week
    for (const day of DAYS_CONFIG) {
      gridHtml += `<div class="heatmap-day-label">${day.name}</div>`;
      for (let h = 0; h < 24; h++) {
        const cellData = heatmapMatrix[day.dayIndex][h];
        const minutes = Math.round(cellData.ms / 60000);
        const plays = cellData.plays;

        let bgStyle = 'background-color: rgba(255, 255, 255, 0.04);';
        if (minutes > 0 && maxCellMinutes > 0) {
          const ratio = minutes / maxCellMinutes;
          const alpha = (0.20 + 0.80 * Math.pow(ratio, 0.65)).toFixed(2);
          bgStyle = `background-color: rgba(29, 185, 84, ${alpha});`;
        }

        const hourRange = `${String(h).padStart(2, '0')}:00 - ${String(h).padStart(2, '0')}:59`;
        const info = `${day.full} ${hourRange} • ${minutes.toLocaleString()} min (${plays.toLocaleString()} plays)`;

        gridHtml += `<div class="heatmap-cell" style="${bgStyle}" data-info="${escapeHtml(info)}" title="${escapeHtml(info)}"></div>`;
      }
    }

    heatmapGrid.innerHTML = gridHtml;
  }

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
  if (albumsSortTag) {
    albumsSortTag.textContent = sortLabel;
  }
  if (monthlyArtistsSortTag) {
    monthlyArtistsSortTag.textContent = sortLabel;
  }
  if (monthlyTracksSortTag) {
    monthlyTracksSortTag.textContent = sortLabel;
  }

  // Render Monthly Leaders Tables (only when a specific year is selected)
  if (selectedYear === 'all') {
    if (monthlyArtistsPanel) monthlyArtistsPanel.classList.add('hidden');
    if (monthlyTracksPanel) monthlyTracksPanel.classList.add('hidden');
  } else {
    if (monthlyArtistsPanel) monthlyArtistsPanel.classList.remove('hidden');
    if (monthlyTracksPanel) monthlyTracksPanel.classList.remove('hidden');

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Render Top Artist per Month
    if (monthlyArtistsTableBody) {
      monthlyArtistsTableBody.innerHTML = MONTH_NAMES
        .map((mName, idx) => {
          const list = Array.from(monthlyArtists[idx].values()).sort(sortComparator);
          const top = list[0];
          if (!top) {
            return `
              <tr>
                <td class="col-month">${mName}</td>
                <td class="col-name" style="color: var(--text-muted); font-style: italic;">—</td>
                <td class="col-plays" style="color: var(--text-muted);">—</td>
                <td class="col-duration" style="color: var(--text-muted);">—</td>
              </tr>
            `;
          }
          return `
            <tr>
              <td class="col-month">${mName}</td>
              <td class="col-name">${escapeHtml(top.name)}</td>
              <td class="col-plays">${top.plays.toLocaleString()}</td>
              <td class="col-duration">${formatDuration(top.duration)}</td>
            </tr>
          `;
        })
        .join('');
    }

    // Render Top Track per Month
    if (monthlyTracksTableBody) {
      monthlyTracksTableBody.innerHTML = MONTH_NAMES
        .map((mName, idx) => {
          const list = Array.from(monthlyTracks[idx].values()).sort(sortComparator);
          const top = list[0];
          if (!top) {
            return `
              <tr>
                <td class="col-month">${mName}</td>
                <td class="col-name" style="color: var(--text-muted); font-style: italic;">—</td>
                <td class="col-plays" style="color: var(--text-muted);">—</td>
                <td class="col-duration" style="color: var(--text-muted);">—</td>
              </tr>
            `;
          }
          return `
            <tr>
              <td class="col-month">${mName}</td>
              <td class="col-name">${escapeHtml(top.name)}</td>
              <td class="col-plays">${top.plays.toLocaleString()}</td>
              <td class="col-duration">${formatDuration(top.duration)}</td>
            </tr>
          `;
        })
        .join('');
    }
  }

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

  // Render Albums Table (Top 10 - only shown if albumName is present in rawRecords)
  const hasAlbums = rawRecords.some((r) => r.albumName != null && String(r.albumName).trim() !== '');

  if (albumsPanel) {
    if (!hasAlbums || albumMap.size === 0) {
      albumsPanel.classList.add('hidden');
    } else {
      albumsPanel.classList.remove('hidden');

      const topAlbums = Array.from(albumMap.values())
        .sort(sortComparator)
        .slice(0, 10);

      albumsTableBody.innerHTML = topAlbums
        .map((item, index) => {
          const rank = index + 1;
          const rankClass = rank <= 3 ? `rank-top-${rank}` : '';
          const minutes = Math.max(1, Math.round(item.duration / 60000));
          return `
            <tr>
              <td class="col-rank"><span class="rank-badge ${rankClass}">${rank}</span></td>
              <td class="col-name">${escapeHtml(item.name)}</td>
              <td class="col-plays">${item.plays.toLocaleString()}</td>
              <td class="col-duration">${minutes.toLocaleString()} min</td>
            </tr>
          `;
        })
        .join('');
    }
  }
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
yearSelect.addEventListener('change', () => {
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

// Heatmap Hover & Touch Interactions
if (heatmapGrid) {
  heatmapGrid.addEventListener('mouseover', (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (cell && cell.dataset.info && heatmapHoverInfo) {
      heatmapHoverInfo.innerHTML = `<strong>${cell.dataset.info}</strong>`;
    }
  });

  heatmapGrid.addEventListener('mouseleave', () => {
    if (heatmapHoverInfo) {
      heatmapHoverInfo.textContent = 'Hover or tap any cell to inspect details';
    }
  });

  heatmapGrid.addEventListener('touchstart', (e) => {
    const cell = e.target.closest('.heatmap-cell');
    if (cell && cell.dataset.info && heatmapHoverInfo) {
      heatmapHoverInfo.innerHTML = `<strong>${cell.dataset.info}</strong>`;
    }
  }, { passive: true });
}
