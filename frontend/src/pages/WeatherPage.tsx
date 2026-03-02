import { useState, useEffect, useMemo } from 'react';
import HourlyWeatherAnalysis from '../components/HourlyWeatherAnalysis';
import { WEATHER_API_BASE_URL } from '../config/api';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MapPin,
  Search,
  Sun,
  Wind,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  Thermometer,
  Navigation,
  Map,
  Sprout,
  TestTube,
  Calendar,
  CloudRain,
  Gauge,
  TrendingUp,
  Activity,
  Zap,
  X,
  Waves
} from 'lucide-react';
import TutorialModal from '../components/TutorialModal';

interface WeatherData {
  location: string;
  lat: number;
  lon: number;
  current: {
    temperature: number;
    condition: string;
    icon: string;
    iconCode: string;   // raw OWM icon id, e.g. "01n"
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    visibility: number;
    sunrise: string;
    sunset: string;
    pressure: number;
  };
  forecast: Array<{
    date: string;
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  }>;
  soil: {
    moisture: number;
    ph: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    temperature: number;
    recommendation: string;
    // identity
    localName: string;
    scientificName: string;
    commonName: string;
    soilType: string;
    // nutrition
    majorNutrients: string;
    mineralsPresent: string;
    organicMatter: string;
    // underground water
    groundwaterAvailability: string;
    groundwaterDepth: string;
    groundwaterQuality: string;
    waterRetention: string;
  };
}

