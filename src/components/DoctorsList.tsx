'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { FaSpinner } from 'react-icons/fa';

interface Doctor {
  id: string;
  name: string;
  speciality: string;
  image: string;
  experience: string;
  available: boolean;
  fees: number;
  about?: string;
}

interface DoctorsListProps {
  limit?: number;
  speciality?: string;
}

export default function DoctorsList({ limit, speciality }: DoctorsListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { themeColor } = useTheme();

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        
        // Build the URL with query parameters
        let url = '/api/doctors';
        const params = new URLSearchParams();
        
        if (speciality && speciality !== 'All Specialities') {
          params.append('speciality', speciality);
        }
        
        if (limit) {
          params.append('limit', limit.toString());
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        // Fetch doctors from the API endpoint
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch doctors: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setDoctors(result.doctors || []);
        } else {
          console.error('API error:', result.error);
          setDoctors([]);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDoctors();
  }, [limit, speciality]);

  if (loading) {
    return (
      <div className="col-span-full flex justify-center items-center py-12">
        <FaSpinner className="text-white text-2xl animate-spin" />
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="col-span-full bg-white/5 backdrop-blur-md rounded-xl p-8 text-center">
        <p className="text-white/80 mb-4">No doctors available at the moment.</p>
        <Link 
          href="/appointment/doctors/add" 
          className="inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: themeColor }}
        >
          Add a Doctor
        </Link>
      </div>
    );
  }

  return (
    <>
      {doctors.map((doctor) => (
        <motion.div
          key={doctor.id}
          className="bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 m-2 flex flex-col h-[440px]" /* Reduced height to match Top Doctors */
          whileHover={{ y: -5, transition: { duration: 0.3 } }}
        >
          <div className="relative overflow-hidden" style={{ paddingTop: '100%' }}> {/* Square aspect ratio for better face visibility */}
            {doctor.image ? (
              <div className="absolute inset-0 p-3">
                <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name} 
                    fill
                    className="object-cover object-center object-top" /* Added object-top to prevent cutting off heads */
                    sizes="(max-width: 798px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                  {/* Gradient overlay for better text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Specialty icon overlay */}
                  <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm p-2 rounded-full">
                    <div className="w-6 h-6 flex items-center justify-center">
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
                  
                  {/* Doctor's name overlay at bottom of image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pt-10">
                    <p className="text-white text-base font-medium">{doctor.name}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <p className="text-white/50">No image</p>
              </div>
            )}
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className={`${doctor.available ? 'text-green-400' : 'text-red-400'} text-xs font-medium`}>
                {doctor.available ? 'Available Now' : 'Not Available'}
              </span>
            </div>
            <p className="text-primary text-sm mb-1">{doctor.speciality}</p>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-white/60 text-xs">{doctor.experience}</span>
              <span className="text-white/20">•</span>
              <span className="text-white font-medium">₹{doctor.fees}</span>
              {doctor.available && (
                <span className="ml-1">
                  <span className="text-yellow-500">★</span>
                </span>
              )}
            </div>
            <p className="text-white/60 text-xs mb-3 line-clamp-1">{doctor.about || 'Specialist doctor with excellent patient care'}</p>
            {doctor.available ? (
              <Link 
                href={`/appointment/book/${doctor.id}`} 
                className="px-6 py-2 rounded-lg text-white text-sm font-medium w-full block text-center" 
                style={{ backgroundColor: themeColor }}
              >
                Book Appointment
              </Link>
            ) : (
              <span className="px-6 py-2 rounded-lg text-white text-sm font-medium bg-gray-600 cursor-not-allowed w-full block text-center">
                Book Appointment
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </>
  );
}
