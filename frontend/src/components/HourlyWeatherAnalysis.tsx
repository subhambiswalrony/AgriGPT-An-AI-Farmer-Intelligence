/**
 * HourlyWeatherAnalysis – performance-first rewrite
 * Smooth scrolling: React.memo, useReducedMotion, CSS contain/will-change,
 * no JS-driven infinite animation loops, stable dot renderers.
 */
import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { WEATHER_API_BASE_URL } from '../config/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Brain,
  ChevronDown,
  Sun,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sprout,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface HourlyDataPoint {
  hour: number;          // 0–23
  label: string;         // "12 AM", "1 AM" …
  temperature: number;   // °C
  humidity: number;      // %
}

interface Insights {
  peakTemp: HourlyDataPoint;
  lowestTemp: HourlyDataPoint;
  highestHumidity: HourlyDataPoint;
  lowestHumidity: HourlyDataPoint;
  irrigationWindow: { start: HourlyDataPoint; end: HourlyDataPoint };
  avoidWindow: { start: HourlyDataPoint; end: HourlyDataPoint };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

interface InsightRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

// ─────────────────────────────────────────────
// 24-hour dummy data  (fallback when no location)
// ─────────────────────────────────────────────
const generateHourlyData = (): HourlyDataPoint[] => {
  const baseTemps = [
    22, 21.5, 21, 21, 21.5, 22, 23, 25, 27, 29, 31, 33,
    34, 34.5, 34, 33, 31.5, 30, 28.5, 27, 26, 25, 24, 23,
  ];
  const baseHumidity = [
    78, 80, 82, 83, 85, 87, 84, 78, 72, 65, 57, 50,
    46, 44, 45, 47, 51, 55, 60, 65, 68, 71, 74, 76,
  ];
  const fmt = (h: number) =>
    h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: fmt(i),
    temperature: parseFloat((baseTemps[i] + (Math.random() * 0.6 - 0.3)).toFixed(1)),
    humidity: Math.round(baseHumidity[i] + (Math.random() * 2 - 1)),
  }));
};

// ─────────────────────────────────────────────
// Derived AI Insights
// ─────────────────────────────────────────────
const computeInsights = (data: HourlyDataPoint[]): Insights => {
  const peakTemp = data.reduce((a, b) => (b.temperature > a.temperature ? b : a));
  const lowestTemp = data.reduce((a, b) => (b.temperature < a.temperature ? b : a));
  const highestHumidity = data.reduce((a, b) => (b.humidity > a.humidity ? b : a));
  const lowestHumidity = data.reduce((a, b) => (b.humidity < a.humidity ? b : a));

  const avgTemp = data.reduce((s, d) => s + d.temperature, 0) / data.length;
  const avgHumidity = data.reduce((s, d) => s + d.humidity, 0) / data.length;

  // Irrigation window: temp below average AND humidity above average
  const irrigationCandidates = data.filter(
    (d) => d.temperature < avgTemp && d.humidity > avgHumidity
  );
  const irrigationStart = irrigationCandidates.reduce((a, b) => (b.hour < a.hour ? b : a));
  const irrigationEnd = irrigationCandidates.reduce((a, b) => (b.hour > a.hour ? b : a));

  // Avoid window: temp more than 3°C above average AND humidity below average
  const avoidCandidates = data.filter(
    (d) => d.temperature > avgTemp + 3 && d.humidity < avgHumidity
  );
  const avoidStart = avoidCandidates.length
    ? avoidCandidates.reduce((a, b) => (b.hour < a.hour ? b : a))
    : data[11];
  const avoidEnd = avoidCandidates.length
    ? avoidCandidates.reduce((a, b) => (b.hour > a.hour ? b : a))
    : data[15];

  return {
    peakTemp,
    lowestTemp,
    highestHumidity,
    lowestHumidity,
    irrigationWindow: { start: irrigationStart, end: irrigationEnd },
    avoidWindow: { start: avoidStart, end: avoidEnd },
  };
};

// ─────────────────────────────────────────────
// Memoised tooltips (pointer-events-none = no
// hover jank while the chart repaints)
// ─────────────────────────────────────────────
const TempTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-600/40 rounded-xl shadow-xl px-4 py-3 text-sm pointer-events-none">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
        <Thermometer size={14} />
        <span>{payload[0].value}°C</span>
      </div>
    </div>
  );
});
TempTooltip.displayName = 'TempTooltip';

const HumidityTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-600/40 rounded-xl shadow-xl px-4 py-3 text-sm pointer-events-none">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      <div className="flex items-center gap-2 text-blue-600 dark:text-teal-400 font-semibold">
        <Droplets size={14} />
        <span>{payload[0].value}%</span>
      </div>
    </div>
  );
});
HumidityTooltip.displayName = 'HumidityTooltip';

