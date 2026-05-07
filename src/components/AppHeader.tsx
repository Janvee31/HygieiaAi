'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCalendarCheck, FaUserMd, FaHistory, FaUserCircle } from 'react-icons/fa';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';

interface AppHeaderProps {
  activePage?: 'appointments' | 'doctors' | 'history' | 'profile';
}

export default function AppHeader({ activePage }: AppHeaderProps) {
  const { themeColor } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0);

  // Force re-render when theme color changes
  useEffect(() => {
    setMounted(true);
    
    // Add event listener for theme color changes
    const handleThemeChange = () => {
      setKey(prev => prev + 1);
    };
    
    document.addEventListener('theme-updated', handleThemeChange);
    
    return () => {
      document.removeEventListener('theme-updated', handleThemeChange);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div 
      key={`header-${key}-${themeColor.replace('#', '')}`}
      className="py-4 px-4 sm:px-6 lg:px-8 shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${themeColor}90 0%, ${darkenColor(themeColor, 30)} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 drop-shadow-md"
              style={{ textShadow: `0 0 15px ${themeColor}` }}
            >
              Hygieia
            </motion.h1>
          </Link>
          <div className="flex space-x-6">
            <Link href="/appointment" className="relative group">
              <motion.div 
                whileHover={{ y: -3, scale: 1.1 }}
                className={`p-2 rounded-full backdrop-blur-sm border shadow-lg ${
                  activePage === 'appointments' 
                    ? 'bg-white/20 border-white/30' 
                    : 'bg-white/10 border-white/20'
                }`}
                style={{ 
                  boxShadow: activePage === 'appointments'
                    ? `0 0 15px ${themeColor}70`
                    : `0 0 10px ${themeColor}50`
                }}
              >
                <FaCalendarCheck className="w-5 h-5 text-white drop-shadow-md" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/80 whitespace-nowrap"
              >
                Appointments
              </motion.span>
            </Link>
            <Link href="/appointment/doctors" className="relative group">
              <motion.div 
                whileHover={{ y: -3, scale: 1.1 }}
                className={`p-2 rounded-full backdrop-blur-sm border shadow-lg ${
                  activePage === 'doctors' 
                    ? 'bg-white/20 border-white/30' 
                    : 'bg-white/10 border-white/20'
                }`}
                style={{ 
                  boxShadow: activePage === 'doctors'
                    ? `0 0 15px ${themeColor}70`
                    : `0 0 10px ${themeColor}50`
                }}
              >
                <FaUserMd className="w-5 h-5 text-white drop-shadow-md" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/80 whitespace-nowrap"
              >
                Doctors
              </motion.span>
            </Link>
            <Link href="/appointment/my-appointments" className="relative group">
              <motion.div 
                whileHover={{ y: -3, scale: 1.1 }}
                className={`p-2 rounded-full backdrop-blur-sm border shadow-lg ${
                  activePage === 'history' 
                    ? 'bg-white/20 border-white/30' 
                    : 'bg-white/10 border-white/20'
                }`}
                style={{ 
                  boxShadow: activePage === 'history'
                    ? `0 0 15px ${themeColor}70`
                    : `0 0 10px ${themeColor}50`
                }}
              >
                <FaHistory className="w-5 h-5 text-white drop-shadow-md" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/80 whitespace-nowrap"
              >
                History
              </motion.span>
            </Link>
            <Link href="/appointment/profile" className="relative group">
              <motion.div 
                whileHover={{ y: -3, scale: 1.1 }}
                className={`p-2 rounded-full backdrop-blur-sm border shadow-lg ${
                  activePage === 'profile' 
                    ? 'bg-white/20 border-white/30' 
                    : 'bg-white/10 border-white/20'
                }`}
                style={{ 
                  boxShadow: activePage === 'profile'
                    ? `0 0 15px ${themeColor}70`
                    : `0 0 10px ${themeColor}50`
                }}
              >
                <FaUserCircle className="w-5 h-5 text-white drop-shadow-md" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/80 whitespace-nowrap"
              >
                Profile
              </motion.span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
