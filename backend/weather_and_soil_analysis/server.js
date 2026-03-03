const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const path   = require("path");

// Load keys from the shared backend/.env (one folder up)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.WEATHER_PORT || 3020;

app.use(cors());
app.use(express.json());

// ================= CONFIG =================

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const WEATHER_URL = "https://api.openweathermap.org/data/2.5";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

// ===== MEMORY CACHE (no database needed) =====

const soilCache = {};
const CACHE_TIME = 24 * 60 * 60 * 1000; // 24 hours

const http = axios.create({ timeout: 60000 });

// ================= SAFE REQUEST (RETRY) =================

async function safeRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response?.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("API rate limit exceeded. Try later.");
}

// ================= GEOCODING =================

async function getCoordinates(city, zipCode) {
  const query = city ? `${city}, India` : `${zipCode}, India`;

  const { data } = await safeRequest(() =>
    http.get(NOMINATIM, {
      params: { q: query, format: "json", limit: 1 },
      headers: { "User-Agent": "AgriAPI/1.0" }
    })
  );

  if (!data.length) throw new Error("Location not found");

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    name: data[0].display_name
  };
}

// ================= GEMINI CALL =================

async function getSoilData(locationName) {
  const cacheKey = locationName.toLowerCase();

  // 🔥 RETURN CACHE IF AVAILABLE
  if (
    soilCache[cacheKey] &&
    Date.now() - soilCache[cacheKey].time < CACHE_TIME
  ) {
    return soilCache[cacheKey].data;
  }

  const prompt = `
Provide soil and underground water data for ${locationName} India.

Return ONLY JSON:

SoilScientificName,
SoilCommonNameEnglish,
SoilLocalName,
SoilType,
MajorNutrients,
MineralsPresent,
SoilPH,
OrganicMatterLevel,
WaterRetention,
UndergroundWaterAvailability,
GroundwaterDepthMeters,
GroundwaterQuality
`;

  const { data } = await safeRequest(() =>
    http.post(`${GEMINI_URL}?key=${process.env.WEATHER_GEMINI_API_KEY}`, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  );

  let result;
  try {
    let raw = data.candidates[0].content.parts[0].text.trim();
    // Strip markdown code fences that Gemini often wraps JSON in
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    result = JSON.parse(raw);
  } catch {
    result = { error: "AI parsing failed" };
  }

  // 🔥 SAVE TO CACHE
  soilCache[cacheKey] = {
    data: result,
    time: Date.now()
  };

  return result;
}

// ================= MAIN ENDPOINT =================

app.get("/api/agriculture-data", async (req, res) => {
  try {
    const { city, zipCode } = req.query;

    if (!city && !zipCode)
      return res
        .status(400)
        .json({ error: "Provide city OR zipCode" });

    // ---------- LOCATION ----------
    const location = await getCoordinates(city, zipCode);

    // ---------- WEATHER ----------
    const [currentWeather, forecast] = await Promise.all([
      safeRequest(() =>
        http.get(`${WEATHER_URL}/weather`, {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: "metric"
          }
        })
      ),
      safeRequest(() =>
        http.get(`${WEATHER_URL}/forecast`, {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: "metric",
            cnt: 40
          }
        })
      )
    ]);

    // ---------- SOIL + WATER (CACHED) ----------
    const soilWater = await getSoilData(location.name);

    res.json({
      location: location.name,

      weather: {
        current: currentWeather.data,
        next7days: forecast.data
      },

      soil_and_water: soilWater
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= HOURLY WEATHER (chart data) =================

app.get("/api/hourly-weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon)
      return res.status(400).json({ error: "Provide lat and lon" });

    // 8 slots × 3 h = covers next 24 h
    const { data } = await safeRequest(() =>
      http.get(`${WEATHER_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
          cnt: 8,
        },
      })
    );

    const fmt = (h) =>
      h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

    // Sparse knots from OWM 3-hour intervals
    const sparse = data.list.map((item) => {
      const h = new Date(item.dt * 1000).getHours();
      return {
        hour: h,
        label: fmt(h),
        temperature: parseFloat(item.main.temp.toFixed(1)),
        humidity: item.main.humidity,
      };
    });

    // Sort by hour ascending (OWM already does this, but be safe)
    sparse.sort((a, b) => a.hour - b.hour);

    // Linear interpolation → fill every hour 0–23
    const filled = [];
    for (let h = 0; h < 24; h++) {
      const before = [...sparse].reverse().find((p) => p.hour <= h);
      const after  = sparse.find((p) => p.hour >= h);

      if (before && after && before.hour !== after.hour) {
        const t = (h - before.hour) / (after.hour - before.hour);
        filled.push({
          hour: h,
          label: fmt(h),
          temperature: parseFloat(
            (before.temperature + t * (after.temperature - before.temperature)).toFixed(1)
          ),
          humidity: Math.round(
            before.humidity + t * (after.humidity - before.humidity)
          ),
        });
      } else if (before) {
        filled.push({ hour: h, label: fmt(h), temperature: before.temperature, humidity: before.humidity });
      } else if (after) {
        filled.push({ hour: h, label: fmt(h), temperature: after.temperature, humidity: after.humidity });
      }
    }

    res.json({ location: data.city?.name || "", hourly: filled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EXPERT RECOMMENDATION (Gemini) =================

app.post("/api/expert-recommendation", async (req, res) => {
  try {
    const { location, weather, soil } = req.body;

    if (!location || !weather || !soil)
      return res.status(400).json({ error: "Provide location, weather and soil" });

    const prompt = `
You are an expert agricultural advisor in India.
Based on the following real-time data for ${location}, give a concise expert recommendation (3-5 sentences) covering:
1. What type of soil it is and its fertility status
2. Current weather impact on farming
3. Which crops are best suited right now
4. Any irrigation or nutrient advice

Real-time data:
- Location: ${location}
- Temperature: ${weather.temperature}°C
- Condition: ${weather.condition}
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.windSpeed} km/h
- Pressure: ${weather.pressure} hPa
- UV Index: ${weather.uvIndex}
- Soil Type: ${soil.SoilType || "Unknown"} (${soil.SoilCommonNameEnglish || ""})
- Soil Local Name: ${soil.SoilLocalName || "N/A"}
- Soil Scientific Name: ${soil.SoilScientificName || "N/A"}
- Soil pH: ${soil.SoilPH || "N/A"}
- Major Nutrients: ${soil.MajorNutrients || "N/A"}
- Minerals Present: ${soil.MineralsPresent || "N/A"}
- Organic Matter: ${soil.OrganicMatterLevel || "N/A"}
- Water Retention: ${soil.WaterRetention || "N/A"}
- Groundwater Availability: ${soil.UndergroundWaterAvailability || "N/A"}
- Groundwater Depth: ${soil.GroundwaterDepthMeters || "N/A"} meters
- Groundwater Quality: ${soil.GroundwaterQuality || "N/A"}

Reply in clear, fluent English only. Do NOT use bullet points or headings — write as a single expert advisory paragraph.
`.trim();

    const { data } = await safeRequest(() =>
      http.post(`${GEMINI_URL}?key=${process.env.WEATHER_GEMINI_API_KEY}`, {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    );

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Empty response from AI");

    res.json({ recommendation: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CURRENT WEATHER (navbar) =================
// Lightweight endpoint: lat+lon only, no Gemini – fast response for UI

app.get("/api/current-weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon)
      return res.status(400).json({ error: "Provide lat and lon" });

    const { data } = await safeRequest(() =>
      http.get(`${WEATHER_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
        },
      })
    );

    res.json({
      location: data.name || "Your Location",
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: data.weather[0].icon,   // OWM icon code e.g. "01d"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ROOT =================

app.get("/", (_, res) => {
  res.send("🌾 Agriculture API Running");
});

// ================= START =================

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
