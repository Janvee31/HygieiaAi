import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCalendarAlt, FaChartLine, FaInfoCircle } from 'react-icons/fa';
import { 
  processMenstrualRequest, 
  MenstrualCycle, 
  MenstrualPrediction,
  periodMotivationalQuotes
} from '@/utils/menstrualTracker';
import { schedulePeriodNotifications } from '@/utils/menstrualTracker';
import { toast } from 'react-toastify';

interface MenstrualTrackerProps {
  userId: string;
  phoneNumber: string;
  onCycleLogged?: (data: Partial<MenstrualCycle>) => void;
  showFullTracker?: boolean;
}

const MenstrualTracker: React.FC<MenstrualTrackerProps> = ({ 
  userId, 
  phoneNumber, 
  onCycleLogged, 
  showFullTracker = true 
}) => {
  const [cycleHistory, setCycleHistory] = useState<MenstrualCycle[]>([]);
  const [prediction, setPrediction] = useState<MenstrualPrediction | null>(null);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [symptoms, setSymptoms] = useState<{[key: string]: boolean}>({});
  const [moods, setMoods] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get a random motivational quote
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * periodMotivationalQuotes.length);
    return periodMotivationalQuotes[randomIndex];
  };
  
  // Toggle notification form
  const toggleNotificationForm = () => {
    setShowNotificationForm(!showNotificationForm);
  };
  
  // Enable notifications
  const enableNotifications = async () => {
    if (!prediction) {
      toast.error("Unable to set up notifications. Please log your period data first.");
      return;
    }
    
    if (!phoneNumber) {
      toast.error("Please enter your phone number to receive notifications.");
      return;
    }
    
    try {
      // Show loading toast
      toast.info("Setting up notifications...");
      
      // Get a motivational quote
      const quote = getRandomQuote();
      
      // Schedule notification with Twilio
      const success = await schedulePeriodNotifications(userId, phoneNumber, prediction);
      
      if (success) {
        setNotificationEnabled(true);
        setShowNotificationForm(false);
        toast.success("Menstrual cycle notifications have been set up successfully!");
        
        // Show the quote that will be sent
        setCurrentQuote(quote);
        setShowMotivationalQuote(true);
      } else {
        toast.error("Failed to set up notifications. Please try again.");
      }
    } catch (error) {
      console.error("Notification error:", error);
      toast.error("Failed to set up notifications. Please try again.");
    }
  };
  
  // Handle logging a new menstrual cycle
  const handleLogCycle = async () => {
    if (!startDate) {
      toast.error("Please select a start date for your cycle");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Collect selected symptoms and moods
      const selectedSymptoms = Object.keys(symptoms).filter(s => symptoms[s]);
      const selectedMoods = Object.keys(moods).filter(m => moods[m]);
      
      // Create cycle data
      const newCycle: Partial<MenstrualCycle> = {
        userId: userId,
        cycleStartDate: startDate,
        flow: flowIntensity as 'light' | 'medium' | 'heavy',
        symptoms: selectedSymptoms,
        mood: selectedMoods
      };
      
      // Mock prediction for demo purposes
      const startDateObj = new Date(startDate);
      const nextPeriodStart = new Date(startDateObj);
      nextPeriodStart.setDate(nextPeriodStart.getDate() + 28); // Assuming 28-day cycle
      
      const nextPeriodEnd = new Date(nextPeriodStart);
      nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 5); // Assuming 5-day period
      
      const ovulationDate = new Date(startDateObj);
      ovulationDate.setDate(ovulationDate.getDate() + 14); // Ovulation around day 14
      
      const fertileWindowStart = new Date(ovulationDate);
      fertileWindowStart.setDate(fertileWindowStart.getDate() - 3);
      
      const fertileWindowEnd = new Date(ovulationDate);
      fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);
      
      const newPrediction: MenstrualPrediction = {
        nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
        nextPeriodEnd: nextPeriodEnd.toISOString().split('T')[0],
        ovulationDate: ovulationDate.toISOString().split('T')[0],
        fertileWindowStart: fertileWindowStart.toISOString().split('T')[0],
        fertileWindowEnd: fertileWindowEnd.toISOString().split('T')[0],
        confidence: 0.85
      };
      
      // Set the prediction
      setPrediction(newPrediction);
      
      // Reset form
      setStartDate('');
      setFlowIntensity('medium');
      setSymptoms({});
      setMoods({});
      
      toast.success("Menstrual cycle logged successfully!");
      
      // Show motivational quote
      setCurrentQuote(getRandomQuote());
      setShowMotivationalQuote(true);
      
      // Call the onCycleLogged callback if provided
      if (onCycleLogged) {
        onCycleLogged(newCycle);
      }
      
    } catch (error) {
      console.error("Error logging cycle:", error);
      toast.error("Failed to log your cycle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show a motivational quote
  const showQuote = () => {
    setCurrentQuote(getRandomQuote());
    setShowMotivationalQuote(true);
    
    // Hide the quote after 10 seconds
    setTimeout(() => {
      setShowMotivationalQuote(false);
    }, 10000);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate days until next period
  const getDaysUntilNextPeriod = () => {
    if (!prediction) return null;
    
    const today = new Date();
    const nextPeriod = new Date(prediction.nextPeriodStart);
    
    const diffTime = nextPeriod.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get cycle phase
  const getCyclePhase = () => {
    if (!prediction) return 'Unknown';
    
    const today = new Date();
    const nextPeriod = new Date(prediction.nextPeriodStart);
    const ovulation = new Date(prediction.ovulationDate);
    
    // Check if currently in period
    const daysUntilNextPeriod = getDaysUntilNextPeriod();
    if (daysUntilNextPeriod !== null && daysUntilNextPeriod <= 0 && daysUntilNextPeriod > -5) {
      return 'Menstrual';
    }
    
    // Check if in follicular phase (after period, before ovulation)
    if (today < ovulation) {
      return 'Follicular';
    }
    
    // Check if in ovulation phase
    const ovulationMinus1 = new Date(ovulation);
    ovulationMinus1.setDate(ovulationMinus1.getDate() - 1);
    
    const ovulationPlus1 = new Date(ovulation);
    ovulationPlus1.setDate(ovulationPlus1.getDate() + 1);
    
    if (today >= ovulationMinus1 && today <= ovulationPlus1) {
      return 'Ovulatory';
    }
    
    // Otherwise, luteal phase
    return 'Luteal';
  };
  
  // Get phase color
  const getPhaseColor = () => {
    const phase = getCyclePhase();
    
    switch (phase) {
      case 'Menstrual':
        return 'from-red-500 to-red-700';
      case 'Follicular':
        return 'from-yellow-400 to-orange-500';
      case 'Ovulatory':
        return 'from-blue-400 to-indigo-500';
      case 'Luteal':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };
  
  return (
    <div className="w-full">
      {/* Cycle Overview */}
      <div className={`p-6 rounded-xl bg-gradient-to-r from-pink-800/70 to-purple-800/70 shadow-lg ${showFullTracker ? 'mb-6' : 'mb-0'} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50,0 C77.6,0 100,22.4 100,50 C100,77.6 77.6,100 50,100 C22.4,100 0,77.6 0,50 C0,22.4 22.4,0 50,0 Z M50,25 C36.2,25 25,36.2 25,50 C25,63.8 36.2,75 50,75 C63.8,75 75,63.8 75,50 C75,36.2 63.8,25 50,25 Z M50,40 C55.5,40 60,44.5 60,50 C60,55.5 55.5,60 50,60 C44.5,60 40,55.5 40,50 C40,44.5 44.5,40 50,40 Z" />
          </svg>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <span className="mr-2 text-white/80">◕</span> Cycle Overview
          </h3>
          <motion.button
            onClick={showFullTracker ? toggleNotificationForm : enableNotifications}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-3 rounded-full cursor-pointer ${notificationEnabled ? 'bg-white text-pink-500 shadow-md' : 'bg-white/20 hover:bg-white/30'} transition-all duration-300`}
            title={showFullTracker ? "Configure notifications" : "Enable cycle notifications"}
          >
            <FaBell className="text-lg" />
          </motion.button>
        </div>
        
        {prediction ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pink-900/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center text-center border border-pink-800/30">
              <span className="text-xs uppercase tracking-wider mb-1 text-white/70">Current Phase</span>
              <span className="text-xl font-bold">{getCyclePhase()}</span>
              <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white/60 rounded-full" style={{ width: `${(getDaysUntilNextPeriod() || 0) / 28 * 100}%` }}></div>
              </div>
            </div>
            
            <div className="bg-pink-900/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center text-center border border-pink-800/30">
              <span className="text-xs uppercase tracking-wider mb-1 text-white/70">Days Until Next Cycle</span>
              <span className="text-xl font-bold">{getDaysUntilNextPeriod() || '?'}</span>
              <span className="text-xs mt-1">{formatDate(prediction.nextPeriodStart)}</span>
            </div>
            
            <div className="bg-pink-900/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center text-center border border-pink-800/30">
              <span className="text-xs uppercase tracking-wider mb-1 text-white/70">Ovulation Date</span>
              <span className="text-xl font-bold">{formatDate(prediction.ovulationDate)}</span>
              <span className="text-xs mt-1">Fertile Window</span>
            </div>
            
            <div className="bg-pink-900/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center text-center border border-pink-800/30">
              <span className="text-xs uppercase tracking-wider mb-1 text-white/70">Cycle Length</span>
              <span className="text-xl font-bold">28 Days</span>
              <span className="text-xs mt-1">Regular</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-pink-900/30 backdrop-blur-sm rounded-lg border border-pink-800/30">
            <div className="mb-3 text-white/60">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.707 1.707a1 1 0 001.414 1.414l2-2a1 1 0 00.293-.707V7z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium">No cycle data available yet.</p>
            <p className="text-sm text-white/70 mt-1">Log your menstrual cycle to see predictions.</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <motion.button
            onClick={showQuote}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 shadow-sm cursor-pointer"
          >
            <FaInfoCircle /> Motivational Quote
          </motion.button>
          
          <motion.button
            onClick={enableNotifications}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 shadow-sm cursor-pointer"
            disabled={!prediction || !phoneNumber || notificationEnabled}
          >
            <FaBell /> {notificationEnabled ? 'Notifications Enabled' : 'Send SMS Notifications'}
          </motion.button>
        </div>
      </div>
      
      {/* Notification Form */}
      {showNotificationForm && showFullTracker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <span className="mr-2 text-indigo-400"><FaBell /></span> Cycle Notifications
            </h3>
            <motion.button
              onClick={() => setShowNotificationForm(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            >
              <span>×</span>
            </motion.button>
          </div>
          
          <div className="bg-black/20 p-4 rounded-lg mb-4">
            <p className="mb-3 text-white/90">
              Receive SMS notifications before your menstrual cycle starts with personalized insights:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-white/80 ml-2">
              <li>2-day advance notification before your cycle</li>
              <li>Motivational quotes for emotional support</li>
              <li>Ayurvedic recommendations for your phase</li>
              <li>Optional ovulation alerts for fertility awareness</li>
            </ul>
          </div>
          
          <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg">
            <span className="text-white/80">Phone Number:</span>
            <span className="font-mono bg-black/30 px-3 py-1 rounded-md">{phoneNumber || 'Not set'}</span>
          </div>
          
          <div className="mt-5 flex justify-end gap-3">
            <motion.button
              onClick={() => setShowNotificationForm(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all duration-300"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={enableNotifications}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white font-medium shadow-md transition-all duration-300"
              disabled={!prediction || !phoneNumber}
            >
              Enable Notifications
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Motivational Quote */}
      {showMotivationalQuote && showFullTracker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 rounded-xl bg-gradient-to-r from-rose-500/30 to-pink-500/30 text-white mb-6 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 opacity-5">
            <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L9.758 4.03c0 0-.218.052-.597.144C8.97 4.222 8.737 4.278 8.472 4.345c-.271.05-.56.187-.882.312C7.272 4.799 6.904 4.895 6.562 5.123c-.344.218-.741.4-1.091.692C5.132 6.116 4.723 6.377 4.421 6.76c-.33.358-.656.734-.909 1.162C3.219 8.33 3.02 8.778 2.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C2.535 17.474 4.338 19 6.5 19c2.485 0 4.5-2.015 4.5-4.5S8.985 10 6.5 10zM17.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L20.758 4.03c0 0-.218.052-.597.144-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162C14.219 8.33 14.02 8.778 13.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C13.535 17.474 15.338 19 17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10z"/>
            </svg>
          </div>
          
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold flex items-center">
              <span className="mr-2 text-pink-300">✨</span> Daily Inspiration
            </h3>
            <motion.button
              onClick={() => setShowMotivationalQuote(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            >
              <span>×</span>
            </motion.button>
          </div>
          
          <div className="bg-black/20 backdrop-blur-sm p-4 rounded-lg">
            <p className="italic text-white/90 text-lg leading-relaxed">"{currentQuote}"</p>
          </div>
        </motion.div>
      )}
      
      {/* Menstrual Cycle Log Form - Only show when in full tracker mode */}
      {showFullTracker && <div className="p-6 rounded-xl bg-gradient-to-r from-pink-900/40 to-purple-900/40 backdrop-blur-sm border border-pink-800/30 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <span className="mr-2 text-pink-400">◐</span> Log Your Menstrual Cycle
          </h3>
          <div className="bg-pink-500/20 text-xs px-3 py-1 rounded-full text-white/90">
            Track for better predictions
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div className="space-y-2">
            <label className="block text-white/80 text-sm font-medium mb-1">Start Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black/30 border border-pink-500/30 focus:border-pink-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400/70" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-white/80 text-sm font-medium mb-1">Flow Intensity</label>
            <select 
              value={flowIntensity}
              onChange={(e) => setFlowIntensity(e.target.value)}
              className="w-full bg-black/30 border border-pink-500/30 focus:border-pink-500/50 rounded-lg p-3 text-white appearance-none focus:ring-2 focus:ring-pink-500/20 transition-all duration-300"
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-5 mb-6">
          <div className="space-y-2">
            <label className="block text-white/80 text-sm font-medium">Symptoms</label>
            <div className="bg-black/20 p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Nausea', 'Back Pain', 'Breast Tenderness', 'Mood Swings'].map(symptom => (
                <div key={symptom} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`symptom-${symptom}`} 
                    checked={symptoms[symptom] || false}
                    onChange={(e) => setSymptoms({...symptoms, [symptom]: e.target.checked})}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor={`symptom-${symptom}`} className="text-sm text-white/90">{symptom}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-white/80 text-sm font-medium">Mood</label>
            <div className="bg-black/20 p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Happy', 'Sad', 'Irritable', 'Anxious', 'Calm', 'Energetic', 'Tired', 'Focused', 'Distracted'].map(mood => (
                <div key={mood} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`mood-${mood}`} 
                    checked={moods[mood] || false}
                    onChange={(e) => setMoods({...moods, [mood]: e.target.checked})}
                    className="w-4 h-4 accent-pink-500"
                  />
                  <label htmlFor={`mood-${mood}`} className="text-sm text-white/90">{mood}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <motion.button
            onClick={handleLogCycle}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-medium shadow-lg hover:shadow-pink-500/20 transition-all duration-300"
            disabled={!startDate || isSubmitting}
          >
            {isSubmitting ? 'Logging...' : 'Log Menstrual Cycle'}
          </motion.button>
        </div>
      </div>
      }
    </div>
  );
};

export default MenstrualTracker;
