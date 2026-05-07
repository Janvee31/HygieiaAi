'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaMicrophone, FaMicrophoneSlash, FaRobot, FaUser, 
  FaImage, FaPaperPlane, FaVolumeUp, FaVolumeMute, 
  FaCalendarAlt, FaRunning, FaAppleAlt, FaHeartbeat, 
  FaLungs, FaFemale, FaPills, FaFileMedical, FaFlask,
  FaCamera, FaFileUpload, FaSearch, FaClipboardList, FaStethoscope,
  FaBrain, FaHospital, FaFileAlt, FaXRay, FaBell
} from 'react-icons/fa';
import { supabase } from '@/utils/supabase';

// Import custom components
import ChatMessage from '@/components/chat/ChatMessage';
import AgentSelector from '@/components/chat/AgentSelector';
import ChatInput from '@/components/chat/ChatInput';
import ImageAnalysis from '@/components/chat/ImageAnalysis';
import AppointmentBooking from '@/components/chat/AppointmentBooking';
import NotificationManager from '@/components/chat/NotificationManager';
import DocumentScanner from '@/components/chat/DocumentScanner';
import MenstrualTracker from '@/components/menstrual/MenstrualTracker';

// Import utility functions
import { analyzeMedicalReport, detectReportType } from '@/utils/reportAnalysis';
import { generateAIResponse } from '@/utils/aiResponseGenerator';
import { detectAppointmentRequest, detectAgentRedirect } from '@/utils/chatUtils';
import { processAppointmentRequest, AppointmentDetails } from '@/utils/appointmentHandler';

// Define SpeechRecognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
}

// Declare SpeechRecognition globals
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Define agent types
const agentTypes = [
  { id: 'general', name: 'General Health', icon: <FaHeartbeat className="text-red-500" />, color: '#ef4444' },
  { id: 'menstrual', name: 'Menstrual Tracker', icon: <FaFemale className="text-pink-500" />, color: '#ec4899' },
  { id: 'nutrition', name: 'Nutrition Coach', icon: <FaAppleAlt className="text-green-500" />, color: '#22c55e' },
  { id: 'exercise', name: 'Exercise Guide', icon: <FaRunning className="text-blue-500" />, color: '#3b82f6' },
  { id: 'medication', name: 'Medication Reminder', icon: <FaPills className="text-purple-500" />, color: '#a855f7' },
  { id: 'appointment', name: 'Appointment Manager', icon: <FaCalendarAlt className="text-yellow-500" />, color: '#eab308' },
];

