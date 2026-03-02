import { useState, useEffect } from 'react';
import { WEATHER_API_BASE_URL } from '../config/api';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: string;
}

// Map OWM icon codes → emoji
const owmIconToEmoji = (icon: string): string => {
  const map: Record<string, string> = {
    '01d': '☀️',  '01n': '🌙',
    '02d': '⛅',  '02n': '☁️',
    '03d': '☁️',  '03n': '☁️',
    '04d': '☁️',  '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };
  return map[icon] ?? '🌤️';
};

// Map open-meteo WMO weather code → emoji + condition label
const wmoToWeather = (code: number): { condition: string; icon: string } => {
  if (code === 0)                    return { condition: 'Clear',        icon: '☀️' };
  if (code <= 2)                     return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3)                    return { condition: 'Overcast',      icon: '☁️' };
  if (code <= 49)                    return { condition: 'Foggy',         icon: '🌫️' };
  if (code <= 59)                    return { condition: 'Drizzle',       icon: '🌦️' };
  if (code <= 69)                    return { condition: 'Rain',          icon: '🌧️' };
  if (code <= 79)                    return { condition: 'Snow',          icon: '❄️' };
  if (code <= 84)                    return { condition: 'Rain Showers',  icon: '🌦️' };
  if (code <= 94)                    return { condition: 'Thunderstorm',  icon: '⛈️' };
  return { condition: 'Thunderstorm', icon: '⛈️' };
};

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // ── Fallback: open-meteo (free, no key) + Nominatim reverse geocode ──
    const fetchFallback = async (lat: number, lon: number) => {
      // Reverse geocode to get city name
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'AgriGPT/1.0' } }
      );
      const geoData = await geoRes.json();
      const city =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.county ||
        'Your Location';

      // Fetch current weather from open-meteo
      const wtRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true&hourly=relative_humidity_2m&forecast_days=1`
      );
      const wtData = await wtRes.json();
      const cw = wtData.current_weather;
      const { condition, icon } = wmoToWeather(cw.weathercode);

      return { location: city, temperature: Math.round(cw.temperature), condition, icon };
    };

    // ── Primary: Node weather server (OWM) ──
    const fetchByCoords = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `${WEATHER_API_BASE_URL}/api/current-weather?lat=${lat}&lon=${lon}`
        );
        if (!res.ok) throw new Error('Node server error');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return {
          location: data.location,
          temperature: data.temperature,
          condition: data.condition,
          icon: owmIconToEmoji(data.icon),
        };
      } catch {
        // Node server unreachable – use free fallback
        return fetchFallback(lat, lon);
      }
    };

    const run = async (lat: number, lon: number) => {
      try {
        const result = await fetchByCoords(lat, lon);
        if (!cancelled) setWeather(result);
      } catch {
        // Both sources failed – hide widget
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => run(pos.coords.latitude, pos.coords.longitude),
      () => { if (!cancelled) setLoading(false); },
      { timeout: 8000 }
    );

    return () => { cancelled = true; };
  }, []);

  return { weather, loading };
};
