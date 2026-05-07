import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaTimes, FaCalendarAlt, FaPills, FaFemale, FaRunning, 
  FaAppleAlt, FaHeartbeat, FaLungs, FaWater, FaBed, FaSun, 
  FaClipboardCheck, FaExclamationTriangle
} from 'react-icons/fa';

interface Notification {
  id: string;
  message: string;
  type: string;
  scheduledTime: string;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

interface NotificationManagerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onDismiss
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return <FaCalendarAlt className="text-yellow-400" />;
      case 'medication_reminder':
        return <FaPills className="text-purple-400" />;
      case 'menstrual_reminder':
        return <FaFemale className="text-pink-400" />;
      case 'exercise_reminder':
        return <FaRunning className="text-blue-400" />;
      case 'hydration_reminder':
        return <FaWater className="text-blue-300" />;
      case 'sleep_reminder':
        return <FaBed className="text-indigo-400" />;
      case 'nutrition_tip':
        return <FaAppleAlt className="text-green-400" />;
      case 'health_tip':
        return <FaHeartbeat className="text-red-400" />;
      case 'breathing_exercise':
        return <FaLungs className="text-cyan-400" />;
      case 'daily_checkin':
        return <FaClipboardCheck className="text-teal-400" />;
      case 'alert':
        return <FaExclamationTriangle className="text-orange-400" />;
      default:
        return <FaBell className="text-white" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
        return 'border-yellow-400 bg-yellow-400 bg-opacity-10';
      case 'medication_reminder':
        return 'border-purple-400 bg-purple-400 bg-opacity-10';
      case 'menstrual_reminder':
        return 'border-pink-400 bg-pink-400 bg-opacity-10';
      case 'exercise_reminder':
        return 'border-blue-400 bg-blue-400 bg-opacity-10';
      case 'hydration_reminder':
        return 'border-blue-300 bg-blue-300 bg-opacity-10';
      case 'sleep_reminder':
        return 'border-indigo-400 bg-indigo-400 bg-opacity-10';
      case 'nutrition_tip':
        return 'border-green-400 bg-green-400 bg-opacity-10';
      case 'health_tip':
        return 'border-red-400 bg-red-400 bg-opacity-10';
      case 'breathing_exercise':
        return 'border-cyan-400 bg-cyan-400 bg-opacity-10';
      case 'daily_checkin':
        return 'border-teal-400 bg-teal-400 bg-opacity-10';
      case 'alert':
        return 'border-orange-400 bg-orange-400 bg-opacity-10';
      default:
        return 'border-white/20 bg-black bg-opacity-20';
    }
  };

  // State for regular tips and reminders
  const [regularTips, setRegularTips] = useState<Notification[]>([]);

  // Generate regular health tips and reminders
  useEffect(() => {
    const healthTips = [
      "Remember to drink water regularly throughout the day.",
      "Take short breaks to stretch if you've been sitting for a long time.",
      "Try to get at least 7-8 hours of sleep tonight.",
      "Deep breathing exercises can help reduce stress and improve focus.",
      "Consider taking a short walk to boost your energy and mood.",
      "Remember to maintain good posture while sitting or standing.",
      "Eating colorful fruits and vegetables provides essential nutrients.",
      "Regular eye breaks can reduce digital eye strain."
    ];

    // Set up interval for regular tips (every 30 minutes)
    const tipInterval = setInterval(() => {
      const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];
      const newTip: Notification = {
        id: `tip-${Date.now()}`,
        message: randomTip,
        type: 'health_tip',
        scheduledTime: new Date().toISOString(),
        priority: 'low'
      };
      
      setRegularTips(prev => [...prev, newTip]);
      
      // Auto-dismiss tips after 10 seconds
      setTimeout(() => {
        setRegularTips(prev => prev.filter(tip => tip.id !== newTip.id));
      }, 10000);
    }, 1800000); // 30 minutes in milliseconds

    return () => clearInterval(tipInterval);
  }, []);

  // Combine regular tips with other notifications
  const allNotifications = [...notifications, ...regularTips];

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-xs w-full">
      <AnimatePresence>
        {allNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className={`rounded-lg border p-4 shadow-lg backdrop-blur-md ${getNotificationColor(notification.type)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="mr-3 text-xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <p className="text-white font-medium">{notification.message}</p>
                  <p className="text-white/60 text-xs mt-1">
                    {new Date(notification.scheduledTime).toLocaleString()}
                  </p>
                  {notification.actionUrl && notification.actionText && (
                    <a 
                      href={notification.actionUrl} 
                      className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                    >
                      {notification.actionText}
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-white/60 hover:text-white p-1"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManager;
