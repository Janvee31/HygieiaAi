'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaSearch, FaStar, FaFilter, FaPlus, FaUserMd, FaArrowLeft } from 'react-icons/fa';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/utils/supabase';
import DoctorCard from '@/components/DoctorCard';
import SpecialtyIcon from '@/components/SpecialtyIcon';
import ThemeSelector from '@/components/ThemeSelector';

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

// Empty array for doctors - data will come from Supabase
const allDoctors: any[] = [];

// Speciality options
const specialities = [
  'All Specialities',
  'Cardiology',
  'Neurology',
  'Pulmonology',
  'Endocrinology',
  'Gastroenterology',
  'Oncology',
  'Orthopedics',
  'Ophthalmology',
  'Pediatrics',
  'Dentistry',
  'Dermatology'
];

export default function DoctorsPage() {
  const { themeColor } = useTheme();
  const searchParams = useSearchParams();
  const specialityParam = searchParams?.get('speciality');
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>(specialityParam || 'All Specialities');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [mounted, setMounted] = useState(false);
  const [animateSpecialties, setAnimateSpecialties] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDoctors();
    
    // Animate specialties after a short delay
    const timer = setTimeout(() => {
      setAnimateSpecialties(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      applyFilters();
    }
  }, [doctors, selectedSpeciality, searchQuery, availableOnly, sortBy]);

  const fetchDoctors = async () => {
    setIsLoading(true);
    
    try {
      // Fetch doctors from API endpoint
      const response = await fetch('/api/doctors');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch doctors: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.doctors && result.doctors.length > 0) {
        setDoctors(result.doctors);
      } else {
        // No doctors found - show empty state
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...doctors];
    
    // Filter by speciality
    if (selectedSpeciality !== 'All Specialities') {
      filtered = filtered.filter(doctor => doctor.speciality === selectedSpeciality);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(query) || 
        doctor.speciality.toLowerCase().includes(query)
      );
    }
    
    // Filter by availability
    if (availableOnly) {
      filtered = filtered.filter(doctor => doctor.available);
    }
    
    // Sort results
    if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'fees_low') {
      filtered.sort((a, b) => a.fees - b.fees);
    } else if (sortBy === 'fees_high') {
      filtered.sort((a, b) => b.fees - a.fees);
    } else if (sortBy === 'experience') {
      filtered.sort((a, b) => {
        const aYears = parseInt(a.experience.split('+')[0]);
        const bYears = parseInt(b.experience.split('+')[0]);
        return bYears - aYears;
      });
    }
    
    setFilteredDoctors(filtered);
  };

  const handleSpecialityChange = (speciality: string) => {
    setSelectedSpeciality(speciality);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Link href="/appointment">
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mr-4 flex items-center justify-center p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  style={{
                    boxShadow: `0 4px 10px ${themeColor}30`
                  }}
                >
                  <FaArrowLeft className="text-lg" />
                </motion.button>
              </Link>
              <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white">
                Find Doctors
              </motion.h1>
            </div>
            <Link href="/appointment/doctors/add">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 10px 15px -3px ${themeColor}30, 0 4px 6px -2px ${themeColor}20` }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: `linear-gradient(135deg, ${themeColor}CC, ${themeColor})`,
                  color: 'white'
                }}
              >
                <FaPlus />
                Add New Doctor
              </motion.button>
            </Link>
          </div>

          {/* Search and Filters */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Search doctors by name or speciality"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full py-3 pl-12 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={toggleFilters}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
              >
                <FaFilter />
                Filters
              </button>
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
              >
                <option value="rating">Top Rated</option>
                <option value="fees_low">Fees: Low to High</option>
                <option value="fees_high">Fees: High to Low</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
            
            {/* Expanded Filters */}
            {showFilters && (
              <div className="glass rounded-xl p-6 mb-6 animate-fadeIn">
                <h3 className="text-white font-semibold mb-4">Additional Filters</h3>
                
                <div className="flex flex-wrap gap-4">
                  {/* Available Only Toggle */}
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={availableOnly}
                          onChange={() => setAvailableOnly(!availableOnly)}
                        />
                        <div className="w-10 h-6 bg-white/20 rounded-full shadow-inner"></div>
                        <div
                          className={`absolute w-4 h-4 rounded-full transition-transform ${
                            availableOnly ? 'transform translate-x-5 bg-white' : 'bg-gray-400'
                          }`}
                          style={{ top: '0.25rem', left: '0.25rem' }}
                        ></div>
                      </div>
                      <span className="ml-3 text-white">Available Doctors Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Speciality Icons */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">Find by Speciality</h3>
              <div className="flex overflow-x-auto space-x-4 py-2 mb-2 no-scrollbar">
                <AnimatePresence>
                  {specialities.map((speciality, index) => (
                    <motion.div
                      key={speciality}
                      initial={{ opacity: 0, y: 20 }}
                      animate={animateSpecialties ? { 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: index * 0.05 }
                      } : {}}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ y: -5 }}
                      className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]"
                      onClick={() => handleSpecialityChange(speciality)}
                    >
                      <SpecialtyIcon 
                        specialty={speciality === 'All Specialities' ? '' : speciality} 
                        isActive={selectedSpeciality === speciality}
                        size={20}
                      />
                      <span className={`text-xs whitespace-nowrap ${selectedSpeciality === speciality ? 'text-white font-semibold' : 'text-white/70'}`}>
                        {speciality}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Doctors List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-t-white border-r-white/50 border-b-white/20 border-l-white/50"
              />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <motion.div 
              variants={itemVariants}
              className="glass rounded-xl p-12 text-center"
            >
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white/10"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FaUserMd className="w-10 h-10 text-white/50" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">No Doctors Found</h2>
              <p className="text-white/70 mb-6">Try adjusting your filters or search criteria.</p>
              <motion.button 
                onClick={() => {
                  setSelectedSpeciality('All Specialities');
                  setSearchQuery('');
                  setAvailableOnly(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-white to-white/90 text-gray-900 hover:shadow-lg hover:shadow-white/20 transition-all"
              >
                Reset Filters
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    variants={itemVariants}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <DoctorCard doctor={doctor} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
