import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, MessageSquare, Mail, User, Calendar, RefreshCw, LogOut, FileText, AlertCircle, Trash2, Check, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getApiUrl, getAuthHeaders } from '../config/api';
import Footer from '../components/Footer';

interface Feedback {
  _id: string;
  name: string;
  email: string;
  message: string;
  user_id?: string;
  status: string;
  timestamp: string;
}

interface Statistics {
  users: {
    total: number;
    developers: number;
    regular_users: number;
    recent_signups: number;
  };
  feature_usage: {
    chat_sessions: number;
    reports_generated: number;
    feedbacks_received: number;
    most_used_feature: {
      name: string;
      count: number;
    };
  };
  recent_activity: {
    last_7_days: {
      new_users: number;
      chat_sessions: number;
      reports: number;
    };
  };
}

const AdminPanelPage = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeveloper, setIsDeveloper] = useState<boolean | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const checkDeveloperAccess = async () => {
    try {
      console.log('🔍 Checking developer access...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.CHECK_DEVELOPER), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('Check developer response status:', response.status);
      const data = await response.json();
      console.log('Check developer response data:', data);

      if (response.status === 401) {
        console.log('❌ Unauthorized, redirecting to auth');
        navigate('/auth');
        return false;
      }

      const hasAccess = response.ok && data.is_developer === true;
      console.log('Has developer access:', hasAccess);
      setIsDeveloper(hasAccess);
      return hasAccess;
    } catch (err: any) {
      console.error('❌ Error checking developer access:', err);
      setIsDeveloper(false);
      return false;
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.ADMIN_FEEDBACKS), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch feedbacks');
      }

      setFeedbacks(data.feedbacks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedbacks');
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.ADMIN_STATISTICS), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setStatistics(data.statistics);
      }
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token) {
      // Trial users (not logged in) - show restricted page
      setIsDeveloper(false);
      setIsLoading(false);
      return;
    }

    // Check developer access
    const hasAccess = await checkDeveloperAccess();
    if (!hasAccess) {
      setIsLoading(false);
      return;
    }

    // Fetch both feedbacks and statistics
    await Promise.all([fetchFeedbacks(), fetchStatistics()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [navigate]);

  const refreshData = () => {
    fetchAllData();
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    setFeedbackToDelete(feedbackId);
    setShowDeleteModal(true);
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      const feedbackId = feedbackToDelete;
      const response = await fetch(getApiUrl(`/api/admin/feedback/${feedbackId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete feedback');
      }

      // Remove from local state
      setFeedbacks(feedbacks.filter(f => f._id !== feedbackId));
      console.log('✅ Feedback deleted successfully');
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    } catch (err: any) {
      console.error('❌ Error deleting feedback:', err);
      alert(err.message || 'Failed to delete feedback');
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    }
  };

  const handleMarkAsDone = async (feedbackId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/feedback/${feedbackId}/status`), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update feedback status');
      }

      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f._id === feedbackId ? { ...f, status: 'resolved' } : f
      ));
      console.log('✅ Feedback marked as resolved');
    } catch (err: any) {
      console.error('❌ Error updating feedback status:', err);
      alert(err.message || 'Failed to update feedback status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <Shield size={64} className="text-green-600 dark:text-green-400 animate-pulse" />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Access denied for non-developers
  if (isDeveloper === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center min-h-[70vh]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mb-6">
                <AlertCircle size={80} className="text-orange-500 dark:text-orange-400 mx-auto" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-400 bg-clip-text text-transparent mb-6">
                Access Restricted
              </h1>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/30 mb-6">
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
                  This page is only accessible to <span className="font-bold text-green-600 dark:text-green-400">AgriGPT Developers</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our development team uses this panel to review and address user feedback, ensuring we continuously improve AgriGPT to better serve farmers like you.
                </p>
                <div className="flex items-start gap-3 text-left bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
                  <MessageSquare className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Have feedback or need help?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Please visit our <span className="font-medium text-green-600 dark:text-green-400">Feedback page</span> to share your thoughts, report issues, or ask questions. We're here to help!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={() => navigate('/feedback')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Go to Feedback
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                >
                  Return Home
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div>
                <Shield size={48} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Manage user feedback and improve AgriGPT
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={refreshData}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Refresh</span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogOut size={20} />
                <span className="hidden md:inline">Back to Home</span>
              </motion.button>
            </div>
          </div>

          {/* Stats Cards - Primary Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {statistics?.users.total || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{statistics?.users.recent_signups || 0} this week
                  </p>
                </div>
                <User size={40} className="text-indigo-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Chat Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {statistics?.feature_usage.chat_sessions || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{statistics?.recent_activity.last_7_days.chat_sessions || 0} this week
                  </p>
                </div>
                <MessageSquare size={40} className="text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Reports Generated</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {statistics?.feature_usage.reports_generated || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{statistics?.recent_activity.last_7_days.reports || 0} this week
                  </p>
                </div>
                <FileText size={40} className="text-orange-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Feedbacks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {feedbacks.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {feedbacks.filter(f => f.status === 'new').length} new
                  </p>
                </div>
                <Mail size={40} className="text-green-500" />
              </div>
            </motion.div>
          </div>

          {/* Secondary Stats - Most Used Feature */}
          {statistics && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/30 dark:to-indigo-900/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-purple-300/50 dark:border-purple-700/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">Most Used Feature</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1 capitalize">
                      {statistics.feature_usage.most_used_feature.name}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                      {statistics.feature_usage.most_used_feature.count} total uses
                    </p>
                  </div>
                  <Shield size={50} className="text-purple-500 dark:text-purple-400" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-gradient-to-br from-cyan-50/90 to-blue-50/90 dark:from-cyan-900/30 dark:to-blue-900/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-cyan-300/50 dark:border-cyan-700/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">Active This Week</p>
                    <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-100 mt-1">
                      {statistics.recent_activity.last_7_days.new_users + 
                       statistics.recent_activity.last_7_days.chat_sessions + 
                       statistics.recent_activity.last_7_days.reports}
                    </p>
                    <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">
                      Total activities in last 7 days
                    </p>
                  </div>
                  <Calendar size={50} className="text-cyan-500 dark:text-cyan-400" />
                </div>
              </motion.div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Grid Container for Side-by-Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Feedbacks - Left Side */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 dark:border-gray-700/30 relative"
            >
              {/* Gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700 rounded-t-3xl" />

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                User Feedbacks
              </h2>

              {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"
                />
              </div>
            ) : feedbacks.filter(f => f.status !== 'resolved').length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-20 blur-xl rounded-full" />
                    <MessageSquare size={80} className="relative text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
                      No Active Feedbacks
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      {feedbacks.length === 0 ? 'No feedbacks received yet' : 'All feedbacks have been resolved'}
                    </p>
                  </div>
                  <div className="mt-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">All caught up! 🎉</span>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.filter(f => f.status !== 'resolved').map((feedback, index) => (
                  <motion.div
                    key={feedback._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <User size={18} />
                            <span className="font-semibold">{feedback.name}</span>
                          </div>
                          {feedback.email && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                              <Mail size={16} />
                              <span>{feedback.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                          <Calendar size={16} />
                          <span>{formatDate(feedback.timestamp)}</span>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(feedback.status)}`}>
                        {feedback.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {feedback.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {feedback.user_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          User ID: {feedback.user_id}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Mark as Done Button */}
                        {feedback.status !== 'resolved' && (
                          <motion.button
                            onClick={() => handleMarkAsDone(feedback._id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                            title="Mark as resolved"
                          >
                            <Check size={16} />
                            <span>Done</span>
                          </motion.button>
                        )}
                        
                        {/* Delete Button */}
                        <motion.button
                          onClick={() => handleDeleteFeedback(feedback._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                          title="Delete feedback"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Resolved Feedbacks - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20 dark:border-gray-700/30 relative"
          >
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700 rounded-t-3xl" />

            <div className="flex items-center gap-3 mb-6">
              <Check size={28} className="text-green-600 dark:text-green-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Resolved Feedbacks
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  These will be automatically deleted after 7 days
                </p>
              </div>
            </div>

            {feedbacks.filter(f => f.status === 'resolved').length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-20 blur-xl rounded-full" />
                    <CheckCircle size={80} className="relative text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">
                      No Resolved Feedbacks
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Resolved feedbacks will appear here
                    </p>
                  </div>
                  <div className="mt-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-full border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">Auto-deleted after 7 days</span>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {feedbacks.filter(f => f.status === 'resolved').map((feedback, index) => (
                  <motion.div
                    key={feedback._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-700/30 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white text-sm">
                            <User size={16} />
                            <span className="font-semibold">{feedback.name}</span>
                          </div>
                          {feedback.email && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
                              <Mail size={14} />
                              <span>{feedback.email}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                          {feedback.message}
                        </p>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-2">
                          <Calendar size={14} />
                          <span>{formatDate(feedback.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                          <Check size={14} />
                          Resolved
                        </span>
                        
                        <motion.button
                          onClick={() => handleDeleteFeedback(feedback._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 shadow-sm"
                          title="Delete feedback"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
          </div>
          {/* End Grid Container */}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-200 dark:border-red-700/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete this feedback? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFeedbackToDelete(null);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </motion.button>
              
              <motion.button
                onClick={confirmDeleteFeedback}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelPage;
