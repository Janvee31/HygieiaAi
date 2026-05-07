'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { FaArrowRight } from 'react-icons/fa';
import AppHeader from '@/components/AppHeader';
import DoctorsList from '@/components/DoctorsList';
import { FaCalendarCheck, FaUserMd, FaHistory, FaUserCircle } from 'react-icons/fa';

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

// Speciality data
const specialities = [
  { id: 1, name: 'Cardiology', image: '/images/heart.jpg' },
  { id: 2, name: 'Neurology', image: '/images/parkinson.jpg' },
  { id: 3, name: 'Pulmonology', image: '/images/lung.png' },
  { id: 4, name: 'Endocrinology', image: '/images/diabetes.jpg' },
  { id: 5, name: 'Gastroenterology', image: '/images/liver.jpg' },
  { id: 6, name: 'Oncology', image: '/images/breast.webp' },
];

// Mock doctor data
const doctors = [
  {
    id: 1,
    name: 'Dr. Sarah Johnson',
    speciality: 'Cardiology',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    experience: '10+ years',
    available: true,
    fees: 1500,
    about: 'Dr. Sarah Johnson is a board-certified cardiologist with over 10 years of experience in treating heart conditions. She specializes in preventive cardiology and heart failure management.'
  },
  {
    id: 2,
    name: 'Dr. Michael Chen',
    speciality: 'Neurology',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    experience: '15+ years',
    available: true,
    fees: 1800,
    about: 'Dr. Michael Chen is a renowned neurologist specializing in movement disorders and neurodegenerative diseases. He has published numerous research papers on Parkinson\'s disease.'
  },
  {
    id: 3,
    name: 'Dr. Emily Rodriguez',
    speciality: 'Pulmonology',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    experience: '8+ years',
    available: false,
    fees: 1300,
    about: 'Dr. Emily Rodriguez is a pulmonologist with expertise in respiratory disorders, sleep medicine, and critical care. She is passionate about improving the quality of life for patients with chronic lung conditions.'
  },
  {
    id: 4,
    name: 'Dr. James Wilson',
    speciality: 'Endocrinology',
    image: 'https://randomuser.me/api/portraits/men/52.jpg',
    experience: '12+ years',
    available: true,
    fees: 1600,
    about: 'Dr. James Wilson is an endocrinologist specializing in diabetes management, thyroid disorders, and metabolic conditions. He takes a holistic approach to patient care, focusing on lifestyle modifications alongside medical treatments.'
  },
];

export default function AppointmentPage() {
  const { themeColor } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div 
        className="py-8 px-4 sm:px-6 lg:px-8 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${themeColor}60 0%, ${darkenColor(themeColor, 40)} 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white text-2xl font-bold">Appointments</Link>
            <div className="flex space-x-8">
              <Link href="/appointment" className="text-white hover:text-white/80 transition-colors">
                <FaCalendarCheck className="w-6 h-6" />
              </Link>
              <Link href="/appointment/doctors" className="text-white hover:text-white/80 transition-colors">
                <FaUserMd className="w-6 h-6" />
              </Link>
              <Link href="/appointment/my-appointments" className="text-white hover:text-white/80 transition-colors">
                <FaHistory className="w-6 h-6" />
              </Link>
              <Link href="/appointment/profile" className="text-white hover:text-white/80 transition-colors">
                <FaUserCircle className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Find by Speciality */}
          <motion.div variants={itemVariants} className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-2">Find by Speciality</h2>
            <p className="text-white/70 text-center max-w-2xl mx-auto mb-8">
              Browse through our extensive list of medical specialities to find the right doctor for your needs.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
              {specialities.map((speciality) => (
                <Link 
                  key={speciality.id}
                  href={`/appointment/doctors?speciality=${speciality.name}`}
                  className="flex flex-col items-center group"
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-3 group-hover:ring-2 ring-offset-2 ring-offset-gray-900 ring-white/30 transition-all duration-300">
                    <Image
                      src={speciality.image}
                      alt={speciality.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-white text-sm font-medium">{speciality.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Top Doctors */}
          <section className="mt-16 mb-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Top Doctors</h2>
            <p className="text-white/80 mb-8">Book appointments with our highly qualified and experienced doctors.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Doctor cards will be dynamically loaded from Supabase */}
              <DoctorsList limit={4} />          
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/appointment/doctors" 
                className="inline-flex items-center px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(45deg, ${themeColor}, ${darkenColor(themeColor, 0.2)})`,
                  boxShadow: `0 4px 15px -2px ${themeColor}40`
                }}
              >
                View All Doctors
                <FaArrowRight className="ml-2" />
              </Link>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
