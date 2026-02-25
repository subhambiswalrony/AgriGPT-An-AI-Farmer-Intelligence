import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    condition: string;
    icon: string;
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

  const generateWeatherData = (locationName: string): WeatherData => {
    const conditions = [
      { condition: 'Sunny', icon: '☀️' },
      { condition: 'Partly Cloudy', icon: '⛅' },
      { condition: 'Cloudy', icon: '☁️' },
      { condition: 'Light Rain', icon: '🌦️' },
      { condition: 'Heavy Rain', icon: '🌧️' },
      { condition: 'Clear', icon: '🌤️' }
    ];

    const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return {
      location: locationName,
      current: {
        temperature: Math.floor(Math.random() * 15) + 25, // 25-40°C
        condition: conditions[Math.floor(Math.random() * conditions.length)].condition,
        icon: conditions[Math.floor(Math.random() * conditions.length)].icon,
        humidity: Math.floor(Math.random() * 30) + 60, // 60-90%
        windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        uvIndex: Math.floor(Math.random() * 8) + 3, // 3-11
        visibility: Math.floor(Math.random() * 5) + 8, // 8-13 km
        sunrise: '06:15 AM',
        sunset: '06:45 PM',
        pressure: Math.floor(Math.random() * 50) + 1000 // 1000-1050 hPa
      },
      forecast: days.map((day, index) => ({
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString(),
        day,
        high: Math.floor(Math.random() * 10) + 30,
        low: Math.floor(Math.random() * 10) + 20,
        condition: conditions[Math.floor(Math.random() * conditions.length)].condition,
        icon: conditions[Math.floor(Math.random() * conditions.length)].icon,
        humidity: Math.floor(Math.random() * 30) + 60,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        precipitation: Math.floor(Math.random() * 80) + 10
      })),
      soil: {
        moisture: Math.floor(Math.random() * 40) + 40, // 40-80%
        ph: parseFloat((Math.random() * 2 + 6).toFixed(1)), // 6.0-8.0
        nitrogen: Math.floor(Math.random() * 50) + 200, // 200-250 kg/ha
        phosphorus: Math.floor(Math.random() * 30) + 40, // 40-70 kg/ha
        potassium: Math.floor(Math.random() * 100) + 150, // 150-250 kg/ha
        temperature: Math.floor(Math.random() * 8) + 22, // 22-30°C
        recommendation: 'मिट्टी की स्थिति अच्छी है। धान और गेहूं की खेती के लिए उपयुक्त है।'
      }
    };
  };

  const handleSearch = () => {
    if (!location.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      const data = generateWeatherData(location);
      setWeatherData(data);
      setIsLoading(false);
    }, 2000);
  };

  const handleClear = () => {
    setWeatherData(null);
    setLocation('');
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
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
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
            style={{ display: shouldReduceMotion ? 'none' : 'block' }}
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
            style={{ display: shouldReduceMotion ? 'none' : 'block' }}
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
                className={`px-4 py-2 rounded-full bg-gradient-to-r ${pill.color} text-white text-sm font-semibold shadow-lg backdrop-blur-sm flex items-center gap-2`}
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
          className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl border-2 border-white/50 dark:border-green-700/50 p-6 mb-8 transition-all duration-300"
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
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-green-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 dark:focus:ring-green-500/50 focus:border-blue-500 dark:focus:border-green-500 bg-white/90 dark:bg-gray-700/90 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 backdrop-blur-sm font-medium shadow-inner"
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
              <div className="relative backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 rounded-3xl shadow-2xl border-2 border-blue-300/50 dark:border-green-700/50 p-8 transition-colors duration-300 overflow-hidden">
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

        {/* Weather Data */}
        {weatherData && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Current Weather - Redesigned with Gradient Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl shadow-2xl"
            >
              {/* Animated Gradient Background */}
              <motion.div
                animate={{
                  background: [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  ],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute inset-0"
              />

              {/* Content Overlay */}
              <div className="relative backdrop-blur-sm bg-black/10 p-8">
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{weatherData.location}</h2>
                    <p className="text-white/90 text-lg">Current Conditions</p>
                  </motion.div>

                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-right"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-6xl mb-3"
                    >
                      {weatherData.current.icon}
                    </motion.div>
                    <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                      {weatherData.current.temperature}°C
                    </div>
                    <div className="text-white/90 text-xl">{weatherData.current.condition}</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Weather Details Cards - Glassmorphism Design */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* UV Index */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 dark:from-orange-500/10 dark:to-yellow-500/10 rounded-2xl shadow-lg border border-orange-300/30 dark:border-orange-500/20 p-5 transition-all duration-300 hover:shadow-orange-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-2xl shadow-lg border border-blue-300/30 dark:border-blue-500/20 p-5 transition-all duration-300 hover:shadow-blue-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-gray-400/20 to-slate-500/20 dark:from-gray-500/10 dark:to-slate-500/10 rounded-2xl shadow-lg border border-gray-300/30 dark:border-gray-500/20 p-5 transition-all duration-300 hover:shadow-gray-500/30 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 dark:from-yellow-500/10 dark:to-amber-500/10 rounded-2xl shadow-lg border border-yellow-300/30 dark:border-yellow-500/20 p-5 transition-all duration-300 hover:shadow-yellow-500/30 hover:shadow-2xl"
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-orange-400/20 to-red-500/20 dark:from-orange-500/10 dark:to-red-500/10 rounded-2xl shadow-lg border border-orange-300/30 dark:border-orange-500/20 p-5 transition-all duration-300 hover:shadow-orange-500/30 hover:shadow-2xl"
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-2xl shadow-lg border border-purple-300/30 dark:border-purple-500/20 p-5 transition-all duration-300 hover:shadow-purple-500/30 hover:shadow-2xl"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 transition-all duration-300"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
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
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -8 }}
                    className="group text-center p-5 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer"
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-lg">{day.day}</div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      className="text-4xl mb-3"
                    >
                      {day.icon}
                    </motion.div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">{day.condition}</div>
                    <div className="flex justify-center gap-3 text-sm mb-2">
                      <span className="font-bold text-red-500 dark:text-red-400">{day.high}°</span>
                      <span className="text-gray-500 dark:text-gray-400">{day.low}°</span>
                    </div>
                    <div className="flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2">
                      <CloudRain size={14} className="mr-1" />
                      {day.precipitation}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Radar and Maps Section - Glassmorphism */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 dark:from-green-500/10 dark:to-blue-500/10 rounded-3xl shadow-2xl border border-green-300/30 dark:border-green-500/20 p-8 transition-all duration-300 hover:shadow-green-500/30"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Navigation className="mr-3 text-green-500 dark:text-green-400" size={28} />
                  </motion.div>
                  Weather Radar
                </h3>
                <motion.div
                  className="relative bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-2xl h-72 flex items-center justify-center overflow-hidden border border-blue-200/50 dark:border-blue-700/30"
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Radar Animation */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      background: [
                        'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                        'radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                        'radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="text-center relative z-10">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl mb-3"
                    >
                      🌦️
                    </motion.div>
                    <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Interactive Radar Map</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Precipitation patterns & alerts</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-3xl shadow-2xl border border-blue-300/30 dark:border-blue-500/20 p-8 transition-all duration-300 hover:shadow-blue-500/30"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                  <Map className="mr-3 text-blue-500 dark:text-blue-400" size={28} />
                  Satellite Map
                </h3>
                <motion.div
                  className="relative bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-2xl h-72 flex items-center justify-center overflow-hidden border border-green-200/50 dark:border-green-700/30"
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Satellite Animation */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                      backgroundSize: '30px 30px',
                    }}
                  />
                  <div className="text-center relative z-10">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-6xl mb-3"
                    >
                      🛰️
                    </motion.div>
                    <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Satellite Imagery</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Cloud coverage & terrain</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Soil Analysis - Completely Redesigned with Animations */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-3xl shadow-2xl border border-green-300/30 dark:border-green-700/30 p-8 transition-all duration-300"
            >
              {/* Header with Icon Animation */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sprout className="mr-3 text-green-600 dark:text-green-400" size={36} />
                  </motion.div>
                  Soil Intelligence Analysis
                </h3>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
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

              {/* Primary Soil Metrics - Circular Progress Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Soil Moisture */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-3xl p-6 border border-blue-300/40 dark:border-blue-600/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                  {/* Animated Background Gradient */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      background: [
                        'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
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
                </motion.div>

                {/* pH Level */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10 rounded-3xl p-6 border border-green-300/40 dark:border-green-600/30 shadow-xl hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300"
                >
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      background: [
                        'radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
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
                </motion.div>

                {/* Soil Temperature */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="relative group backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 dark:from-orange-500/10 dark:to-amber-500/10 rounded-3xl p-6 border border-orange-300/40 dark:border-orange-600/30 shadow-xl hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300"
                >
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      background: [
                        'radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.2) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.2) 0%, transparent 50%)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
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
                </motion.div>
              </div>

              {/* NPK Nutrient Levels - Modern Card Design */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="mb-8"
              >
                <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <TrendingUp className="mr-2 text-purple-500 dark:text-purple-400" size={24} />
                  NPK Nutrient Analysis
                </h4>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Nitrogen */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="backdrop-blur-sm bg-gradient-to-br from-yellow-400/30 to-amber-400/30 dark:from-yellow-500/20 dark:to-amber-500/20 rounded-2xl p-6 text-center border border-yellow-400/40 dark:border-yellow-600/30 shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="text-yellow-600 dark:text-yellow-400 mb-3"
                    >
                      <Gauge size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">Nitrogen (N)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" }}
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
                        transition={{ duration: 1.5, delay: 1.3 }}
                      />
                    </div>
                  </motion.div>

                  {/* Phosphorus */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="backdrop-blur-sm bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl p-6 text-center border border-purple-400/40 dark:border-purple-600/30 shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-purple-600 dark:text-purple-400 mb-3"
                    >
                      <Activity size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">Phosphorus (P)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.3, type: "spring" }}
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
                        transition={{ duration: 1.5, delay: 1.4 }}
                      />
                    </div>
                  </motion.div>

                  {/* Potassium */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="backdrop-blur-sm bg-gradient-to-br from-red-400/30 to-rose-400/30 dark:from-red-500/20 dark:to-rose-500/20 rounded-2xl p-6 text-center border border-red-400/40 dark:border-red-600/30 shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-red-600 dark:text-red-400 mb-3"
                    >
                      <Zap size={32} className="mx-auto" />
                    </motion.div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">Potassium (K)</div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring" }}
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
                        transition={{ duration: 1.5, delay: 1.5 }}
                      />
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Soil Recommendation - Enhanced Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                whileHover={{ scale: 1.02 }}
                className="relative backdrop-blur-xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 border-l-8 border-green-500 dark:border-green-400 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300"
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sprout size={128} className="text-green-500" />
                </motion.div>

                <div className="relative z-10">
                  <h4 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center text-xl">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-2 text-2xl"
                    >
                      🌾
                    </motion.span>
                    Expert Recommendation
                  </h4>
                  <p className="text-green-700 dark:text-green-200 text-lg leading-relaxed font-medium">
                    {weatherData.soil.recommendation}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeatherPage;