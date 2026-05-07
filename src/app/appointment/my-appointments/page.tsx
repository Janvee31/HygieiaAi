'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RazorpayPayment from '@/components/RazorpayPayment';
import { 
  FaCalendarCheck, FaUserMd, FaHistory, FaUserCircle, 
  FaRegCalendarAlt, FaCalendarAlt, FaClock, FaMapMarkerAlt, 
  FaMoneyBillWave, FaTimesCircle, FaCheck, FaInfoCircle 
} from 'react-icons/fa';

// Hardcoded mock data to use if Supabase fails
const mockAppointments = [
  {
    id: '1',
    doctor_id: '09905004-28aa-44c4-91b5-06f7095535cd',
    doctor_name: 'Dr. Sarah Johnson',
    doctor_speciality: 'Cardiology',
    doctor_image: 'https://randomuser.me/api/portraits/women/44.jpg',
    appointment_date: '2025-04-25',
    appointment_time: '10:30',
    fees: 1500,
    status: 'confirmed',
    created_at: '2025-04-21T10:15:00Z'
  },
  {
    id: '2',
    doctor_id: '09905004-28aa-44c4-91b5-06f7095535cd',
    doctor_name: 'Dr. Michael Chen',
    doctor_speciality: 'Neurology',
    doctor_image: 'https://randomuser.me/api/portraits/men/32.jpg',
    appointment_date: '2025-04-28',
    appointment_time: '14:00',
    fees: 1800,
    status: 'confirmed',
    created_at: '2025-04-20T15:30:00Z'
  }
];

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

// Interface for appointment data
interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_speciality: string;
  doctor_image: string;
  appointment_date: string;
  appointment_time: string;
  fees: number;
  status: string;
  payment?: boolean;
  cancelled?: boolean;
  created_at: string;
}

