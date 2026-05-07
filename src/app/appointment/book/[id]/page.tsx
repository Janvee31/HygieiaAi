'use client';

// Add TypeScript declaration for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaCalendar, FaClock, FaRupeeSign } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';
import confetti from 'canvas-confetti';

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

export default function BookAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
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
  const [patientName, setPatientName] = useState('Test Patient');
  const [patientEmail, setPatientEmail] = useState('patient@example.com');
  const [patientPhone, setPatientPhone] = useState('');
  
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
    const loadRazorpay = () => {
      if (typeof window !== 'undefined') {
        // Create and configure the script element within the scope where window is defined
        const razorpayScript = document.createElement('script');
        razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
        razorpayScript.async = true;
        razorpayScript.onload = () => {
          console.log('Razorpay script loaded successfully');
          setIsRazorpayLoaded(true);
        };
        razorpayScript.onerror = () => {
          console.error('Failed to load Razorpay script');
        };
        document.body.appendChild(razorpayScript);
      }
    };
    
    loadRazorpay();
    
    // Get user ID (in a real app, this would come from authentication).
    // For demo usage, keep a valid UUID in localStorage so Supabase accepts it.
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('demoUserId');
      const demoUserId = storedUserId && isValidUUID(storedUserId)
        ? storedUserId
        : crypto.randomUUID();
      localStorage.setItem('demoUserId', demoUserId);
      setUserId(demoUserId);
    }
    
    // Only fetch doctor details if we have an ID. The database uses UUIDs,
    // but this page should not crash if older/mock records use another format.
    if (unwrappedParams.id && typeof unwrappedParams.id === 'string') {
      fetchDoctorDetails();
    } else {
      console.error('Missing or invalid doctor ID');
      setError('Missing doctor ID');
      setIsLoading(false);
    }
    
    // No cleanup needed for Razorpay script as it's loaded once and kept for the entire session
    return () => {
      // Cleanup function
    };
  }, [unwrappedParams.id]);
  
  // Force re-render when theme color changes to ensure immediate UI updates
  useEffect(() => {
    // This empty effect with themeColor dependency will cause
    // the component to re-render when themeColor changes
    console.log('Theme color changed to:', themeColor);
    // No action needed, just having themeColor in the dependency array
    // ensures the component re-renders when it changes
  }, [themeColor]);
  
  useEffect(() => {
    if (selectedDate && doctor) {
      updateAvailableSlots();
    }
  }, [selectedDate, doctor]);
  
  const fetchDoctorDetails = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching doctor with ID:', unwrappedParams.id);
      
      // First verify the doctor ID is valid
      if (!unwrappedParams.id || typeof unwrappedParams.id !== 'string') {
        throw new Error(`Invalid doctor ID: ${unwrappedParams.id}`);
      }
      
      const response = await fetch(`/api/doctors/${encodeURIComponent(unwrappedParams.id)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load doctor details');
      }

      if (!result.doctor) {
        console.error('No doctor found with ID:', unwrappedParams.id);
        setError('Doctor not found');
        return;
      }

      const data = result.doctor;
      
      // Validate the doctor data has all required fields
      const requiredFields = ['name', 'email', 'speciality', 'degree', 'experience', 'fees', 'about', 'image'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.error('Doctor data missing required fields:', missingFields);
        setError(`Doctor data incomplete. Missing: ${missingFields.join(', ')}`);
        return;
      }
      
      console.log('Doctor data loaded successfully:', data);
      setDoctor(data);
    } catch (error) {
      // Provide more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching doctor details:', error);
      setError(`Failed to load doctor details: ${errorMessage}`);
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
    if (!selectedDate || !selectedTime || !doctor || !userId) {
      setError('Please select a date and time for your appointment');
      return;
    }

    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
      setError('Please enter patient name, email, and phone number for booking confirmation');
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
        payment: false,
        cancelled: false,
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        patient_phone: patientPhone.trim()
      };
      
      console.log('Booking appointment with data:', appointmentData);
      
      // Book appointment through API
      const response = await fetch('/api/appointment-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to book appointment');
      }
      
      // Handle different response formats to be more flexible
      let appointment;
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        appointment = result.data[0];
      } else if (result.appointment) {
        appointment = result.appointment;
      } else if (result.data && !Array.isArray(result.data)) {
        appointment = result.data;
      }
      
      console.log('Extracted appointment data:', appointment);
      
      if (!appointment) {
        throw new Error('No appointment data returned from server');
      }
      
      // Proceed to payment
      if (isRazorpayLoaded) {
        console.log('Razorpay is loaded, initializing payment...');
        
        // Initialize Razorpay payment
        const options = {
          key: 'rzp_test_1DP5mmOlF5G5ag', // Test key that works in test mode
          amount: doctor.fees * 100, // Amount in smallest currency unit (paise for INR)
          currency: 'INR',
          name: 'Hygieia Health',
          description: `Appointment with ${doctor.name}`,
          image: '/logo.png',
          handler: function(response: any) {
            // Handle successful payment
            const paymentId = response.razorpay_payment_id;
            updateAppointmentPaymentStatus(appointment.id, paymentId);
            
            // Show success animation before redirect
            showSuccessAnimation();
            
            // Redirect after animation completes
            setTimeout(() => {
              router.push('/appointment/my-appointments');
            }, 3000);
          },
          prefill: {
            name: patientName.trim(),
            email: patientEmail.trim(),
            contact: patientPhone.trim()
          },
          theme: {
            color: themeColor,
          },
          // Add notes for test mode
          notes: {
            address: 'Hygieia Health Headquarters',
            merchant_order_id: 'TEST_' + Date.now(),
          },
          // Modal closing behavior
          modal: {
            ondismiss: function() {
              console.log('Payment modal closed by user');
              setIsBooking(false);
            },
            escape: false,
            backdropclose: false
          }
        };
        
        try {
          // Create and open Razorpay instance
          console.log('Creating Razorpay instance with options:', options);
          const razorpayInstance = new window.Razorpay(options);
          razorpayInstance.on('payment.failed', function(response: any) {
            console.error('Payment failed:', response.error);
            alert('Payment failed: ' + response.error.description);
            setIsBooking(false);
          });
          
          // Open Razorpay modal
          console.log('Opening Razorpay payment modal...');
          razorpayInstance.open();
        } catch (error) {
          console.error('Error opening Razorpay:', error);
          
          // Fallback for development/demo
          console.log('Using fallback payment flow for development');
          alert('Development mode: Payment simulation successful!');
          updateAppointmentPaymentStatus(appointment.id, 'dev_' + Date.now());
          router.push('/appointment/success?id=' + appointment.id);
          setIsBooking(false);
        }
      } else {
        // Razorpay not loaded, use fallback
        console.log('Razorpay not loaded, using fallback payment flow');
        alert('Development mode: Payment simulation successful!');
        updateAppointmentPaymentStatus(appointment.id, 'dev_' + Date.now());
        router.push('/appointment/success?id=' + appointment.id);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error instanceof Error ? error.message : 'Failed to book appointment');
      setIsBooking(false);
    }
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
      const response = await fetch('/api/appointment-payment', {
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
      
      // Show success and redirect
      alert('Appointment booked and payment completed successfully!');
      router.push('/appointment/my-appointments');
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Payment was processed but there was an error updating the appointment. Please contact support.');
      setIsBooking(false);
    }
  };
  
  // Send SMS notification for appointment
  const sendAppointmentNotification = async (appointmentId: string, doctorName: string, date: string, time: string) => {
    try {
      // Format the date for better readability
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Prepare notification data with comprehensive details
      const notificationData = {
        appointmentId,
        doctorName,
        doctorSpeciality: doctor.speciality,
        doctorDegree: doctor.degree || 'MD',
        date: formattedDate,
        time,
        fees: `₹${doctor.fees}`,
        location: doctor.address?.line1 || 'Hygieia Health Center',
        patientName,
        phoneNumber: patientPhone,
        confirmationCode: appointmentId.substring(0, 8).toUpperCase(),
        instructions: 'Please arrive 15 minutes before your appointment time. Bring your ID and insurance card.'
      };
      
      console.log('Sending notification with comprehensive data:', notificationData);
      
      // Compose the SMS message
      const message = `
        🏥 APPOINTMENT CONFIRMED 🏥
        
        Hello ${notificationData.patientName},
        
        Your appointment with Dr. ${notificationData.doctorName} (${notificationData.doctorSpeciality}) has been confirmed.
        
        📅 Date: ${notificationData.date}
        ⏰ Time: ${notificationData.time}
        💰 Fees: ${notificationData.fees}
        📍 Location: ${notificationData.location}
        
        Confirmation Code: ${notificationData.confirmationCode}
        
        ${notificationData.instructions}
        
        Thank you for choosing Hygieia Health!
      `;
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: notificationData.phoneNumber,
          message
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.warn('SMS notification was not sent:', result.error || result);
        return;
      }

      console.log('Appointment SMS notification sent:', result.messageId);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw, as this is not critical for the appointment booking flow
    }
  };
  
  const isValidUUID = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  
  // Show success animation using canvas-confetti
  const showSuccessAnimation = () => {
    // Create container for the animation
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.flexDirection = 'column';
    document.body.appendChild(container);
    
    // Create success message
    const message = document.createElement('div');
    message.textContent = 'Booking Successful!';
    message.style.color = '#ffffff';
    message.style.fontSize = '2.5rem';
    message.style.fontWeight = 'bold';
    message.style.marginBottom = '2rem';
    message.style.zIndex = '10000';
    message.style.opacity = '0';
    message.style.transition = 'opacity 0.5s ease-in';
    container.appendChild(message);
    
    // Show message after a short delay
    setTimeout(() => {
      message.style.opacity = '1';
    }, 500);
    
    // Create canvas element for confetti
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);
    
    // Initialize confetti with the canvas
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });
    
    // Define colors for confetti
    const colors = [
      '#ff0000', // Red
      '#00ff00', // Green
      '#0000ff', // Blue
      '#ffff00', // Yellow
      '#ff00ff', // Magenta
      '#00ffff'  // Cyan
    ];
    
    const end = Date.now() + 3000;
    
    // Center burst
    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      startVelocity: 30,
      gravity: 0.8,
      scalar: 1.2,
      ticks: 200
    });
    
    // Side bursts
    myConfetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors: colors
    });
    
    myConfetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors: colors
    });
    
    // Ribbon effect with interval
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      
      // Random shapes and colors
      myConfetti({
        particleCount: 10,
        angle: 60,
        spread: 55,
        origin: { x: Math.random() * 0.3, y: Math.random() * 0.5 + 0.4 },
        colors: colors,
        startVelocity: 45,
        scalar: 0.7,
        gravity: 0.6,
        drift: 0.5,
        ticks: 200
      });
      
      myConfetti({
        particleCount: 10,
        angle: 120,
        spread: 55,
        origin: { x: 0.7 + Math.random() * 0.3, y: Math.random() * 0.5 + 0.4 },
        colors: colors,
        startVelocity: 45,
        scalar: 0.7,
        gravity: 0.6,
        drift: -0.5,
        ticks: 200
      });
    }, 250);
    
    // Remove container after animation completes
    setTimeout(() => {
      clearInterval(interval);
      document.body.removeChild(container);
    }, 3000);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-full flex justify-start mb-4">
              <Link href="/appointment/doctors">
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <FaArrowLeft className="text-lg" />
                </motion.button>
              </Link>
            </div>
            <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
              Book Appointment
            </motion.h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Doctor Info */}
            <motion.div
              variants={itemVariants}
              className="glass rounded-xl p-8 backdrop-blur-md bg-black/30 border border-white/10 shadow-xl"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 30%, rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.1) 0%, transparent 70%)`,
                boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 20px ${themeColor}30`
              }}
            >
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-xl mb-6">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name} 
                    fill 
                    className="object-cover"
                    priority
                  />
                  {/* Specialty icon overlay */}
                  <div className="absolute bottom-0 right-0 bg-white/30 backdrop-blur-md p-2 rounded-full shadow-lg border border-white/30">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {doctor.speciality === 'Cardiology' && <span className="text-red-500 text-xl">❤️</span>}
                      {doctor.speciality === 'Neurology' && <span className="text-yellow-500 text-xl">🧠</span>}
                      {doctor.speciality === 'Pulmonology' && <span className="text-blue-500 text-xl">🫁</span>}
                      {doctor.speciality === 'Orthopedics' && <span className="text-purple-500 text-xl">🦴</span>}
                      {doctor.speciality === 'Ophthalmology' && <span className="text-blue-400 text-xl">👁️</span>}
                      {doctor.speciality === 'Pediatrics' && <span className="text-green-400 text-xl">👶</span>}
                      {doctor.speciality === 'Dentistry' && <span className="text-white text-xl">🦷</span>}
                      {doctor.speciality === 'Dermatology' && <span className="text-pink-300 text-xl">🧬</span>}
                      {!['Cardiology', 'Neurology', 'Pulmonology', 'Orthopedics', 'Ophthalmology', 'Pediatrics', 'Dentistry', 'Dermatology'].includes(doctor.speciality) && <span className="text-white text-xl">👨‍⚕️</span>}
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{doctor.name}</h2>
                <div className="px-3 py-1 rounded-full bg-white/10 text-white mb-2">{doctor.speciality}</div>
                <p className="text-white/70 mb-5 text-center">{doctor.degree}</p>
                
                <div className="w-full border-t border-white/10 pt-5 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/70 flex items-center"><span className="mr-2">⏱️</span>Experience:</span>
                    <span className="text-white font-medium">{doctor.experience}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70 flex items-center"><span className="mr-2">💰</span>Fees:</span>
                    <span className="text-white font-medium flex items-center bg-white/10 px-3 py-1 rounded-full">
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
              className="glass rounded-xl p-8 backdrop-blur-md bg-black/30 border border-white/10 shadow-xl md:col-span-2"
              style={{
                backgroundImage: `radial-gradient(circle at 70% 30%, rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.1) 0%, transparent 70%)`,
                boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 20px ${themeColor}30`
              }}
            >
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                <FaCalendar className="mr-3 text-white/80" />
                Select Date & Time
              </h3>

              {/* Patient Details */}
              <div className="mb-10">
                <h4 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full mr-2"></span>
                  Patient Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    placeholder="Patient name"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(event) => setPatientEmail(event.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    placeholder="Phone with country code"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>
              
              {/* Date Selection */}
              <div className="mb-10">
                <h4 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full mr-2"></span>
                  Available Dates
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                  {dates.map((date) => (
                    <button
                      key={date.date}
                      onClick={() => handleDateSelect(date.date)}
                      className={`p-4 rounded-xl flex flex-col items-center transition-all duration-300 ${
                        selectedDate === date.date 
                          ? `bg-white text-gray-900 shadow-lg transform scale-105` 
                          : 'bg-white/10 text-white hover:bg-white/20 hover:scale-102'
                      }`}
                    >
                      <span className="text-xs font-medium">{date.day}</span>
                      <span className="text-lg font-bold">{date.dayOfMonth}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Selection */}
              <div className="mb-10">
                <h4 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 bg-white/50 rounded-full mr-2"></span>
                  <FaClock className="mr-2" />
                  Available Time Slots for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Selected Date'}
                </h4>
                {selectedDate ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          selectedTime === time 
                            ? `bg-white text-gray-900 shadow-lg transform scale-105 font-medium` 
                            : 'bg-white/10 text-white hover:bg-white/20 hover:scale-102'
                        }`}
                      >
                        <span className="block text-lg">{time}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-6 text-center text-white/60 border border-white/10 backdrop-blur-md">
                    <span className="block text-3xl mb-2">👆</span>
                    Please select a date first
                  </div>
                )}
              </div>
              
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
                  disabled={!selectedDate || !selectedTime || !patientName.trim() || !patientEmail.trim() || !patientPhone.trim() || isBooking}
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
