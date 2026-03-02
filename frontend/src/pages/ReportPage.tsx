import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sprout, Sun, Droplets, Calendar, Download, History, Clock, LogIn, FileText, Sparkles, TrendingUp, Zap, Cloud, Leaf, Lock, UserPlus } from 'lucide-react';
import TutorialModal from '../components/TutorialModal';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

interface CropReport {
  crop: string;
  region: string;
  sowingAdvice: string[];
  fertilizerPlan: string[];
  weatherTips: string[];
  calendar: string[];
}

interface ReportHistory {
  user_id: string;
  crop_name: string;
  region: string;
  language: string;
  report_data: CropReport;
  timestamp: string;
}

const ReportPage = () => {
  const [cropName, setCropName] = useState('');
  const [region, setRegion] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [report, setReport] = useState<CropReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check authentication and load report history
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (token) {
      fetchReportHistory();
    }
  }, []);

  const fetchReportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_ENDPOINTS.REPORTS), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportHistory(data);
      }
    } catch (error) {
      console.error('Error fetching report history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadHistoryReport = (historyItem: ReportHistory) => {
    setCropName(historyItem.crop_name);
    setRegion(historyItem.region);
    setLanguage(historyItem.language);
    setReport(historyItem.report_data);
    setShowHistory(false);
    // Scroll to report
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !report) return;

    setIsDownloading(true);

    try {
      // Capture the report content as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${report.crop}_${report.region}_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateReport = async () => {
    if (!cropName || !region) return;

    setIsGenerating(true);
    setReport(null);

    try {
      // Get auth token if available
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.REPORT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          cropName: cropName,
          region: region,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      
      if (data.error) {
        alert(`Error: ${data.error}`);
        setIsGenerating(false);
        return;
      }

      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }

    // Refresh history for authenticated users
    if (localStorage.getItem('token')) {
      fetchReportHistory();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-teal-950 dark:to-gray-900 transition-all duration-500">
      {/* Authentication Overlay */}
      {!isAuthenticated && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-white/20 dark:border-gray-700/30"
          >
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700 rounded-t-3xl" />
            
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex justify-center mb-6"
            >
              <Lock size={64} className="text-green-600 dark:text-green-400" />
            </motion.div>

            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2">
              Premium Feature 🌟
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-6">
              Personalized crop reports are available for logged-in users only. Sign in to access AI-powered farming insights!
            </p>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogIn size={20} />
                <span>Sign In</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <UserPlus size={20} />
                <span>Create Account</span>
              </motion.button>

              <button
                onClick={() => navigate('/')}
                className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Blurred Content */}
      <div className={!isAuthenticated ? 'filter blur-lg pointer-events-none select-none' : ''}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative"
        >
          {/* Floating Background Elements */}
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-8 left-1/4 text-6xl opacity-20"
          >
            🌾
          </motion.div>
          <motion.div
            animate={{ 
              y: [0, 12, 0],
              rotate: [0, -8, 0]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -top-4 right-1/4 text-5xl opacity-20"
          >
            📊
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800 blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-4 rounded-2xl shadow-2xl">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2 leading-tight"
          >
            Personalized Farming Reports
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Get AI-powered customized farming advice based on your crop and location
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {[
              { icon: TrendingUp, text: "Data Driven" },
              { icon: Zap, text: "Instant Advice" },
              { icon: Cloud, text: "Weather Ready" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 dark:border-emerald-800"
              >
                <feature.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* History Sidebar - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-80 flex-shrink-0"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-4 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Report History
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your past reports
                  </p>
                </div>
                {isAuthenticated && reportHistory.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors"
                  >
                    {showHistory ? 'Hide' : 'Show'}
                  </motion.button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isAuthenticated ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity
                      }}
                      className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
                    >
                      <LogIn className="text-emerald-600 dark:text-emerald-400" size={36} />
                    </motion.div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">
                      Login to save & view history
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/auth')}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Login / Sign Up
                    </motion.button>
                  </motion.div>
                ) : isLoadingHistory ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-teal-500 rounded-full"
                      ></motion.div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading history...</p>
                  </motion.div>
                ) : reportHistory.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <History className="text-gray-400 dark:text-gray-500" size={36} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No reports yet<br />Generate your first report!
                    </p>
                  </motion.div>
                ) : showHistory ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-400 dark:scrollbar-thumb-emerald-600"
                  >
                    {reportHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        onClick={() => loadHistoryReport(item)}
                        className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 group"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-300/20 dark:bg-emerald-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                        
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                                {item.crop_name}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                              <MapPin size={14} />
                              {item.region}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Clock size={12} className="mr-1" />
                              {formatDate(item.timestamp)}
                            </div>
                          </div>
                          <span className="text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full shadow-sm flex-shrink-0">
                            {item.language}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
        {/* Input Form - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Generate Report
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your crop details below
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Crop Name (फसल का नाम)
              </label>
              <input
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                placeholder="e.g., Rice, Wheat, Tomato"
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Region (क्षेत्र)
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Punjab, Maharashtra, Odisha"
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Language (भाषा)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300"
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Malayalam">മലയാളം (Malayalam)</option>
                <option value="Marathi">मराठी (Marathi)</option>
                <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="Urdu">اردو (Urdu)</option>
                <option value="Assamese">অসমীয়া (Assamese)</option>
              </select>
            </div>
          </div>
          
          <motion.button
            onClick={generateReport}
            disabled={!cropName || !region || isGenerating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Sparkles className="w-6 h-6 relative z-10" />
            <span className="relative z-10">
              {isGenerating ? 'Generating Your Report...' : 'Generate Personalized Report'}
            </span>
            {!isGenerating && <MapPin className="w-5 h-5 relative z-10" />}
          </motion.button>
        </motion.div>

        {/* Loading State - Enhanced */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-gray-200 dark:border-gray-700"
            >
              {/* Animated Scanner Effect */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="w-full h-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 rounded-full"></div>
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2"
                >
                  <div className="w-full h-full border-4 border-transparent border-b-emerald-400 border-l-teal-400 rounded-full"></div>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-emerald-500" />
                </div>
              </div>
              
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Generating Report...
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Creating personalized advice for <span className="font-semibold text-emerald-600 dark:text-emerald-400">{cropName}</span> in <span className="font-semibold text-teal-600 dark:text-teal-400">{region}</span>
                </p>
              </motion.div>

              {/* Progress Steps */}
              <div className="mt-8 space-y-2">
                {['Analyzing crop requirements...', 'Checking regional conditions...', 'Generating recommendations...'].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.3 }}
                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: index * 0.3 }}
                      className="w-2 h-2 bg-emerald-500 rounded-full"
                    ></motion.div>
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Results - Enhanced */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6 }}
              ref={reportRef}
              className="space-y-8"
            >
              {/* Report Header - Enhanced */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-800 dark:to-cyan-800 text-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-400/30 dark:border-emerald-700/50"
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <motion.div
                    animate={{ 
                      backgroundPosition: ['0% 0%', '100% 100%']
                    }}
                    transition={{ 
                      duration: 20,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="w-full h-full"
                    style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '30px 30px'
                    }}
                  />
                </div>

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-center gap-3 mb-3"
                    >
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                          Farming Report
                        </h2>
                        <p className="text-white/90 text-sm mt-1">AI-Generated Analysis</p>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-lg">
                        <Sprout className="w-5 h-5" />
                        <span className="font-semibold">Crop:</span>
                        <span className="font-bold text-yellow-200">{report.crop}</span>
                      </div>
                      <div className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5" />
                        <span className="font-semibold">Region:</span>
                        <span className="font-bold text-yellow-200">{report.region}</span>
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 border border-white/30"
                  >
                    <Download size={22} />
                    <span className="font-bold text-lg">
                      {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </span>
                  </motion.button>
                </div>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sowing Advice - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <Sprout className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          Sowing Advice
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Best practices for planting
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {report.sowingAdvice.map((advice, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-all"
                        >
                          <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                            {advice}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Fertilizer Plan - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                        <Droplets className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          Fertilizer Plan
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nutrient management guide
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {report.fertilizerPlan.map((plan, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-800 hover:shadow-md transition-all"
                        >
                          <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                            {plan}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Weather Tips - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl shadow-lg">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          Weather Tips
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Climate considerations
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {report.weatherTips.map((tip, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 border-2 border-orange-200 dark:border-orange-800 hover:shadow-md transition-all"
                        >
                          <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                            {tip}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Farming Calendar - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          Farming Calendar
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Timeline & schedules
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {report.calendar.map((schedule, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800 hover:shadow-md transition-all"
                        >
                          <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed">
                            {schedule}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
      </div>

      {/* Page Tutorial */}
      <TutorialModal
        accentColor="green"
        pageTitle="Crop Report Generator"
        pageDescription="Generate personalized farming reports with AI-powered insights."
        steps={[
          {
            title: 'Enter Crop Details',
            description: 'Type the name of your crop (e.g., Wheat, Rice, Tomato) and your region or district name in the input fields.',
            icon: <Sprout size={28} />,
            tip: 'Be specific with the region name for more accurate local advice.',
          },
          {
            title: 'Choose Language',
            description: 'Select your preferred language from the dropdown. The report will be fully generated in that language, including all advice and tips.',
            icon: <FileText size={28} />,
          },
          {
            title: 'Generate the Report',
            description: 'Click the "Generate Report" button. The AI will create a complete report covering sowing advice, fertilizer plan, weather tips, and crop calendar.',
            icon: <Sparkles size={28} />,
            tip: 'Generation takes about 10–20 seconds as the AI crafts personalised advice.',
          },
          {
            title: 'Download as PDF',
            description: 'Once the report is ready, click the download button at the top of the report card to save a formatted PDF copy to your device.',
            icon: <Download size={28} />,
          },
          {
            title: 'Report History',
            description: 'All previously generated reports are saved under the "History" section below the form. Click any past report to reload it instantly.',
            icon: <History size={28} />,
            tip: 'Your report history is only available when you are logged in.',
          },
        ]}
      />
    </div>
  );
};

export default ReportPage;