// ─────────────────────────────────────────────
// Stable dot renderer factory
// (avoids creating a new inline function each
//  render, which causes Recharts to re-animate)
// ─────────────────────────────────────────────
const makeDotRenderer =
  (hi1: number, hi2: number, hColor: string, dColor: string) =>
  function Dot({ cx = 0, cy = 0, index = 0 }: CustomDotProps) {
    const isHi = index === hi1 || index === hi2;
    return (
      <circle
        cx={cx} cy={cy}
        r={isHi ? 6 : 3}
        fill={isHi ? hColor : dColor}
        stroke={isHi ? '#fff' : 'transparent'}
        strokeWidth={isHi ? 2 : 0}
      />
    );
  };

// ─────────────────────────────────────────────
// Insight Row
// ─────────────────────────────────────────────
const InsightRow = memo(({ icon, label, value, color }: InsightRowProps) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <div className={`mt-0.5 shrink-0 ${color}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-snug">{value}</p>
    </div>
  </div>
));
InsightRow.displayName = 'InsightRow';

// ─────────────────────────────────────────────
// Framer Motion variants (no spring wobble)
// ─────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;


const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.42, ease } },
};
const collapseVariants = {
  open:   { height: 'auto', opacity: 1, transition: { duration: 0.38, ease } },
  closed: { height: 0,      opacity: 0, transition: { duration: 0.28, ease: [0.55, 0, 1, 0.45] as const } },
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
interface HourlyWeatherAnalysisProps {
  lat?: number;
  lon?: number;
  locationName?: string;
}

const HourlyWeatherAnalysis = ({ lat, lon, locationName }: HourlyWeatherAnalysisProps) => {
  const shouldReduce = useReducedMotion();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'temperature' | 'humidity'>('temperature');
  const [hourlyData, setHourlyData] = useState<HourlyDataPoint[]>(() => generateHourlyData());
  const [dataLoading, setDataLoading] = useState(false);
  const [isRealData, setIsRealData] = useState(false);

  // Fetch real hourly data whenever lat/lon change
  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    let cancelled = false;
    setDataLoading(true);
    fetch(`${WEATHER_API_BASE_URL}/api/hourly-weather?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && Array.isArray(data.hourly) && data.hourly.length > 0) {
          setHourlyData(data.hourly);
          setIsRealData(true);
        }
      })
      .catch(() => { /* keep dummy data on error */ })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lon]);

  const insights    = useMemo(() => computeInsights(hourlyData), [hourlyData]);

  const xAxisTicks  = useMemo(
    () => hourlyData.filter(d => d.hour % 3 === 0).map(d => d.label),
    [hourlyData]
  );
  const tempDomain = useMemo<[number, number]>(() => {
    const v = hourlyData.map(d => d.temperature);
    return [Math.floor(Math.min(...v)) - 1, Math.ceil(Math.max(...v)) + 1];
  }, [hourlyData]);
  const humidityDomain = useMemo<[number, number]>(() => {
    const v = hourlyData.map(d => d.humidity);
    return [Math.floor(Math.min(...v)) - 2, Math.ceil(Math.max(...v)) + 2];
  }, [hourlyData]);

  /* Stable dot renderers – won't recreate on each render */
  const tempDot  = useMemo(
    () => makeDotRenderer(insights.peakTemp.hour,        insights.lowestTemp.hour,      '#ef4444', '#fdba74'),
    [insights.peakTemp.hour, insights.lowestTemp.hour]
  );
  const humidDot = useMemo(
    () => makeDotRenderer(insights.highestHumidity.hour, insights.lowestHumidity.hour,  '#14b8a6', '#7dd3fc'),
    [insights.highestHumidity.hour, insights.lowestHumidity.hour]
  );

  const toggleCollapse = useCallback(() => setIsCollapsed(v => !v), []);
  const setTemp        = useCallback(() => setActiveTab('temperature'), []);
  const setHumid       = useCallback(() => setActiveTab('humidity'), []);

  const cropTip = useMemo(() => {
    if (insights.peakTemp.temperature >= 33) return 'High heat stress — consider mulching & shade nets';
    if (insights.peakTemp.temperature >= 30) return 'Moderate heat — maintain soil moisture adequately';
    return 'Favourable conditions for field operations today';
  }, [insights.peakTemp.temperature]);

  return (
    <div
      style={{ contain: 'layout paint' }}
      className="rounded-3xl overflow-hidden shadow-2xl border border-green-200/60 dark:border-green-700/40 bg-white dark:bg-gray-800"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 md:px-7 py-5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-700 dark:via-emerald-700 dark:to-teal-700">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 p-2 bg-white/20 rounded-xl">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-white leading-tight truncate">
              Hourly Weather Analysis
            </h2>
            <p className="text-green-100/75 text-xs font-medium">
              {locationName ? `${locationName} · ` : ''}Today · 24-hour {isRealData ? 'real data' : 'prediction'}
            </p>
          </div>
          {/* Loading indicator or Live / Demo badge */}
          <div className="flex items-center gap-1.5 ml-1 bg-white/15 px-3 py-1 rounded-full shrink-0">
            {dataLoading ? (
              <>
                {[0, 1, 2].map(i => (
                  <motion.span key={i}
                    className="block w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
                <span className="text-xs font-semibold text-white/90 hidden sm:inline">Fetching...</span>
              </>
            ) : (
              <>
                <span className="block w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-xs font-semibold text-white/90 hidden sm:inline">{isRealData ? 'Live Data' : 'Demo'}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={toggleCollapse}
          className="shrink-0 ml-3 p-2 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl text-white transition-colors duration-200 cursor-pointer"
          aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ willChange: 'transform' }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </button>
      </div>

      {/* ── Collapsible body ────────────────────────────── */}
      <motion.div
        variants={collapseVariants}
        initial="open"
        animate={isCollapsed ? 'closed' : 'open'}
        style={{ overflow: 'hidden', willChange: 'height, opacity' }}
      >
        <div className="p-5 md:p-7 space-y-6">

          {/* ── Tab bar ──────────────────────────────────── */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700/60 p-1.5 rounded-2xl w-fit">
            {(['temperature', 'humidity'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={tab === 'temperature' ? setTemp : setHumid}
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer',
                    active
                      ? tab === 'temperature'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {tab === 'temperature' ? <Thermometer size={15} /> : <Droplets size={15} />}
                  <span className="capitalize">{tab}</span>
                </button>
              );
            })}
          </div>

          {/* ── Charts: both stay mounted – CSS opacity toggle prevents Recharts re-animation ── */}
          <div className="relative">
            {/* Temperature Chart */}
            <div
              className={[
                'transition-opacity duration-300 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-4 md:p-6 border border-orange-100 dark:border-orange-700/30',
                activeTab === 'temperature' ? 'relative opacity-100' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none',
              ].join(' ')}
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Thermometer className="text-orange-500" size={17} />
                    Temperature (°C) — 24 Hours
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-red-500">
                      <TrendingUp size={12} /> {insights.peakTemp.temperature}°C at {insights.peakTemp.label}
                    </span>
                    <span className="flex items-center gap-1 text-blue-500">
                      <TrendingDown size={12} /> {insights.lowestTemp.temperature}°C at {insights.lowestTemp.label}
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={hourlyData} margin={{ top: 18, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="tGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" strokeOpacity={0.25} />
                    <XAxis dataKey="label" ticks={xAxisTicks}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis domain={tempDomain}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}°`} width={36} />
                    <Tooltip content={<TempTooltip />} />
                    <ReferenceDot x={insights.peakTemp.label} y={insights.peakTemp.temperature}
                      r={7} fill="#ef4444" stroke="#fff" strokeWidth={2}
                      label={{ value: `▲ ${insights.peakTemp.temperature}°C`, position: 'top', fontSize: 11, fill: '#ef4444', fontWeight: 700 }} />
                    <ReferenceDot x={insights.lowestTemp.label} y={insights.lowestTemp.temperature}
                      r={7} fill="#3b82f6" stroke="#fff" strokeWidth={2}
                      label={{ value: `▼ ${insights.lowestTemp.temperature}°C`, position: 'bottom', fontSize: 11, fill: '#3b82f6', fontWeight: 700 }} />
                    <Line type="monotone" dataKey="temperature" stroke="url(#tGrad)" strokeWidth={3}
                      dot={tempDot}
                      activeDot={{ r: 7, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                      isAnimationActive={!shouldReduce} animationDuration={1400} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-8 h-[3px] bg-gradient-to-r from-orange-500 to-red-500 rounded-full inline-block" />
                    Temperature trend
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow inline-block" />
                    Peak · {insights.peakTemp.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow inline-block" />
                    Lowest · {insights.lowestTemp.label}
                  </span>
                </div>
            </div>

            {/* Humidity Chart */}
            <div
              className={[
                'transition-opacity duration-300 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-2xl p-4 md:p-6 border border-blue-100 dark:border-blue-700/30',
                activeTab === 'humidity' ? 'relative opacity-100' : 'absolute top-0 left-0 w-full opacity-0 pointer-events-none',
              ].join(' ')}
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Droplets className="text-blue-500" size={17} />
                    Humidity (%) — 24 Hours
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1 text-teal-600">
                      <TrendingUp size={12} /> {insights.highestHumidity.humidity}% at {insights.highestHumidity.label}
                    </span>
                    <span className="flex items-center gap-1 text-orange-500">
                      <TrendingDown size={12} /> {insights.lowestHumidity.humidity}% at {insights.lowestHumidity.label}
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={hourlyData} margin={{ top: 18, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="hGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="50%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" strokeOpacity={0.25} />
                    <XAxis dataKey="label" ticks={xAxisTicks}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis domain={humidityDomain}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v}%`} width={40} />
                    <Tooltip content={<HumidityTooltip />} />
                    <ReferenceDot x={insights.highestHumidity.label} y={insights.highestHumidity.humidity}
                      r={7} fill="#14b8a6" stroke="#fff" strokeWidth={2}
                      label={{ value: `▲ ${insights.highestHumidity.humidity}%`, position: 'top', fontSize: 11, fill: '#14b8a6', fontWeight: 700 }} />
                    <ReferenceDot x={insights.lowestHumidity.label} y={insights.lowestHumidity.humidity}
                      r={7} fill="#f97316" stroke="#fff" strokeWidth={2}
                      label={{ value: `▼ ${insights.lowestHumidity.humidity}%`, position: 'bottom', fontSize: 11, fill: '#f97316', fontWeight: 700 }} />
                    <Line type="monotone" dataKey="humidity" stroke="url(#hGrad)" strokeWidth={3}
                      dot={humidDot}
                      activeDot={{ r: 7, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                      isAnimationActive={!shouldReduce} animationDuration={1400} animationEasing="ease-out" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-4 mt-3 justify-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-8 h-[3px] bg-gradient-to-r from-blue-500 to-teal-500 rounded-full inline-block" />
                    Humidity trend
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow inline-block" />
                    Highest · {insights.highestHumidity.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow inline-block" />
                    Lowest · {insights.lowestHumidity.label}
                  </span>
                </div>
            </div>
          </div>

          {/* ── AI Insight Box ───────────────────────────── */}
          <motion.div
            variants={shouldReduce ? undefined : fadeUp}
            initial="hidden" animate="show"
            style={{ contain: 'layout paint' }}
            className="rounded-2xl overflow-hidden border border-green-200 dark:border-green-700/40 shadow-lg"
          >
            {/* Header strip */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700">
              <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                <Brain className="text-white" size={17} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white leading-tight">Smart AI Insight</h3>
                <p className="text-green-100/70 text-xs truncate">Dynamically calculated from today's 24-hour data</p>
              </div>
              {/* CSS-only pulse */}
              <div className="ml-auto flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse block" />
                <span className="text-xs text-white/80 font-medium">AI Active</span>
              </div>
            </div>

            {/* Two-column grid */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700/50 bg-white/90 dark:bg-gray-800/80 px-5 py-2">
              <div className="md:pr-5 py-1">
                <InsightRow icon={<Sun size={15} />}         label="Peak Temperature"  value={`${insights.peakTemp.label} — ${insights.peakTemp.temperature}°C`}           color="text-red-500" />
                <InsightRow icon={<Thermometer size={15} />} label="Lowest Temperature" value={`${insights.lowestTemp.label} — ${insights.lowestTemp.temperature}°C`}       color="text-blue-500" />
                <InsightRow icon={<Droplets size={15} />}    label="Highest Humidity"   value={`${insights.highestHumidity.label} — ${insights.highestHumidity.humidity}%`}  color="text-teal-500" />
                <InsightRow icon={<Droplets size={15} />}    label="Lowest Humidity"    value={`${insights.lowestHumidity.label} — ${insights.lowestHumidity.humidity}%`}    color="text-orange-400" />
              </div>

              <div className="md:pl-5 py-1">
                <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Best Irrigation Window</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      {insights.irrigationWindow.start.label} – {insights.irrigationWindow.end.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Cool temp + higher humidity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Avoid Outdoor Field Work</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {insights.avoidWindow.start.label} – {insights.avoidWindow.end.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Very high temperature + low humidity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2.5">
                  <Sprout size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">Crop Action Tip</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{cropTip}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-700/30 flex items-center gap-2">
              <Clock size={12} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                Analysis updates every hour · Based on {isRealData ? `live OWM data for ${locationName || 'this location'}` : "today's 24-hour prediction model"}
              </span>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default memo(HourlyWeatherAnalysis);
