import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, Camera, CheckCircle, AlertCircle, X, Sparkles, Leaf, FileImage, Zap, Shield, FlaskConical, Lock, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface DiagnosisResult {
  disease: string;
  confidence: number;
}

// DEV  → /api/predict is intercepted by the Vite dev-server proxy and forwarded
//         directly to the prediction service (raw multipart, no re-encoding).
// PROD → request goes to the deployed backend which Flask-proxies server-side.
const PREDICT_API_URL = import.meta.env.DEV
  ? '/api/predict'
  : `${API_BASE_URL}/api/predict`;

const UploadPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDiagnosis(null);
        setPredictionError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
        setDiagnosis(null);
        setPredictionError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setDiagnosis(null);
    setPredictionError(null);
  };

  const analyzeDiseases = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setDiagnosis(null);
    setPredictionError(null);

    const formData = new FormData();
    formData.append('image', selectedFile, selectedFile.name);

    try {
      const response = await fetch(PREDICT_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detail = '';
        try { const e = await response.json(); detail = e.error || e.message || ''; } catch { /* ignore */ }
        if (response.status === 500) {
          throw new Error('The prediction service is temporarily unavailable. Please try again in a moment.');
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(`Prediction failed${detail ? ': ' + detail : '. Please try again.'}`);
      }

      const data = await response.json();

      // Normalize response — raw service returns { top, confidence: 0.92 }
      // Flask proxy returns { disease, confidence: 92.5 }
      const disease    = (data.disease || data.top || 'Unknown').replace(/_/g, ' ');
      const rawConf    = data.confidence ?? 0;
      const confidence = Math.round(rawConf > 1 ? rawConf : rawConf * 100);

      setDiagnosis({ disease, confidence });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setPredictionError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900 transition-all duration-500">
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
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              animate={shouldReduceMotion ? {} : {
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              className="flex justify-center mb-6"
            >
              <Lock size={64} className="text-green-600 dark:text-green-400" />
            </motion.div>

            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2">
              Premium Feature 🌟
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-6">
              Disease detection is available for logged-in users only. Sign in to access AI-powered crop analysis!
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
          {/* Header Section with Floating Animation */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12 relative"
          >
            {/* Floating Background Elements */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-8 left-1/4 text-6xl opacity-20"
              style={{ display: shouldReduceMotion ? 'none' : 'block' }}
            >
              🌿
            </motion.div>
            <motion.div
              animate={{
                y: [0, 15, 0],
                rotate: [0, -5, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -top-4 right-1/4 text-5xl opacity-20"
              style={{ display: shouldReduceMotion ? 'none' : 'block' }}
            >
              🔬
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="inline-block mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 dark:from-green-600 dark:to-emerald-800 blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 p-4 rounded-2xl shadow-2xl">
                  <Leaf className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4"
            >
              AI Plant Disease Detection
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Upload a clear photo of a <span className="font-semibold text-green-600 dark:text-green-400">plant leaf</span> for instant AI-powered disease detection. Works on leaves only — not fruits or vegetables.
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center gap-3 mt-6"
            >
              {[
                { icon: Zap, text: "Instant Results" },
                { icon: FlaskConical, text: "AI Powered" },
                { icon: Shield, text: "95% Accuracy" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-green-200 dark:border-green-800"
                >
                  <feature.icon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <FileImage className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      Upload Image
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Drag & drop or click to select
                    </p>
                  </div>
                </div>

                {/* Upload Area */}
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                    relative flex flex-col items-center justify-center w-full h-80 
                    border-3 border-dashed rounded-2xl cursor-pointer 
                    transition-all duration-300 overflow-hidden
                    ${isDragging
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-105'
                        : selectedImage
                          ? 'border-transparent'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                  `}
                  >
                    <AnimatePresence mode="wait">
                      {selectedImage ? (
                        <motion.div
                          key="image"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative w-full h-full"
                        >
                          <img
                            src={selectedImage}
                            alt="Uploaded crop"
                            className="w-full h-full object-cover rounded-2xl"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                            <div className="text-center text-white">
                              <Upload size={40} className="mx-auto mb-2" />
                              <p className="font-medium">Click to change image</p>
                            </div>
                          </div>
                          {/* Close button */}
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.preventDefault();
                              clearImage();
                            }}
                            className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                          >
                            <X size={20} />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center"
                        >
                          <motion.div
                            animate={{
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="mb-6"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-400 dark:bg-green-600 blur-xl opacity-50 animate-pulse"></div>
                              <Upload size={64} className="relative text-green-600 dark:text-green-400" />
                            </div>
                          </motion.div>
                          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {isDragging ? 'Drop your leaf image here' : 'Upload Leaf Image'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                            Click to browse or drag and drop<br />
                            <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">🍃 Leaves only — fruits & vegetables not supported</span><br />
                            <span className="text-xs">PNG, JPG, JPEG up to 10MB</span>
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </label>
                </div>

                {/* Analyze Button */}
                <AnimatePresence>
                  {selectedImage && !diagnosis && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      onClick={analyzeDiseases}
                      disabled={isAnalyzing}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                      w-full mt-6 py-4 rounded-xl font-bold text-lg
                      bg-gradient-to-r from-green-500 to-emerald-600 
                      dark:from-green-600 dark:to-emerald-700
                      text-white shadow-xl hover:shadow-2xl
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                      flex items-center justify-center gap-3
                      relative overflow-hidden group
                    "
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Camera className="w-6 h-6 relative z-10" />
                      <span className="relative z-10">
                        {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}
                      </span>
                      {!isAnalyzing && <Sparkles className="w-5 h-5 relative z-10" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 min-h-[500px]">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <FlaskConical className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      Analysis Results
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI-powered diagnostics
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isAnalyzing && (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-96"
                    >
                      {/* Animated Scanner Effect */}
                      <div className="relative w-32 h-32 mb-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0"
                        >
                          <div className="w-full h-full border-4 border-transparent border-t-green-500 border-r-emerald-500 rounded-full"></div>
                        </motion.div>
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2"
                        >
                          <div className="w-full h-full border-4 border-transparent border-b-green-400 border-l-emerald-400 rounded-full"></div>
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-green-500" />
                        </div>
                      </div>

                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-center"
                      >
                        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Analyzing Image...
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          AI is processing your plant image
                        </p>
                      </motion.div>

                      {/* Progress Steps */}
                      <div className="mt-8 space-y-2 w-full max-w-xs">
                        {['Scanning image...', 'Detecting patterns...', 'Analyzing results...'].map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.3 }}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity, delay: index * 0.3 }}
                              className="w-2 h-2 bg-green-500 rounded-full"
                            ></motion.div>
                            {step}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {diagnosis && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      {/* Disease Detection Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                        relative overflow-hidden rounded-2xl p-6 
                        ${diagnosis.disease.toLowerCase().includes('healthy')
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700'
                            : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-2 border-orange-300 dark:border-orange-700'
                          }
                      `}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {diagnosis.disease.toLowerCase().includes('healthy') ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 360 }}
                                transition={{ type: "spring", stiffness: 200 }}
                              >
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                              >
                                <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                              </motion.div>
                            )}
                            <div>
                              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {diagnosis.disease}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Detected Condition
                              </p>
                            </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className={`
                            px-4 py-2 rounded-full font-bold text-sm shadow-lg
                            ${diagnosis.confidence > 90
                                ? 'bg-green-500 text-white'
                                : 'bg-yellow-500 text-white'
                              }
                          `}
                          >
                            {diagnosis.confidence}%
                          </motion.div>
                        </div>
                      </motion.div>


                    </motion.div>
                  )}

                  {predictionError && !isAnalyzing && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-96 text-center px-4"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className="mb-4"
                      >
                        <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
                      </motion.div>
                      <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                        Prediction Failed
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {predictionError}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={analyzeDiseases}
                        className="mt-6 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Retry
                      </motion.button>
                    </motion.div>
                  )}

                  {!diagnosis && !isAnalyzing && !predictionError && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-96 text-gray-400 dark:text-gray-500"
                    >
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="mb-6"
                      >
                        <Camera size={80} className="opacity-30" />
                      </motion.div>
                      <p className="text-xl font-medium mb-2">No Analysis Yet</p>
                      <p className="text-sm text-center max-w-xs">
                        Upload a leaf image and click analyze to detect diseases. Fruits &amp; vegetables are not supported.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Info Cards at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            {[
              {
                icon: "🎯",
                title: "High Accuracy",
                description: "95% detection accuracy powered by advanced AI"
              },
              {
                icon: "⚡",
                title: "Instant Analysis",
                description: "Get results in seconds, not days"
              },
              {
                icon: "�",
                title: "Leaves Only",
                description: "Works on plant leaves — fruits and vegetables are not supported"
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.02 }}
                className="
                bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl 
                rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700
                transition-all duration-300
              "
              >
                <div className="text-4xl mb-3">{card.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;