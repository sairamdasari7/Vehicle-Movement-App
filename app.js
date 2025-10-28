// app.js — replace your existing file with this
document.addEventListener('DOMContentLoaded', async () => {
  // UI elements
  const playPauseBtn = document.getElementById('playPauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const coordsEl = document.getElementById('coords');
  const tsEl = document.getElementById('timestamp');
  const elapsedEl = document.getElementById('elapsed');
  const speedEl = document.getElementById('speed');

  // Load route data
  let route;
  try {
    const r = await fetch('dummy-route.json');
    if (!r.ok) throw new Error('Failed to load dummy-route.json');
    route = await r.json();
    if (!Array.isArray(route) || route.length === 0) throw new Error('Route is empty or invalid');
  } catch (e) {
    console.error(e);
    alert('Failed to load route: ' + e.message);
    return;
  }

  const pts = route.map(p => [p.latitude, p.longitude]);

  // Initialize map
  const map = L.map('map', { zoomControl: true }).setView(pts[0], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Polylines and marker
  const fullRoute = L.polyline(pts, { color: '#888', weight: 3, opacity: 0.35 }).addTo(map);
  const progressed = L.polyline([pts[0]], { color: '#7c3aed', weight: 5, opacity: 0.95 }).addTo(map);
  const marker = L.marker(pts[0]).addTo(map);

  // Helpers
  function toFixed6(a) { return `${a[0].toFixed(6)}, ${a[1].toFixed(6)}`; }
  function formatElapsed(s) {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(Math.floor(s % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  }
  function haversine(a, b) {
    const toRad = x => x * Math.PI / 180;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const la = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(la), Math.sqrt(1 - la));
    return R * c;
  }

  // Animation state
  let idx = 0;                   // current segment start index (moving from pts[idx] -> pts[idx+1])
  let playing = false;
  let animId = null;
  let segmentStartTimestamp = 0; // perf.now() when current segment started
  let segmentDuration = 2000;    // ms for current segment
  let playStartPerf = 0;         // perf.now() when playback started (for elapsed)
  let elapsedBeforePlay = 0;     // seconds accumulated from previous plays (when paused/resumed)

  // Initialize UI
  coordsEl.textContent = toFixed6(pts[0]);
  tsEl.textContent = route[0] && route[0].timestamp ? route[0].timestamp : '—';
  elapsedEl.textContent = '00:00';
  speedEl.textContent = '—';

  // Compute duration between route points using timestamps (ms). fallback default if missing
  function getSegmentDuration(i) {
    if (!route[i] || !route[i + 1]) return 2000;
    const t1 = route[i].timestamp ? new Date(route[i].timestamp).getTime() : null;
    const t2 = route[i + 1].timestamp ? new Date(route[i + 1].timestamp).getTime() : null;
    if (t1 && t2 && t2 > t1) {
      return Math.max(500, t2 - t1); // at least 500ms
    }
    return 2000;
  }

  // Animate single segment from pts[idx] to pts[idx+1]
  function animateSegment() {
    if (idx >= pts.length - 1) {
      // finished
      playing = false;
      playPauseBtn.textContent = 'Play';
      cancelAnimationFrame(animId);
      animId = null;
      return;
    }

    const from = pts[idx];
    const to = pts[idx + 1];
    segmentDuration = getSegmentDuration(idx);
    segmentStartTimestamp = performance.now();

    // compute speed (m/s)
    const distance = haversine(from, to);
    const speedMps = distance / (segmentDuration / 1000);

    function step(now) {
      const t = Math.min(1, (now - segmentStartTimestamp) / segmentDuration);
      const lat = from[0] + (to[0] - from[0]) * t;
      const lon = from[1] + (to[1] - from[1]) * t;
      marker.setLatLng([lat, lon]);
      progressed.addLatLng([lat, lon]);

      // update UI
      coordsEl.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      speedEl.textContent = speedMps.toFixed(2);
      if (route[idx] && route[idx + 1] && route[idx].timestamp && route[idx + 1].timestamp) {
        const t1 = new Date(route[idx].timestamp).getTime();
        const t2 = new Date(route[idx + 1].timestamp).getTime();
        const curTs = new Date(t1 + t * (t2 - t1)).toISOString();
        tsEl.textContent = curTs;
      } else {
        tsEl.textContent = '—';
      }

      // elapsed calculation (seconds)
      if (playing) {
        const elapsedSecs = (performance.now() - playStartPerf) / 1000 + elapsedBeforePlay;
        elapsedEl.textContent = formatElapsed(elapsedSecs);
      }

      if (t < 1 && playing) {
        animId = requestAnimationFrame(step);
      } else {
        // segment done
        idx++;
        if (playing && idx < pts.length - 1) {
          // small delay not necessary; start next immediately
          animateSegment();
        } else {
          if (idx >= pts.length - 1) {
            // reached end: set final pos and stop
            marker.setLatLng(pts[pts.length - 1]);
            coordsEl.textContent = toFixed6(pts[pts.length - 1]);
            playing = false;
            playPauseBtn.textContent = 'Play';
            animId = null;
          }
        }
      }
    }

    animId = requestAnimationFrame(step);
  }

  // play/pause handler
  playPauseBtn.addEventListener('click', () => {
    if (playing) {
      // pause
      playing = false;
      playPauseBtn.textContent = 'Play';
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      // update elapsedBeforePlay
      elapsedBeforePlay = (performance.now() - playStartPerf) / 1000 + elapsedBeforePlay;
    } else {
      // start or resume
      if (idx >= pts.length - 1) {
        // if finished, reset to start
        idx = 0;
        progressed.setLatLngs([pts[0]]);
        marker.setLatLng(pts[0]);
      }
      playing = true;
      playPauseBtn.textContent = 'Pause';
      playStartPerf = performance.now();
      // if we had paused earlier, elapsedBeforePlay already holds previous seconds
      animateSegment();
    }
  });

  // reset handler
  resetBtn.addEventListener('click', () => {
    playing = false;
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    idx = 0;
    elapsedBeforePlay = 0;
    playStartPerf = 0;
    progressed.setLatLngs([pts[0]]);
    marker.setLatLng(pts[0]);
    coordsEl.textContent = toFixed6(pts[0]);
    tsEl.textContent = route[0] && route[0].timestamp ? route[0].timestamp : '—';
    elapsedEl.textContent = '00:00';
    speedEl.textContent = '—';
    playPauseBtn.textContent = 'Play';
    // pan map to start (useful if user panned away)
    if (window.innerWidth >= 900) map.setView(pts[0], 15);
    else map.panTo(pts[0], { animate: false });
  });

  // make sure progressed initially contains start point
  progressed.setLatLngs([pts[0]]);
});
