import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaUserMd, FaCheck } from 'react-icons/fa';
import Link from 'next/link';

interface AppointmentBookingProps {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  doctorName,
  appointmentDate,
  appointmentTime,
  onConfirm,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Format date for display
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Simulate searching for doctor
  React.useEffect(() => {
    const searchDoctor = async () => {
      try {
        // In a real implementation, this would search the database for the doctor
        // For now, we'll just simulate a delay and success
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate finding a doctor ID (this would come from your database)
        setDoctorId("doctor-123");
      } catch (error) {
        console.error("Error finding doctor:", error);
      }
    };
    
    searchDoctor();
  }, [doctorName]);

  const handleConfirm = async () => {
    if (!doctorId) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConfirmed(true);
      onConfirm();
    } catch (error) {
      console.error("Error confirming appointment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-black bg-opacity-30 backdrop-blur-md border border-white/10 rounded-xl p-5 mb-4"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FaCalendarAlt className="mr-2 text-blue-400" />
        Appointment Booking
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <FaUserMd className="text-lg mr-3 text-green-400" />
          <div>
            <p className="text-white/60 text-sm">Doctor</p>
            <p className="font-medium">{doctorName}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <FaCalendarAlt className="text-lg mr-3 text-yellow-400" />
          <div>
            <p className="text-white/60 text-sm">Date</p>
            <p className="font-medium">{formattedDate}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <FaClock className="text-lg mr-3 text-purple-400" />
          <div>
            <p className="text-white/60 text-sm">Time</p>
            <p className="font-medium">{appointmentTime}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex gap-3">
        {isConfirmed ? (
          <div className="w-full">
            <div className="flex items-center justify-center bg-green-500 bg-opacity-20 text-green-400 p-3 rounded-lg mb-3">
              <FaCheck className="mr-2" />
              <span>Appointment Confirmed!</span>
            </div>
            
            <Link href={`/appointment/book/${doctorId}`} className="block w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Proceed to Payment
              </motion.button>
            </Link>
          </div>
        ) : (
          <>
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-black bg-opacity-50 hover:bg-opacity-70 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </motion.button>
            
            <motion.button
              onClick={handleConfirm}
              disabled={isProcessing || !doctorId}
              whileHover={!isProcessing && doctorId ? { scale: 1.02 } : {}}
              whileTap={!isProcessing && doctorId ? { scale: 0.98 } : {}}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                isProcessing || !doctorId
                  ? 'bg-gray-500 bg-opacity-50 text-white/50 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : !doctorId ? (
                "Searching..."
              ) : (
                "Confirm"
              )}
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentBooking;