export default function MyAppointmentsPage() {
  const { themeColor } = useTheme();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [visibleAppointments, setVisibleAppointments] = useState(5);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState<string | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState('');
  const [newAppointmentTime, setNewAppointmentTime] = useState('');

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, []);

  // Check if user is logged in
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setUser(user);
      fetchAppointments(user.id);
    } else {
      // For demo purposes, we'll fetch all appointments
      fetchAllAppointments();
    }
  };

  const fetchAppointments = async (userId: string) => {
    setIsLoading(true);
    
    try {
      // Fetch appointments with doctor details using Supabase join
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id (*)
        `)
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true });
      
      if (error) throw error;
      
      if (appointmentsData && appointmentsData.length > 0) {
        // Transform the data to match the expected format
        const formattedAppointments = appointmentsData.map((appointment: any) => ({
          id: appointment.id,
          doctor_id: appointment.doctor_id,
          doctor_name: appointment.doctors?.name || 'Unknown Doctor',
          doctor_speciality: appointment.doctors?.speciality || 'Specialist',
          doctor_image: appointment.doctors?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          fees: appointment.doctors?.fees || 0,
          status: appointment.status,
          payment: appointment.payment,
          cancelled: appointment.cancelled,
          created_at: appointment.created_at
        }));
        
        setAppointments(formattedAppointments);
      } else {
        // No appointments found
        setAppointments([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
      setAppointments([]);
      setIsLoading(false);
    }
  };
  
  // Fetch all appointments for demo purposes
  const fetchAllAppointments = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching all appointments...');
      
      // Try an alternative approach - direct fetch from API
      try {
        console.log('Attempting to fetch appointments via API...');
        const response = await fetch('/api/appointments');
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response:', data);
          
          if (data.appointments && data.appointments.length > 0) {
            const formattedAppointments = data.appointments.map((appointment: any) => ({
              id: appointment.id,
              doctor_id: appointment.doctor_id,
              doctor_name: appointment.doctor_name || 'Doctor',
              doctor_speciality: appointment.doctor_speciality || 'Specialist',
              doctor_image: appointment.doctor_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              fees: appointment.fees || 1500,
              status: appointment.status || 'confirmed',
              payment: appointment.payment || false,
              cancelled: appointment.cancelled || false,
              created_at: appointment.created_at
            }));
            
            console.log('Setting appointments from API:', formattedAppointments.length);
            setAppointments(formattedAppointments);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error('API fetch failed:', apiError);
      }
      
      // Direct database query as fallback
      console.log('Falling back to direct database query...');
      
      // Use a direct SQL query to bypass RLS
      const { data: directData, error: directError } = await supabase.rpc('get_all_appointments');
      
      console.log('Direct RPC result:', directData);
      
      if (directError) {
        console.error('Direct RPC error:', directError);
        // Try one more approach - direct SQL query
        const { data: sqlData, error: sqlError } = await supabase.from('appointments').select('*');
        
        if (sqlError) {
          console.error('SQL query error:', sqlError);
          throw sqlError;
        }
        
        if (sqlData && sqlData.length > 0) {
          console.log('SQL query successful, found', sqlData.length, 'appointments');
          
          // Get doctor details separately
          const doctorIds = [...new Set(sqlData.map((a: any) => a.doctor_id))];
          const { data: doctorsData } = await supabase.from('doctors').select('*').in('id', doctorIds);
          
          const doctorsMap = (doctorsData || []).reduce((map: any, doctor: any) => {
            map[doctor.id] = doctor;
            return map;
          }, {});
          
          const formattedAppointments = sqlData.map((appointment: any) => {
            const doctor = doctorsMap[appointment.doctor_id] || {};
            return {
              id: appointment.id,
              doctor_id: appointment.doctor_id,
              doctor_name: doctor.name || 'Doctor',
              doctor_speciality: doctor.speciality || 'Specialist',
              doctor_image: doctor.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              fees: doctor.fees || 1500,
              status: appointment.status || 'confirmed',
              payment: appointment.payment || false,
              cancelled: appointment.cancelled || false,
              created_at: appointment.created_at
            };
          });
          
          setAppointments(formattedAppointments);
          setIsLoading(false);
          return;
        }
      } else if (directData && directData.length > 0) {
        console.log('Direct RPC successful, found', directData.length, 'appointments');
        
        const formattedAppointments = directData.map((appointment: any) => ({
          id: appointment.id,
          doctor_id: appointment.doctor_id,
          doctor_name: appointment.doctor_name || 'Doctor',
          doctor_speciality: appointment.doctor_speciality || 'Specialist',
          doctor_image: appointment.doctor_image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          fees: appointment.fees || 1500,
          status: appointment.status || 'confirmed',
          payment: appointment.payment || false,
          cancelled: appointment.cancelled || false,
          created_at: appointment.created_at
        }));
        
        setAppointments(formattedAppointments);
        setIsLoading(false);
        return;
      }
      
      // If all else fails, use mock data for demo purposes
      console.log('All database approaches failed, using mock data');
      setAppointments(mockAppointments);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      toast.error('Failed to load appointments');
      console.log('Using mock data as fallback');
      setAppointments(mockAppointments);
      setIsLoading(false);
    }
  };
  
  // Show more appointments
  const handleShowMore = () => {
    setVisibleAppointments(prev => prev + 5);
  };

  // Initiate appointment cancellation
  const initiateCancelAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    setShowRefundDialog(true);
  };

  // Close refund dialog
  const closeRefundDialog = () => {
    setShowRefundDialog(false);
    setSelectedAppointment(null);
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    try {
      // Use the new API endpoint without dynamic route parameters
      try {
        const response = await fetch('/api/appointment-cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appointmentId })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to cancel appointment');
        }
      } catch (apiError) {
        console.warn('API endpoint not available, falling back to direct DB update:', apiError);
        // Fallback to direct DB update if API is not available
        const { error } = await supabase
          .from('appointments')
          .update({ cancelled: true, status: 'cancelled' })
          .eq('id', appointmentId);
        
        if (error) throw error;
      }
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, cancelled: true, status: 'cancelled' } : app
      ));
      
      toast.success('Appointment cancelled successfully');
      setShowRefundDialog(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  // Initiate appointment reschedule
  const initiateReschedule = (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (appointment) {
      setRescheduleMode(appointmentId);
      setNewAppointmentDate(appointment.appointment_date);
      setNewAppointmentTime(appointment.appointment_time);
    }
  };

  // Cancel reschedule mode
  const cancelReschedule = () => {
    setRescheduleMode(null);
    setNewAppointmentDate('');
    setNewAppointmentTime('');
  };

  // Reschedule appointment
  const rescheduleAppointment = async (appointmentId: string) => {
    try {
      if (!newAppointmentDate || !newAppointmentTime) {
        toast.error('Please select a new date and time');
        return;
      }

      // Update appointment date and time
      const { error } = await supabase
        .from('appointments')
        .update({ 
          appointment_date: newAppointmentDate, 
          appointment_time: newAppointmentTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (error) throw error;
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { 
          ...app, 
          appointment_date: newAppointmentDate, 
          appointment_time: newAppointmentTime 
        } : app
      ));
      
      toast.success('Appointment rescheduled successfully');
      setRescheduleMode(null);
      setNewAppointmentDate('');
      setNewAppointmentTime('');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
    }
  };
  
  // Handle payment success
  const handlePaymentSuccess = (appointmentId: string) => {
    // Update local state
    setAppointments(appointments.map(app => 
      app.id === appointmentId ? { ...app, payment: true } : app
    ));
    setSelectedAppointment(null);
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen text-white p-6">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">
              My Appointments
            </motion.h1>
            
            <motion.div variants={itemVariants}>
              <Link 
                href="/appointment/doctors" 
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <FaCalendarCheck className="w-5 h-5" />
                Book New Appointment
              </Link>
            </motion.div>
          </div>

          {/* Glass-morphic Refund Dialog */}
          <AnimatePresence>
            {showRefundDialog && (
              <motion.div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => closeRefundDialog()}
              >
                <motion.div 
                  className="relative w-full max-w-md p-8 mx-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <FaMoneyBillWave className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-white">Refund Initiated</h3>
                    <p className="mb-6 text-gray-300">
                      Your appointment will be cancelled and a refund will be processed. The amount will be credited to your bank account within 5-7 business days.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => closeRefundDialog()}
                        className="px-6 py-2 text-white transition-all duration-300 border border-white/20 rounded-full hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => selectedAppointment && cancelAppointment(selectedAppointment)}
                        className="px-6 py-2 text-white transition-all duration-300 bg-gradient-to-r from-red-600 to-red-400 rounded-full hover:shadow-lg hover:shadow-red-500/30"
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-t-4 rounded-full border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : appointments.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="p-8 text-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20">
                <FaRegCalendarAlt className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No Appointments Found</h3>
              <p className="mb-6 text-gray-400">You don't have any appointments scheduled yet.</p>
              <Link 
                href="/appointment/doctors"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                <FaCalendarCheck className="w-5 h-5" />
                Book an Appointment
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {appointments.slice(0, visibleAppointments).map((appointment) => (
                <motion.div 
                  key={appointment.id}
                  variants={itemVariants}
                  className={`p-6 rounded-xl backdrop-blur-sm border ${appointment.cancelled ? 'bg-red-900/10 border-red-500/30' : 'bg-white/5 border-white/10'} transition-all duration-300 hover:bg-white/10`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 overflow-hidden rounded-full">
                        <Image 
                          src={appointment.doctor_image} 
                          alt={appointment.doctor_name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{appointment.doctor_name}</h3>
                        <p className="text-sm text-gray-400">{appointment.doctor_speciality}</p>
                      </div>
                    </div>
                    
                    {rescheduleMode === appointment.id ? (
                      <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">New Date</label>
                            <input 
                              type="date" 
                              value={newAppointmentDate}
                              onChange={(e) => setNewAppointmentDate(e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-400">New Time</label>
                            <select
                              value={newAppointmentTime}
                              onChange={(e) => setNewAppointmentTime(e.target.value)}
                              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Time</option>
                              <option value="09:00">09:00 AM</option>
                              <option value="09:30">09:30 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="10:30">10:30 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="11:30">11:30 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="12:30">12:30 PM</option>
                              <option value="14:00">02:00 PM</option>
                              <option value="14:30">02:30 PM</option>
                              <option value="15:00">03:00 PM</option>
                              <option value="15:30">03:30 PM</option>
                              <option value="16:00">04:00 PM</option>
                              <option value="16:30">04:30 PM</option>
                              <option value="17:00">05:00 PM</option>
                              <option value="17:30">05:30 PM</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                          <button 
                            onClick={() => cancelReschedule()}
                            className="px-4 py-1.5 text-sm border border-white/10 rounded-lg hover:bg-white/5"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => rescheduleAppointment(appointment.id)}
                            className="px-4 py-1.5 text-sm bg-blue-500 rounded-lg hover:bg-blue-600"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-4 md:gap-6">
                          <div className="flex items-center gap-2">
                            <FaRegCalendarAlt className="text-blue-400" />
                            <span>{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-green-400" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-yellow-400" />
                            <span>₹{appointment.fees}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {appointment.cancelled ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-400 bg-red-400/10 rounded-full">
                              <FaTimesCircle />
                              Cancelled
                            </span>
                          ) : appointment.payment ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-400 bg-green-400/10 rounded-full">
                                <FaCheck />
                                Confirmed
                              </span>
                              <button 
                                onClick={() => initiateReschedule(appointment.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-400 bg-transparent border border-blue-400/30 rounded-full hover:bg-blue-400/10 transition-colors"
                              >
                                <FaCalendarAlt />
                                Reschedule
                              </button>
                              <button 
                                onClick={() => initiateCancelAppointment(appointment.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-400 bg-transparent border border-red-400/30 rounded-full hover:bg-red-400/10 transition-colors"
                              >
                                <FaTimesCircle />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm text-yellow-400 bg-yellow-400/10 rounded-full">
                                <FaInfoCircle />
                                Payment Pending
                              </span>
                              <button 
                                onClick={() => setSelectedAppointment(appointment.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-green-400 bg-transparent border border-green-400/30 rounded-full hover:bg-green-400/10 transition-colors"
                              >
                                <FaMoneyBillWave />
                                Pay Now
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {selectedAppointment === appointment.id && !appointment.payment && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                      <RazorpayPayment 
                        appointmentId={appointment.id}
                        amount={appointment.fees}
                        currency="INR"
                        userEmail={user?.email || 'user@example.com'}
                        userName={user?.user_metadata?.full_name || 'User'}
                        userPhone={user?.user_metadata?.phone || '9999999999'}
                        onSuccess={() => handlePaymentSuccess(appointment.id)}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Show More Button */}
              {appointments.length > visibleAppointments && (
                <motion.div 
                  variants={itemVariants}
                  className="flex justify-center mt-4"
                >
                  <button
                    onClick={handleShowMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                  >
                    Show More
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
}
