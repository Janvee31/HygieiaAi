'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaCalendar, FaClock, FaRupeeSign } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import AppHeader from '@/components/AppHeader';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
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

// Generate time slots from 9 AM to 5 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
    const amPm = hour < 12 ? 'AM' : 'PM';
    slots.push(`${hourFormatted}:00 ${amPm}`);
    if (hour < 17) {
      slots.push(`${hourFormatted}:30 ${amPm}`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export default function BookAppointmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { themeColor } = useTheme();
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>(timeSlots);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  
  // Get next 7 days for appointment selection
  const getDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: date.getDate()
      });
    }
    
    return dates;
  };
  
  const dates = getDates();
  
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
    
    // Get user ID (in a real app, this would come from authentication)
    // For demo purposes, we'll use a fixed ID or generate one
    const demoUserId = localStorage.getItem('demoUserId') || `demo-user-${Date.now()}`;
    localStorage.setItem('demoUserId', demoUserId);
    setUserId(demoUserId);
    
    fetchDoctorDetails();
    
    return () => {
      document.body.removeChild(script);
    };
  }, [params.id]);
  
  useEffect(() => {
    if (selectedDate && doctor) {
      updateAvailableSlots();
    }
  }, [selectedDate, doctor]);
  
  const fetchDoctorDetails = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setDoctor(data);
      } else {
        setError('Doctor not found');
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      setError('Failed to load doctor details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateAvailableSlots = () => {
    // Filter out already booked slots for the selected date
    const bookedSlots = doctor.slots_booked?.[selectedDate] || [];
    const available = timeSlots.filter(slot => !bookedSlots.includes(slot));
    setAvailableSlots(available);
    
    // Clear selected time if it's no longer available
    if (selectedTime && !available.includes(selectedTime)) {
      setSelectedTime('');
    }
  };
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time for your appointment');
      return;
    }
    
    if (!userId) {
      setError('User ID not found. Please try again.');
      return;
    }
    
    setIsBooking(true);
    setError(null);
    
    try {
      // Create appointment data
      const appointmentData = {
        user_id: userId,
        doctor_id: doctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'pending',
        payment: false
      };
      
      // Book the appointment through our API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment');
      }
      
      // Proceed to payment
      handlePayment(result.appointment);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to book appointment');
      setIsBooking(false);
    }
  };
  
  const handlePayment = (appointment: any) => {
    if (!isRazorpayLoaded) {
      setError('Payment system is not loaded. Please try again.');
      setIsBooking(false);
      return;
    }
    
    // For demo purposes, we'll simulate a payment
    // In a real app, you would create an order on your backend and get an order_id
    
    const options = {
      key: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay key
      amount: doctor.fees * 100, // Amount in paisa
      currency: 'INR',
      name: 'Hygieia Health',
      description: `Appointment with ${doctor.name} on ${selectedDate} at ${selectedTime}`,
      image: '/logo.png',
      order_id: `order_${Date.now()}`, // In a real app, get this from your backend
      handler: function(response: any) {
        // Handle successful payment
        updateAppointmentPaymentStatus(appointment.id, response.razorpay_payment_id);
      },
      prefill: {
        name: 'Patient Name',
        email: 'patient@example.com',
        contact: '9999999999'
      },
      notes: {
        appointment_id: appointment.id
      },
      theme: {
        color: themeColor
      },
      modal: {
        ondismiss: function() {
          setIsBooking(false);
        }
      }
    };
    
    // For demo purposes, we'll simulate a successful payment
    simulateSuccessfulPayment(appointment.id);
  };
  
  const simulateSuccessfulPayment = (appointmentId: string) => {
    // In a real app, this would be handled by the Razorpay callback
    setTimeout(() => {
      updateAppointmentPaymentStatus(appointmentId, `pay_${Date.now()}`);
    }, 2000);
  };
  
  const updateAppointmentPaymentStatus = async (appointmentId: string, paymentId: string) => {
    try {
      // Create payment record
      const paymentData = {
        appointment_id: appointmentId,
        amount: doctor.fees,
        payment_id: paymentId,
        payment_status: 'completed'
      };
      
      // Record payment through API
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to record payment');
      }
      
      // Update appointment status
      const { error } = await supabase
        .from('appointments')
        .update({ 
          payment: true,
          status: 'confirmed'
        })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Show success and redirect
      alert('Appointment booked and payment completed successfully!');
      router.push('/appointment/my-appointments');
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Payment was processed but there was an error updating the appointment. Please contact support.');
      setIsBooking(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <AppHeader activePage="doctors" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !doctor) {
    return (
      <div className="min-h-screen">
        <AppHeader activePage="doctors" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass rounded-xl p-8 backdrop-blur-md bg-black/30 border border-white/10 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-white/80">{error || 'Doctor not found'}</p>
            <Link href="/appointment/doctors">
              <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                Back to Doctors
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <AppHeader activePage="doctors" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center mb-6">
            <Link href="/appointment/doctors">
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                <span>Back to Doctors</span>
              </motion.button>
            </Link>
            <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white ml-6">
              Book Appointment
            </motion.h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Doctor Info */}
            <motion.div
              variants={itemVariants}
              className="glass rounded-xl p-6 backdrop-blur-md bg-black/30 border border-white/10 shadow-xl"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 30%, rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.1) 0%, transparent 70%)`,
                boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 20px ${themeColor}30`
              }}
            >
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-xl mb-4">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{doctor.name}</h2>
                <p className="text-white/70 mb-2">{doctor.speciality}</p>
                <p className="text-white/70 mb-4">{doctor.degree}</p>
                
                <div className="w-full border-t border-white/10 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Experience:</span>
                    <span className="text-white font-medium">{doctor.experience}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Fees:</span>
                    <span className="text-white font-medium flex items-center">
                      <FaRupeeSign className="text-sm mr-1" />
                      {doctor.fees}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Appointment Booking */}
            <motion.div
              variants={itemVariants}
              className="glass rounded-xl p-6 backdrop-blur-md bg-black/30 border border-white/10 shadow-xl md:col-span-2"
              style={{
                backgroundImage: `radial-gradient(circle at 70% 30%, rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.1) 0%, transparent 70%)`,
                boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 20px ${themeColor}30`
              }}
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <FaCalendar className="mr-2" />
                Select Date & Time
              </h3>
              
              {/* Date Selection */}
              <div className="mb-8">
                <h4 className="text-white/80 text-sm font-medium mb-3">Available Dates</h4>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date.date}
                      onClick={() => handleDateSelect(date.date)}
                      className={`p-3 rounded-lg flex flex-col items-center transition-colors ${
                        selectedDate === date.date 
                          ? `bg-white text-gray-900 shadow-lg` 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="text-xs font-medium">{date.day}</span>
                      <span className="text-lg font-bold">{date.dayOfMonth}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-8">
                  <h4 className="text-white/80 text-sm font-medium mb-3 flex items-center">
                    <FaClock className="mr-2" />
                    Available Time Slots for {formatDate(selectedDate)}
                  </h4>
                  
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            selectedTime === time 
                              ? `bg-white text-gray-900 shadow-lg` 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70 bg-white/5 p-4 rounded-lg">No available slots for this date.</p>
                  )}
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200">{error}</p>
                </div>
              )}
              
              {/* Book Button */}
              <div className="flex justify-end">
                <motion.button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 20px ${themeColor}60` }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 rounded-lg text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                    boxShadow: `0 4px 15px ${themeColor}50`
                  }}
                >
                  {isBooking ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    `Book Appointment (₹${doctor.fees})`
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