const WeatherPage = () => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  // Generate floating particles for background animation
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  // ─── OWM icon code → emoji ───────────────────────────────────────────────
  const owmIconToEmoji = (icon: string): string => {
    const map: Record<string, string> = {
      '01d': '☀️',  '01n': '🌙',
      '02d': '⛅',  '02n': '☁️',
      '03d': '☁️',  '03n': '☁️',
      '04d': '☁️',  '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return map[icon] || '🌤️';
  };

  // ─── Unix timestamp → "06:15 AM" ─────────────────────────────────────────
  const formatUnixTime = (unix: number): string => {
    const d = new Date(unix * 1000);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // ─── Parse soil pH string/number like "6.5 - 7.5" → 7.0 ─────────────────
  const parsePH = (phRaw: unknown): number => {
    if (typeof phRaw === 'number') return parseFloat(phRaw.toFixed(1));
    const nums = String(phRaw).match(/[\d.]+/g);
    if (!nums) return 6.5;
    if (nums.length === 1) return parseFloat(nums[0]);
    return parseFloat(((parseFloat(nums[0]) + parseFloat(nums[nums.length - 1])) / 2).toFixed(1));
  };

  // ─── Parse WaterRetention → moisture % ───────────────────────────────────
  const parseMoisture = (retention: string): number => {
    const r = String(retention).toLowerCase();
    if (r.includes('very high') || r.includes('excellent')) return 80;
    if (r.includes('high') || r.includes('good')) return 68;
    if (r.includes('low') || r.includes('poor')) return 35;
    return 52; // moderate
  };

  // ─── Parse MajorNutrients string → N, P, K kg/ha estimates ───────────────
  const parseNPK = (nutrients: string): { n: number; p: number; k: number } => {
    const s = String(nutrients).toLowerCase();
    const level = (keyword: string) => {
      const ctx = s.slice(Math.max(0, s.indexOf(keyword) - 10), s.indexOf(keyword) + 30);
      if (ctx.includes('high') || ctx.includes('rich')) return 'high';
      if (ctx.includes('low') || ctx.includes('defici')) return 'low';
      return 'medium';
    };
    const nLevel = s.includes('nitrogen') ? level('nitrogen') : 'medium';
    const pLevel = s.includes('phosphorus') ? level('phosphorus') : 'medium';
    const kLevel = s.includes('potassium') ? level('potassium') : 'medium';
    const toN = (l: string) => l === 'high' ? 245 : l === 'low' ? 110 : 200;
    const toP = (l: string) => l === 'high' ? 68 : l === 'low' ? 22 : 45;
    const toK = (l: string) => l === 'high' ? 230 : l === 'low' ? 95 : 170;
    return { n: toN(nLevel), p: toP(pLevel), k: toK(kLevel) };
  };

  // ─── Map raw API response → WeatherData ──────────────────────────────────
  const mapApiResponse = (raw: Record<string, any>): WeatherData => {
    const cur = raw.weather.current;
    const forecastList: any[] = raw.weather.next7days.list;
    const soil = raw.soil_and_water || {};

    // Aggregate 3-hour OWM slots into daily buckets
    const dayMap: { [key: string]: any[] } = {};
    forecastList.forEach((item: any) => {
      const key = new Date(item.dt * 1000).toLocaleDateString();
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(item);
    });
    const dayLabels = ['Today', 'Tomorrow', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const forecast = Object.entries(dayMap).slice(0, 7).map(([date, items], i) => {
      const mid = items[Math.floor(items.length / 2)];
      return {
        date,
        day: dayLabels[i] ?? date,
        high: Math.round(Math.max(...items.map((x: any) => x.main.temp_max ?? x.main.temp))),
        low:  Math.round(Math.min(...items.map((x: any) => x.main.temp_min ?? x.main.temp))),
        condition: mid.weather[0].main,
        icon: owmIconToEmoji(mid.weather[0].icon),
        humidity: Math.round(items.reduce((s: number, x: any) => s + x.main.humidity, 0) / items.length),
        windSpeed: Math.round(items.reduce((s: number, x: any) => s + x.wind.speed, 0) / items.length * 3.6),
        precipitation: Math.round((items.reduce((s: number, x: any) => s + (x.pop ?? 0), 0) / items.length) * 100),
      };
    });

    // Soil mapping
    const ph       = parsePH(soil.SoilPH);
    const moisture = parseMoisture(soil.WaterRetention ?? 'Moderate');
    const { n, p, k } = parseNPK(soil.MajorNutrients ?? '');
    const soilTemp  = Math.round(cur.main.temp) - 4;

    const recParts = [
      soil.SoilType            && `Soil: ${soil.SoilCommonNameEnglish || soil.SoilType}`,
      soil.OrganicMatterLevel  && `Organic Matter: ${soil.OrganicMatterLevel}`,
      soil.MajorNutrients      && `Nutrients: ${soil.MajorNutrients}`,
      soil.UndergroundWaterAvailability && `Groundwater: ${soil.UndergroundWaterAvailability}`,
      soil.GroundwaterDepthMeters       && `Depth: ${soil.GroundwaterDepthMeters} m`,
      soil.GroundwaterQuality           && `Water Quality: ${soil.GroundwaterQuality}`,
    ].filter(Boolean);
    const recommendation = recParts.length
      ? recParts.join(' | ')
      : 'Soil analysis complete for this region.';

    return {
      location: (raw.location ?? location).split(',')[0].trim(),
      lat: cur.coord?.lat ?? 20.29,
      lon: cur.coord?.lon ?? 85.82,
      current: {
        temperature: Math.round(cur.main.temp),
        condition:   cur.weather[0].main,
        icon:        owmIconToEmoji(cur.weather[0].icon),
        iconCode:    cur.weather[0].icon as string,
        humidity:    cur.main.humidity,
        windSpeed:   Math.round(cur.wind.speed * 3.6),
        uvIndex:     cur.uvi ?? 0,
        visibility:  Math.round((cur.visibility ?? 10000) / 1000),
        sunrise:     formatUnixTime(cur.sys.sunrise),
        sunset:      formatUnixTime(cur.sys.sunset),
        pressure:    cur.main.pressure,
      },
      forecast,
      soil: {
        moisture, ph, nitrogen: n, phosphorus: p, potassium: k, temperature: soilTemp, recommendation,
        localName:      String(soil.SoilLocalName      ?? ''),
        scientificName: String(soil.SoilScientificName ?? ''),
        commonName:     String(soil.SoilCommonNameEnglish ?? soil.SoilType ?? ''),
        soilType:       String(soil.SoilType           ?? ''),
        majorNutrients: String(soil.MajorNutrients     ?? ''),
        mineralsPresent:String(soil.MineralsPresent    ?? ''),
        organicMatter:  String(soil.OrganicMatterLevel ?? ''),
        groundwaterAvailability: String(soil.UndergroundWaterAvailability ?? ''),
        groundwaterDepth:        String(soil.GroundwaterDepthMeters       ?? ''),
        groundwaterQuality:      String(soil.GroundwaterQuality           ?? ''),
        waterRetention:          String(soil.WaterRetention               ?? ''),
      },
    };
  };

  // ─── Real API call ────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const fetchRecommendation = async (raw: Record<string, any>, mapped: WeatherData) => {
    setRecLoading(true);
    setRecommendation(null);
    try {
      const res = await fetch(`${WEATHER_API_BASE_URL}/api/expert-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: mapped.location,
          weather: mapped.current,
          soil: raw.soil_and_water || {}
        })
      });
      const data = await res.json();
      if (data.recommendation) setRecommendation(data.recommendation);
    } catch {
      // Non-critical – silently skip
    } finally {
      setRecLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!location.trim()) return;
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const url = `${WEATHER_API_BASE_URL}/api/agriculture-data?city=${encodeURIComponent(location.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }
      const raw = await res.json();
      const mapped = mapApiResponse(raw);
      setWeatherData(mapped);
      // Fire recommendation in parallel – don't block main UI
      fetchRecommendation(raw, mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Hero card weather theme (Samsung-style) ──────────────────────────
  const heroTheme = useMemo(() => {
    if (!weatherData) return null;
    const c    = weatherData.current.condition.toLowerCase();
    const code = weatherData.current.iconCode ?? '';
    const isNight = code.endsWith('n');     // OWM: '01n', '02n', etc.

    // ── Thunderstorm (day or night) ──
    if (c === 'thunderstorm' || c.includes('thunder') || c.includes('storm'))
      return { bg: 'from-gray-950 via-slate-900 to-purple-950', textDark: false, effect: 'thunder' as const };

    // ── Snow (day or night) ──
    if (c === 'snow' || c.includes('snow') || c.includes('sleet') || c.includes('blizzard'))
      return { bg: isNight ? 'from-slate-900 via-blue-950 to-indigo-950' : 'from-sky-200 via-blue-100 to-slate-200',
               textDark: !isNight, effect: 'snow' as const };

    // ── Rain / Drizzle ──
    if (c === 'rain' || c === 'drizzle' || c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
      return { bg: isNight ? 'from-gray-950 via-slate-900 to-blue-950' : 'from-slate-800 via-blue-900 to-slate-900',
               textDark: false, effect: 'rain' as const };

    // ── Atmosphere (mist / fog / haze / smoke / dust / sand / ash) ──
    if (c === 'mist' || c === 'fog' || c === 'haze' || c === 'smoke' || c === 'dust' ||
        c === 'sand' || c === 'ash' || c === 'squall' || c === 'tornado')
      return { bg: isNight ? 'from-gray-900 via-slate-800 to-gray-900' : 'from-gray-500 via-slate-500 to-gray-600',
               textDark: false, effect: 'fog' as const };

    // ── Clouds ──
    if (c === 'clouds' || c.includes('cloud') || c.includes('overcast'))
      return { bg: isNight ? 'from-gray-900 via-slate-800 to-indigo-950' : 'from-slate-600 via-gray-500 to-slate-700',
               textDark: false, effect: 'cloudy' as const };

    // ── Clear Night — moon + stars ──
    if (isNight)
      return { bg: 'from-indigo-950 via-slate-900 to-blue-950', textDark: false, effect: 'night' as const };

    // ── Clear Day — sunny ──
    return { bg: 'from-amber-400 via-orange-300 to-sky-500', textDark: false, effect: 'sunny' as const };
  }, [weatherData?.current.condition, weatherData?.current.iconCode]);

  // Stable deterministic particle positions — never re-randomised on render
  const heroParticles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id:    i,
      x:     (i * 41 + 7)  % 100,
      delay: (i * 0.27)    % 3,
      dur:   1.4 + (i * 0.19) % 1.6,
      size:  1 + (i % 3),
      drift: ((i * 23 + 5) % 60) - 30,
    }))
  , []);

  const handleClear = () => {
    setWeatherData(null);
    setLocation('');
    setRecommendation(null);
  };

  const getUVLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Very High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 transition-all duration-500 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.slice(0, shouldReduceMotion ? 5 : 20).map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-blue-400/20 dark:bg-green-500/10"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              willChange: 'transform',
            }}
            animate={{ y: [0, -30, 0] }}
            transition={{
              duration: 8,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with Glassmorphism & Floating Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 relative"
        >
          {/* Floating Weather Icons */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -left-16 top-0 text-6xl opacity-20 pointer-events-none hidden lg:block"
            style={{ display: shouldReduceMotion ? 'none' : 'block', willChange: 'transform' }}
          >
            ☀️
          </motion.div>
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -right-16 top-8 text-6xl opacity-20 pointer-events-none hidden lg:block"
            style={{ display: shouldReduceMotion ? 'none' : 'block', willChange: 'transform' }}
          >
            🌧️
          </motion.div>
          <motion.div
            animate={{
              y: [0, -10, 0],
              x: [0, 5, 0]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute left-1/4 -top-8 text-5xl opacity-15 pointer-events-none hidden lg:block"
            style={{ willChange: 'transform' }}
          >
            ⛅
          </motion.div>
          <motion.div
            animate={{
              y: [0, -12, 0],
              x: [0, -5, 0]
            }}
            transition={{
              duration: 6.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute right-1/4 -top-4 text-5xl opacity-15 pointer-events-none hidden lg:block"
            style={{ willChange: 'transform' }}
          >
            🌩️
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="inline-block relative"
          >
            {/* Pulsing Glow Effect */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 dark:from-green-500 dark:via-emerald-600 dark:to-teal-600 blur-3xl rounded-full"
            />
            <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2 leading-tight transition-all duration-300">
              🌤️ Weather & Soil Intelligence
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300 font-medium"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Advanced Analytics for Precision Agriculture
            </motion.span>
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mt-4"
          >
            {[
              { icon: '☀️', text: 'Real-time Weather', color: 'from-orange-500 to-yellow-500' },
              { icon: '🌱', text: 'Soil Analysis', color: 'from-green-500 to-emerald-500' },
              { icon: '📊', text: '7-Day Forecast', color: 'from-blue-500 to-cyan-500' }
            ].map((pill, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                className={`px-4 py-2 rounded-full bg-gradient-to-r ${pill.color} text-white text-sm font-semibold shadow-lg flex items-center gap-2`}
              >
                <span>{pill.icon}</span>
                <span>{pill.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Search Section with Enhanced Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-gray-100 dark:border-green-700/50 p-6 mb-8"
        >
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative group">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              >
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400 transition-all duration-300 group-hover:scale-110" size={22} />
              </motion.div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter district or area name (e.g., Bhubaneswar, Cuttack)"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-green-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 dark:focus:ring-green-500/50 focus:border-blue-500 dark:focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200 font-medium shadow-inner"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              disabled={!location.trim() || isLoading}
              className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-600 text-white px-8 py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl overflow-hidden font-bold"
            >
              {/* Shimmer Effect */}
              <motion.div
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
              <Search size={20} className="relative z-10" />
              <span className="font-bold relative z-10">{isLoading ? 'Searching...' : 'Search'}</span>
            </motion.button>

            {/* Clear Button */}
            <AnimatePresence>
              {weatherData && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClear}
                  className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-4 rounded-2xl transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl overflow-hidden font-bold"
                  title="Clear results"
                >
                  <motion.div
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <X size={20} className="relative z-10" />
                  <span className="font-bold relative z-10">Clear</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Enhanced Loading State with Scanner Animation */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-center mb-8"
            >
              <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 rounded-3xl shadow-2xl border-2 border-blue-300/50 dark:border-green-700/50 p-8 transition-colors duration-300 overflow-hidden">
                {/* Rotating Border Effect */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-transparent border-t-blue-500 dark:border-t-green-500 border-r-purple-500 dark:border-r-emerald-500 rounded-3xl"
                />

                <div className="relative flex items-center space-x-6">
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.5, repeat: Infinity }
                      }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl"
                    >
                      <Sprout className="text-white" size={28} />
                    </motion.div>
                    {/* Pulsing Ring */}
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-500 dark:bg-green-500 rounded-2xl"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex space-x-3 mb-3">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-3 h-3 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 dark:from-green-400 dark:via-emerald-500 dark:to-teal-500 rounded-full shadow-lg"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.4, 1, 0.4],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-1">
                      Analyzing Weather Data
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                      Scanning patterns for <span className="text-blue-600 dark:text-green-400 font-bold">{location}</span>
                    </p>

                    {/* Progress Steps */}
                    <div className="mt-4 space-y-2">
                      {['Fetching data', 'Processing', 'Analyzing'].map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.3 }}
                          className="flex items-center space-x-2"
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: idx * 0.3
                            }}
                            className="w-2 h-2 bg-blue-500 dark:bg-green-500 rounded-full"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 font-medium flex items-center gap-3"
            >
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold">Could not fetch data</p>
                <p className="text-sm">{error}</p>
                <p className="text-xs mt-1 opacity-75">Make sure the Weather &amp; Soil Analysis server is running on port 3020.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weather Data */}
        {weatherData && (
          <div className="space-y-8">
            {/* ── Samsung-style animated weather hero card ── */}
            <div className="relative overflow-hidden rounded-3xl shadow-2xl min-h-[200px]">

              {/* Themed gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${heroTheme?.bg ?? 'from-indigo-600 via-purple-600 to-blue-700'} transition-all duration-700`} />

              {/* ── Live weather effect layer ── */}
              {!shouldReduceMotion && heroTheme && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">

                  {/* RAIN */}
                  {heroTheme.effect === 'rain' && heroParticles.map(p => (
                    <motion.div key={p.id}
                      className="absolute rounded-full bg-sky-200/50"
                      style={{ left: `${p.x}%`, width: 1.5, height: p.size * 8 + 14, top: -25, willChange: 'transform' }}
                      animate={{ y: ['0%', '120%'], opacity: [0, 0.65, 0] }}
                      transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                    />
                  ))}

                  {/* THUNDER – heavy rain streaks + lightning flash */}
                  {heroTheme.effect === 'thunder' && (
                    <>
                      {heroParticles.map(p => (
                        <motion.div key={p.id}
                          className="absolute rounded-full bg-blue-300/55"
                          style={{ left: `${p.x}%`, width: 1.5, height: p.size * 12 + 22, top: -30, rotate: '12deg', willChange: 'transform' }}
                          animate={{ y: ['0%', '120%'], opacity: [0, 0.8, 0] }}
                          transition={{ duration: p.dur * 0.72, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                        />
                      ))}
                      {/* Lightning glow flash */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: [0, 0, 0, 0.22, 0, 0.10, 0, 0] }}
                        transition={{ duration: 5, repeat: Infinity, times: [0, 0.22, 0.23, 0.235, 0.24, 0.25, 0.26, 1] }}
                        style={{ background: 'radial-gradient(ellipse at 62% 18%, rgba(255,255,170,0.65) 0%, transparent 65%)', willChange: 'opacity' }}
                      />
                      {/* Lightning bolt SVG */}
                      <motion.svg
                        viewBox="0 0 24 48"
                        className="absolute"
                        style={{ width: 28, top: '5%', left: '58%', willChange: 'opacity' }}
                        animate={{ opacity: [0, 0, 0, 1, 0, 0.5, 0, 0] }}
                        transition={{ duration: 5, repeat: Infinity, times: [0, 0.22, 0.23, 0.235, 0.24, 0.25, 0.26, 1] }}
                      >
                        <polyline points="16,0 7,26 13,26 6,48 22,18 14,18" fill="rgba(255,255,150,0.95)" stroke="rgba(255,220,50,0.8)" strokeWidth="1" />
                      </motion.svg>
                    </>
                  )}

                  {/* SNOW – drifting snowflakes */}
                  {heroTheme.effect === 'snow' && heroParticles.map(p => (
                    <motion.div key={p.id}
                      className="absolute select-none text-blue-300/75"
                      style={{ left: `${p.x}%`, fontSize: p.size * 5 + 8, top: -24, willChange: 'transform' }}
                      animate={{ y: ['0%', '112%'], x: [0, p.drift * 0.35, 0, p.drift * -0.25, 0] }}
                      transition={{ duration: p.dur * 3.2, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                    >
                      ❄
                    </motion.div>
                  ))}

                  {/* SUNNY – sun disc + rotating rays + sparkles */}
                  {heroTheme.effect === 'sunny' && (
                    <>
                      {/* Glow halo */}
                      <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-yellow-200/25 blur-3xl" />
                      {/* Sun disc */}
                      <motion.div
                        className="absolute top-3 right-3 w-36 h-36 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300"
                        animate={{ scale: [1, 1.07, 1], opacity: [0.82, 1, 0.82] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{ boxShadow: '0 0 80px 35px rgba(251,191,36,0.38)', willChange: 'transform, opacity' }}
                      />
                      {/* Rotating rays */}
                      <motion.div
                        className="absolute top-3 right-3 w-36 h-36"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                        style={{ willChange: 'transform' }}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i}
                            className="absolute bg-yellow-200/55 rounded-full"
                            style={{
                              width: 3, height: 24,
                              left: '50%', top: '50%',
                              transformOrigin: '50% 0',
                              transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-${18 + 80}px)`,
                            }}
                          />
                        ))}
                      </motion.div>
                      {/* Tiny sparkles */}
                      {heroParticles.slice(0, 9).map(p => (
                        <motion.div key={p.id}
                          className="absolute w-1 h-1 rounded-full bg-yellow-100/70"
                          style={{ left: `${p.x * 0.55}%`, top: `${(p.id * 13 + 8) % 82}%` }}
                          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.6, 0.5] }}
                          transition={{ duration: p.dur * 1.6, repeat: Infinity, delay: p.delay }}
                        />
                      ))}
                    </>
                  )}

                  {/* CLOUDY – drifting soft blobs */}
                  {heroTheme.effect === 'cloudy' && [0, 1, 2, 3].map(i => (
                    <motion.div key={i}
                      className="absolute rounded-full blur-2xl"
                      style={{ width: 120 + i * 65, height: 52 + i * 18, top: `${6 + i * 22}%`, left: -90, background: 'rgba(255,255,255,0.07)' }}
                      animate={{ x: ['0px', `${190 + i * 55}px`, '0px'] }}
                      transition={{ duration: 9 + i * 2.5, repeat: Infinity, ease: 'linear', delay: i * 1.8 }}
                    />
                  ))}

                  {/* FOG – drifting translucent bands */}
                  {heroTheme.effect === 'fog' && [0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute w-full blur-3xl"
                      style={{ height: 44 + i * 16, top: `${14 + i * 28}%`, background: 'rgba(255,255,255,0.11)' }}
                      animate={{ x: ['-18%', '18%', '-18%'], opacity: [0.45, 0.85, 0.45] }}
                      transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i }}
                    />
                  ))}

                  {/* NIGHT – glowing moon + twinkling stars */}
                  {heroTheme.effect === 'night' && (
                    <>
                      {/* Moon glow halo */}
                      <div className="absolute -top-10 right-8 w-52 h-52 rounded-full bg-indigo-300/10 blur-3xl" />
                      {/* Moon disc */}
                      <motion.div
                        className="absolute top-4 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200"
                        animate={{ opacity: [0.82, 1, 0.82], scale: [1, 1.04, 1] }}
                        transition={{ duration: 5, repeat: Infinity }}
                        style={{ boxShadow: '0 0 55px 22px rgba(253,224,71,0.18)', willChange: 'transform, opacity' }}
                      >
                        {/* Crescent mask */}
                        <div className="absolute top-1 right-1 w-16 h-16 rounded-full bg-indigo-950/80" />
                      </motion.div>
                      {/* Stars */}
                      {heroParticles.map(p => (
                        <motion.div key={p.id}
                          className="absolute rounded-full bg-white"
                          style={{
                            width:  p.size <= 1 ? 1.5 : p.size <= 2 ? 2 : 3,
                            height: p.size <= 1 ? 1.5 : p.size <= 2 ? 2 : 3,
                            left: `${p.x}%`,
                            top:  `${(p.id * 17 + 6) % 85}%`,
                            willChange: 'opacity, transform',
                          }}
                          animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.5, 0.8] }}
                          transition={{ duration: p.dur * 2.2, repeat: Infinity, delay: p.delay }}
                        />
                      ))}
                      {/* Occasional shooting star */}
                      <motion.div
                        className="absolute h-px rounded-full"
                        style={{ width: 70, top: '18%', left: '22%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', rotate: '-28deg', willChange: 'transform, opacity' }}
                        animate={{ x: [0, 160, 160], opacity: [0, 1, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 7, ease: 'easeOut' }}
                      />
                    </>
                  )}

                </div>
              )}

              {/* Bottom vignette for text legibility */}
              <div className={`absolute inset-0 ${
                heroTheme?.textDark
                  ? 'bg-gradient-to-t from-white/10 to-transparent'
                  : 'bg-gradient-to-t from-black/35 via-transparent to-black/10'
              }`} />

              {/* ── Card Content ── */}
              <div className="relative p-7 md:p-9">
                <div className="flex items-start justify-between gap-4">

                  {/* Left column: location + temperature */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-1.5 mb-2 ${heroTheme?.textDark ? 'text-gray-700' : 'text-white/75'}`}>
                      <MapPin size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest truncate">{weatherData.location}</span>
                    </div>
                    <div className={`leading-none font-thin mb-1 ${heroTheme?.textDark ? 'text-gray-900' : 'text-white'}`}
                      style={{ fontSize: 'clamp(4rem, 10vw, 6rem)' }}
                    >
                      {weatherData.current.temperature}<span style={{ fontSize: '2.5rem' }}>°</span>
                    </div>
                    <div className={`text-xl font-semibold mb-1 ${heroTheme?.textDark ? 'text-gray-800' : 'text-white'}`}>
                      {weatherData.current.condition}
                    </div>
                    <div className={`text-sm ${heroTheme?.textDark ? 'text-gray-600' : 'text-white/65'}`}>
                      Feels like {weatherData.current.temperature - 2}°
                      &nbsp;·&nbsp;H:{weatherData.forecast[0]?.high ?? '--'}°
                      &nbsp;L:{weatherData.forecast[0]?.low ?? '--'}°
                    </div>
                  </div>

                  {/* Right column: floating icon */}
                  <div className="shrink-0 mt-2">
                    <motion.div
                      animate={shouldReduceMotion ? {} : { y: [0, -10, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ willChange: 'transform' }}
                    >
                      <img
                        src={`https://openweathermap.org/img/wn/${weatherData.current.iconCode}@4x.png`}
                        alt={weatherData.current.condition}
                        className="w-28 h-28 md:w-36 md:h-36 drop-shadow-2xl select-none"
                        draggable={false}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Bottom info strip */}
                <div className={`flex flex-wrap gap-x-5 gap-y-1 mt-5 pt-4 border-t text-sm font-medium ${
                  heroTheme?.textDark
                    ? 'border-gray-400/30 text-gray-700'
                    : 'border-white/20 text-white/75'
                }`}>
                  <span className="flex items-center gap-1.5"><Droplets size={13} />{weatherData.current.humidity}% Humidity</span>
                  <span className="flex items-center gap-1.5"><Wind size={13} />{weatherData.current.windSpeed} km/h Wind</span>
                  <span className="flex items-center gap-1.5"><Eye size={13} />{weatherData.current.visibility} km Visibility</span>
                  <span className="flex items-center gap-1.5"><Gauge size={13} />{weatherData.current.pressure} hPa</span>
                </div>
              </div>
            </div>

            {/* Weather Details Cards - Glassmorphism Design */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* UV Index */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-orange-500/20 to-yellow-500/20 dark:from-orange-500/10 dark:to-yellow-500/10 rounded-2xl shadow-lg border border-orange-300/30 dark:border-orange-500/20 p-5 transition-all duration-300 hover:shadow-orange-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    style={{ willChange: 'transform' }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sun className="text-orange-500 dark:text-orange-400" size={24} />
                  </motion.div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">UV Index</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {weatherData.current.uvIndex}
                </div>
                <div className={`text-xs px-3 py-1 rounded-full ${getUVLevel(weatherData.current.uvIndex).bg} ${getUVLevel(weatherData.current.uvIndex).color} font-semibold`}>
                  {getUVLevel(weatherData.current.uvIndex).level}
                </div>
              </motion.div>

              {/* Humidity */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-2xl shadow-lg border border-blue-300/30 dark:border-blue-500/20 p-5 transition-all duration-300 hover:shadow-blue-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    style={{ willChange: 'transform' }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Droplets className="text-blue-500 dark:text-blue-400" size={24} />
                  </motion.div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Humidity</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {weatherData.current.humidity}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Moisture level</div>
              </motion.div>

              {/* Wind */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-gray-400/20 to-slate-500/20 dark:from-gray-500/10 dark:to-slate-500/10 rounded-2xl shadow-lg border border-gray-300/30 dark:border-gray-500/20 p-5 transition-all duration-300 hover:shadow-gray-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    style={{ willChange: 'transform' }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Wind className="text-gray-600 dark:text-gray-400" size={24} />
                  </motion.div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Wind</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {weatherData.current.windSpeed}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">km/h</div>
              </motion.div>

              {/* Sunrise */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-yellow-400/20 to-amber-500/20 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-2xl shadow-lg border border-yellow-300/30 dark:border-yellow-500/20 p-5 transition-all duration-300 hover:shadow-yellow-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <Sunrise className="text-yellow-600 dark:text-yellow-400" size={24} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Sunrise</span>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {weatherData.current.sunrise}
                </div>
              </motion.div>

              {/* Sunset */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-orange-400/20 to-red-500/20 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl shadow-lg border border-orange-300/30 dark:border-orange-500/20 p-5 transition-all duration-300 hover:shadow-orange-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <Sunset className="text-orange-600 dark:text-orange-400" size={24} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Sunset</span>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {weatherData.current.sunset}
                </div>
              </motion.div>

              {/* Visibility */}
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="group bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-2xl shadow-lg border border-purple-300/30 dark:border-purple-500/20 p-5 transition-all duration-300 hover:shadow-purple-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <Eye className="text-purple-600 dark:text-purple-400" size={24} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Visibility</span>
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {weatherData.current.visibility}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">km</div>
              </motion.div>
            </div>

            {/* 7-Day Forecast - Modern Card Design */}
            <div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  style={{ willChange: 'transform' }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calendar className="mr-3 text-blue-500 dark:text-blue-400" size={28} />
                </motion.div>
                7-Day Forecast
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {weatherData.forecast.map((day, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -8 }}
                    className="group text-center p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border border-blue-200 dark:border-blue-700/40 transition-shadow duration-200 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer"
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-base">{day.day}</div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      style={{ willChange: 'transform' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl mb-2"
                    >
                      {day.icon}
                    </motion.div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">{day.condition}</div>
                    {/* High / Low */}
                    <div className="flex justify-center gap-2 text-sm mb-2">
                      <span className="font-bold text-red-500 dark:text-red-400">{day.high}°</span>
                      <span className="text-gray-500 dark:text-gray-400">{day.low}°</span>
                    </div>
                    {/* Precipitation */}
                    <div className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                      <CloudRain size={12} className="mr-1" />{day.precipitation}%
                    </div>
                    {/* Humidity */}
                    <div className="flex items-center justify-center text-xs text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                      <Droplets size={12} className="mr-1" />{day.humidity}%
                    </div>
                    {/* Wind */}
                    <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-semibold">
                      <Wind size={12} className="mr-1" />{day.windSpeed} km/h
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Radar and Maps Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weather Radar – Windy live precipitation */}
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 dark:from-green-500/10 dark:to-blue-500/10 rounded-3xl shadow-2xl border border-green-300/30 dark:border-green-500/20 p-6 transition-all duration-300">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    style={{ willChange: 'transform' }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Navigation className="mr-3 text-green-500 dark:text-green-400" size={28} />
                  </motion.div>
                  Live Precipitation Radar
                </h3>
                <div className="rounded-2xl overflow-hidden border border-green-300/40 dark:border-green-700/40 shadow-inner" style={{ height: '320px' }}>
                  <iframe
                    key={`radar-${weatherData.location}`}
                    title="Windy Precipitation Radar"
                    src={`https://embed.windy.com/embed2.html?lat=${weatherData.lat}&lon=${weatherData.lon}&detailLat=${weatherData.lat}&detailLon=${weatherData.lon}&width=650&height=320&zoom=7&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Powered by Windy • Live precipitation & wind overlay</p>
              </div>

              {/* Satellite Map – Google Maps satellite view */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl shadow-2xl border border-blue-300/30 dark:border-blue-500/20 p-6 transition-all duration-300">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <Map className="mr-3 text-blue-500 dark:text-blue-400" size={28} />
                  Satellite Map
                </h3>
                <div className="rounded-2xl overflow-hidden border border-blue-300/40 dark:border-blue-700/40 shadow-inner" style={{ height: '320px' }}>
                  <iframe
                    key={`satellite-${weatherData.location}`}
                    title="Google Maps Satellite"
                    src={`https://maps.google.com/maps?q=${weatherData.lat},${weatherData.lon}&z=11&t=k&output=embed`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Powered by Google Maps • Satellite & terrain imagery</p>
              </div>
            </div>

            {/* ── Hourly Weather Analysis (Today) ── */}
            <HourlyWeatherAnalysis lat={weatherData.lat} lon={weatherData.lon} locationName={weatherData.location} />

            {/* Soil Analysis - Completely Redesigned with Animations */}
            <div
              className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 rounded-3xl shadow-2xl border border-green-200 dark:border-green-800 p-8"
            >
              {/* Header with Icon Animation */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    style={{ willChange: 'transform' }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sprout className="mr-3 text-green-600 dark:text-green-400" size={36} />
                  </motion.div>
                  Soil Intelligence Analysis
                </h3>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  style={{ willChange: 'opacity' }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold"
                >
                  <Activity size={20} />
                  <span className="text-sm">Live Data</span>
                </motion.div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
                📍 Analysis for: <span className="text-green-600 dark:text-green-400 font-bold">{weatherData.location}</span>
              </div>

              {/* ── Soil Identity Card ── */}
              {(weatherData.soil.localName || weatherData.soil.scientificName || weatherData.soil.soilType) && (
                <div className="mb-8 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-2xl border border-teal-200 dark:border-teal-700/40 p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-teal-800 dark:text-teal-300 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🌍</span> Soil Identity
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {weatherData.soil.localName && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-teal-200/60 dark:border-teal-700/30">
                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">Local Name</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{weatherData.soil.localName}</p>
                      </div>
                    )}
                    {weatherData.soil.scientificName && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-teal-200/60 dark:border-teal-700/30">
                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">Scientific Name</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 italic">{weatherData.soil.scientificName}</p>
                      </div>
                    )}
                    {weatherData.soil.commonName && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-teal-200/60 dark:border-teal-700/30">
                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">Common Name (EN)</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{weatherData.soil.commonName}</p>
                      </div>
                    )}
                    {weatherData.soil.soilType && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-teal-200/60 dark:border-teal-700/30">
                        <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">Soil Type</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{weatherData.soil.soilType}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Soil Metrics - Circular Progress Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Soil Moisture */}
                <div
                  className="relative bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-700/40 shadow-xl"
                >

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        style={{ willChange: 'transform' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Droplets className="text-blue-500 dark:text-blue-400" size={28} />
                      </motion.div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">Soil Moisture</span>
                    </div>

                    {/* Circular Progress */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-blue-200 dark:text-blue-800"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-blue-500 dark:text-blue-400"
                            initial={{ strokeDasharray: "0 352" }}
                            animate={{
                              strokeDasharray: `${(weatherData.soil.moisture / 100) * 352} 352`,
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {weatherData.soil.moisture}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${weatherData.soil.moisture}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-center mt-3 text-gray-600 dark:text-gray-400 font-medium">
                      {weatherData.soil.moisture > 70 ? 'Optimal' : weatherData.soil.moisture > 50 ? 'Good' : 'Low'} moisture level
                    </p>
                  </div>
                </div>

                {/* pH Level */}
                <div
                  className="relative bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-3xl p-6 border border-green-200 dark:border-green-700/40 shadow-xl"
                >

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        style={{ willChange: 'transform' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <TestTube className="text-green-500 dark:text-green-400" size={28} />
                      </motion.div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">pH Level</span>
                    </div>

                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-green-200 dark:text-green-800"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-green-500 dark:text-green-400"
                            initial={{ strokeDasharray: "0 352" }}
                            animate={{
                              strokeDasharray: `${((weatherData.soil.ph - 4) / 10) * 352} 352`,
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {weatherData.soil.ph}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* pH Scale */}
                    <div className="relative w-full h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mb-2">
                      <motion.div
                        className="absolute top-0 w-2 h-3 bg-white border-2 border-gray-800"
                        initial={{ left: '0%' }}
                        animate={{ left: `${((weatherData.soil.ph - 4) / 10) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-center mt-3 text-gray-600 dark:text-gray-400 font-medium">
                      {weatherData.soil.ph < 6.5 ? '🔴 Acidic' : weatherData.soil.ph > 7.5 ? '🔵 Alkaline' : '🟢 Neutral'} soil
                    </p>
                  </div>
                </div>

                {/* Soil Temperature */}
                <div
                  className="relative bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-3xl p-6 border border-orange-200 dark:border-orange-700/40 shadow-xl"
                >

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        style={{ willChange: 'transform' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Thermometer className="text-orange-500 dark:text-orange-400" size={28} />
                      </motion.div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">Soil Temp</span>
                    </div>

                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-orange-200 dark:text-orange-800"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeLinecap="round"
                            className="text-orange-500 dark:text-orange-400"
                            initial={{ strokeDasharray: "0 352" }}
                            animate={{
                              strokeDasharray: `${(weatherData.soil.temperature / 40) * 352} 352`,
                            }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                              {weatherData.soil.temperature}°C
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Temperature Bar */}
                    <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(weatherData.soil.temperature / 40) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-center mt-3 text-gray-600 dark:text-gray-400 font-medium">
                      Ground level temperature
                    </p>
                  </div>
                </div>
              </div>

              {/* NPK Nutrient Levels - Modern Card Design */}
              <div
                className="mb-8"
              >
                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <TrendingUp className="mr-2 text-purple-500 dark:text-purple-400" size={24} />
                  NPK Nutrient Analysis
                </h4>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Nitrogen */}
                  <div
                    className="bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-2xl p-6 text-center border border-yellow-300 dark:border-yellow-700/40 shadow-lg"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      style={{ willChange: 'transform' }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="text-yellow-600 dark:text-yellow-400 mb-3"
                    >
                      <Gauge size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">Nitrogen (N)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-1"
                    >
                      {weatherData.soil.nitrogen}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">kg/ha</div>
                    <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-900/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-yellow-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(weatherData.soil.nitrogen / 300) * 100}%` }}
                        transition={{ duration: 1.2 }}
                      />
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div
                    className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-2xl p-6 text-center border border-purple-200 dark:border-purple-700/40 shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      style={{ willChange: 'transform' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-purple-600 dark:text-purple-400 mb-3"
                    >
                      <Activity size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">Phosphorus (P)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-1"
                    >
                      {weatherData.soil.phosphorus}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">kg/ha</div>
                    <div className="mt-3 w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-purple-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(weatherData.soil.phosphorus / 100) * 100}%` }}
                        transition={{ duration: 1.2 }}
                      />
                    </div>
                  </div>

                  {/* Potassium */}
                  <div
                    className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 rounded-2xl p-6 text-center border border-red-200 dark:border-red-700/40 shadow-lg"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      style={{ willChange: 'transform' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-red-600 dark:text-red-400 mb-3"
                    >
                      <Zap size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">Potassium (K)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                      className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-1"
                    >
                      {weatherData.soil.potassium}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">kg/ha</div>
                    <div className="mt-3 w-full bg-red-200 dark:bg-red-900/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-red-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(weatherData.soil.potassium / 300) * 100}%` }}
                        transition={{ duration: 1.2 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Nutrition Profile ── */}
              {(weatherData.soil.majorNutrients || weatherData.soil.mineralsPresent || weatherData.soil.organicMatter) && (
                <div className="mb-8 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-2xl border border-amber-200 dark:border-amber-700/40 p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🧪</span> Nutrition Profile
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {weatherData.soil.majorNutrients && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-amber-200/60 dark:border-amber-700/30">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Major Nutrients</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.majorNutrients}</p>
                      </div>
                    )}
                    {weatherData.soil.mineralsPresent && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-amber-200/60 dark:border-amber-700/30">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Minerals Present</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.mineralsPresent}</p>
                      </div>
                    )}
                    {weatherData.soil.organicMatter && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-amber-200/60 dark:border-amber-700/30">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Organic Matter</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.organicMatter}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Underground Water Analysis ── */}
              {(weatherData.soil.groundwaterAvailability || weatherData.soil.groundwaterDepth || weatherData.soil.groundwaterQuality || weatherData.soil.waterRetention) && (
                <div className="mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl border border-blue-200 dark:border-blue-700/40 p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-5 flex items-center gap-2">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ willChange: 'transform' }}>
                      <Waves size={22} className="text-blue-500 dark:text-blue-400" />
                    </motion.div>
                    Underground Water Analysis
                  </h4>

                  {/* Depth highlight */}
                  {weatherData.soil.groundwaterDepth && (
                    <div className="flex items-center gap-5 mb-5 bg-white/60 dark:bg-white/5 rounded-2xl p-4 border border-blue-200/60 dark:border-blue-700/30">
                      <div className="relative w-14 h-14 shrink-0">
                        {/* Animated water-level fill */}
                        <svg viewBox="0 0 56 56" className="w-14 h-14">
                          <circle cx="28" cy="28" r="26" stroke="#bfdbfe" strokeWidth="4" fill="transparent" />
                          <motion.circle cx="28" cy="28" r="26"
                            stroke="#3b82f6" strokeWidth="4" fill="transparent" strokeLinecap="round"
                            className="-rotate-90 origin-center"
                            initial={{ strokeDasharray: '0 164' }}
                            animate={{ strokeDasharray: '82 164' }}
                            transition={{ duration: 1.8, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Waves size={20} className="text-blue-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Groundwater Depth</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{weatherData.soil.groundwaterDepth} <span className="text-base font-medium text-gray-500">meters</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Estimated depth to water table</p>
                      </div>
                    </div>
                  )}

                  {/* Three info tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {weatherData.soil.groundwaterAvailability && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-blue-200/60 dark:border-blue-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets size={15} className="text-blue-500 shrink-0" />
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Availability</p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.groundwaterAvailability}</p>
                      </div>
                    )}
                    {weatherData.soil.groundwaterQuality && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-blue-200/60 dark:border-blue-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube size={15} className="text-cyan-500 shrink-0" />
                          <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">Water Quality</p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.groundwaterQuality}</p>
                      </div>
                    )}
                    {weatherData.soil.waterRetention && (
                      <div className="bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-blue-200/60 dark:border-blue-700/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={15} className="text-indigo-500 shrink-0" />
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Water Retention</p>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{weatherData.soil.waterRetention}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Soil Recommendation - Enhanced Card */}
              <div
                className="relative bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 dark:from-green-900/50 dark:via-emerald-900/50 dark:to-teal-900/50 border-l-8 border-green-500 dark:border-green-400 p-6 rounded-2xl shadow-xl"
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10"
                  animate={{ rotate: 360 }}
                  style={{ willChange: 'transform' }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sprout size={128} className="text-green-500" />
                </motion.div>

                <div className="relative z-10">
                  <h4 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center text-xl">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      style={{ willChange: 'transform' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-2 text-2xl"
                    >
                      🌾
                    </motion.span>
                    Expert Recommendation
                    {recLoading && (
                      <span className="ml-3 flex items-center gap-1.5">
                        {[0,1,2].map(i => (
                          <motion.span
                            key={i}
                            className="inline-block w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </span>
                    )}
                  </h4>
                  {recLoading ? (
                    <div className="space-y-2">
                      {[100, 90, 75].map((w, i) => (
                        <motion.div
                          key={i}
                          className="h-4 bg-green-300/50 dark:bg-green-700/40 rounded-full"
                          style={{ width: `${w}%` }}
                          animate={{ opacity: [0.4, 0.8, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                        🤖 AI is analyzing soil &amp; weather data for {weatherData.location}...
                      </p>
                    </div>
                  ) : (
                    <p className="text-green-700 dark:text-green-200 text-lg leading-relaxed font-medium">
                      {recommendation || weatherData.soil.recommendation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Tutorial */}
      <TutorialModal
        accentColor="green"
        pageTitle="Weather & Soil Analysis"
        pageDescription="Real-time weather, soil data, and AI crop recommendations for your farm."
        steps={[
          {
            title: 'Search Your Location',
            description: 'Type your city, village, or district name in the search bar and press Enter or click the Search button to load the weather data.',
            icon: <Search size={28} />,
            tip: 'Try typing the nearest town if your village is not found.',
          },
          {
            title: 'Use GPS Location',
            description: 'Click the "Use My Location" (Navigation) button to automatically detect your current location and fetch local weather data.',
            icon: <Navigation size={28} />,
            tip: 'Allow location permission in your browser for this to work.',
          },
          {
            title: 'Read the Forecast',
            description: 'Scroll down to see the 7-day weather forecast including temperature highs/lows, humidity, wind, and precipitation for each day.',
            icon: <CloudRain size={28} />,
          },
          {
            title: 'View Soil Analysis',
            description: 'Below the weather card you will find soil moisture, pH level, and nitrogen content for your selected location — all valuable for farming decisions.',
            icon: <Sprout size={28} />,
            tip: 'Soil data is estimated from satellite and meteorological models.',
          },
          {
            title: 'AI Crop Recommendation',
            description: 'Scroll to the bottom to see a personalized AI recommendation on which crops to grow and how to manage your soil based on current conditions.',
            icon: <TrendingUp size={28} />,
          },
        ]}
      />
    </div>
  );
};

export default WeatherPage;