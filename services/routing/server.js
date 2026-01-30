const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 9003;
const DEFAULT_OSRM = "https://router.project-osrm.org";

function decodePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

function requestJson(urlString, options = {}) {
  const url = new URL(urlString);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function routeWithMapbox(coords, profile) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) throw new Error("MAPBOX_TOKEN not set");
  const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordString}` +
    `?geometries=geojson&overview=full&access_token=${token}`;
  const json = await requestJson(url);
  const route = json.routes && json.routes[0];
  if (!route) throw new Error("Mapbox: no routes");
  return {
    provider: "mapbox",
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map((c) => [c[1], c[0]]),
  };
}

async function routeWithOsrm(coords, profile) {
  const base = process.env.OSRM_BASE_URL || DEFAULT_OSRM;
  const coordString = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url =
    `${base}/route/v1/${profile}/${coordString}` +
    "?geometries=geojson&overview=full";
  const json = await requestJson(url);
  const route = json.routes && json.routes[0];
  if (!route) throw new Error("OSRM: no routes");
  return {
    provider: "osrm",
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map((c) => [c[1], c[0]]),
  };
}

async function routeWithGoogle(coords) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not set");
  if (coords.length < 2) throw new Error("Google: need at least 2 coordinates");

  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const intermediates = coords.slice(1, -1).map((c) => ({
    location: { latLng: { latitude: c.lat, longitude: c.lng } },
  }));

  const body = JSON.stringify({
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
    intermediates,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    polylineQuality: "HIGH_QUALITY",
  });

  const json = await requestJson("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
    },
    body,
  });

  const route = json.routes && json.routes[0];
  if (!route || !route.polyline) throw new Error("Google: no routes");

  const decoded = decodePolyline(route.polyline.encodedPolyline);
  return {
    provider: "google",
    distanceMeters: route.distanceMeters,
    durationSeconds: route.duration ? parseInt(route.duration.replace("s", ""), 10) : null,
    geometry: decoded.map((c) => [c[0], c[1]]),
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, service: "routing" }));
    return;
  }

  if (req.method === "POST" && req.url === "/route") {
    try {
      const payload = await readJson(req);
      const provider = payload.provider || "osrm";
      const profile = payload.profile || "driving";
      const coords = payload.coordinates || [];
      if (coords.length < 2) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "At least 2 coordinates are required" }));
        return;
      }

      let route;
      if (provider === "mapbox") route = await routeWithMapbox(coords, profile);
      else if (provider === "google") route = await routeWithGoogle(coords);
      else route = await routeWithOsrm(coords, profile);

      res.statusCode = 200;
      res.end(JSON.stringify(route));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Routing service running on http://localhost:${PORT}`);
});
