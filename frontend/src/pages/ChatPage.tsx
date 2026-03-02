import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, Bot, User, Mic, MicOff, Volume2, Sparkles, X, Trash2, Plus, MessageSquare, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import TutorialModal from '../components/TutorialModal';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { debounce } from '../utils/debounce';
import { isMobileDevice } from '../utils/performance';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  audioEn?: string | null;
  audioLocal?: string | null;
}

interface ChatSession {
  _id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
}

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMemo(() => isMobileDevice(), []);
  const shouldReduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [recordingTime, setRecordingTime] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  // Chat session states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  const promptProcessedRef = useRef(false);

  // Scroll to top when navigating away from this page
  useEffect(() => {
    return () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
  }, [location]);

  // Check authentication and fetch chat sessions on component mount
  useEffect(() => {
    const initializeChat = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        // Not authenticated - show welcome message only
        console.log('No token found, showing welcome message only');
        setIsAuthenticated(false);
        setShowSidebar(false); // Hide sidebar for trial users

        // Load trial count from localStorage
        const savedTrialCount = localStorage.getItem('chatTrialCount');
        setTrialCount(savedTrialCount ? parseInt(savedTrialCount) : 0);
        setMessages([
          {
            id: '1',
            text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
        return;
      }

      // User is authenticated
      setIsAuthenticated(true);
      console.log('User authenticated, fetching chat sessions');

      // Load profile picture
      const picture = localStorage.getItem('profilePicture');
      setProfilePicture(picture || '');

      try {
        // Fetch all chat sessions
        const sessionsResponse = await fetch(getApiUrl(API_ENDPOINTS.CHATS), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          console.log('Chat sessions loaded:', sessions);
          setChatSessions(sessions);

          // Show welcome message without loading any session
          setMessages([
            {
              id: '1',
              text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        } else {
          // Failed to fetch sessions, show welcome message
          setMessages([
            {
              id: '1',
              text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch chat sessions:', error);
        // On error, show welcome message
        setMessages([
          {
            id: '1',
            text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
      }
    };

    initializeChat();
  }, []);

  // Handle initial prompt from navigation state (Home page quick prompts)
  useEffect(() => {
    const checkInitialPrompt = async () => {
      const prompt = location.state?.initialPrompt;
      if (prompt && !promptProcessedRef.current) {
        promptProcessedRef.current = true;
        console.log('🚀 Initial prompt detected:', prompt);
        // Clear state immediately to prevent re-triggering on refresh
        navigate(location.pathname, { replace: true, state: {} });

        // Small delay to ensure initialization is complete
        setTimeout(() => {
          handleSendMessage(prompt);
        }, 500);
      }
    };
    checkInitialPrompt();
  }, [location.state, navigate, location.pathname]);

  // Load a specific chat session
  const loadChatSession = async (chatId: string, token?: string) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;

    // Update ref immediately (synchronous)
    currentChatIdRef.current = chatId;

    // Update state
    setCurrentChatId(chatId);
    setMessages([]); // Clear messages immediately

    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.CHATS}/${chatId}`), {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const chatData = await response.json();

        // Check if user switched to a different chat while we were loading
        if (currentChatIdRef.current !== chatId) {
          console.warn('⚠️ User switched chats, discarding loaded data');
          return;
        }

        console.log('✅ Chat data loaded for:', chatId);

        // Convert messages to display format
        const displayMessages: Message[] = chatData.messages.map((msg: any) => ({
          id: msg.timestamp,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'bot',
          timestamp: new Date(msg.timestamp)
        }));

        setMessages(displayMessages);
        console.log(`✅ Loaded ${displayMessages.length} messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load chat session:', error);
    }
  };

  // Create a new chat session
  const createNewChat = () => {
    // Force immediate state reset using ref (synchronous)
    currentChatIdRef.current = null;

    // Clear state
    setCurrentChatId(null);
    setMessages([]); // Clear messages first

    // Use setTimeout to ensure messages are cleared before adding welcome message
    // This prevents race conditions with React's state batching
    setTimeout(() => {
      setMessages([
        {
          id: 'welcome',
          text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }, 0);

    setIsMobileSidebarOpen(false);

    console.log('✅ New chat created - cleared old messages and reset chat ID');
  };

  // Delete a chat session - show confirmation modal
  const deleteChatSession = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setChatToDelete(chatId);
  };

  // Confirm delete action
  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setChatToDelete(null);
      return;
    }

    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.CHATS}/${chatToDelete}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Chat deleted from backend');

        // Check if deleting current chat BEFORE updating state
        const isDeletingCurrentChat = currentChatId === chatToDelete;

        // Remove from sessions list immediately
        setChatSessions(prev => {
          const updated = prev.filter(s => s._id !== chatToDelete);
          console.log(`✅ Updated sessions list: ${updated.length} sessions remaining`);
          return updated;
        });

        // If this was the current chat, clear messages and reset
        if (isDeletingCurrentChat) {
          // Update ref immediately (synchronous)
          currentChatIdRef.current = null;
          setCurrentChatId(null);
          setMessages([]); // Clear first

          // Then add welcome message
          setTimeout(() => {
            setMessages([
              {
                id: 'welcome',
                text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
                sender: 'bot',
                timestamp: new Date()
              }
            ]);
          }, 0);

          console.log('✅ Current chat cleared, ready for new conversation');
        }

        console.log('✅ Chat deleted successfully from frontend');
      } else {
        console.error('Failed to delete: Backend returned', response.status);
        alert('Failed to delete chat. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      alert('An error occurred while deleting the chat.');
    } finally {
      // Close modal
      setChatToDelete(null);
    }
  };

  // Cancel delete action
  const cancelDeleteChat = () => {
    setChatToDelete(null);
  };

  // Refresh chat sessions list
  const refreshChatSessions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CHATS), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const sessions = await response.json();
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to refresh chat sessions:', error);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    // Use instant scroll on mobile for better performance
    const behavior = isMobile ? 'instant' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior: behavior as ScrollBehavior });
  }, [isMobile]);

  // Debounced scroll for better performance
  const debouncedScroll = useMemo(
    () => debounce(scrollToBottom, 100),
    [scrollToBottom]
  );

  useEffect(() => {
    debouncedScroll();
  }, [messages, debouncedScroll]);

  // Load speech synthesis voices
  useEffect(() => {
    // Load voices on mount
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();

        // Log available voices for debugging
        console.log('📢 Available Speech Synthesis Voices:', voices.length);

        // Group voices by language for easier reading
        const indianVoices = voices.filter(v =>
          v.lang.includes('IN') ||
          v.lang.match(/^(hi|bn|ta|te|kn|ml|mr|gu|pa|or|ur|as)/)
        );

        if (indianVoices.length > 0) {
          console.log('🇮🇳 Indian Language Voices:', indianVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            local: v.localService
          })));
        } else {
          console.log('⚠️ No Indian language voices found. Using default voices.');
        }
      };

      loadVoices();

      // Some browsers need this event to load voices
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup: cancel any ongoing speech on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Audio visualization function
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Create 20 bars from frequency data
    const newLevels = [];
    const barCount = 20;
    const dataPerBar = Math.floor(dataArray.length / barCount);

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = i * dataPerBar; j < (i + 1) * dataPerBar; j++) {
        sum += dataArray[j];
      }
      const average = sum / dataPerBar;
      newLevels.push(average / 255); // Normalize to 0-1
    }

    setAudioLevels(newLevels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, []);

  // Clean up recording resources
  const cleanupRecording = () => {
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Reset states
    setIsRecording(false);
    setAudioLevels(new Array(20).fill(0));
    setRecordingTime(0);
  };

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = async (buffer: AudioBuffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);
    const sampleRate = buffer.sampleRate;
    const channels = [];
    let pos = 0;

    // Write WAV header
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');                    // RIFF identifier
    view.setUint32(4, 36 + length, true);           // File length
    writeString(view, 8, 'WAVE');                    // WAVE identifier
    writeString(view, 12, 'fmt ');                   // fmt chunk
    view.setUint32(16, 16, true);                   // fmt chunk length
    view.setUint16(20, 1, true);                    // Sample format (1 = PCM)
    view.setUint16(22, numOfChannels, true);        // Channels
    view.setUint32(24, sampleRate, true);           // Sample rate
    view.setUint32(28, sampleRate * 2, true);       // Byte rate
    view.setUint16(32, numOfChannels * 2, true);    // Block align
    view.setUint16(34, 16, true);                   // Bits per sample
    writeString(view, 36, 'data');                  // data chunk
    view.setUint32(40, length, true);               // data chunk length

    // Write audio data
    for (let i = 0; i < numOfChannels; i++) {
      channels[i] = buffer.getChannelData(i);
    }

    while (pos < buffer.length) {
      for (let i = 0; i < numOfChannels; i++) {
        const sample = Math.max(-1, Math.min(1, channels[i][pos])) * 0x7FFF;
        view.setInt16(44 + (pos * numOfChannels + i) * 2, sample, true);
      }
      pos++;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  // Start voice recording
  const startRecording = async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginPrompt(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '🎤 Voice feature is only available for logged-in users. Please login or signup to use voice input! 🔐',
        sender: 'bot',
        timestamp: new Date()
      }]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      updateAudioLevels();

      // Setup media recorder with specific format
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      });

      // Create audioChunks array that persists
      const audioChunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('📱 Audio chunk received:', event.data.size);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('🛑 Recording stopped, processing audio chunks:', audioChunks.length);

        if (audioChunks.length === 0) {
          console.error('❌ No audio data recorded');
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('📦 Created audio blob:', audioBlob.size, 'bytes');

        try {
          // Convert webm to wav
          const audioContext = new AudioContext();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create WAV file
          const wavBlob = await audioBufferToWav(audioBuffer);
          console.log('🎵 Created WAV blob:', wavBlob.size, 'bytes');

          // Send immediately when recording stops
          await sendVoiceMessage(wavBlob);
        } catch (error) {
          console.error('❌ Error processing audio:', error);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: 'Error: Failed to process audio recording.',
            sender: 'bot',
            timestamp: new Date()
          }]);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎤 Recording started');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  // Stop voice recording and send immediately
  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🛑 Stopping recording...');
      mediaRecorderRef.current.stop();
      cleanupRecording();
    }
  };

  // Cancel voice recording without processing
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('❌ Cancelling recording...');

      // Override the onstop handler to prevent processing
      mediaRecorderRef.current.onstop = () => {
        console.log('🗑️ Recording cancelled, no processing');
      };

      mediaRecorderRef.current.stop();
      cleanupRecording();
    }
  };

  // Send voice message function with better language handling
  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsTyping(true);

    try {
      // Create FormData to send audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_message.wav');

      // Remove language hint to let backend auto-detect
      // This allows the backend to try multiple languages

      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to use this feature');
      }

      // Send to the /api/voice endpoint
      const response = await fetch(getApiUrl(API_ENDPOINTS.VOICE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `Error: ${data.error || 'Failed to process voice'}`,
          sender: 'bot',
          timestamp: new Date(),
          audioEn: null,
          audioLocal: null
        }]);
      } else {
        // Add user's transcribed message
        const userMessage: Message = {
          id: Date.now().toString(),
          text: data.user_text,
          sender: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        // Debug logging
        console.log('🤖 Voice response:', data);

        // Add bot's response
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: data.ai_reply,
          sender: 'bot',
          timestamp: new Date(),
          audioEn: null,
          audioLocal: null
        }]);
      }
    } catch (err) {
      console.error('Voice message error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Error: Unable to process voice message.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    }

    setIsTyping(false);
  };

  const handleSendMessage = async (explicitText?: string | React.MouseEvent) => {
    const textToSend = typeof explicitText === 'string' ? explicitText : inputText;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (typeof explicitText !== 'string') setInputText('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        // Non-authenticated user - check trial count
        const currentTrialCount = trialCount;

        if (currentTrialCount >= 10) {
          // Trial limit reached
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: '⚠️ You have reached your free trial limit of 10 messages. Please login or signup to continue chatting! 🔐',
            sender: 'bot',
            timestamp: new Date()
          }]);
          setIsTyping(false);
          setShowLoginPrompt(true);
          return;
        }

        // Increment trial count
        const newTrialCount = currentTrialCount + 1;
        setTrialCount(newTrialCount);
        localStorage.setItem('chatTrialCount', newTrialCount.toString());

        console.log(`Trial ${newTrialCount}/10 used`);
      }

      // Use the ref value for the API call
      const chatIdToSend = currentChatIdRef.current;
      console.log(`📤 Sending message to chat_id: ${chatIdToSend}`);

      const response = await fetch(getApiUrl(API_ENDPOINTS.CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: textToSend,
          chat_id: chatIdToSend
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.error || 'Failed to get response'}`,
          sender: 'bot',
          timestamp: new Date(),
          audioEn: null,
          audioLocal: null
        }]);
      } else {
        console.log('📥 Received response for chat_id:', data.chat_id);

        // Update chat ID if this was a new chat
        if (data.chat_id && !chatIdToSend) {
          currentChatIdRef.current = data.chat_id;
          setCurrentChatId(data.chat_id);

          if (isAuthenticated) {
            await refreshChatSessions();
          }
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
          audioEn: null,
          audioLocal: null
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Error: Unable to connect to backend.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  const handleTextToSpeech = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);

    if (!msg || !msg.text) {
      console.log('❌ No message text available');
      return;
    }

    // If already playing this message, stop it
    if (isPlaying === messageId) {
      window.speechSynthesis.cancel();
      setIsPlaying(null);
      return;
    }

    // Stop any currently playing speech
    window.speechSynthesis.cancel();

    let textToSpeak = msg.text;

    // Language detection based on Unicode ranges
    let lang = 'en-IN'; // Default to English (India)
    let languageName = 'English';
    let isOdia = false;

    const text = msg.text;

    if (/[\u0900-\u097F]/.test(text)) {
      lang = 'hi-IN';
      languageName = 'Hindi';
      // Remove English words in parentheses for Hindi
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0B00-\u0B7F]/.test(text)) {
      // Odia script detected
      lang = 'or-IN';
      languageName = 'Odia';
      isOdia = true;
      // Remove English words in parentheses and standalone English words for Odia
      textToSpeak = text
        .replace(/\([^)]*[a-zA-Z][^)]*\)/g, '') // Remove parenthetical English
        .replace(/\b[a-zA-Z]+\b/g, '') // Remove standalone English words
        .replace(/\s+/g, ' ') // Clean up multiple spaces
        .trim();

      console.log('🔤 Cleaned Odia text:', {
        original: text.substring(0, 100),
        cleaned: textToSpeak.substring(0, 100)
      });
    } else if (/[\u0980-\u09FF]/.test(text)) {
      lang = 'bn-IN';
      languageName = 'Bengali';
      // Remove English words for Bengali
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0B80-\u0BFF]/.test(text)) {
      lang = 'ta-IN';
      languageName = 'Tamil';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0C00-\u0C7F]/.test(text)) {
      lang = 'te-IN';
      languageName = 'Telugu';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0C80-\u0CFF]/.test(text)) {
      lang = 'kn-IN';
      languageName = 'Kannada';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0D00-\u0D7F]/.test(text)) {
      lang = 'ml-IN';
      languageName = 'Malayalam';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0900-\u097F]/.test(text)) {
      lang = 'mr-IN';
      languageName = 'Marathi';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0A80-\u0AFF]/.test(text)) {
      lang = 'gu-IN';
      languageName = 'Gujarati';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0A00-\u0A7F]/.test(text)) {
      lang = 'pa-IN';
      languageName = 'Punjabi';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0600-\u06FF]/.test(text)) {
      lang = 'ur-IN';
      languageName = 'Urdu';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    } else if (/[\u0980-\u09FF]/.test(text)) {
      lang = 'as-IN';
      languageName = 'Assamese';
      textToSpeak = text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '');
    }

    // Create speech synthesis utterance with cleaned text
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.lang = lang;
    utterance.rate = 0.8; // Even slower for better pronunciation with cleaned text
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    // Special handling for Odia
    if (isOdia) {
      // Strategy 1: Try to find Odia voice (or-IN or or)
      selectedVoice = voices.find(voice =>
        voice.lang === 'or-IN' ||
        voice.lang === 'or' ||
        voice.lang.startsWith('or-')
      );

      // Strategy 2: Try Oriya alternative spelling
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('oriya') ||
          voice.name.toLowerCase().includes('odia')
        );
      }

      // Strategy 3: Fallback to Hindi (similar script, better than English)
      if (!selectedVoice) {
        console.warn('⚠️ Odia voice not available, using Hindi as fallback');
        selectedVoice = voices.find(voice =>
          voice.lang === 'hi-IN' ||
          voice.lang.startsWith('hi')
        );
        utterance.lang = 'hi-IN'; // Change language to Hindi for better pronunciation
        languageName = 'Odia (using Hindi voice)';
      }

      // Strategy 4: Try Bengali as alternative fallback (also similar script)
      if (!selectedVoice) {
        console.warn('⚠️ Hindi voice not available, trying Bengali as fallback');
        selectedVoice = voices.find(voice =>
          voice.lang === 'bn-IN' ||
          voice.lang.startsWith('bn')
        );
        if (selectedVoice) {
          utterance.lang = 'bn-IN';
          languageName = 'Odia (using Bengali voice)';
        }
      }
    } else {
      // For other languages, use original strategy
      // Strategy 1: Try to find exact language match (e.g., 'hi-IN', 'te-IN')
      selectedVoice = voices.find(voice => voice.lang === lang);

      // Strategy 2: Try language code without region (e.g., 'hi', 'te')
      if (!selectedVoice) {
        const langCode = lang.split('-')[0];
        selectedVoice = voices.find(voice => voice.lang.startsWith(langCode));
      }

      // Strategy 3: Try to find Google voices for Indian languages
      if (!selectedVoice) {
        const langCode = lang.split('-')[0];
        selectedVoice = voices.find(voice =>
          voice.lang.startsWith(langCode) &&
          (voice.name.includes('Google') || voice.name.includes('Indian'))
        );
      }

      // Strategy 4: Try any voice with 'IN' or 'India' in name for Indian languages
      if (!selectedVoice && lang !== 'en-IN') {
        selectedVoice = voices.find(voice =>
          voice.lang.includes('IN') ||
          voice.name.includes('India')
        );
      }
    }

    // Final fallback to English-India or English-US for all languages
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang === 'en-IN') ||
        voices.find(voice => voice.lang === 'en-US') ||
        voices.find(voice => voice.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    console.log('🔊 Text-to-Speech:', {
      messageId,
      detectedLanguage: languageName,
      requestedLang: lang,
      actualLang: utterance.lang,
      voiceName: selectedVoice?.name || 'Default',
      voiceLang: selectedVoice?.lang || 'Default',
      isOdiaFallback: isOdia && selectedVoice?.lang?.startsWith('hi'),
      textCleaned: isOdia,
      originalLength: text.length,
      cleanedLength: textToSpeak.length,
      availableVoices: voices.length
    });

    utterance.onstart = () => {
      setIsPlaying(messageId);
    };

    utterance.onend = () => {
      setIsPlaying(null);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsPlaying(null);

      // Show a user-friendly message
      if (error.error === 'not-allowed') {
        alert('Please allow audio playback permissions in your browser.');
      } else if (error.error === 'language-unavailable') {
        if (isOdia) {
          alert('Odia voice is not available in your browser. Using Hindi voice as fallback for better pronunciation.');
        } else {
          alert(`Voice for ${languageName} is not available. Using default voice.`);
        }
      }
    };

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear chat function with confirmation
  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
    const token = localStorage.getItem('token');

    // If there's a current chat session and user is authenticated, delete it from backend
    if (currentChatId && token) {
      try {
        const response = await fetch(getApiUrl(`${API_ENDPOINTS.CHATS}/${currentChatId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          // Remove from sessions list
          setChatSessions(prev => prev.filter(s => s._id !== currentChatId));
          console.log('✅ Chat deleted from backend');
        }
      } catch (error) {
        console.error('Failed to delete chat session:', error);
      }
    }

    // Reset with the same pattern as createNewChat
    currentChatIdRef.current = null;
    setCurrentChatId(null);
    setMessages([]);

    setTimeout(() => {
      setMessages([
        {
          id: '1',
          text: 'नमस्ते! 🌿 मैं AgriGPT हूं, आपका कृषि सहायक। आप मुझसे खेती से जुड़े कोई भी सवाल पूछ सकते हैं! 👨‍🌾',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }, 0);

    setShowClearConfirm(false);
    console.log('✅ Chat cleared and ready for new conversation');
  };

  const cancelClearChat = () => {
    setShowClearConfirm(false);
    console.log('❌ Chat clear cancelled');
  };

  // Audio Visualizer Component
  const AudioVisualizer = () => (
    <div className="flex items-center justify-center space-x-1 h-16 px-4">
      {audioLevels.map((level, index) => (
        <motion.div
          key={index}
          className="bg-gradient-to-t from-blue-400 to-purple-500 rounded-full"
          style={{
            width: '3px',
            height: `${Math.max(4, level * 48)}px`,
          }}
          animate={{
            height: `${Math.max(4, level * 48)}px`,
          }}
          transition={{
            duration: 0.1,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900 transition-all duration-500">
      <div className="h-screen pt-14 sm:pt-16 flex relative">
        {/* Sidebar for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Desktop Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: showSidebar ? 0 : -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="hidden md:flex flex-col w-72 bg-gradient-to-b from-white/95 via-green-50/80 to-emerald-50/80 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl border-r border-green-200/30 dark:border-green-700/30 shadow-2xl absolute left-0 top-0 bottom-0 z-10"
            >
              {/* Gradient accent line */}
              <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700" />

              {/* Sidebar Header */}
              <div className="relative p-5 border-b border-green-200/30 dark:border-green-700/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">Chat History</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <motion.button
                  onClick={createNewChat}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-4 py-3.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
                >
                  {!shouldReduceMotion && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: [-300, 300] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <Plus size={20} className="relative z-10" />
                  <span className="relative z-10">New Conversation</span>
                </motion.button>
              </div>

              {/* Chat Sessions List */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {chatSessions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center px-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-4">
                      <MessageSquare size={28} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">No chats yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start a new conversation to begin!
                    </p>
                  </motion.div>
                ) : (
                  chatSessions.map((session, index) => (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => loadChatSession(session._id)}
                      className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 ${currentChatId === session._id
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 dark:border-green-400/50 shadow-lg'
                        : 'bg-white/60 dark:bg-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-700/60 border-2 border-transparent hover:border-green-200/50 dark:hover:border-green-700/50 shadow-sm hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${currentChatId === session._id
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md'
                          : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700'
                          }`}>
                          <MessageSquare size={16} className={
                            currentChatId === session._id
                              ? 'text-white'
                              : 'text-gray-600 dark:text-gray-300'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mb-1">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span className="capitalize">{session.language}</span>
                          </div>
                        </div>
                        <motion.button
                          onClick={(e) => deleteChatSession(session._id, e)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-xl transition-all flex-shrink-0"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
              {isMobileSidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  />

                  {/* Sidebar */}
                  <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="md:hidden fixed left-0 top-14 bottom-0 w-80 bg-gradient-to-b from-white/95 via-green-50/80 to-emerald-50/80 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-xl shadow-2xl z-50 flex flex-col border-r border-green-200/30 dark:border-green-700/30"
                  >
                    {/* Gradient accent line */}
                    <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 via-emerald-500 to-teal-600" />

                    {/* Sidebar Header */}
                    <div className="relative p-5 border-b border-green-200/30 dark:border-green-700/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <MessageSquare size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">Chat History</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                        >
                          <X size={20} className="text-gray-600 dark:text-gray-400" />
                        </motion.button>
                      </div>
                      <motion.button
                        onClick={createNewChat}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3.5 rounded-2xl font-semibold shadow-lg overflow-hidden group"
                      >
                        {!shouldReduceMotion && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ x: [-300, 300] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                        )}
                        <Plus size={20} className="relative z-10" />
                        <span className="relative z-10">New Conversation</span>
                      </motion.button>
                    </div>

                    {/* Chat Sessions List */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {chatSessions.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center h-full text-center px-4"
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-4">
                            <MessageSquare size={28} className="text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">No chats yet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Start a new conversation to begin!
                          </p>
                        </motion.div>
                      ) : (
                        chatSessions.map((session, index) => (
                          <motion.div
                            key={session._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              loadChatSession(session._id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 ${currentChatId === session._id
                              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 shadow-lg'
                              : 'bg-white/60 dark:bg-gray-700/40 hover:bg-white/80 dark:hover:bg-gray-700/60 border-2 border-transparent hover:border-green-200/50 dark:hover:border-green-700/50 shadow-sm hover:shadow-md'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${currentChatId === session._id
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md'
                                : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700'
                                }`}>
                                <MessageSquare size={16} className={
                                  currentChatId === session._id
                                    ? 'text-white'
                                    : 'text-gray-600 dark:text-gray-300'
                                } />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate mb-1">
                                  {session.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  <span>•</span>
                                  <span className="capitalize">{session.language}</span>
                                </div>
                              </div>
                              <motion.button
                                onClick={(e) => deleteChatSession(session._id, e)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 hover:bg-red-500/20 rounded-xl transition-all flex-shrink-0"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Toggle Sidebar Button (Desktop) */}
            {showSidebar && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden md:flex fixed left-72 top-24 z-50 p-2.5 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-200 border border-green-200/50 dark:border-green-700/50 hover:left-[290px]"
                title="Hide sidebar"
              >
                <ChevronLeft size={20} className="text-green-600 dark:text-green-400" />
              </motion.button>
            )}
            {!showSidebar && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden md:flex fixed left-0 top-24 z-50 p-2 bg-white dark:bg-gray-800 rounded-r-lg shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                title="Show sidebar"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
            )}
          </>
        )}

        {/* Main Chat Container */}
        <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${!isAuthenticated || !showSidebar ? 'mx-auto max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8' : 'ml-0 md:ml-72'
          }`}>
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg border-b border-green-200/50 dark:border-green-700/50 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3"
          >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                {isAuthenticated && (
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Menu size={22} className="text-gray-600 dark:text-gray-400" />
                  </button>
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <Bot className="text-white" size={16} />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent truncate">
                    AgriGPT Assistant
                  </h2>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Sparkles className="text-green-500 flex-shrink-0" size={12} />
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium truncate">आपका कृषि सहायक 🌿</p>
                  </div>
                </div>
              </div>

              {/* Clear Chat Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearChat}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200/50 dark:border-red-800/50 flex-shrink-0"
                title="Clear Chat History"
              >
                <Trash2 size={15} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Clear Chat</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 space-y-3 md:space-y-4 lg:space-y-5 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-2 sm:gap-3 max-w-[85%] sm:max-w-[75%] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden ${message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                      }`}
                  >
                    {message.sender === 'user' ? (
                      profilePicture && isAuthenticated ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-white" size={16} />
                      )
                    ) : (
                      <Bot className="text-white" size={16} />
                    )}
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-2xl p-3 sm:p-3.5 md:p-4 lg:p-5 shadow-lg ${message.sender === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white'
                      : 'bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-gray-100'
                      }`}
                  >
                    {message.sender === 'bot' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="text-sm sm:text-base lg:text-lg leading-relaxed markdown-content" {...props} />
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed">{message.text}</p>
                    )}
                    {message.sender === 'bot' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTextToSpeech(message.id)}
                        className="mt-2 lg:mt-3 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                      >
                        <Volume2
                          size={16}
                          className={`sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5 ${isPlaying === message.id ? 'text-green-600 animate-pulse' : ''}`}
                        />
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Bot className="text-white" size={16} />
                    </div>
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 md:p-4 shadow-lg border border-white/30 dark:border-gray-600/30">
                      <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-green-200/50 dark:border-green-700/50 text-center max-w-sm sm:max-w-md w-full"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                  >
                    <Mic className="text-white" size={32} />
                  </motion.div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Recording...</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2 transition-colors duration-300">Speak in any language</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 transition-colors duration-300">
                    हिंदी • English • मराठी • ଓଡ଼ିଆ • বাংলা • ਪੰਜਾਬੀ
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
                    اردو • ગુજરાતી • తెలుగు • Hinglish • Marathinglish
                  </p>

                  <div className="text-xl sm:text-2xl md:text-3xl font-mono text-blue-600 dark:text-blue-400 mb-6 transition-colors duration-300">
                    {formatTime(recordingTime)}
                  </div>

                  <AudioVisualizer />

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={cancelRecording}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center gap-2"
                    >
                      <X size={20} className="sm:w-[22px] sm:h-[22px]" />
                      <span className="text-sm sm:text-base">Cancel</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopRecordingAndSend}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={20} className="sm:w-[22px] sm:h-[22px]" />
                      <span className="text-sm sm:text-base">Send</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remove the entire "Voice Message Ready Overlay" section */}

          {/* Input */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-green-200/50 dark:border-green-700/50 p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg"
          >
            {/* Trial count indicator for non-authenticated users */}
            {!isAuthenticated && trialCount > 0 && (
              <div className="mb-3 sm:mb-4 text-center">
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                  🆓 Free trial: <span className="font-semibold text-green-600 dark:text-green-400">{trialCount}/10</span> messages used
                  {trialCount >= 7 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      • {10 - trialCount} messages remaining
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Listening..." : "अपना सवाल यहां लिखें... (Hindi/English/Odia)"}
                  className={`w-full border-2 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-5 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500 dark:focus:border-green-400 shadow-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-100 transition-all text-sm sm:text-base lg:text-lg ${isRecording || isTyping
                    ? 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 border-green-200/50 dark:border-green-700/50'
                    }`}
                  disabled={isRecording || isTyping}
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                {inputText.trim() ? (
                  <motion.button
                    whileHover={!isTyping ? { scale: 1.05 } : {}}
                    whileTap={!isTyping ? { scale: 0.95 } : {}}
                    onClick={handleSendMessage}
                    disabled={isTyping}
                    className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-5 shadow-lg transition-all ${isTyping
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white hover:shadow-xl'
                      }`}
                  >
                    <Send size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={!isTyping ? { scale: 1.05 } : {}}
                    whileTap={!isTyping ? { scale: 0.95 } : {}}
                    onClick={handleVoiceInput}
                    disabled={isTyping}
                    className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-5 shadow-lg transition-all ${isTyping
                      ? 'bg-gray-400 cursor-not-allowed opacity-50'
                      : isRecording
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white animate-pulse hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white hover:shadow-xl'
                      }`}
                  >
                    {isRecording ? <MicOff size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Mic size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Clear Chat Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelClearChat}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full mx-4 border-2 border-green-200/50 dark:border-green-700/50 transition-colors duration-500"
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                    <Trash2 className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300 truncate">Clear Chat History?</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-5 sm:mb-6 transition-colors duration-300">
                  Are you sure you want to clear all chat messages? This will remove all conversations from this session.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelClearChat}
                    className="flex-1 px-4 py-3 sm:py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors duration-200 text-sm sm:text-base"
                  >
                    No, Keep Chat
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmClearChat}
                    className="flex-1 px-4 py-3 sm:py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg text-sm sm:text-base"
                  >
                    Yes, Clear All
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Prompt Modal */}
        <AnimatePresence>
          {showLoginPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowLoginPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full mx-4 border border-green-200/50 dark:border-green-700/50"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl sm:text-4xl md:text-5xl">🔐</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 px-2">
                    Continue with Full Access
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 px-2">
                    {trialCount >= 10
                      ? "You've used all 10 free messages! Login or signup to continue chatting with AgriGPT."
                      : "Login to unlock unlimited messages and voice features!"}
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.a
                    href="/auth"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-6 py-3 sm:py-3.5 md:py-4 rounded-xl font-semibold text-center shadow-lg hover:shadow-xl transition-all text-sm sm:text-base md:text-lg"
                  >
                    Login / Sign Up
                  </motion.a>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 sm:py-3.5 md:py-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-sm sm:text-base md:text-lg"
                  >
                    Maybe Later
                  </motion.button>
                </div>

                {!isAuthenticated && trialCount < 10 && (
                  <p className="mt-4 text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    You have {10 - trialCount} free messages remaining
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Chat Confirmation Modal */}
        <AnimatePresence>
          {chatToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelDeleteChat}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full mx-4 border border-green-200/50 dark:border-green-700/50"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
                    <Trash2 className="text-red-600 dark:text-red-400" size={28} />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300 px-2">
                    Delete Chat?
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 transition-colors duration-300 px-2">
                    This will permanently delete this conversation and all its messages.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDeleteChat}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors duration-200 text-sm sm:text-base"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDeleteChat}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg text-sm sm:text-base"
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page Tutorial */}
      <TutorialModal
        accentColor="green"
        fabBottom="bottom-[70px] sm:bottom-[82px] md:bottom-[96px] lg:bottom-[116px]"
        pageTitle="AI Farming Assistant"
        pageDescription="Chat with your personal AI to get instant farming advice."
        steps={[
          {
            title: 'Start a New Chat',
            description: 'Click the "+" button in the left sidebar to begin a fresh conversation. Each chat is saved automatically so you can revisit it anytime.',
            icon: <Plus size={28} />,
            tip: 'You can rename a chat by clicking its title in the sidebar.',
          },
          {
            title: 'Type Your Question',
            description: 'Type any farming question in the message box at the bottom and press Enter or click the Send button to get an AI-powered answer.',
            icon: <Send size={28} />,
            tip: 'Ask in Hindi, English, or any regional language — the AI understands both.',
          },
          {
            title: 'Voice Input',
            description: 'Click the microphone button to speak your question instead of typing. The AI will transcribe and respond to your voice message.',
            icon: <Mic size={28} />,
            tip: 'Speak clearly and wait for the recording indicator before asking your question.',
          },
          {
            title: 'Listen to Responses',
            description: 'Click the speaker icon next to any bot message to hear the response read aloud in your chosen language.',
            icon: <Volume2 size={28} />,
          },
          {
            title: 'Manage Your Chats',
            description: 'All conversations are listed in the sidebar. Click the trash icon to delete a chat, or click any chat to continue where you left off.',
            icon: <MessageSquare size={28} />,
            tip: 'Your chat history is private and only visible to you.',
          },
        ]}
      />
    </div>
  );
};

export default ChatPage;