// Define message interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId: string;
  imageUrl?: string;
  isLoading?: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function ChatAIPage() {
  const { themeColor } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Hygieia Health Assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
      agentId: 'general'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAgentRedirectPrompt, setShowAgentRedirectPrompt] = useState(false);
  const [suggestedAgentId, setSuggestedAgentId] = useState<string | null>(null);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);
  const [detectedReportType, setDetectedReportType] = useState<string>('general');
  const [isPerformingOCR, setIsPerformingOCR] = useState(false);
  const [showMenstrualTracker, setShowMenstrualTracker] = useState(false);
  const [showFullMenstrualTracker, setShowFullMenstrualTracker] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [menstrualData, setMenstrualData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Speech recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if user is logged in
    checkUser();
    
    // Initialize welcome message based on time of day
    initializeWelcomeMessage();
    
    // Set up speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        
        setInputText(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    }
  };
  
  const initializeWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `${greeting}! I'm your Hygieia Health Assistant. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      agentId: 'general'
    };
    
    setMessages([welcomeMessage]);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setInputText('');
    }
  };
  
  const toggleSpeaking = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported in your browser.');
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('Image preview set:', reader.result);
        
        // Automatically detect report type for medical documents
        if (selectedAgent === 'reports' || selectedAgent === 'labs') {
          detectDocumentType(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const detectDocumentType = async (imageData: string) => {
    try {
      // Detect the type of medical report
      const reportType = await detectReportType(imageData);
      setDetectedReportType(reportType);
      
      // Show a notification about the detected document type
      const notification = {
        id: Date.now().toString(),
        message: `Detected ${reportType.replace('_', ' ')} document. Would you like me to analyze it?`,
        type: 'reports',
        scheduledTime: new Date().toISOString(),
        actionText: 'Analyze Now',
        actionUrl: '#analyze-document'
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 10000);
      
    } catch (error) {
      console.error('Error detecting document type:', error);
    }
  };
  

  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleCaptureDocument = () => {
    setShowDocumentScanner(true);
  };
  
  const handleDocumentCaptured = (imageData: string, analysisText?: string) => {
    setShowDocumentScanner(false);
    setImagePreview(imageData);
    
    // Convert base64 to file
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `document-${Date.now()}.jpg`, { type: mimeString });
    
    setImageFile(file);
    
    // If we have analysis text from Gemini, use it directly
    if (analysisText) {
      // Add the analysis as a message from the AI
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: `📄 **Document Analysis**\n\n${analysisText}`,
        sender: 'ai',
        timestamp: new Date(),
        agentId: selectedAgent
      };
      
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
    } else {
      // Otherwise, detect document type as before
      detectDocumentType(imageData);
    }
  };
  
  const performOCRAnalysis = async () => {
    if (!imagePreview) return;
    
    setIsPerformingOCR(true);
    setIsAnalyzingImage(true);
    
    try {
      // In a real implementation, this would call an OCR service
      // For now, we'll use our mock analysis function
      const analysisResult = await analyzeMedicalReport(imagePreview, detectedReportType);
      
      // Create a user message with the image
      const userMessage: Message = {
        id: Date.now().toString(),
        text: 'Please analyze this medical document',
        sender: 'user',
        timestamp: new Date(),
        agentId: selectedAgent,
        imageUrl: imagePreview
      };
      
      // Create an AI response with the analysis
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysisResult,
        sender: 'ai',
        timestamp: new Date(),
        agentId: selectedAgent
      };
      
      // Add messages to chat
      setMessages(prev => [...prev, userMessage, aiResponse]);
      
      // Set analysis result for display
      setImageAnalysisResult(analysisResult);
      
    } catch (error) {
      console.error('Error performing OCR analysis:', error);
      toast.error('Failed to analyze document. Please try again.');
    } finally {
      setIsPerformingOCR(false);
      setIsAnalyzingImage(false);
      clearImagePreview();
    }
  };
  
  const clearImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSendMessage = async () => {
    if ((!inputText || inputText.trim() === '') && !imageFile) return;
    
    // Reset states for new message
    setAppointmentData(null);
    setImageAnalysisResult(null);
    setShowAgentRedirectPrompt(false);
    setSuggestedAgentId(null);
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      agentId: selectedAgent,
      imageUrl: imagePreview || undefined
    };
    
    // Create loading message for AI
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '...',
      sender: 'ai',
      timestamp: new Date(),
      agentId: selectedAgent,
      isLoading: true
    };
    
    // Add messages to state
    setMessages(prev => [...prev, userMessage, loadingMessage]);
    
    // Clear input and image preview
    setInputText('');
    clearImagePreview();
    
    try {
      // Check if this is an appointment request
      const isAppointmentRelated = inputText.toLowerCase().includes('appointment') || 
                                   inputText.toLowerCase().includes('book') || 
                                   inputText.toLowerCase().includes('doctor') || 
                                   inputText.toLowerCase().includes('dr.');
      
      // If it's appointment related, switch to appointment agent
      if (isAppointmentRelated && selectedAgent !== 'appointment') {
        setSelectedAgent('appointment');
      }
      
      let aiResponseText = '';
      let bookingUrl = '';
      let appointmentDetails: AppointmentDetails | undefined;
      
      // If it's an appointment request, process it with the appointment handler
      if (selectedAgent === 'appointment') {
        const appointmentResponse = await processAppointmentRequest(inputText);
        aiResponseText = appointmentResponse.response;
        bookingUrl = appointmentResponse.bookingUrl || '';
        appointmentDetails = appointmentResponse.appointmentDetails;
        
        // If we have appointment details, save them
        if (appointmentDetails) {
          setAppointmentData({
            isAppointment: true,
            details: {
              doctor: appointmentDetails.doctorName,
              date: appointmentDetails.date,
              time: appointmentDetails.time,
              phone: appointmentDetails.patientPhone || ''
            }
          });
          
          // If we have a booking URL, redirect to it
          if (bookingUrl) {
            // Add a button to the message that will redirect to the booking page
            aiResponseText += '\n\n[Book Appointment](' + bookingUrl + ')';
          }
        }
      } else {
        // Check if we should redirect to another agent
        const redirectAgent = detectAgentRedirect(inputText, selectedAgent);
        const shouldRedirect = redirectAgent !== selectedAgent;
        
        // If we should redirect to another agent, update the selected agent
        if (shouldRedirect && redirectAgent) {
          setShowAgentRedirectPrompt(true);
          setSuggestedAgentId(redirectAgent);
        }
        
        // Generate AI response based on user input and image if present
        const aiResponse = await generateAIResponse(
          inputText,
          selectedAgent,
          imagePreview || undefined,
          user?.id || 'anonymous',
          phoneNumber || user?.user_metadata?.phone || ''
        );
        
        // Extract the text from the response object
        aiResponseText = typeof aiResponse === 'string' ? aiResponse : aiResponse.text;
      }
      
      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.isLoading ? {
          ...msg,
          id: Date.now().toString(),
          text: aiResponseText,
          isLoading: false,
          agentId: selectedAgent
        } : msg
      ));
      
      // If appointment data is available, schedule a notification
      if (appointmentData && appointmentData.details.date) {
        const notificationData = {
          userId: 'anonymous', // Replace with actual user ID in production
          phone: appointmentData.details.phone || '',
          message: `Reminder: You have an appointment scheduled for ${appointmentData.details.date} at ${appointmentData.details.time || '(time not specified)'}`,
          scheduledTime: new Date(appointmentData.details.date).toISOString(),
          type: 'appointment'
        };
        
        // Schedule the notification
        scheduleNotification(notificationData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response. Please try again.');
      
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.isLoading ? {
          ...msg,
          id: Date.now().toString(),
          text: 'Sorry, I encountered an error. Please try again.',
          isLoading: false
        } : msg
      ));
    } finally {
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  };
  
  const scheduleNotification = async (notificationData: any) => {
    try {
      const response = await fetch('/api/schedule-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          phone: user?.user_metadata?.phone || '',
          message: notificationData.message,
          scheduledTime: notificationData.scheduledTime,
          type: notificationData.type
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Notification scheduled for ${new Date(notificationData.scheduledTime).toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast.error('Failed to schedule notification');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getAgentIcon = (agentId: string) => {
    const agent = agentTypes.find(a => a.id === agentId);
    return agent ? agent.icon : <FaRobot className="text-blue-500" />;
  };
  
  const getAgentColor = (agentId: string) => {
    const agent = agentTypes.find(a => a.id === agentId);
    return agent ? agent.color : themeColor;
  };
  
  const getAgentName = (agentId: string) => {
    const agent = agentTypes.find(a => a.id === agentId);
    return agent ? agent.name : 'Health Assistant';
  };
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentRedirectPrompt(false);
    setShowMenstrualTracker(agentId === 'menstrual');
  };
  
  const handleAgentRedirect = () => {
    if (suggestedAgentId) {
      setSelectedAgent(suggestedAgentId);
      setShowAgentRedirectPrompt(false);
      setSuggestedAgentId(null);
      
      // Add a system message about the switch
      const switchMessage: Message = {
        id: Date.now().toString(),
        text: `Switched to ${getAgentName(suggestedAgentId)} assistant.`,
        sender: 'ai',
        timestamp: new Date(),
        agentId: suggestedAgentId
      };
      
      setMessages(prev => [...prev, switchMessage]);
    }
  };
  
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const handleAppointmentConfirm = () => {
    if (!appointmentData) return;
    
    // Add a confirmation message
    const confirmMessage: Message = {
      id: Date.now().toString(),
      text: `Appointment with ${appointmentData.doctorName} confirmed for ${new Date(appointmentData.date).toLocaleDateString()} at ${appointmentData.time}. You can proceed to payment.`,
      sender: 'ai',
      timestamp: new Date(),
      agentId: 'appointment'
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    
    // Schedule a notification for the appointment
    const appointmentDate = new Date(appointmentData.date);
    appointmentDate.setHours(parseInt(appointmentData.time.split(':')[0]), parseInt(appointmentData.time.split(':')[1]));
    
    // Set notification for 24 hours before
    const notificationTime = new Date(appointmentDate);
    notificationTime.setHours(notificationTime.getHours() - 24);
    
    const notificationData = {
      type: 'appointment_reminder',
      scheduledTime: notificationTime.toISOString(),
      message: `Reminder: You have an appointment with ${appointmentData.doctorName} tomorrow at ${appointmentData.time}.`
    };
    
    scheduleNotification(notificationData);
  };
  
  const handleAppointmentCancel = () => {
    setAppointmentData(null);
    
    // Add a cancellation message
    const cancelMessage: Message = {
      id: Date.now().toString(),
      text: 'Appointment booking cancelled. Let me know if you would like to schedule at a different time.',
      sender: 'ai',
      timestamp: new Date(),
      agentId: 'appointment'
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };

  return (
    <div className="min-h-screen text-white bg-transparent">
      <div className="max-w-8xl mx-auto px-4 py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col h-[90vh] relative"
        >
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col space-y-4 mb-6 relative z-10"
          >
            <div className="flex flex-col mb-4 ">
              <h1 className="text-3xl font-bold text-white text-center">Health Assistant</h1>
              <p className="text-gray-400 mt-1 text-center">Your personal AI health companion</p>
            </div>
            
            {/* Agent Selector */}
            <AgentSelector 
              agents={agentTypes}
              selectedAgent={selectedAgent}
              onSelectAgent={handleAgentSelect}
            />
          </motion.div>
          
          {/* Chat Messages or Specialized Interface */}
          <motion.div 
            variants={itemVariants}
            className="flex-1 overflow-y-auto rounded-xl bg-black bg-opacity-20 backdrop-blur-sm border border-white/10 p-4 mb-4 relative z-10"
          >
            {/* Show Menstrual Tracker interface when selected */}
            {showMenstrualTracker && (
              <div className="mb-6 bg-gradient-to-br from-pink-800/30 to-purple-900/30 p-6 rounded-2xl border border-pink-500/30 shadow-lg backdrop-blur-md relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 opacity-5">
                  <svg viewBox="0 0 100 100" fill="currentColor" className="text-pink-200">
                    <path d="M50,0 C77.6,0 100,22.4 100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 Z M50,25 C36.2,25 25,36.2 25,50 C25,63.8 36.2,75 50,75 C63.8,75 75,63.8 75,50 C75,36.2 63.8,25 50,25 Z" />
                  </svg>
                </div>
                
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-3 text-pink-300 bg-pink-500/20 p-2 rounded-full">♀️</span> 
                    <span>Menstrual Tracker</span>
                  </h2>
                  <motion.button
                    onClick={() => setShowMenstrualTracker(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300"
                  >
                    <span className="text-xl">×</span>
                  </motion.button>
                </div>
                
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 rounded-xl mb-6 border border-pink-500/20 shadow-inner">
                    <div className="flex items-center mb-3">
                      <span className="text-pink-300 mr-2"><FaBell /></span>
                      <label className="text-white/90 font-medium">Phone Number for Notifications</label>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1234567890"
                        className="flex-1 bg-black/40 border border-pink-500/30 focus:border-pink-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-medium shadow-lg hover:shadow-pink-500/20 transition-all duration-300"
                        onClick={() => toast.success("Phone number saved for notifications!")}
                      >
                        Save
                      </motion.button>
                    </div>
                    <p className="text-white/60 text-xs mt-2">Required for menstrual cycle notifications with motivational quotes</p>
                  </div>
                  
                  <MenstrualTracker 
                    userId="anonymous" 
                    phoneNumber={phoneNumber || appointmentData?.details?.phone || ''}
                    onCycleLogged={(data) => {
                      setShowFullMenstrualTracker(false);
                      setMenstrualData(data);
                      
                      // Add a message to the chat
                      const cycleInfo = `I've logged my menstrual cycle starting on ${data.cycleStartDate} with ${data.flow} flow.`;
                      const symptoms = data.symptoms && data.symptoms.length > 0 ? `Symptoms: ${data.symptoms.join(', ')}. ` : '';
                      const moods = data.mood && data.mood.length > 0 ? `Mood: ${data.mood.join(', ')}.` : '';
                      
                      const message = cycleInfo + ' ' + symptoms + moods;
                      
                      // Add the message to the chat
                      const newMessage: Message = {
                        id: Date.now().toString(),
                        text: message,
                        sender: 'user',
                        timestamp: new Date(),
                        agentId: 'menstrual'
                      };
                      
                      setMessages(prev => [...prev, newMessage]);
                      
                      // Add AI response with predictions
                      setTimeout(() => {
                        // Calculate next period date (28 days from start date)
                        const startDate = new Date(data.cycleStartDate || new Date());
                        const nextPeriodDate = new Date(startDate);
                        nextPeriodDate.setDate(nextPeriodDate.getDate() + 28);
                        
                        // Calculate ovulation date (14 days from start date)
                        const ovulationDate = new Date(startDate);
                        ovulationDate.setDate(ovulationDate.getDate() + 14);
                        
                        // Format dates
                        const nextPeriodFormatted = nextPeriodDate.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        
                        const ovulationFormatted = ovulationDate.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric' 
                        });
                        
                        // Store data in state for future reference
                        setMenstrualData({
                          ...data,
                          nextPeriodDate: nextPeriodFormatted,
                          ovulationDate: ovulationFormatted,
                          cycleLength: 28
                        });
                        
                        // Create detailed response
                        const aiResponse: Message = {
                          id: (Date.now() + 1).toString(),
                          text: `I've recorded your menstrual cycle information. Based on your data, here are your predictions:\n\nNext cycle expected on: ${nextPeriodFormatted}\nOvulation expected on: ${ovulationFormatted}\nCycle length: 28 days\n\nYou can ask me any questions about your cycle, get Ayurvedic recommendations, or set up SMS notifications.`,
                          sender: 'ai',
                          timestamp: new Date(),
                          agentId: 'menstrual'
                        };
                        setMessages(prev => [...prev, aiResponse]);
                      }, 1000);
                    }}
                    showFullTracker={showFullMenstrualTracker}
                  />
                </div>
              </div>
            )}
            {/* Agent Redirect Prompt */}
            {showAgentRedirectPrompt && suggestedAgentId && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-black bg-opacity-30 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-4"
              >
                <p className="mb-3">
                  This question seems to be related to {getAgentName(suggestedAgentId)}. Would you like to switch to that assistant?
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAgentRedirect}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500 rounded-lg text-white"
                  >
                    Switch to {getAgentName(suggestedAgentId)}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAgentRedirectPrompt(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white"
                  >
                    Stay with current assistant
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {/* Image Analysis Results */}
            {imageAnalysisResult && (
              <ImageAnalysis 
                imageUrl={messages.find(m => m.imageUrl)?.imageUrl || ''}
                analysisResult={imageAnalysisResult}
                isAnalyzing={isAnalyzingImage}
              />
            )}
            
            {/* Appointment Booking UI */}
            {appointmentData && (
              <AppointmentBooking 
                doctorName={appointmentData.doctorName}
                appointmentDate={appointmentData.date}
                appointmentTime={appointmentData.time}
                onConfirm={handleAppointmentConfirm}
                onCancel={handleAppointmentCancel}
              />
            )}
            
            <AnimatePresence>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  getAgentIcon={getAgentIcon}
                  getAgentName={getAgentName}
                  isSpeaking={isSpeaking}
                  toggleSpeaking={toggleSpeaking}
                />
              ))}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </motion.div>
          
          {/* Advanced Input Area with Document Scanner */}
          <div className="relative">
            {selectedAgent === 'reports' || selectedAgent === 'labs' ? (
              <div className="absolute -top-12 right-0 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCaptureDocument}
                  className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1 rounded-full text-sm text-white shadow-lg"
                >
                  <FaCamera className="text-xs" />
                  <span>Scan Document</span>
                </motion.button>
                
                {imagePreview && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={performOCRAnalysis}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full text-sm text-white shadow-lg"
                    disabled={isPerformingOCR}
                  >
                    {isPerformingOCR ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <FaSearch className="text-xs" />
                        <span>Analyze Document</span>
                      </>
                    )}
                  </motion.button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            ) : null}
            
            <ChatInput 
              inputText={inputText}
              setInputText={setInputText}
              handleSendMessage={handleSendMessage}
              handleKeyDown={handleKeyDown}
              isListening={isListening}
              toggleListening={toggleListening}
              imagePreview={imagePreview}
              clearImagePreview={clearImagePreview}
              triggerFileInput={triggerFileInput}
              fileInputRef={fileInputRef}
              onCameraCapture={handleCaptureDocument}
            />
            
            {/* Hidden file input for image upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Notifications */}
      <NotificationManager 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <DocumentScanner 
          onCapture={handleDocumentCaptured}
          onCancel={() => setShowDocumentScanner(false)}
        />
      )}
      
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
