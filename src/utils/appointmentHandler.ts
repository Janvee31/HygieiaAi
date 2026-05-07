/**
 * Utility for handling appointment booking requests and automating the flow
 */

import { supabase } from './supabase';

/**
 * Interface for appointment details
 */
export interface AppointmentDetails {
  doctorName: string;
  doctorId?: string;
  date: string;
  time: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  reason?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

/**
 * Extract appointment details from user input
 * @param input The user's message text
 * @returns Object containing appointment details if found
 */
export const extractAppointmentDetails = (input: string): AppointmentDetails | null => {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase();
  
  // Check if this is an appointment request
  if (!lowerInput.includes('appointment') && 
      !lowerInput.includes('book') && 
      !lowerInput.includes('schedule') && 
      !lowerInput.includes('see a doctor') &&
      !lowerInput.includes('dr.') &&
      !lowerInput.includes('doctor')) {
    return null;
  }
  
  // Extract doctor name
  let doctorName = '';
  const drRegex = /dr\.?\s+([a-z\s]+)/i;
  const doctorRegex = /doctor\s+([a-z\s]+)/i;
  
  const drMatch = input.match(drRegex);
  const doctorMatch = input.match(doctorRegex);
  
  if (drMatch && drMatch[1]) {
    doctorName = drMatch[1].trim();
  } else if (doctorMatch && doctorMatch[1]) {
    doctorName = doctorMatch[1].trim();
  }
  
  // Extract date
  let date = '';
  const dateRegex = /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.]?(\d{2,4})?)/i;
  const dateMatch = input.match(dateRegex);
  
  if (dateMatch) {
    if (dateMatch[1].toLowerCase() === 'today') {
      const today = new Date();
      date = today.toISOString().split('T')[0];
    } else if (dateMatch[1].toLowerCase() === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateMatch[1].toLowerCase())) {
      // Find the next occurrence of the day
      const today = new Date();
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dateMatch[1].toLowerCase());
      const daysToAdd = (dayOfWeek + 7 - today.getDay()) % 7 || 7; // If today, then next week
      
      const nextDay = new Date();
      nextDay.setDate(today.getDate() + daysToAdd);
      date = nextDay.toISOString().split('T')[0];
    } else if (dateMatch[2] && dateMatch[3]) {
      // Handle DD/MM/YYYY format
      const day = dateMatch[2];
      const month = dateMatch[3];
      const year = dateMatch[4] || new Date().getFullYear().toString();
      
      // Adjust for 2-digit year
      const fullYear = year.length === 2 ? `20${year}` : year;
      
      // Format as YYYY-MM-DD
      date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Extract time
  let time = '';
  const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
  const timeMatch = input.match(timeRegex);
  
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] || '00';
    const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    // Adjust hours for AM/PM
    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    time = `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Return the extracted details
  return {
    doctorName,
    date,
    time
  };
};

/**
 * Find a doctor by name in the database
 * @param name The doctor's name (partial match)
 * @returns The doctor's information if found
 */
export const findDoctorByName = async (name: string): Promise<any | null> => {
  try {
    if (!name) return null;
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1);
    
    if (error) {
      console.error('Error finding doctor:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in findDoctorByName:', error);
    return null;
  }
};

/**
 * Check if a doctor is available at the specified time
 * @param doctorId The doctor's ID
 * @param date The appointment date
 * @param time The appointment time
 * @returns Whether the doctor is available
 */
export const checkDoctorAvailability = async (
  doctorId: string,
  date: string,
  time: string
): Promise<boolean> => {
  try {
    // Get the doctor's booked slots
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('slots_booked')
      .eq('id', doctorId)
      .single();
    
    if (error || !doctor) {
      console.error('Error checking doctor availability:', error);
      return false;
    }
    
    // Check if the slot is already booked
    const slotsBooked = doctor.slots_booked || {};
    const dateKey = date.replace(/-/g, '');
    
    if (slotsBooked[dateKey] && slotsBooked[dateKey].includes(time)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in checkDoctorAvailability:', error);
    return false;
  }
};

/**
 * Create a booking URL with pre-filled information
 * @param details The appointment details
 * @returns The URL for the booking page
 */
export const createBookingUrl = (details: AppointmentDetails): string => {
  const params = new URLSearchParams();
  
  if (details.doctorId) params.append('doctorId', details.doctorId);
  if (details.doctorName) params.append('doctorName', details.doctorName);
  if (details.date) params.append('date', details.date);
  if (details.time) params.append('time', details.time);
  
  return `/book-appointment?${params.toString()}`;
};

/**
 * Process an appointment request and generate a response
 * @param input The user's message text
 * @returns Object containing the response and booking URL if applicable
 */
export const processAppointmentRequest = async (input: string): Promise<{
  response: string;
  bookingUrl?: string;
  appointmentDetails?: AppointmentDetails;
}> => {
  try {
    // Extract appointment details
    const details = extractAppointmentDetails(input);
    
    if (!details || !details.doctorName) {
      return {
        response: "I'd be happy to help you book an appointment. Could you please provide the doctor's name, preferred date, and time?"
      };
    }
    
    // Find the doctor in the database
    const doctor = await findDoctorByName(details.doctorName);
    
    if (!doctor) {
      return {
        response: `I couldn't find Dr. ${details.doctorName} in our system. Could you please check the spelling or provide a different doctor's name?`,
        appointmentDetails: details
      };
    }
    
    // Update details with doctor ID
    details.doctorId = doctor.id;
    details.doctorName = doctor.name; // Use the full name from the database
    
    // Check if date and time are provided
    if (!details.date || !details.time) {
      return {
        response: `I found Dr. ${doctor.name} (${doctor.speciality}). Could you please specify your preferred date and time for the appointment?`,
        appointmentDetails: details
      };
    }
    
    // Check doctor availability
    const isAvailable = await checkDoctorAvailability(doctor.id, details.date, details.time);
    
    if (!isAvailable) {
      return {
        response: `I'm sorry, but Dr. ${doctor.name} is not available on ${details.date} at ${details.time}. Would you like to try a different time or date?`,
        appointmentDetails: details
      };
    }
    
    // Create booking URL
    const bookingUrl = createBookingUrl(details);
    
    // Generate response
    const response = `Great! I've found an available slot with Dr. ${doctor.name} (${doctor.speciality}) on ${details.date} at ${details.time}. The consultation fee is ${doctor.fees}. I've prepared the booking form for you. Would you like to proceed with the appointment?`;
    
    return {
      response,
      bookingUrl,
      appointmentDetails: details
    };
  } catch (error) {
    console.error('Error processing appointment request:', error);
    return {
      response: "I'm sorry, but I encountered an error while processing your appointment request. Please try again or contact our support team for assistance."
    };
  }
};
