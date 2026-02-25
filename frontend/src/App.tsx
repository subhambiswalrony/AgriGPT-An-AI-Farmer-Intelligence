import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import Loader from './components/Loader';
import ScrollToTop from './components/ScrollToTop';
import Navigation from './components/Navigation';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const UploadPage = React.lazy(() => import('./pages/UploadPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));
// const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const WeatherPage = React.lazy(() => import('./pages/WeatherPage'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const FeedbackPage = React.lazy(() => import('./pages/FeedbackPage'));
const AdminPanelPage = React.lazy(() => import('./pages/AdminPanelPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = React.useState(true);

  // Apply theme immediately on mount, before loader
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <Loader onLoadComplete={handleLoadComplete} />;
  }

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <Navigation />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/report" element={<ReportPage />} />
                {/* <Route path="/team" element={<TeamPage />} /> */}
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/admin" element={<AdminPanelPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default App;