import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Camera, Upload, Trash2, Sparkles, Shield, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import Loader from '../components/Loader';
import { LogoutConfirmModal, DeleteAccountModal } from '../components/Modals';
import { auth, googleProvider } from '../config/firebaseAuth';
import { EmailAuthProvider, linkWithCredential, signInWithPopup } from 'firebase/auth';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authProviders, setAuthProviders] = useState<string[]>([]);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: ''
  });

  const [previewImage, setPreviewImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    profilePicture: ''
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    // Load current user data
    const name = localStorage.getItem('name') || '';
    const email = localStorage.getItem('email') || '';
    const profilePicture = localStorage.getItem('profilePicture') || '';
    const providersString = localStorage.getItem('auth_providers');
    
    // If auth_providers is missing, infer from available data
    let providers: string[] = [];
    if (providersString) {
      providers = JSON.parse(providersString);
    } else {
      // Fallback: Check if user has firebase_uid (Google user)
      const firebaseUid = localStorage.getItem('firebase_uid');
      if (firebaseUid) {
        providers = ['google'];
        localStorage.setItem('auth_providers', JSON.stringify(providers));
      } else {
        // Regular user with password
        providers = ['local'];
        localStorage.setItem('auth_providers', JSON.stringify(providers));
      }
    }
    
    setFormData(prev => ({ ...prev, name, email, profilePicture }));
    setOriginalData({ name, email, profilePicture });
    setPreviewImage(profilePicture);
    setAuthProviders(providers);
    setIsGoogleUser(providers.includes('google'));
    setHasPassword(providers.includes('local'));
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set maximum dimensions (smaller = less storage)
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality (0.7 = 70% quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        setPreviewImage(compressedBase64);
        setFormData(prev => ({ ...prev, profilePicture: compressedBase64 }));
        setUploadingImage(false);
      };
      
      img.onerror = () => {
        setErrorMessage('Failed to process image');
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 5000);
        setUploadingImage(false);
      };
      
      img.src = reader.result as string;
    };
    
    reader.onerror = () => {
      setErrorMessage('Failed to read image file');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Remove from backend
      const response = await fetch(getApiUrl(API_ENDPOINTS.UPDATE_PROFILE), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          profilePicture: ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove profile picture');
      }

      // Update state and localStorage
      setPreviewImage('');
      setFormData(prev => ({ ...prev, profilePicture: '' }));
      localStorage.removeItem('profilePicture');

      setSuccessMessage('Profile picture removed successfully!');
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

    } catch (error) {
      console.error('Remove profile picture error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to remove profile picture');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) {
        throw new Error('Please login to continue');
      }

      // Validate inputs
      if (!formData.name.trim()) {
        throw new Error('Name cannot be empty');
      }

      if (!formData.email.trim()) {
        throw new Error('Email cannot be empty');
      }

      // Update profile
      const profileResponse = await fetch(getApiUrl(API_ENDPOINTS.UPDATE_PROFILE), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          profilePicture: formData.profilePicture
        })
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || 'Failed to update profile');
      }

      // Update password if provided
      // For Google users creating password for the first time
      if (isGoogleUser && !hasPassword && formData.newPassword) {
        if (formData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        console.log('📡 Creating password for Google user...');
        
        // Try to link with Firebase (optional)
        const user = auth.currentUser;
        if (user && user.email) {
          try {
            const credential = EmailAuthProvider.credential(user.email, formData.newPassword);
            await linkWithCredential(user, credential);
            console.log('✅ Firebase credential linked successfully');
          } catch (firebaseError: any) {
            console.warn('⚠️ Firebase linking failed (may already be linked):', firebaseError.message);
          }
        }
        
        // Update backend to add 'local' provider
        const createPasswordResponse = await fetch(getApiUrl('/api/create-password'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            password: formData.newPassword
          })
        });

        console.log('📡 Backend response status:', createPasswordResponse.status);
        const createPasswordData = await createPasswordResponse.json();
        console.log('📡 Backend response data:', createPasswordData);

        if (!createPasswordResponse.ok) {
          throw new Error(createPasswordData.error || 'Failed to create password');
        }

        // Update local state
        setHasPassword(true);
        const updatedProviders = [...authProviders, 'local'];
        setAuthProviders(updatedProviders);
        localStorage.setItem('auth_providers', JSON.stringify(updatedProviders));
        
      } else if (formData.currentPassword && formData.newPassword) {
        // Regular password change for users who already have a password
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }

        if (formData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const passwordResponse = await fetch(getApiUrl(API_ENDPOINTS.CHANGE_PASSWORD), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
        });

        const passwordData = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(passwordData.error || 'Failed to change password');
        }
      }

      // Update localStorage
      localStorage.setItem('name', formData.name);
      localStorage.setItem('email', formData.email);
      if (formData.profilePicture) {
        localStorage.setItem('profilePicture', formData.profilePicture);
      }

      // Update original data
      setOriginalData({
        name: formData.name,
        email: formData.email,
        profilePicture: formData.profilePicture
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setSuccessMessage('Settings saved successfully!');
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

    } catch (error) {
      console.error('Save settings error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setFormData({
      ...originalData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPreviewImage(originalData.profilePicture);
    setSuccessMessage('Changes cancelled');
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000);
  };

  // Check if there are any unsaved changes
  const hasUnsavedChanges = () => {
    // Check profile changes
    const hasProfileChanges = 
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.profilePicture !== originalData.profilePicture;
    
    // Check password changes
    const hasPasswordChanges = 
      formData.currentPassword !== '' ||
      formData.newPassword !== '' ||
      formData.confirmPassword !== '';
    
    return hasProfileChanges || hasPasswordChanges;
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) {
        throw new Error('Please login to continue');
      }

      const response = await fetch(getApiUrl(API_ENDPOINTS.DELETE_ACCOUNT), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear all localStorage data
      localStorage.clear();

      // Notify Navigation (and any listener) to clear user state immediately
      window.dispatchEvent(new Event('authChange'));

      // Show loader before redirecting (loader will handle navigation)
      // Note: isLoading state will keep showing loader

    } catch (error) {
      console.error('Delete account error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete account');
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
      setIsLoading(false);
    }
  };

  const handleDeleteLoadComplete = () => {
    navigate('/');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear all localStorage data
    localStorage.clear();

    // Notify Navigation to clear user state immediately
    window.dispatchEvent(new Event('authChange'));

    // Navigate to home page
    navigate('/');
  };

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();
      
      // Send Firebase token to backend to link accounts
      const response = await fetch(getApiUrl('/api/link-google'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firebase_token: firebaseToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Google account');
      }

      // Update local state
      const updatedProviders = data.auth_providers;
      setAuthProviders(updatedProviders);
      setIsGoogleUser(true);
      localStorage.setItem('auth_providers', JSON.stringify(updatedProviders));
      localStorage.setItem('firebase_uid', data.firebase_uid);

      setSuccessMessage('Google account linked successfully! You can now sign in with Google.');
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

    } catch (error: any) {
      console.error('Link Google error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to link Google account');
      }
      
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 5000);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  // Only show full-page loader for account deletion
  if (isLoading && !isSaving) {
    return <Loader onLoadComplete={handleDeleteLoadComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 py-8 px-4 transition-colors duration-500">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl border-2 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back</span>
            </motion.button>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 backdrop-blur-xl bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-xl border-2 border-orange-300/50 dark:border-orange-700/50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </motion.button>
          </div>
          
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl p-6 sm:p-8 border-2 border-green-200/50 dark:border-green-700/50 shadow-2xl">
            <div className="flex items-center space-x-4 mb-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
                className="relative"
              >
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-xl"
                />
                <span className="text-5xl relative z-10">⚙️</span>
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Account Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center">
                  <Sparkles size={16} className="mr-2 text-green-500" />
                  Manage your profile and preferences
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Picture Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 transition-all duration-300 hover:shadow-green-500/20 hover:shadow-3xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
                className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 p-3 rounded-2xl"
              >
                <Camera size={24} className="text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">Profile Picture</h2>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {/* Profile Picture Preview */}
              <div className="relative">
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity
                  }}
                  className="absolute -inset-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full blur-xl opacity-30"
                />
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-4 border-green-400/50 dark:border-green-600/50 shadow-xl">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={48} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  
                  {/* Upload overlay */}
                  <label className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload size={24} className="text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <motion.label
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              >
                <motion.div
                  animate={{
                    x: ["-100%", "200%"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
                <Camera size={20} className="relative z-10" />
                <span className="relative z-10">{uploadingImage ? 'Uploading...' : 'Change Picture'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </motion.label>

              {/* Remove Picture Button */}
              {previewImage && (
                <motion.button
                  onClick={handleRemoveProfilePicture}
                  disabled={uploadingImage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative overflow-hidden w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group disabled:opacity-50"
                >
                  <motion.div
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                  <Trash2 size={20} className="relative z-10" />
                  <span className="relative z-10">Remove Picture</span>
                </motion.button>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-400 text-center flex items-center justify-center">
                <Sparkles size={12} className="mr-1 text-green-500" />
                JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </motion.div>

          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 transition-all duration-300 hover:shadow-green-500/20 hover:shadow-3xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 0.5
                }}
                className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 p-3 rounded-2xl"
              >
                <User size={24} className="text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">Profile Information</h2>
            </div>

            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 items-center">
                  <Sparkles size={14} className="mr-1 text-green-500" />
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-green-200/50 dark:border-green-700/50 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 transition-all duration-300 shadow-lg"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 items-center">
                  <Sparkles size={14} className="mr-1 text-green-500" />
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-green-200/50 dark:border-green-700/50 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 transition-all duration-300 shadow-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Password & Google Connection Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 transition-all duration-300 hover:shadow-green-500/20 hover:shadow-3xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 1
                }}
                className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 p-3 rounded-2xl"
              >
                <Lock size={24} className="text-green-600 dark:text-green-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                  {isGoogleUser && !hasPassword ? 'Create Password' : 'Change Password'}
                </h2>
                {isGoogleUser && !hasPassword && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Create a password to enable email/password login
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Password - Only show if user already has a password */}
              {hasPassword && (
                <div>
                  <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 items-center">
                    <Shield size={14} className="mr-1 text-green-500" />
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border-2 border-green-200/50 dark:border-green-700/50 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 transition-all duration-300 shadow-lg"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 items-center">
                  <Shield size={14} className="mr-1 text-green-500" />
                  {isGoogleUser && !hasPassword ? 'Password' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border-2 border-green-200/50 dark:border-green-700/50 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 transition-all duration-300 shadow-lg"
                    placeholder={isGoogleUser && !hasPassword ? "Enter password" : "Enter new password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="flex text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 items-center">
                  <Shield size={14} className="mr-1 text-green-500" />
                  Confirm {isGoogleUser && !hasPassword ? 'Password' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border-2 border-green-200/50 dark:border-green-700/50 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl text-gray-800 dark:text-gray-100 transition-all duration-300 shadow-lg"
                    placeholder={isGoogleUser && !hasPassword ? "Confirm password" : "Confirm new password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Connect with Google Section - Only show for non-Google users */}
          {!isGoogleUser && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 transition-all duration-300 hover:shadow-green-500/20 hover:shadow-3xl"
            >
            <div className="flex items-center space-x-3 mb-4">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: 1.5
                }}
                className="backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-red-500/20 p-3 rounded-2xl"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </motion.div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Connect with Google
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Link your Google account for easier sign-in
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold mb-1">Why connect Google?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Sign in with one click using Google</li>
                    <li>• Keep your existing email/password login</li>
                    <li>• No duplicate accounts</li>
                    <li>• Enhanced account security</li>
                  </ul>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                whileHover={{ scale: isLinkingGoogle ? 1 : 1.02 }}
                whileTap={{ scale: isLinkingGoogle ? 1 : 0.98 }}
                className="relative overflow-hidden w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-300/50 dark:border-green-700/50 group"
              >
                {!isLinkingGoogle && (
                  <motion.div
                    animate={{
                      x: ["-100%", "200%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/40 dark:via-green-500/10 to-transparent"
                  />
                )}
                
                {isLinkingGoogle ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full"
                  />
                ) : (
                  <motion.svg 
                    className="w-6 h-6 relative z-10"
                    viewBox="0 0 24 24"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </motion.svg>
                )}

                <span className="relative z-10 bg-gradient-to-r from-gray-700 via-gray-900 to-gray-700 dark:from-gray-200 dark:via-white dark:to-gray-200 bg-clip-text text-transparent group-hover:from-green-600 group-hover:via-emerald-600 group-hover:to-teal-600 dark:group-hover:from-green-400 dark:group-hover:via-emerald-400 dark:group-hover:to-teal-400 transition-all duration-500">
                  {isLinkingGoogle ? 'Connecting...' : 'Connect Google Account'}
                </span>
              </motion.button>
            </div>
          </motion.div>
          )}
        </div>

        {/* Connected Accounts Display */}
        {(isGoogleUser || hasPassword) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Shield size={24} className="text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                Connected Sign-In Methods
              </h2>
            </div>
            
            <div className="space-y-3">
              {hasPassword && (
                <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center space-x-3">
                    <Mail size={20} className="text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Email & Password</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{formData.email}</p>
                    </div>
                  </div>
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
              )}
              
              {isGoogleUser && (
                <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">Google Account</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{formData.email}</p>
                    </div>
                  </div>
                  <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Save, Cancel, Delete Account */}
        <motion.form
          onSubmit={handleSaveAll}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-green-200/50 dark:border-green-700/50"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Save Button */}
            <motion.button
              type="submit"
              disabled={isSaving || !hasUnsavedChanges()}
              whileHover={!isSaving && hasUnsavedChanges() ? { scale: 1.05 } : {}}
              whileTap={!isSaving && hasUnsavedChanges() ? { scale: 0.95 } : {}}
              className={`relative overflow-hidden flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold shadow-xl transition-all duration-200 disabled:cursor-not-allowed group text-lg ${
                hasUnsavedChanges() && !isSaving
                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white hover:shadow-2xl'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {hasUnsavedChanges() && !isSaving && (
                <motion.div
                  animate={{
                    x: ["-100%", "200%"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              )}
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="relative z-10"
                >
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
                </motion.div>
              ) : (
                <Save size={24} className="relative z-10" />
              )}
              <span className="relative z-10">{isSaving ? 'Saving...' : 'Save All Changes'}</span>
            </motion.button>

            {/* Cancel Button */}
            <motion.button
              type="button"
              onClick={handleCancel}
              disabled={isSaving || !hasUnsavedChanges()}
              whileHover={!isSaving && hasUnsavedChanges() ? { scale: 1.05 } : {}}
              whileTap={!isSaving && hasUnsavedChanges() ? { scale: 0.95 } : {}}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-bold shadow-xl transition-all duration-200 disabled:cursor-not-allowed border-2 text-lg ${
                hasUnsavedChanges() && !isSaving
                  ? 'backdrop-blur-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white hover:shadow-2xl border-yellow-300/50 dark:border-yellow-600/50'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed border-gray-400/30 dark:border-gray-600/30'
              }`}
            >
              <AlertCircle size={24} />
              <span>Cancel</span>
            </motion.button>

            {/* Delete Account Button */}
            <motion.button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden flex-1 flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 group text-lg"
            >
              <motion.div
                animate={{
                  x: ["-100%", "200%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
              <Trash2 size={24} className="relative z-10" />
              <span className="relative z-10">Delete Account</span>
            </motion.button>
          </div>
        </motion.form>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={showLogoutConfirm}
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteAccountModal
          isOpen={showDeleteConfirm}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={isLoading}
        />

        {/* Success Popup */}
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-24 right-4 backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl p-5 flex items-center space-x-4 z-50 border-2 border-green-200/50 dark:border-green-700/50"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 0.5
              }}
              className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-800/50 rounded-2xl shadow-lg"
            >
              <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
            </motion.div>
            <div>
              <p className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">Success!</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Error Popup */}
        {showErrorPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-24 right-4 backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl p-5 z-50 max-w-md border-2 border-red-200/50 dark:border-red-700/50"
          >
            <div className="flex items-start space-x-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{
                  duration: 0.5
                }}
                className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl shadow-lg flex-shrink-0"
              >
                <AlertCircle size={28} className="text-red-600 dark:text-red-400" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-lg bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">Error</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{errorMessage}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowErrorPopup(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
