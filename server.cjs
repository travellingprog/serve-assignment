/* Robot Service
Small Node/Express service that holds in-memory robot positions inside
the DTLA polygon.

Endpoints:
- GET /robots -> { robots: [[lat,lng], ...] }
- POST /move { meters } -> steps all robots by meters and returns
updated positions
- POST /reset { count } -> re-spawn `count` robots inside polygon
- POST /start-auto { meters, intervalMs } -> start auto-stepping
- POST /stop-auto -> stop auto-stepping

Environment variables:
- ROBOT_COUNT - initial robot count (default 20)
- MOVE_METERS - default movement in meters (default 1)
- MOVE_INTERVAL_MS - default auto interval in ms (default 60000)
- PORT - server port (default 4000)
*/

const express = require("express");
const ViteExpress = require("vite-express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Downtown LA polygon (lat, lng) order for internal use
const polygon = [
  [34.055, -118.275],
  [34.055, -118.225],
  [34.02, -118.225],
  [34.02, -118.275],
];

const DEFAULT_COUNT = Number(process.env.ROBOT_COUNT) || 20;
const DEFAULT_MOVE_METERS = Number(process.env.MOVE_METERS) || 1;
const DEFAULT_MOVE_INTERVAL_MS = Number(process.env.MOVE_INTERVAL_MS) || 60000;

// utils
function pointInPolygon(point, vs) {
  const x = point[1],
    y = point[0];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][1],
      yi = vs[i][0];
    const xj = vs[j][1],
      yj = vs[j][0];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function randomPointInPolygon(polygonLatLng) {
  const lats = polygonLatLng.map((p) => p[0]);
  const lngs = polygonLatLng.map((p) => p[1]);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  for (let i = 0; i < 1000; i++) {
    const lat = minLat + Math.random() * (maxLat - minLat);
    const lng = minLng + Math.random() * (maxLng - minLng);
    if (pointInPolygon([lat, lng], polygonLatLng)) return [lat, lng];
  }
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
  return [avgLat, avgLng];
}

function moveByMeters([lat, lng], meters) {
  const bearing = Math.random() * Math.PI * 2;
  const latRad = (lat * Math.PI) / 180;
  const metersPerDegLat = 111320.0;
  const metersPerDegLng = 111320.0 * Math.cos(latRad);
  const deltaLat = (meters * Math.cos(bearing)) / metersPerDegLat;
  const deltaLng = (meters * Math.sin(bearing)) / metersPerDegLng;
  return [lat + deltaLat, lng + deltaLng];
}

// in-memory robot store
let robots = [];
function initRobots(count) {
  robots = [];
  for (let i = 0; i < count; i++) {
    robots.push(randomPointInPolygon(polygon));
  }
}

initRobots(DEFAULT_COUNT);

function stepAll(meters) {
  robots = robots.map((pos) => {
    const next = moveByMeters(pos, meters);
    if (!pointInPolygon(next, polygon)) {
      const alt = moveByMeters(pos, -meters);
      if (pointInPolygon(alt, polygon)) return alt;
      return pos;
    }
    return next;
  });
}

// auto-step
let autoInterval = null;
function startAuto(
  meters = DEFAULT_MOVE_METERS,
  intervalMs = DEFAULT_MOVE_INTERVAL_MS,
) {
  if (autoInterval) clearInterval(autoInterval);
  autoInterval = setInterval(() => stepAll(meters), intervalMs);
}
startAuto();

app.get("/robots", (req, res) => {
  res.json({ robots });
});

app.post("/move", (req, res) => {
  const meters = Number(req.body.meters) || DEFAULT_MOVE_METERS;
  stepAll(meters);
  res.json({ robots });
});

app.post("/reset", (req, res) => {
  const count = Number(req.body.count) || DEFAULT_COUNT;
  initRobots(count);
  res.json({ robots });
});

app.post("/start-auto", (req, res) => {
  const meters = Number(req.body.meters) || DEFAULT_MOVE_METERS;
  const intervalMs = Number(req.body.intervalMs) || DEFAULT_MOVE_INTERVAL_MS;
  startAuto(meters, intervalMs);
  res.json({ status: "started", meters, intervalMs });
});

app.post("/stop-auto", (req, res) => {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
  res.json({ status: "stopped" });
});

const port = Number(process.env.PORT) || 4000;
ViteExpress.listen(app, port, () => {
  console.log(`Robot service listening on http://localhost:${port}`);
});
