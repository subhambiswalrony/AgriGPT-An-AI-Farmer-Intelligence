# 🌾 AgriGPT Frontend

A modern, high-performance React + TypeScript frontend for the AgriGPT agricultural chatbot application with Firebase Google Sign-In integration and mobile-optimized performance.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-blue.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange.svg)](https://firebase.google.com/)

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Performance Optimizations](#-performance-optimizations)
- [Technology Stack](#️-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Authentication Flow](#-authentication-flow)
- [API Integration](#-api-integration)
- [Routes](#-routes)
- [Theming](#-theming)
- [Responsive Design](#-responsive-design)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🚀 Core Features

### 1. **User Authentication System**
- **Multiple Authentication Methods:**
  - Traditional email/password authentication with JWT
  - **Google Sign-In with Firebase** (OAuth 2.0)
  - Animated Google Sign-In button with green agricultural theme
  - Hybrid support: Google users can create password for email login
- Secure JWT-based session management
- Protected routes with authentication guards
- Automatic token refresh and validation
- Profile management with password creation for Google users
- Secure token storage in localStorage with automatic cleanup

### 2. **Real-time AI Chat Interface**
- Interactive chat with AgriGPT AI powered by Google Gemini 2.5-flash
- Support for **13+ Indian languages** (Hindi, Odia, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, Assamese, English)
- Clean, responsive chat UI with conversation history
- Text and voice input support with real-time transcription
- **Markdown rendering** for formatted AI responses
- Message timestamps and typing indicators
- **Trial mode** for unauthenticated users (free text chat without registration)
- Auto-scroll to latest messages
- Copy message functionality

### 3. **Voice Input Support**
- **Browser-based audio recording** with real-time visualization
- Voice message transcription using Faster Whisper
- Visual recording indicators with timer
- Support for multiple Indian languages in voice input
- **Voice features restricted to authenticated users** only
- Seamless integration with chat interface
- Audio waveform animation during recording

### 4. **Farming Report Generation**
- **AI-powered comprehensive farming reports** in 13+ languages
- Language selection dropdown for report generation
- Interactive form for crop name, district, state, and farming type
- **PDF download capability** with professional formatting
- Report history access for authenticated users
- **7 analytical sections** covering the full suitability picture:
  - 🌡️ Environmental Summary (auto-fetched temp, humidity, soil type, annual rainfall)
  - 🌱 Crop Requirements (ideal parameters from AgriGPT crop database)
  - 🔬 Compatibility Analysis (factor-by-factor: temp, humidity, rainfall, soil)
  - 📊 Suitability Score (0–100 with classification: Highly Suitable / Moderately Suitable / Risky / Not Recommended)
  - ⚠️ Quality Impact Analysis (risks and yield quality effects)
  - 💰 Economic Feasibility (market viability for the selected farming type)
  - ✅ Final Recommendation (3 actionable expert management steps)
- Print and download options

### 5. **Weather Dashboard**
- **Real-time weather information** with location detection
- Temperature, humidity, wind speed, and conditions
- 5-day weather forecast display
- **Agricultural weather advisories** specific to farming
- Location-based weather data with auto-detection
- Beautiful weather icons and animations
- Responsive weather cards

### 6. **User Profile Management**
- **Comprehensive profile settings** page
- Update personal information (name, email)
- **Profile picture upload, change, and removal**
  - Base64 image storage for quick loading
  - Image preview before upload
  - Circular avatar display
- Password management features:
  - Change existing password (requires current password)
  - **Create password for Google Sign-In users** (hybrid auth)
- View active authentication methods (Google/Local)
- Account settings and preferences
- Delete account option with confirmation

### 7. **Feedback System**
- **User feedback submission** page for suggestions and bug reports
- Contact form with name, email, and message fields
- Optional authentication - works for both trial and authenticated users
- Email validation and form validation
- Success/error toast notifications
- Beautiful gradient design with animated submit button
- Helps improve AgriGPT based on real user feedback

### 8. **Admin Dashboard** (Developer-only)
- **Developer authentication** via separate `developers` collection
- **Comprehensive statistics dashboard** powered by `analytics_routes.py` scanning **8 MongoDB collections**:
  - **Users analytics**: Total, active, returning, and inactive user counts
  - **Feature usage**: Totals for chat, voice, reports, weather searches, and disease uploads
  - **Engagement metrics**: Voice %, language distribution across 13+ Indian languages, response-type distribution (AI vs fallback), average messages per session
  - **Agriculture insights**: Top crops and disease keywords extracted from chat history
  - **Report analytics**: Top crops/regions in generated reports, report language distribution
  - **Feedback analytics**: Status breakdown (new / in-progress / resolved)
  - **Upload analytics**: Disease prediction totals, top diseases, confidence distribution
  - **Weather analytics**: Trial vs registered searches, unique cities
  - **Platform health**: 0–100 composite health score with up to 10 data-driven alerts
  - **Time-series activity**: Daily and monthly trend charts for all features
  - Supports configurable time windows: last 7, 14, 30, or 365 days
- **Advanced feedback management**:
  - Side-by-side layout comparing active vs resolved feedbacks
  - Filter feedbacks by status (new, in-progress, resolved)
  - Mark feedbacks as resolved with timestamp tracking
  - Delete feedbacks with beautiful confirmation modal
  - Auto-delete resolved feedbacks after 7 days
  - Independent scrollable columns for better UX
- **Enhanced empty states**:
  - Animated icons with gradient glow effects
  - Contextual messages based on feedback state
  - Professional badges for status indicators
- **Real-time updates** for feedback operations
- **Access control**: Restricted to verified developers only
- **Beautiful gradient accents** and modern card design

### 9. **Modern UI/UX Design**
- **Dark/Light theme toggle** with smooth transitions
- Persistent theme preference in localStorage
- Fully responsive design for mobile, tablet, and desktop
- **TailwindCSS** for utility-first styling
- **Framer Motion** for fluid animations and transitions
- **Lucide React** icons throughout
- Custom animations (shimmer effects, sparkle animations, fade-ins)
- Smooth page transitions with lazy loading
- Loading states and skeleton screens
- Toast notifications for user feedback
- Error boundaries for graceful error handling

### 10. **Performance Optimizations** ⚡
- **Code splitting** with React.lazy() for all routes
- **Lazy loading** of heavy libraries (PDF, Markdown, Animations)
- **60% smaller initial bundle** size (200 KB from 500 KB)
- **50% faster load times** on mobile devices
- **Debounced scroll** for smooth performance
- **Optimized animations** for mobile (reduced motion on low-end devices)
- **Image lazy loading** with Intersection Observer
- **Memoized components** to prevent unnecessary re-renders
- **Service Worker** ready for PWA support
- Chunk splitting for better caching

## ⚡ Performance Optimizations

AgriGPT frontend is **highly optimized for mobile devices**, ensuring smooth performance even on 6 GB RAM devices.

### 🚀 Key Performance Improvements

| Optimization | Impact | Details |
|-------------|--------|---------|
| **Code Splitting** | 60% smaller bundle | All routes lazy loaded with React.lazy() |
| **Initial Bundle** | 200 KB (from 500 KB) | 50% faster initial page load |
| **Scroll Performance** | 50% smoother | Debounced scroll, instant on mobile |
| **Animation** | Reduced lag | Mobile-optimized, respects motion preferences |
| **Image Loading** | 70% faster | Lazy loading with Intersection Observer |
| **Chunk Splitting** | Better caching | Separate vendor bundles |

### 📦 Build Optimization Details

When you run `npm run build`, the build process creates optimized chunks:

```bash
dist/
├── assets/
│   ├── react-vendor.[hash].js      # 177 KB - React core
│   ├── animation.[hash].js         # 119 KB - Framer Motion (lazy)
│   ├── markdown.[hash].js          # 118 KB - React Markdown (lazy)
│   ├── icons.[hash].js             #  30 KB - Lucide icons
│   ├── pdf.[hash].js               # 616 KB - jsPDF (lazy)
│   ├── ChatPage.[hash].js          #  43 KB - Chat page
│   ├── HomePage.[hash].js          #  25 KB - Home page
│   └── [other pages].[hash].js     # Other lazy-loaded routes
```

### 🎯 Performance Features Implemented

1. **React.lazy() for All Routes**
   - Home, Chat, Report, Settings, Weather, Team, Feedback pages
   - Each page loads only when needed
   - Reduces initial JavaScript bundle dramatically

2. **Component Memoization**
   ```typescript
   // Using React.memo for expensive components
   export default React.memo(ChatMessage);
   
   // Using useMemo for expensive calculations
   const filteredData = useMemo(() => filterLargeDataset(data), [data]);
   
   // Using useCallback for stable function references
   const handleSubmit = useCallback(() => { ... }, [dependencies]);
   ```

3. **Debounced Operations**
   - Scroll events debounced for smooth performance
   - Search input debounced to reduce API calls
   - Resize events throttled for better responsiveness

4. **Mobile-Specific Optimizations**
   - Instant scrolling (no smooth scroll on mobile)
   - Reduced animation complexity (40% faster)
   - Touch-optimized interactions (no hover effects)
   - Compressed shadows for better rendering
   - Mobile device detection with `useOptimizedAnimation` hook

5. **Image Lazy Loading**
   - Custom `LazyImage` component
   - Intersection Observer API
   - Blur placeholder during load
   - Automatic loading state management

6. **Code Splitting Strategy**
   ```typescript
   // Lazy load pages
   const ChatPage = lazy(() => import('./pages/ChatPage'));
   const ReportPage = lazy(() => import('./pages/ReportPage'));
   
   // Suspense with fallback loader
   <Suspense fallback={<Loader />}>
     <Routes>
       <Route path="/chat" element={<ChatPage />} />
     </Routes>
   </Suspense>
   ```

### 📱 Mobile Performance Metrics

**Before Optimization:**
- Initial bundle: 500 KB
- First contentful paint: 2.5s
- Time to interactive: 4.2s
- Scroll FPS: 35-40

**After Optimization:**
- Initial bundle: 200 KB (60% reduction)
- First contentful paint: 1.2s (52% faster)
- Time to interactive: 2.1s (50% faster)
- Scroll FPS: 55-60 (50% smoother)

### 🎨 Animation Performance

- Hardware-accelerated CSS transforms
- Reduced motion support (respects OS preferences)
- Conditional animations based on device capability
- Frame rate monitoring for smooth 60 FPS

**See mobile-optimizations.css for detailed CSS optimizations.**

## 🛠️ Technology Stack

### Core Technologies
- **React** 18.3.1 - Modern UI library with hooks and concurrent features
- **TypeScript** 5.5.3 - Type-safe JavaScript for better developer experience
- **Vite** 5.4.2 - Lightning-fast build tool and dev server with HMR

### UI & Styling
- **TailwindCSS** 3.4.1 - Utility-first CSS framework for rapid UI development
- **Framer Motion** 12.23.3 - Production-ready animation library (code-split)
- **Lucide React** 0.344.0 - Beautiful, consistent icon library (code-split)
- **Custom CSS** - Mobile-optimized styles for performance

### Authentication & Backend
- **Firebase** 11.10.0 - Google Sign-In OAuth 2.0 authentication
- **React Router DOM** 7.6.3 - Declarative client-side routing with lazy loading
- **Axios** (via api.ts) - Promise-based HTTP client for API requests

### Content & Media
- **React Markdown** 10.1.0 - Markdown to React component renderer (code-split)
- **jsPDF** 3.0.4 - Client-side PDF generation for farming reports (code-split)
- **html2canvas** 1.4.1 - HTML to canvas conversion for PDF exports

### Development Tools
- **ESLint** - Code linting and quality checks
- **PostCSS** - CSS transformation and autoprefixing
- **TypeScript ESLint** - TypeScript-specific linting rules

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Backend server running on http://localhost:5000
- Firebase project configured (for Google Sign-In)

## 🔧 Installation

### Step-by-Step Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `frontend/` directory:
   
   ```env
   # Backend API URL
   VITE_API_URL=http://localhost:5000
   
   # Weather & Soil API URL — proxied through Flask backend (no separate port needed)
   VITE_WEATHER_API_BASE_URL=http://localhost:5000
   
   # Firebase Configuration (Get from Firebase Console)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Optional: Weather API
   VITE_WEATHER_API_KEY=your_weather_api_key
   ```

4. **Setup Firebase Project**
   
   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project or select existing one
   
   c. Enable Google Sign-In:
      - Go to **Authentication** → **Sign-in method**
      - Enable **Google** provider
      - Configure OAuth consent screen
   
   d. Get Configuration:
      - Go to **Project Settings** → **General**
      - Scroll to "Your apps" section
      - Copy Firebase configuration values
      - Add to `.env` file
   
   e. Add Authorized Domains:
      - Go to **Authentication** → **Settings** → **Authorized domains**
      - Add `localhost` for development
      - Add your production domain when deploying

5. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at: **http://localhost:5173**

### Quick Verification

After starting the server, verify:
- ✅ Frontend loads at http://localhost:5173
- ✅ Backend is running at http://localhost:5000
- ✅ Firebase configuration is correct (check browser console)
- ✅ No CORS errors (backend should allow frontend origin)

## 📁 Project Structure

```
frontend/
├── 📄 index.html                      # HTML entry point with meta tags
├── 📄 package.json                    # Dependencies, scripts, and project metadata
├── 📄 vite.config.ts                  # Vite configuration with optimizations
├── 📄 tsconfig.json                   # TypeScript base configuration
├── 📄 tsconfig.app.json               # App-specific TypeScript config
├── 📄 tsconfig.node.json              # Node-specific TypeScript config
├── 📄 tailwind.config.js              # TailwindCSS configuration & theme
├── 📄 postcss.config.js               # PostCSS configuration for Tailwind
├── 📄 eslint.config.js                # ESLint linting rules
├── 📄 .env                            # Environment variables (create this - not in repo)
├── 📄 .gitignore                      # Git ignore patterns
├── 📄 README.md                       # Frontend documentation (this file)
│
├── 📁 src/                            # Source code directory
│   ├── 📄 main.tsx                    # Application entry point (ReactDOM render)
│   ├── 📄 App.tsx                     # Root component with React Router & lazy loading
│   ├── 📄 index.css                   # Global styles, TailwindCSS imports, custom animations
│   ├── 📄 mobile-optimizations.css    # Mobile-specific CSS optimizations
│   ├── 📄 vite-env.d.ts               # Vite environment type definitions
│   │
│   ├── 📁 assets/                     # Static assets (images, fonts, etc.)
│   │   ├── 🖼️ Rony.jpg                # Team member photo (Subham Biswal)
│   │   ├── 🖼️ swabhiman.jpeg          # Team member photo (Swabhiman Mohanty)
│   │   ├── 🖼️ tusar.jpeg              # Team member photo (Tusar Kanta Das)
│   │   └── 🖼️ vivekananda.jpg         # Team member photo (Vivekananda Champati)
│   │
│   ├── 📁 components/                 # Reusable UI components
│   │   ├── 📄 AgriGPTLogoAnimation.tsx  # Animated AgriGPT logo (loading/splash screens)
│   │   ├── 📄 FAQ.tsx                 # FAQ accordion component on home page
│   │   ├── 📄 Footer.tsx              # Footer with links and copyright
│   │   ├── 📄 LazyImage.tsx           # Lazy loading image component with Intersection Observer
│   │   ├── 📄 Loader.tsx              # Loading spinner/animation component
│   │   ├── 📄 HourlyWeatherAnalysis.tsx # 24-hour temperature & humidity chart with AI farming insights (irrigation window, avoid window)
│   │   ├── 📄 Modals.tsx              # Reusable modal components (Logout, Delete Account)
│   │   ├── 📄 Navigation.tsx          # Top navigation bar with theme toggle & auth status
│   │   ├── 📄 PromptScroller.tsx      # Animated scrolling example prompts carousel
│   │   ├── 📄 ScrollToTop.tsx         # Scroll to top on route change utility
│   │   └── 📄 TutorialModal.tsx       # Reusable step-by-step onboarding/tutorial modal with FAB trigger
│   │
│   ├── 📁 config/                     # Configuration files
│   │   ├── 📄 api.ts                  # API base URL, axios configuration, endpoint definitions
│   │   ├── 📄 firebase.ts             # Firebase project configuration (from .env)
│   │   └── 📄 firebaseAuth.ts         # Firebase Auth initialization & methods
│   │
│   ├── 📁 contexts/                   # React Context providers
│   │   └── 📄 ThemeContext.tsx        # Dark/Light theme context provider
│   │
│   ├── 📁 data/                      # Static reference data
│   │   └── 📄 indiaStatesDistricts.ts  # India states & districts lookup for report form dropdowns
│   │
│   ├── 📁 hooks/                      # Custom React hooks
│   │   ├── 📄 useOptimizedAnimation.ts # Performance optimization hook for animations
│   │   └── 📄 useWeather.ts           # Weather data fetching hook
│   │
│   ├── 📁 pages/                      # Page components (lazy loaded)
│   │   ├── 📄 AdminPanelPage.tsx      # Admin dashboard with statistics & feedback management (developer-only)
│   │   ├── 📄 ChatPage.tsx            # AI chat interface with voice support and session management
│   │   ├── 📄 FeedbackPage.tsx        # User feedback submission form
│   │   ├── 📄 HomePage.tsx            # Landing page with features showcase
│   │   ├── 📄 LoginPage.tsx           # Login with email/password + Google Sign-In
│   │   ├── 📄 SignupPage.tsx          # Signup with OTP email verification
│   │   ├── 📄 NotFoundPage.tsx        # 404 error page
│   │   ├── 📄 ReportPage.tsx          # Farming report generation & download
│   │   ├── 📄 ResetPasswordPage.tsx   # Password reset
│   │   ├── 📄 SettingsPage.tsx        # User profile & settings management
│   │   ├── 📄 TeamPage.tsx            # Team member cards with photos, roles, skills, and social links
│   │   ├── 📄 TermsAndConditionsPage.tsx # Terms and conditions page
│   │   ├── 📄 UploadPage.tsx          # AI plant disease detection (leaf image upload)
│   │   └── 📄 WeatherPage.tsx         # Weather dashboard with forecasts
│   │
│   └── 📁 utils/                      # Utility functions
│       ├── 📄 debounce.ts             # Debounce utility for performance
│       └── 📄 performance.ts          # Mobile detection & performance utilities
│
└── 📁 preview/                        # Preview files and demo videos
    └── 📹 AgriGPT 2.0.mp4             # Project demo video
```

### Key Files Explained

**Core Application Files:**
- `main.tsx` - React app initialization, StrictMode, ThemeProvider wrapper
- `App.tsx` - React Router setup with lazy-loaded routes, Suspense fallbacks
- `index.css` - Global styles, Tailwind directives, custom CSS animations
- `mobile-optimizations.css` - Mobile-specific performance optimizations

**Components (Reusable UI):**
- `Navigation.tsx` - Responsive navbar, theme toggle, user menu, mobile hamburger, logout modal
- `Footer.tsx` - Footer with quick links, social media, copyright info
- `FAQ.tsx` - Accordion-style FAQ section displayed on the home page
- `LazyImage.tsx` - Optimized image loading with blur placeholder & Intersection Observer
- `Loader.tsx` - Loading spinner shown during async operations and route changes
- `Modals.tsx` - Reusable modal components (LogoutConfirmModal, DeleteAccountModal)
- `HourlyWeatherAnalysis.tsx` - Recharts `LineChart` displaying 24-hour interpolated temperature & humidity from the weather microservice; derives AI farm insights (best irrigation window, avoid window, peak/low temps) from the hourly data
- `PromptScroller.tsx` - Horizontally scrolling carousel of example farming prompts
- `ScrollToTop.tsx` - Automatically scrolls to top on route navigation
- `TutorialModal.tsx` - Generic multi-step onboarding modal (portal-rendered, fixed 480 px height); accepts `steps[]`, `pageTitle`, `accentColor`; rendered via a floating action button; used across WeatherPage, ChatPage, etc.

**Configuration:**
- `api.ts` - Axios instance, API_BASE_URL from .env, all endpoint paths
- `firebase.ts` - Firebase config object from environment variables
- `firebaseAuth.ts` - Firebase Auth initialization, Google provider setup

**Contexts:**
- `ThemeContext.tsx` - Global theme state (dark/light), localStorage persistence

**Static Data:**
- `indiaStatesDistricts.ts` - TypeScript lookup of all Indian states and their districts; used by ReportPage dropdowns for crop region selection

**Custom Hooks:**
- `useWeather.ts` - Fetches weather data from API, handles loading/error states
- `useOptimizedAnimation.ts` - Detects mobile devices, reduces motion on low-end devices

**Pages (Lazy Loaded):**
- `HomePage.tsx` - Hero section, features, FAQ accordion, prompt scroller, call-to-action
- `LoginPage.tsx` - Email/password form, Google Sign-In button, OTP verification flow
- `SignupPage.tsx` - Registration form with OTP email verification before account creation
- `ChatPage.tsx` - Chat interface, session list, message list, text/voice input, trial mode
- `ReportPage.tsx` - Report form (crop, region, language), PDF generation, report history
- `WeatherPage.tsx` - Weather cards, forecast, location detection
- `SettingsPage.tsx` - Profile edit, password change, profile picture upload, logout button with confirmation modal, Google account linking, OTP verification
- `TeamPage.tsx` - Team member cards with photos, roles, skills, and social links
- `FeedbackPage.tsx` - Feedback form submission with email validation
- `AdminPanelPage.tsx` - Developer-only dashboard; Recharts-driven statistics from 8 MongoDB collections (users, chat, reports, feedback, disease predictions, weather, engagement, health score), configurable time window (7/14/30/365 days), side-by-side feedback management, delete confirmation modal
- `TermsAndConditionsPage.tsx` - Full terms and conditions legal page
- `NotFoundPage.tsx` - 404 error page with navigation back home

**Utils:**
- `debounce.ts` - Debounce function for scroll, search, input optimization
- `generateReportPDF.ts` - Client-side PDF generation (jsPDF + html2canvas); 7-section color-coded report layout
- `performance.ts` - Mobile detection, performance utilities

**Build Configuration:**
- `vite.config.ts` - Build optimizations, chunk splitting, code splitting; dev-server proxy for `/api/predict` → `agri-gpt-disease-prediction.onrender.com/predict`
- `tsconfig.json` - TypeScript compiler options, strict mode
- `tailwind.config.js` - Tailwind theme customization, dark mode config
- `package.json` - React 18.3.1, TypeScript 5.5.3, Vite 5.4.2, Firebase 11.10.0

## 🔐 Authentication Flow

### Email/Password Authentication
1. User enters email and password on AuthPage
2. Frontend sends credentials to `/api/login` or `/api/signup`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. Protected routes accessible with valid token

### Google Sign-In Authentication
1. User clicks "Sign in with Google" button (animated with green theme)
2. Firebase popup for Google account selection
3. Firebase returns ID token after successful authentication
4. Frontend sends Firebase token to `/api/auth/google`
5. Backend verifies token and syncs user data with MongoDB
6. Backend returns JWT token for API access
7. User redirected to chat interface

### Password Creation for Google Users
1. Google-authenticated users can create password in Settings page
2. Uses Firebase `linkWithCredential` to add email/password
3. Enables dual authentication (Google + email/password)
4. Backend updates `auth_providers` array in MongoDB

## 📡 API Integration

All API calls are configured in `src/config/api.ts`:

### Authentication Endpoints
- `POST /api/signup` - Initiate signup (sends OTP to email)
- `POST /api/verify-signup-otp` - Complete signup (verify OTP, creates account)
- `POST /api/login` - Initiate login (verify password, sends OTP)
- `POST /api/verify-login-otp` - Complete login (verify OTP, returns JWT)
- `POST /api/auth/google` - Google Sign-In authentication
- `POST /api/verify-otp` - General OTP verification

### User Profile Endpoints
- `PUT /api/update-profile` - Update user details (protected)
- `PUT /api/change-password` - Change password (protected)
- `POST /api/create-password` - Create password for Google users (protected)

### Chat & Reports Endpoints
- `POST /api/chat` - Send text message (optional auth for trial mode)
- `POST /api/voice` - Send voice message (protected)
- `GET /api/chats` - Get all chat sessions (protected)
- `GET /api/chats/<id>` - Get specific chat session with messages (protected)
- `DELETE /api/chats/<id>` - Delete a chat session (protected)
- `POST /api/report` - Generate farming report (optional auth)
- `GET /api/reports` - Get saved report history (protected)

### Disease Prediction Endpoint
- `POST /api/predict` - AI plant disease detection via leaf image (protected)
  - In dev: Vite proxy forwards directly to ML service (avoids CORS)
  - In prod: Flask backend proxies via `requests`
  - Body: `multipart/form-data` with `image` field (JPEG/PNG, ≤10 MB)
  - Returns: `{ "disease": "<label>", "confidence": <0-100> }`

### API Configuration

API base URL is configured via environment variable:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

**Protected endpoints require:**
```
Authorization: Bearer <jwt_token>
```

## 🌐 Routes

- `/` - Home page (landing page)
- `/login` - Login page (email/password + Google Sign-In)
- `/signup` - Signup page (with OTP email verification)
- `/auth` - Redirects to `/login`
- `/chat` - Chat interface (trial mode available)
- `/report` - Farming report generation
- `/upload` - AI plant disease detection (leaf image upload, authenticated users only)
- `/weather` - Weather dashboard
- `/settings` - User settings and profile management (protected)
- `/feedback` - User feedback form
- `/team` - Team member profiles page
- `/admin` - Admin dashboard with statistics & feedback management (developer-only, protected)
- `/terms` - Terms and conditions page
- `/reset-password` - Password reset
- `*` - 404 Not Found page

## 🔒 Protected Routes

Routes that require authentication:
- `/settings` - User settings and profile

Routes that require developer authentication:
- `/admin` - Admin panel with analytics and feedback management

Features that require authentication:
- Voice input in chat
- Chat history saving
- Report history
- Profile picture upload
- Password management
- AI plant disease detection (Upload page)

If user is not authenticated, they can still use:
- Text chat (trial mode)
- Report generation (not saved)
- Weather information
- General browsing
- Feedback submission

## 💾 Local Storage

The app stores the following data in localStorage:

- `token` - JWT authentication token
- `user_id` - User's unique MongoDB ID
- `firebase_uid` - Firebase user ID (for Google Sign-In users)
- `email` - User's email address
- `name` - User's name
- `profilePicture` - Base64 encoded profile picture
- `auth_providers` - Array of authentication methods (e.g., ["google"], ["local"])
- `theme` - User's theme preference (dark/light)

## 🎨 Theming

The application supports dark and light themes:

- Theme state managed by `ThemeContext`
- Theme preference saved to localStorage
- Smooth transitions between themes
- All components theme-aware
- Custom TailwindCSS color schemes
- Toggle available in Navigation component

## 📱 Responsive Design

The application is fully responsive and works on:
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md/lg)
- **Desktop**: > 1024px (xl)
- Touch-friendly UI elements
- Adaptive layouts for all screen sizes
- Mobile-first approach

## 🎨 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (output to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🎙️ Voice Input

The chat page supports voice input with:
- Real-time audio visualization during recording
- Recording timer display
- Automatic transcription via backend Whisper integration
- Support for multiple Indian languages
- **Authentication required** - Voice features restricted to logged-in users
- One-click recording with visual feedback

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🐛 Troubleshooting

### Common Issues

**Firebase Configuration Error**
- Ensure all Firebase environment variables are set in `.env`
- Check Firebase project settings in Firebase Console
- Verify API keys are correct and not expired
- Error: "Firebase: Error (auth/configuration-not-found)"
  - Solution: Create `.env` file with all `VITE_FIREBASE_*` variables

**Backend Connection Failed**
- Verify backend server is running on port 5000
- Check `VITE_API_URL` in `.env`
- Ensure CORS is configured on backend
- Check browser console for network errors

**Google Sign-In Not Working**
- Add authorized domains in Firebase Console (Authentication > Settings > Authorized domains)
- Enable Google Sign-In in Firebase Authentication methods
- Check browser console for Firebase errors
- Ensure `firebase-credentials.json` exists in backend

**Authentication Issues**
- Clear localStorage and login again
- Check if token is being sent in request headers
- Verify JWT_SECRET_KEY matches between frontend and backend
- Check token expiration

**Voice Recording Issues**
- Grant microphone permissions in browser
- Check browser console for errors
- Ensure using HTTPS or localhost (required for microphone access)
- Voice features require authentication

**Build Errors**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are installed

## 🚀 Deployment

### Build for Production

```bash
# Create optimized production build
npm run build

# Output will be in dist/ directory
# Total build size: ~600 KB (gzipped)
# Initial bundle: ~200 KB (gzipped)
```

### Deploy to Vercel (Recommended ⭐)

Vercel provides the best experience for Vite apps with automatic builds and deployments.

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables from your `.env` file
   - Ensure variables are available for Production, Preview, and Development

4. **Update Firebase Authorized Domains**
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

5. **Configure Backend CORS**
   - Update backend to allow your Vercel domain
   ```python
   CORS(app, origins=["https://your-app.vercel.app"])
   ```

### Deploy to Netlify

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Add Environment Variables** in Netlify dashboard
4. **Configure Redirects** for SPA routing
   
   Create `public/_redirects` file:
   ```
   /* /index.html 200
   ```

5. **Update Firebase and Backend CORS** with Netlify domain

### Deploy to GitHub Pages

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/AgriGPT-Chat-Report_System/',
     // ... rest of config
   })
   ```

3. **Add Deploy Script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

### Important Deployment Notes

1. **Environment Variables**
   - All variables must start with `VITE_` to be accessible in frontend
   - Never commit `.env` file to repository
   - Set variables in deployment platform dashboard

2. **Backend URL**
   - Update `VITE_API_URL` to production backend URL
   - Ensure backend is deployed and accessible
   - Check CORS configuration on backend

3. **Firebase Configuration**
   - Add production domain to Firebase authorized domains
   - Update OAuth redirect URLs if needed
   - Ensure Firebase service account is configured on backend

4. **HTTPS Required**
   - Firebase authentication requires HTTPS in production
   - Most deployment platforms provide automatic HTTPS
   - Microphone access (voice input) requires HTTPS

5. **Performance Monitoring**
   - Use Vercel Analytics or similar
   - Monitor Core Web Vitals
   - Check bundle size with `npm run build`

## 🔒 Security Features

- JWT token validation
- Protected route guards
- Firebase authentication security
- Secure environment variable handling
- XSS protection via React
- CORS configuration
- Token expiration handling
- Input sanitization

## 📚 Dependencies Overview

### Production Dependencies
- `firebase` - Firebase SDK for Google authentication
- `framer-motion` - Smooth animations and transitions
- `html2canvas` - Convert DOM to canvas for PDF generation
- `jspdf` - Client-side PDF generation
- `lucide-react` - Beautiful SVG icon library
- `recharts` - Interactive charts for admin statistics dashboard
- `react` & `react-dom` - Core React library (v18.3.1)
- `react-markdown` - Render markdown in chat messages
- `react-router-dom` - Client-side routing (v7.6.3)

### Development Dependencies
- `@vitejs/plugin-react` - React support for Vite
- `typescript` - TypeScript compiler (v5.5.3)
- `tailwindcss` - Utility-first CSS framework (v3.4.1)
- `eslint` - Code quality and linting
- `autoprefixer` - CSS vendor prefixing
- `postcss` - CSS transformation

## 🚀 Future Enhancements

- [ ] Implement password reset functionality
- [ ] Add file upload for crop images
- [ ] Implement chat history search
- [ ] Add offline support with PWA
- [ ] Multi-language UI translations
- [ ] Push notifications for weather alerts
- [ ] Chat export functionality
- [ ] Voice output (Text-to-Speech)
- [ ] Real-time notifications

## 🤝 Contributing

We welcome contributions to improve AgriGPT frontend!

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System.git
   cd AgriGPT-Chat-Report_System/frontend
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow existing code structure and patterns
   - Use TypeScript for all new components
   - Add proper type definitions
   - Follow React best practices (hooks, functional components)

4. **Test Your Changes**
   ```bash
   # Run development server
   npm run dev
   
   # Build for production (check for errors)
   npm run build
   
   # Run linting
   npm run lint
   ```

5. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add: Your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub and create a pull request
   - Describe changes clearly
   - Reference related issues

### Contribution Guidelines

**Code Style**
- Use TypeScript for type safety
- Follow existing file and folder structure
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic

**Component Guidelines**
- Create reusable components in `components/` folder
- Page-level components in `pages/` folder
- Use React.memo for expensive components
- Implement proper loading and error states

**Naming Conventions**
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case or Tailwind utilities

**What to Contribute**
- 🐛 Bug fixes and error handling improvements
- ✨ New features (UI components, pages, functionality)
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ⚡ Performance optimizations
- ♿ Accessibility improvements
- 🌐 Internationalization (i18n) support

### Testing Checklist

Before submitting PR, ensure:
- [ ] Code compiles without errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All features work on desktop and mobile
- [ ] Both light and dark themes work correctly
- [ ] Firebase authentication works properly
- [ ] No console errors in browser
- [ ] Performance is not degraded

## 📚 Additional Resources

### Official Documentation
- [React Documentation](https://react.dev/) - React 18 features and hooks
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Vite Documentation](https://vitejs.dev/) - Build tool configuration
- [TailwindCSS Documentation](https://tailwindcss.com/docs) - Utility classes reference
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth) - Authentication setup
- [Framer Motion Documentation](https://www.framer.com/motion/) - Animation library

### Tutorials & Guides
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite + React + TypeScript Setup](https://vitejs.dev/guide/)
- [Firebase Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [TailwindCSS Best Practices](https://tailwindcss.com/docs/utility-first)

### Tools & Utilities
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debugging
- [Firebase Console](https://console.firebase.google.com/) - Project management
- [Vercel Dashboard](https://vercel.com/dashboard) - Deployment monitoring
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing

## 👥 Team

**AgriGPT Frontend Team**
- **Subham Biswal** - 💬 Chat System Developer (frontend + backend)
- **Vivekananda Champati** - 🌿 Upload & Disease Detection Developer (frontend + backend)
- **Tusarkanta Das** - 🌦️ Weather & Soil System Developer (frontend + backend)
- **Swabhiman Mohanty** - 📄 Report System Developer (frontend + backend)

## 📄 License

This project is developed as part of a Major Project for educational purposes.

**Frontend License**: Educational use only
**Third-Party Licenses**: See respective library licenses

## 👥 Support & Contact

### Getting Help

**For Technical Issues:**
1. Check [Troubleshooting](#-troubleshooting) section
2. Review browser console for errors
3. Verify environment variables in `.env`
4. Check Firebase Console for auth errors
5. Ensure backend is running and accessible

**For Questions:**
- 📧 **Email**: biswalsubhamrony@gmail.com
- 🐛 **GitHub Issues**: [Create an issue](https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/subhambiswalrony/AgriGPT-Chat-Report_System/discussions)

**Bug Reports Should Include:**
- Browser and version
- Operating system
- Error messages from console
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 🙏 Acknowledgments

Special thanks to:
- **React Team** for amazing frontend library
- **Firebase Team** for authentication infrastructure
- **Vercel** for excellent hosting platform
- **TailwindCSS** for utility-first CSS framework
- **Framer** for beautiful animation library
- **Open Source Community** for incredible tools

---

<div align="center">

**Built with ❤️ for Indian Farmers** 🌾

**Last Updated**: March 2026 | **Version**: 2.0

**Frontend Documentation** | [Backend Documentation](../backend/README.md) | [Main README](../README.md)

[⬆ Back to Top](#-agrigpt-frontend)

</div>
