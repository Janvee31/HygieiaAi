'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    speciality: string;
    image: string;
    experience: string;
    available: boolean;
    fees: number;
    rating: number;
    about?: string;
  };
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const { themeColor } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className="bg-white/5 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex flex-col h-full"
    >
      {/* Doctor Image Section - 60% of card height */}
      <div className="relative" style={{ height: '220px' }}>
        {doctor.image ? (
          <div className="relative w-full h-full">
            <Image 
              src={doctor.image} 
              alt={doctor.name} 
              fill
              className="object-cover object-center object-top"
              sizes="(max-width: 798px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            {/* Specialty icon overlay */}
            <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md p-3 rounded-full shadow-lg border border-white/40 z-10">
              <div className="w-8 h-8 flex items-center justify-center">
                {doctor.speciality === 'Cardiology' && <span className="text-red-500 text-2xl">❤️</span>}
                {doctor.speciality === 'Neurology' && <span className="text-yellow-500 text-2xl">🧠</span>}
                {doctor.speciality === 'Pulmonology' && <span className="text-blue-500 text-2xl">🫁</span>}
                {doctor.speciality === 'Orthopedics' && <span className="text-purple-500 text-2xl">🦴</span>}
                {doctor.speciality === 'Ophthalmology' && <span className="text-blue-400 text-2xl">👁️</span>}
                {doctor.speciality === 'Pediatrics' && <span className="text-green-400 text-2xl">👶</span>}
                {doctor.speciality === 'Dentistry' && <span className="text-white text-2xl">🦷</span>}
                {doctor.speciality === 'Dermatology' && <span className="text-pink-300 text-2xl">🧬</span>}
                {!['Cardiology', 'Neurology', 'Pulmonology', 'Orthopedics', 'Ophthalmology', 'Pediatrics', 'Dentistry', 'Dermatology'].includes(doctor.speciality) && <span className="text-white text-2xl">👨‍⚕️</span>}
              </div>
            </div>
            
            {/* Doctor's name overlay at bottom of image */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent pt-10 z-10">
              <p className="text-white text-lg font-medium">{doctor.name}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-white/50">No image</p>
          </div>
        )}
      </div>
      
      {/* Doctor Info Section - 40% of card height */}
      <div className="p-4 flex flex-col justify-between flex-grow bg-white/5">
        {/* Doctor Details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-primary text-base font-medium">{doctor.speciality}</p>
            <div className="flex items-center bg-white/10 px-2 py-1 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${doctor.available ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></div>
              <span className={`${doctor.available ? 'text-green-400' : 'text-red-400'} text-xs font-medium`}>
                {doctor.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-white/80 text-sm">{doctor.experience}</span>
            </div>
            <div className="flex items-center bg-white/10 px-2 py-1 rounded-full">
              <span className="text-white font-medium text-sm">₹{doctor.fees}</span>
              {doctor.rating && (
                <div className="ml-2 flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="text-white/90 text-xs">{doctor.rating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Book Appointment Button */}
        <div className="mt-2">
          {doctor.available ? (
            <Link 
              href={`/appointment/book/${doctor.id}`} 
              className="px-4 py-2.5 rounded-lg text-white text-sm font-medium w-full block text-center transition-all hover:shadow-lg" 
              style={{ backgroundColor: themeColor }}
            >
              Book Appointment
            </Link>
          ) : (
            <span className="px-4 py-2.5 rounded-lg text-white text-sm font-medium bg-gray-600 cursor-not-allowed w-full block text-center">
              Not Available
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
