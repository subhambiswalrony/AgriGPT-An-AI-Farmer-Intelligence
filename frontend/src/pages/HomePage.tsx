import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, Upload, FileText, ArrowRight, Cloud, Sparkles, TrendingUp, Shield, Zap, CheckCircle, User, Lock, Crown, Star, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import FAQ from '../components/FAQ';
import PromptScroller from '../components/PromptScroller';

const AnimatedCounter = ({ end, duration = 2, suffix = '', decimals = 0 }: { end: number; duration?: number; suffix?: string; decimals?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * end * 10) / 10);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isInView]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
};

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [orbitRadius, setOrbitRadius] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 165 : window.innerWidth >= 640 ? 135 : 110
  );
  const navigate = useNavigate();

  useEffect(() => {
    const update = () =>
      setOrbitRadius(window.innerWidth >= 1024 ? 165 : window.innerWidth >= 640 ? 135 : 110);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Fixed positions so Math.random() never re-runs on re-render / tab switch
  const particles = useMemo(() => [
    { left: 8,  top: 12, size: 3, delay: 0   },
    { left: 22, top: 58, size: 4, delay: 1.2 },
    { left: 38, top: 25, size: 3, delay: 2.1 },
    { left: 54, top: 78, size: 5, delay: 0.7 },
    { left: 67, top: 15, size: 4, delay: 3.0 },
    { left: 80, top: 88, size: 3, delay: 1.8 },
    { left: 91, top: 42, size: 5, delay: 2.6 },
    { left: 14, top: 70, size: 3, delay: 0.4 },
  ], []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    setIsLoggedIn(!!token);
    setUserName(name || 'User');
  }, []);
  const features = [
    {
      title: 'AI Chat Assistant',
      description: 'Get instant farming advice in 13+ Indian languages with our intelligent chatbot',
      icon: MessageCircle,
      link: '/chat',
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      emoji: '💬',
      stats: '10,000+ Queries Solved'
    },
    {
      title: 'Disease Detection',
      description: 'Upload crop images for AI-powered disease identification and treatment suggestions',
      icon: Upload,
      link: '/upload',
      gradient: 'from-emerald-400 via-green-500 to-teal-600',
      emoji: '🔬',
      stats: '95% Accuracy'
    },
    {
      title: 'Farming Reports',
      description: 'Get personalized crop reports with sowing, fertilizer, and weather guidance',
      icon: FileText,
      link: '/report',
      gradient: 'from-teal-400 via-emerald-500 to-green-600',
      emoji: '📊',
      stats: 'Custom Reports'
    },
    {
      title: 'Weather Intelligence',
      description: 'Real-time weather forecasts and soil analysis for better farming decisions',
      icon: Cloud,
      link: '/weather',
      gradient: 'from-green-500 via-teal-500 to-emerald-600',
      emoji: '🌤️',
      stats: 'Live Updates'
    }
  ];

  const benefits = [
    { icon: Sparkles, text: 'AI-Powered Insights', color: 'text-green-500 dark:text-green-400' },
    { icon: TrendingUp, text: 'Increase Productivity', color: 'text-emerald-500 dark:text-emerald-400' },
    { icon: Shield, text: 'Trusted by 10k+ Farmers', color: 'text-teal-500 dark:text-teal-400' },
    { icon: Zap, text: 'Instant Solutions', color: 'text-green-600 dark:text-green-300' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 overflow-hidden transition-colors duration-300">
      {/* Lightweight CSS-only background — zero JS per frame */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ contain: 'strict' }}>
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-green-400/20 dark:bg-green-500/15 hp-float"
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s` }}
          />
        ))}
        {/* Static ambient blobs — no animation */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-400/20 dark:bg-green-500/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-2xl" />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="inline-block mb-4"
              >
                <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold inline-flex items-center transition-colors duration-300 border border-green-300 dark:border-green-700">
                  <Sparkles size={16} className="mr-2" />
                  {isLoggedIn ? `Welcome back, ${userName}! 👋` : 'AI-Powered Agricultural Assistant'}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 relative"
              >
                {/* Static decorative emojis */}
                <span className="absolute -left-12 sm:-left-16 top-0 text-3xl sm:text-4xl select-none">🌱</span>
                <span className="absolute -right-12 sm:-right-16 top-0 text-3xl sm:text-4xl select-none">🚜</span>

                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Transform Your
                </span>
                <br />
                <span className="text-gray-800 dark:text-gray-100">
                  Farming Journey 🌾
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 }}
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed transition-colors duration-300"
              >
                Experience the future of farming with AI-powered insights, real-time disease detection,
                personalized crop reports, and expert guidance in your language 🌿
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link to="/chat">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center group overflow-hidden"
                  >
                    <span className="hp-shimmer absolute inset-0 rounded-xl pointer-events-none" />
                    <span className="relative z-10 flex items-center">
                      Start Chatting
                      <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </Link>
                <Link to="/report">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 text-green-700 dark:text-green-300 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 hover:from-green-100 hover:to-emerald-100"
                  >
                    Generate Report
                  </motion.button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.5 }}
                className="mt-12 grid grid-cols-3 gap-6"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    <AnimatedCounter end={10} duration={2} suffix="K+" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    <AnimatedCounter end={95} duration={2} suffix="%" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                    <AnimatedCounter end={13} duration={2} suffix="+" />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Languages</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="relative block"
            >
              {/* Responsive container — shorter on small screens */}
              <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[500px] flex items-center justify-center">
                {/* Background glow — behind everything */}
                <div className="absolute w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 bg-gradient-to-br from-green-400/40 via-emerald-500/30 to-teal-400/40 rounded-full blur-3xl" />
                <div className="absolute w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 bg-emerald-400/35 rounded-full blur-2xl" />

                {/* Central farmer — smaller on mobile */}
                <div className="relative z-10 hp-farmer-float text-[4.5rem] sm:text-[6rem] lg:text-[7rem] select-none drop-shadow-lg">🧑‍🌾</div>

                {/* Orbital icon badges — spin in from centre, settle at their positions */}
                {[
                  { emoji: '🌱', label: 'Seedling', angle: -90,  gradFrom: 'from-green-400',   gradTo: 'to-emerald-500', shadow: 'shadow-green-300/60',   border: 'border-green-300 dark:border-green-600',     text: 'text-green-700 dark:text-green-300',   pill: 'bg-green-100 dark:bg-green-900/60'   },
                  { emoji: '🌾', label: 'Harvest',  angle: -30,  gradFrom: 'from-emerald-400', gradTo: 'to-teal-500',    shadow: 'shadow-emerald-300/60', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-700 dark:text-emerald-300', pill: 'bg-emerald-100 dark:bg-emerald-900/60' },
                  { emoji: '🌻', label: 'Growth',   angle:  30,  gradFrom: 'from-yellow-400',  gradTo: 'to-orange-400',  shadow: 'shadow-yellow-300/60',  border: 'border-yellow-300 dark:border-yellow-600',   text: 'text-yellow-700 dark:text-yellow-300', pill: 'bg-yellow-100 dark:bg-yellow-900/60'  },
                  { emoji: '🌽', label: 'Crops',    angle:  90,  gradFrom: 'from-amber-400',   gradTo: 'to-yellow-500',  shadow: 'shadow-amber-300/60',   border: 'border-amber-300 dark:border-amber-600',     text: 'text-amber-700 dark:text-amber-300',   pill: 'bg-amber-100 dark:bg-amber-900/60'    },
                  { emoji: '🥕', label: 'Produce',  angle: 150,  gradFrom: 'from-orange-400',  gradTo: 'to-red-400',     shadow: 'shadow-orange-300/60',  border: 'border-orange-300 dark:border-orange-600',   text: 'text-orange-700 dark:text-orange-300', pill: 'bg-orange-100 dark:bg-orange-900/60'  },
                  { emoji: '🚜', label: 'Farming',  angle: 210,  gradFrom: 'from-teal-400',    gradTo: 'to-green-500',   shadow: 'shadow-teal-300/60',    border: 'border-teal-300 dark:border-teal-600',       text: 'text-teal-700 dark:text-teal-300',     pill: 'bg-teal-100 dark:bg-teal-900/60'      },
                ].map((item, i) => {
                  // Smaller radius on mobile, full radius on desktop
                  const rad = (item.angle * Math.PI) / 180;
                  const txSm = Math.round(orbitRadius * Math.cos(rad));
                  const tySm = Math.round(orbitRadius * Math.sin(rad));
                  return (
                    <motion.div
                      key={item.label}
                      className="absolute z-10 flex flex-col items-center gap-1"
                      style={{ left: 'calc(50% - 24px)', top: 'calc(50% - 24px)' }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: -360 }}
                      animate={{ x: txSm, y: tySm, scale: 1, opacity: 1, rotate: 0 }}
                      transition={{
                        duration: 0.75,
                        delay: 0.55 + i * 0.08,
                        type: 'spring',
                        stiffness: 110,
                        damping: 13,
                      }}
                    >
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br ${item.gradFrom} ${item.gradTo} shadow-lg ${item.shadow} flex items-center justify-center text-xl lg:text-2xl border-2 ${item.border}`}>
                        {item.emoji}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold ${item.text} ${item.pill} px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                        {item.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* User Comparison Section */}
      <section className="relative py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                Choose Your Experience
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See how signing in unlocks powerful features for your farming journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free User Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="h-full backdrop-blur-sm bg-white/90 dark:bg-gray-800/80 rounded-3xl border-2 border-gray-300 dark:border-gray-600 shadow-xl p-8 transition-all duration-300">
                {/* Badge */}
                <div className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
                  <span className="flex items-center text-gray-700 dark:text-gray-300 font-semibold">
                    <User size={20} className="mr-2" />
                    Guest Access
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Without Login
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">Basic chat access (limited)</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-300">View public features</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 line-through">Save chat history</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 line-through">Generate detailed reports</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 line-through">Upload image and analyze disease</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 line-through">Access weather predictions</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 line-through">Personalized recommendations</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Logged In User Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Static glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-emerald-500/50 rounded-3xl blur-xl" />

              <div className="relative h-full backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 rounded-3xl border-2 border-green-400 dark:border-green-500 shadow-2xl p-8 transition-all duration-300">
                {/* Premium Badge */}
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
                  <span className="flex items-center text-white font-semibold">
                    <Crown size={20} className="mr-2" />
                    Premium Access
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  With Login
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Unlimited AI chat sessions</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Complete chat history saved</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Generate personalized reports</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Upload image & analyze disease</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Real-time weather predictions</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">AI-powered recommendations</span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                      <Star size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Priority support</span>
                  </div>
                </div>

                {!isLoggedIn && (
                  <Link to="/auth">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="mt-8 w-full relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg overflow-hidden group"
                    >
                      <span className="hp-shimmer absolute inset-0 rounded-xl pointer-events-none" />
                      <span className="relative z-10 flex items-center justify-center">
                        <Lock size={18} className="mr-2" />
                        Sign In to Unlock All Features
                      </span>
                    </motion.button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        viewport={{ once: true }}
        className="py-8 px-4 bg-white/90 dark:bg-gray-800/90 shadow-lg transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                viewport={{ once: true }}
                className="flex items-center justify-center space-x-2"
              >
                <benefit.icon size={24} className={benefit.color} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section with Cards */}
      <section className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                Powerful Features for Modern Farmers
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Everything you need to make informed farming decisions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="group h-full"
              >
                <Link to={feature.link} className="block h-full">
                  <div className="relative backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 rounded-3xl border-2 border-green-200/50 dark:border-green-700/50 shadow-xl p-6 h-full overflow-hidden transition-all duration-200 group-hover:shadow-2xl group-hover:border-green-400 dark:group-hover:border-green-500 flex flex-col">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <feature.icon className="text-white" size={24} />
                    </motion.div>

                    {/* Emoji */}
                    <div className="text-3xl mb-3">{feature.emoji}</div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed transition-colors duration-300 flex-grow">
                      {feature.description}
                    </p>

                    {/* Stats Badge */}
                    <div className="inline-flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-semibold text-green-700 dark:text-green-300 mb-3 transition-colors duration-300 border border-green-300 dark:border-green-700 w-fit">
                      <CheckCircle size={12} className="mr-1.5" />
                      {feature.stats}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center text-green-600 dark:text-green-400 font-semibold text-sm group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors mt-auto">
                      Explore Feature
                      <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prompt Suggestions Section */}
      <PromptScroller />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        viewport={{ once: true }}
        className="py-10 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 dark:from-green-600 dark:via-emerald-700 dark:to-teal-700 rounded-3xl shadow-2xl p-12 overflow-hidden">
            {/* Teal/emerald tinted decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-teal-300/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-300/10 rounded-full blur-2xl" />

            {/* Static decorative emojis */}
            <div className="absolute top-8 right-8 text-6xl sm:text-9xl opacity-20 select-none">🌿</div>
            <div className="absolute bottom-8 left-8 text-6xl sm:text-9xl opacity-20 select-none">🌾</div>

            <div className="relative text-center text-white">
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl font-bold mb-6"
              >
                Ready to Transform Your Farming? 🚀
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-xl mb-8 text-white/90"
              >
                Join thousands of farmers using AI to increase productivity and make smarter decisions
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link to="/auth">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative px-10 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-100 dark:to-teal-100 text-green-700 dark:text-green-800 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-emerald-100 hover:to-teal-100 transition-all inline-flex items-center overflow-hidden"
                  >
                    <span className="hp-shimmer-light absolute inset-0 rounded-xl pointer-events-none" />
                    <span className="relative z-10 flex items-center">
                      Get Started
                      <Sparkles size={20} className="ml-2" />
                    </span>
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Feedback Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-950/50 dark:to-emerald-950/50 rounded-2xl shadow-lg p-8 border border-green-200/30 dark:border-green-700/30 transition-colors duration-300"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <MessageSquare size={40} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300 mb-1">
                    Help Us Improve! 💚
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    Found a bug or have suggestions? We'd love to hear from you.
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/feedback')}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-400 dark:hover:to-emerald-400 transition-all duration-200 whitespace-nowrap"
              >
                <MessageSquare size={20} />
                <span>Share Feedback</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;