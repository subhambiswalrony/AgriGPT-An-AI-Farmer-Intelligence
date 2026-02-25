import React from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Upload, FileText, Users, Menu, X, MapPin, Cloud, LogIn, LogOut, ChevronDown, Settings, Moon, Sun, Shield } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useWeather } from '../hooks/useWeather';
import { useTheme } from '../contexts/ThemeContext';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '../config/api';
import Loader from './Loader';
import { LogoutConfirmModal } from './Modals';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showLoader, setShowLoader] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isDeveloper, setIsDeveloper] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [profilePicture, setProfilePicture] = React.useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { weather, loading } = useWeather();
  const { isDarkMode, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Check if user is a developer
  const checkDeveloperStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(getApiUrl(API_ENDPOINTS.CHECK_DEVELOPER), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setIsDeveloper(data.is_developer);
      }
    } catch (error) {
      console.log('Not a developer or error checking status');
      setIsDeveloper(false);
    }
  };

  // Check authentication status on mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const picture = localStorage.getItem('profilePicture');

    if (token) {
      setIsAuthenticated(true);
      setUserName(name || 'User');
      setUserEmail(email || '');
      setProfilePicture(picture || '');
      checkDeveloperStatus();
    } else {
      setIsAuthenticated(false);
      setIsDeveloper(false);
    }
  }, [location]);

  // Close mobile menu on resize and handle orientation changes
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
      setShowProfileMenu(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowProfileMenu(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    setIsAuthenticated(false);
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    setShowLoader(true);
    console.log('✅ User logged out');
  };

  const handleLoadComplete = () => {
    setShowLoader(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
    console.log('❌ Logout cancelled');
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/report', icon: FileText, label: 'Report' },
    // { path: '/team', icon: Users, label: 'Team' },
    { path: '/weather', icon: Cloud, label: 'Weather' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const hamburgerVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 }
  };

  if (showLoader) {
    return createPortal(
      <div className="fixed inset-0 z-[9999]">
        <Loader onLoadComplete={handleLoadComplete} />
      </div>,
      document.body
    ) as unknown as React.ReactElement;
  }

  return (
    <motion.nav
      className="bg-white/95 dark:bg-emerald-950/[0.97] backdrop-blur-xl shadow-lg border-b-2 border-green-200/50 dark:border-green-600/60 sticky top-0 z-50 transition-all duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo with enhanced styling */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={shouldReduceMotion ? {} : {
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-50"
              />
              <span className="text-2xl sm:text-3xl relative z-10">🌿</span>
            </motion.div>
            <motion.span
              className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent transition-all duration-200"
              whileHover={{ scale: 1.05 }}
            >
              AgriGPT
            </motion.span>
          </Link>

          {/* Weather Info - Enhanced styling */}
          <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4 flex-shrink-0">
            {loading ? (
              <motion.div
                className="flex items-center space-x-1.5 backdrop-blur-xl bg-gray-100/80 dark:bg-emerald-900/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-gray-300/50 dark:border-emerald-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-400 dark:bg-green-500 rounded-full"
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 hidden xs:inline font-medium">Loading...</span>
              </motion.div>
            ) : weather ? (
              <motion.div
                className="flex items-center space-x-1 sm:space-x-1.5 backdrop-blur-xl bg-gradient-to-r from-blue-50/90 to-cyan-50/90 dark:from-blue-900/40 dark:to-cyan-900/40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-blue-300/50 dark:border-blue-600/50 hover:shadow-lg transition-all duration-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <MapPin size={10} className="text-blue-600 dark:text-blue-400 sm:w-3 sm:h-3" />
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 font-semibold truncate max-w-[40px] xs:max-w-[60px] sm:max-w-none">{weather.location}</span>
                <motion.span
                  className="text-sm sm:text-base"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {weather.icon}
                </motion.span>
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 font-bold">{weather.temperature}°C</span>
              </motion.div>
            ) : null}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-0.5 lg:space-x-1 flex-shrink-0">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-xl backdrop-blur-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-emerald-900/60 dark:to-emerald-900/80 border border-gray-200/50 dark:border-emerald-700/50 hover:shadow-lg transition-all duration-200"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun size={20} className="text-yellow-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon size={20} className="text-gray-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {navItems.map(({ path, icon: Icon, label }) => (
              <motion.div
                key={path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={path}
                  className={`flex items-center space-x-1.5 px-2 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-xl backdrop-blur-xl transition-all duration-200 ${location.pathname === path
                    ? 'bg-gradient-to-br from-green-100/90 to-emerald-100/90 dark:from-green-700/30 dark:to-emerald-700/30 text-green-700 dark:text-green-300 shadow-lg border border-green-300/50 dark:border-green-500/50'
                    : 'bg-gray-50/60 dark:bg-emerald-900/20 text-gray-600 dark:text-emerald-100/80 hover:bg-gradient-to-br hover:from-gray-100/90 hover:to-gray-50/90 dark:hover:from-emerald-800/40 dark:hover:to-emerald-900/40 hover:shadow-md border border-gray-200/30 dark:border-emerald-800/40'
                    }`}
                >
                  <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden lg:block text-sm font-semibold">{label}</span>
                </Link>
              </motion.div>
            ))}

            {/* Profile or Login Button */}
            {isAuthenticated ? (
              <div className="relative ml-1 md:ml-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl backdrop-blur-xl bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-300/50 dark:border-green-600/50 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs md:text-sm overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(userName)
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400 hidden lg:block">{getFirstName(userName)}</span>
                  <ChevronDown size={14} className={`text-green-600 dark:text-green-400 transition-transform duration-200 md:w-4 md:h-4 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, type: "spring" }}
                      className="absolute right-0 mt-3 w-72 backdrop-blur-xl bg-white/90 dark:bg-emerald-950/[0.97] rounded-3xl shadow-2xl border border-green-200/30 dark:border-emerald-700/40 overflow-hidden z-50"
                    >
                      {/* Gradient accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700" />

                      {/* User Info Section */}
                      <div className="relative px-6 py-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-emerald-900/30 dark:to-teal-900/20">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg">
                              {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(userName)
                              )}
                            </div>
                            {/* Online indicator */}
                            <motion.div
                              animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1 pt-1">
                            <p className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">{userName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">{userEmail}</p>
                            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Admin Panel Link - Only for developers */}
                        {isDeveloper && (
                          <Link
                            to="/admin"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center space-x-3 px-6 py-3.5 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-indigo-50/80 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 text-gray-700 dark:text-gray-300 transition-all duration-200 group"
                          >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Shield size={16} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Admin Panel</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Manage feedbacks</p>
                            </div>
                          </Link>
                        )}

                        <Link
                          to="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="group w-full px-6 py-3 text-left flex items-center space-x-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-200"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Settings size={18} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Settings</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
                          </div>
                          <motion.div
                            initial={{ x: -5, opacity: 0 }}
                            whileHover={{ x: 0, opacity: 1 }}
                            className="text-green-600 dark:text-green-400"
                          >
                            <ChevronDown size={16} className="-rotate-90" />
                          </motion.div>
                        </Link>

                        <button
                          onClick={handleLogoutClick}
                          className="group w-full px-6 py-3 text-left flex items-center space-x-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-200"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/40 dark:to-pink-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <LogOut size={18} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Logout</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sign out of your account</p>
                          </div>
                          <motion.div
                            initial={{ x: -5, opacity: 0 }}
                            whileHover={{ x: 0, opacity: 1 }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <ChevronDown size={16} className="-rotate-90" />
                          </motion.div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/auth"
                  className="relative flex items-center space-x-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ml-1 md:ml-2 overflow-hidden group"
                >
                  <motion.div
                    animate={{
                      x: [-200, 200],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{ width: '50%' }}
                  />
                  <LogIn size={16} className="md:w-[18px] md:h-[18px] relative z-10" />
                  <span className="text-sm font-semibold relative z-10">Login</span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle for Mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl backdrop-blur-xl bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-emerald-900/60 dark:to-emerald-900/80 border border-gray-200/50 dark:border-emerald-700/50 transition-all duration-200"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <AnimatePresence mode="wait">
                {isDarkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun size={20} className="text-yellow-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon size={20} className="text-gray-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Hamburger Menu Button */}
            <motion.button
              onClick={toggleMobileMenu}
              className={`p-2.5 rounded-xl backdrop-blur-xl transition-all duration-200 focus:outline-none border ${isMobileMenuOpen
                ? 'bg-gradient-to-br from-red-50/90 to-red-100/90 dark:from-red-900/40 dark:to-red-800/40 text-red-600 dark:text-red-400 shadow-lg border-red-300/50 dark:border-red-600/50'
                : 'bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-emerald-900/60 dark:to-emerald-900/80 text-gray-700 dark:text-emerald-100 border-gray-200/50 dark:border-emerald-700/50 hover:shadow-md'
                }`}
              variants={hamburgerVariants}
              animate={isMobileMenuOpen ? "open" : "closed"}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu — portalled to body so backdrop-blur applies to real page content */}
        {createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 backdrop-blur-xl z-[9990]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Mobile Menu */}
                <motion.div
                  className="fixed inset-0 z-[9991] flex items-start sm:items-center justify-center p-3 sm:p-4 pt-20 sm:pt-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="backdrop-blur-2xl bg-white/95 dark:bg-emerald-950/[0.97] rounded-3xl shadow-2xl border-2 border-green-200/50 dark:border-emerald-600/50 p-5 sm:p-6 w-full max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300">
                  {/* Close Button */}
                  <div className="flex justify-between items-center mb-4 sm:mb-5">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                      Menu
                    </h3>
                    <motion.button
                      onClick={() => setIsMobileMenuOpen(false)}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl backdrop-blur-xl bg-gradient-to-br from-red-50/90 to-red-100/90 dark:from-red-900/40 dark:to-red-800/40 border border-red-300/50 dark:border-red-600/50 text-red-600 dark:text-red-400 transition-all duration-200 shadow-md hover:shadow-lg"
                      title="Close menu"
                    >
                      <X size={20} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                    </motion.button>
                  </div>

                  {/* Mobile Weather Info */}
                  {weather && (
                    <motion.div
                      className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 mb-5 sm:mb-6 backdrop-blur-xl bg-gradient-to-r from-blue-50/90 to-cyan-50/90 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-2xl border border-blue-300/50 dark:border-blue-600/50 text-xs sm:text-sm transition-all duration-300 shadow-md"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <MapPin size={12} className="text-blue-600 dark:text-blue-400 sm:w-3.5 sm:h-3.5" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">{weather.location}</span>
                      <motion.span
                        className="text-base sm:text-lg"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {weather.icon}
                      </motion.span>
                      <span className="text-blue-700 dark:text-blue-300">{weather.temperature}°C</span>
                      <span className="text-blue-600 dark:text-blue-400">({weather.condition})</span>
                    </motion.div>
                  )}

                  {/* Profile Section for Mobile */}
                  {isAuthenticated && (
                    <motion.div
                      className="mb-5 sm:mb-6 p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-r from-green-50/90 to-emerald-50/90 dark:from-emerald-900/40 dark:to-teal-900/30 rounded-2xl border border-green-300/50 dark:border-emerald-600/50 transition-all duration-300 shadow-md"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-base sm:text-lg overflow-hidden">
                          {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(userName)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate transition-colors duration-300">{userName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate transition-colors duration-300">{userEmail}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Items */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {navItems.map(({ path, icon: Icon, label }, index) => (
                      <motion.div
                        key={path}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                      >
                        <Link
                          to={path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 sm:space-x-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl backdrop-blur-xl transition-all duration-200 border ${location.pathname === path
                            ? 'bg-gradient-to-br from-green-100/90 to-emerald-100/90 dark:from-green-700/30 dark:to-emerald-700/30 text-green-700 dark:text-green-300 shadow-lg border-green-300/50 dark:border-green-500/50'
                            : 'bg-gray-50/60 dark:bg-emerald-900/20 text-gray-700 dark:text-emerald-100/80 hover:bg-gradient-to-br hover:from-gray-100/90 hover:to-gray-50/90 dark:hover:from-emerald-800/40 dark:hover:to-emerald-900/40 hover:shadow-md border-gray-200/30 dark:border-emerald-800/40'
                            }`}
                        >
                          <Icon size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" />
                          <span className="text-sm sm:text-base font-semibold">{label}</span>
                        </Link>
                      </motion.div>
                    ))}

                    {/* Admin Panel Link for Mobile - Only for developers */}
                    {isAuthenticated && isDeveloper && (
                      <motion.div
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={navItems.length}
                      >
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 sm:space-x-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl backdrop-blur-xl transition-all duration-200 border bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/40 dark:to-indigo-900/40 text-purple-700 dark:text-purple-400 hover:shadow-lg border-purple-300/50 dark:border-purple-600/50"
                        >
                          <Shield size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm sm:text-base font-semibold">Admin Panel</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">Developer Access</p>
                          </div>
                        </Link>
                      </motion.div>
                    )}


                    {/* Settings Button for Mobile (if authenticated) */}
                    {isAuthenticated && (
                      <motion.div
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={navItems.length}
                      >
                        <Link
                          to="/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 sm:space-x-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border border-green-300/50 dark:border-green-600/50 hover:shadow-lg transition-all duration-200"
                        >
                          <Settings size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" />
                          <span className="text-sm sm:text-base font-semibold">Settings</span>
                        </Link>
                      </motion.div>
                    )}

                    {/* Logout Button for Mobile (if authenticated) */}
                    {isAuthenticated && (
                      <motion.button
                        onClick={handleLogoutClick}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={navItems.length + 1}
                        className="w-full flex items-center space-x-3 sm:space-x-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 text-red-700 dark:text-red-400 border border-red-300/50 dark:border-red-600/50 hover:shadow-lg transition-all duration-200"
                      >
                        <LogOut size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0" />
                        <span className="text-sm sm:text-base font-semibold">Logout</span>
                      </motion.button>
                    )}

                    {/* Login Button for Mobile (if not authenticated) */}
                    {!isAuthenticated && (
                      <motion.div
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                        custom={navItems.length}
                      >
                        <Link
                          to="/auth"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="relative flex items-center space-x-3 sm:space-x-3.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
                        >
                          <motion.div
                            animate={{
                              x: [-200, 200],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            style={{ width: '50%' }}
                          />
                          <LogIn size={20} className="sm:w-[22px] sm:h-[22px] flex-shrink-0 relative z-10" />
                          <span className="text-sm sm:text-base font-semibold relative z-10">Login</span>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
          </AnimatePresence>,
          document.body
        )}

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {/* Logout Confirmation Modal */}
          <LogoutConfirmModal
            isOpen={showLogoutConfirm}
            onConfirm={confirmLogout}
            onCancel={cancelLogout}
          />
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;