import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle, AlertCircle, Sparkles, Shield, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { auth, googleProvider } from '../config/firebaseAuth';
import { signInWithPopup } from 'firebase/auth';

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showGoogleTermsModal, setShowGoogleTermsModal] = useState(false);
  const [googleTermsAccepted, setGoogleTermsAccepted] = useState(false);
  const [isConfirmingGoogle, setIsConfirmingGoogle] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showOtpInput) { await handleVerifyOtp(); return; }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      setShowErrorPopup(true);
      return;
    }
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      setShowErrorPopup(true);
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please accept the Terms & Conditions to create an account.');
      setShowErrorPopup(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error?.toLowerCase().includes('already registered') || data.error?.toLowerCase().includes('already exists')) {
          setErrorMessage('This email is already registered. Please sign in instead.');
          setShowErrorPopup(true);
          return;
        }
        throw new Error(data.error || 'Signup failed');
      }

      if (data.requires_otp) { setShowOtpInput(true); return; }

      setShowSuccessPopup(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Signup failed');
      setShowErrorPopup(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP');
      setShowErrorPopup(true);
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp, name: formData.name, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'OTP verification failed');

      // Auto-login: save token and user info, then go home
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('email', data.email);
      if (data.name) localStorage.setItem('name', data.name);
      if (data.profilePicture) localStorage.setItem('profilePicture', data.profilePicture);
      if (data.auth_providers) localStorage.setItem('auth_providers', JSON.stringify(data.auth_providers));

      setShowOtpInput(false);
      setShowSuccessPopup(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed');
      setShowErrorPopup(true);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 1: clicking Google button opens T&C modal first
  const handleGoogleSignIn = () => {
    setGoogleTermsAccepted(false);
    setShowGoogleTermsModal(true);
  };

  // Step 2: user ticks checkbox and clicks Confirm — NOW open Google popup
  const handleConfirmGoogleSignup = async () => {
    if (!googleTermsAccepted) return;
    setIsConfirmingGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google sign-in failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('email', data.email);
      localStorage.setItem('firebase_uid', data.firebase_uid);
      if (data.name) localStorage.setItem('name', data.name);
      if (data.profilePicture) localStorage.setItem('profilePicture', data.profilePicture);
      if (data.auth_providers) localStorage.setItem('auth_providers', JSON.stringify(data.auth_providers));

      setShowGoogleTermsModal(false);
      setShowSuccessPopup(true);
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } catch (error: any) {
      setShowGoogleTermsModal(false);
      setErrorMessage(error.message || 'Google sign-in failed');
      setShowErrorPopup(true);
    } finally {
      setIsConfirmingGoogle(false);
    }
  };

  // ── Background & decorative elements ──────────────────────────────
  const Background = () => (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-green-400/10 dark:bg-green-500/10"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: Math.random() * 6 + 2, height: Math.random() * 6 + 2 }}
            animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 8, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 text-6xl opacity-10 pointer-events-none hidden lg:block">🌱</motion.div>
      <motion.div animate={{ y: [0, -15, 0], rotate: [0, -5, 5, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-20 right-10 text-6xl opacity-10 pointer-events-none hidden lg:block">✨</motion.div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 flex items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-8 lg:p-12 w-full max-w-md lg:max-w-xl transition-colors duration-300 border-2 border-green-200/30 dark:border-green-700/30"
      >
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full blur-2xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, duration: 0.6, type: 'spring' }} className="relative inline-block mb-4">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 blur-xl rounded-full" />
            <div className="relative text-5xl">🌿</div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
            Create Account
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Join your AI-powered farming assistant
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap justify-center gap-2 mt-4">
            {[{ icon: <Sparkles size={14} />, text: 'AI Powered' }, { icon: <Shield size={14} />, text: 'Secure' }, { icon: <Zap size={14} />, text: 'Fast' }].map((pill, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + idx * 0.1 }}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-300/30 dark:border-green-700/30 text-xs font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
                {pill.icon}<span>{pill.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-7">
          {/* Name */}
          <div>
            <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors" size={20} />
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-3 lg:py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/50 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300" required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors" size={20} />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 lg:py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/50 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300" required />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors" size={20} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Create a password"
                className="w-full pl-10 pr-12 py-3 lg:py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/50 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors" size={20} />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-3 lg:py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/50 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300" required />
            </div>
          </div>

          {/* OTP Input */}
          <AnimatePresence>
            {showOtpInput && (
              <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <div className="relative">
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-300">OTP sent to <strong>{formData.email}</strong></p>
                  </motion.div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">Enter Verification Code</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 dark:group-focus-within:text-green-400 transition-colors" size={20} />
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:focus:ring-green-400/50 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 text-center text-lg tracking-widest"
                      autoFocus onKeyPress={(e) => { if (e.key === 'Enter' && otp.length === 6) handleVerifyOtp(); }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">OTP expires in 5 minutes</p>
                    <button type="button" onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }) });
                        if (res.ok) { setOtp(''); setErrorMessage('OTP resent successfully!'); setShowErrorPopup(true); setTimeout(() => setShowErrorPopup(false), 2000); }
                      } catch {}
                    }} className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors duration-200">Resend OTP</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms & Conditions Checkbox */}
          {!showOtpInput && (
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`relative flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 mt-0.5 ${termsAccepted ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}
              >
                <AnimatePresence>
                  {termsAccepted && (
                    <motion.svg initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 w-full h-full p-0.5" viewBox="0 0 16 16" fill="none">
                      <motion.path d="M3 8l3.5 3.5 6.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium underline underline-offset-2 transition-colors duration-300">
                  Terms &amp; Conditions
                </Link>
                {' '}of AgriGPT
              </p>
            </div>
          )}

          {/* Submit */}
          <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
            disabled={showOtpInput && (otp.length !== 6 || isVerifyingOtp)}
            className="relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 dark:from-green-600 dark:via-emerald-600 dark:to-teal-600 text-white py-3 lg:py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl overflow-hidden font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
            {showOtpInput ? (
              isVerifyingOtp ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="relative z-10 w-5 h-5 border-2 border-white border-t-transparent rounded-full" /><span className="relative z-10">Verifying...</span></>
              ) : (
                <><span className="relative z-10">Verify OTP & Continue</span><CheckCircle size={20} className="relative z-10" /></>
              )
            ) : (
              <><span className="relative z-10">Create Account</span><ArrowRight size={20} className="relative z-10" /></>
            )}
          </motion.button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-500 font-medium transition-colors duration-300">Sign In</Link>
          </p>
        </div>

        {/* Google Sign-In */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600 transition-colors duration-300" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-300">Or continue with</span></div>
          </div>
          <div className="mt-6 flex justify-center">
            <motion.button onClick={handleGoogleSignIn} whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.95 }}
              className="relative group w-full max-w-xs inline-flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-green-200 dark:border-green-700">
              <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/40 dark:via-green-500/10 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 blur-xl" />
              </div>
              <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ rotate: 360, scale: 1.2, transition: { duration: 0.6, ease: 'easeOut' } }} className="relative z-10">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </motion.div>
              <span className="relative z-10 font-semibold text-base bg-gradient-to-r from-gray-700 via-gray-900 to-gray-700 dark:from-gray-200 dark:via-white dark:to-gray-200 bg-clip-text text-transparent group-hover:from-green-600 group-hover:via-emerald-600 group-hover:to-teal-600 dark:group-hover:from-green-400 dark:group-hover:via-emerald-400 dark:group-hover:to-teal-400 transition-all duration-500">
                Continue with Google
              </span>
              <motion.div animate={{ scale: [0, 1, 0], rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100" />
              <motion.div animate={{ scale: [0, 1, 0], rotate: [0, -180, -360] }} transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-2 left-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Popups ── */}

      {/* Success */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
              <div className="flex flex-col items-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle size={48} className="text-green-600" />
                </motion.div>
                <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-gray-800 mb-2">Account Created!</motion.h3>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-gray-600 text-center">Welcome! Redirecting to home...</motion.p>
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 2 }} className="w-full h-1 bg-green-600 rounded-full mt-4" style={{ transformOrigin: 'left' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {showErrorPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowErrorPopup(false)}>
            <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle size={48} className="text-red-600" />
                </motion.div>
                <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-gray-800 mb-2">
                  {errorMessage.toLowerCase().includes('already registered') ? 'Already Registered!' : 'Error!'}
                </motion.h3>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-gray-600 text-center mb-6">{errorMessage}</motion.p>
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowErrorPopup(false); if (errorMessage.toLowerCase().includes('already registered')) navigate('/login'); }}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
                  {errorMessage.toLowerCase().includes('already registered') ? 'Sign In' : 'Try Again'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google T&C Modal */}
      <AnimatePresence>
        {showGoogleTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg border border-green-200/40 dark:border-green-700/30 overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

              <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sign up with Google</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">You must accept terms before continuing</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">
                  Please read and accept our Terms &amp; Conditions. The Google sign-in will only open <strong>after</strong> you tick the checkbox below.
                </p>

                {/* Scrollable T&C preview */}
                <div className="h-48 overflow-y-auto rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 p-4 mb-5 text-sm text-gray-600 dark:text-gray-300 space-y-3 scrollbar-thin">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Terms &amp; Conditions Summary</p>
                  <p>By creating an account on AgriGPT, you agree to use the platform solely for lawful agricultural advisory purposes.</p>
                  <p><strong>Data Usage:</strong> We collect your name, email, and usage data to provide personalised AI-driven crop recommendations. Your data is never sold to third parties.</p>
                  <p><strong>AI Advice:</strong> AgriGPT provides informational guidance only. Always consult a qualified agronomist for critical farming decisions.</p>
                  <p><strong>Account Security:</strong> You are responsible for keeping your credentials secure. Report any unauthorised access immediately.</p>
                  <p><strong>Content Policy:</strong> Do not misuse the platform for spam, illegal activity, or uploading harmful content.</p>
                  <p><strong>Termination:</strong> We reserve the right to suspend accounts that violate these terms.</p>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Read the full terms at{' '}
                    <Link to="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-700 dark:hover:text-green-300">
                      agrigpt.com/terms
                    </Link>
                  </p>
                </div>

                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => setGoogleTermsAccepted(!googleTermsAccepted)}
                  className="flex items-start gap-3 w-full text-left mb-6 group"
                >
                  <div className={`relative flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 transition-all duration-200 ${
                    googleTermsAccepted
                      ? 'bg-green-500 border-green-500 dark:bg-green-600 dark:border-green-600'
                      : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 group-hover:border-green-400'
                  }`}>
                    <AnimatePresence>
                      {googleTermsAccepted && (
                        <motion.svg
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.4 }}
                          className="absolute inset-0 w-full h-full p-0.5"
                          viewBox="0 0 16 16" fill="none"
                        >
                          <motion.path d="M3 8l3.5 3.5 6.5-7" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    I have read and agree to the{' '}
                    <Link
                      to="/terms" target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 dark:text-green-400 underline underline-offset-2 font-medium hover:text-green-700 dark:hover:text-green-300"
                    >
                      Terms &amp; Conditions
                    </Link>
                    {' '}of AgriGPT
                  </span>
                </button>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowGoogleTermsModal(false); setGoogleTermsAccepted(false); }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={googleTermsAccepted ? { scale: 1.02, y: -1 } : {}}
                    whileTap={googleTermsAccepted ? { scale: 0.98 } : {}}
                    onClick={handleConfirmGoogleSignup}
                    disabled={!googleTermsAccepted || isConfirmingGoogle}
                    className={`flex-1 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      googleTermsAccepted
                        ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:shadow-green-200 dark:hover:shadow-green-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isConfirmingGoogle ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /><span>Opening Google...</span></>
                    ) : (
                      <><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span>Continue with Google</span></>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignupPage;
