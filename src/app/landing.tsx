'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';
import ModelViewer from '@/components/ModelViewer';
import { 
  FaCalendarCheck, 
  FaStethoscope, 
  FaFileMedical, 
  FaFlask, 
  FaArrowRight 
} from 'react-icons/fa';
import { ArrowRightIcon } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.1, 0.25, 1.0] // Custom cubic bezier for smoother motion
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  },
  hover: {
    y: -8,
    scale: 1.05,
    boxShadow: "0 20px 30px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Feature card component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
}

const FeatureCard = ({ title, description, icon, link, color, gradientStart, gradientEnd }: FeatureCardProps) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="glass rounded-2xl overflow-hidden backdrop-blur-lg border border-white/10"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
      }}
    >
      <div 
        className="h-1.5" 
        style={{ 
          background: `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`,
          boxShadow: `0 0 20px ${gradientStart}80`
        }}
      />
      <div className="p-8">
        <motion.div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ 
            background: `linear-gradient(135deg, ${gradientStart}40 0%, ${gradientEnd}80 100%)`,
            boxShadow: `0 8px 20px ${gradientStart}30`
          }}
          whileHover={{ rotate: [0, -5, 5, -5, 0], transition: { duration: 0.5 } }}
        >
          <motion.div 
            className="text-2xl"
            style={{ color }}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
          >
            {icon}
          </motion.div>
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/70 mb-6 text-sm leading-relaxed">{description}</p>
        <Link href={link} className="group flex items-center text-sm font-medium transition-all duration-300 hover:pl-1" style={{ color }}>
          <span className="mr-2">Explore</span>
          <motion.div
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <FaArrowRight />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const { themeColor } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen -mt-24 relative">
      <ThemeSelector />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Enhanced background with animated gradients */}
          <div className="absolute inset-0 animate-gradient-slow"></div>
          
          {/* Animated particles/stars effect */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white animate-pulse-slow"
                style={{
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${Math.random() * 10 + 5}s`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Glowing orbs for visual interest */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/10 filter blur-[100px] animate-float-slow"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-purple-600/10 filter blur-[120px] animate-float-slow-reverse"></div>
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/10 filter blur-[80px] animate-pulse-slow"></div>
        </div>
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <motion.div variants={itemVariants} className="order-2 lg:order-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-blue-600/20 to-blue-400/20 text-blue-400 text-sm font-medium mb-6 border border-blue-500/20"
              >
                Your Ultimate Health Companion
              </motion.div>
              
              <motion.h1 
                variants={itemVariants}
                className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
              >
                Hygieia - Ultimate Health Companion
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Transform your healthcare experience with our comprehensive suite of AI-powered health tools
              </motion.p>
              
              <motion.div variants={itemVariants} className="relative z-20">
                <Link 
                  href="/home" 
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium text-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Get Started
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Enhanced 3D Doctor Model */}
            <motion.div
              variants={itemVariants}
              className="order-1 lg:order-2 relative z-10 pointer-events-none"
            >
              <div className="relative w-full h-[450px] max-w-lg mx-auto">
                {/* Glowing backdrop for the model */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 filter blur-[30px] opacity-80"></div>
                
                {/* Circular platform with reflection */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-6">
                  <div className="w-full h-full bg-gradient-to-r from-blue-600/30 via-indigo-500/40 to-purple-600/30 rounded-full filter blur-md"></div>
                </div>
                
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 6,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full relative"
                >
                  {/* Animated particles around the model */}
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0.4, scale: 0.8 }}
                        animate={{ 
                          opacity: [0.2, 0.8, 0.2], 
                          scale: [0.8, 1.2, 0.8],
                          x: [0, Math.sin(i * 45) * 20, 0],
                          y: [0, Math.cos(i * 45) * 20, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 3 + i, 
                          ease: "easeInOut" 
                        }}
                        className="absolute w-3 h-3 rounded-full bg-blue-400/40 filter blur-sm"
                        style={{
                          top: `${50 + Math.sin(i * 45) * 30}%`,
                          left: `${50 + Math.cos(i * 45) * 30}%`,
                        }}
                      />
                    ))}
                  </div>
                  
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-pulse text-white/70">Loading 3D Model...</div>
                    </div>
                  }>
                    <ModelViewer 
                      modelPath="/Cheerful_Doctor_Carto_0421133620_texture.glb" 
                      className="w-full h-full" 
                      autoRotate={true} 
                    />
                  </Suspense>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Comprehensive Health Solutions</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass relative isolate overflow-hidden p-6 rounded-2xl flex flex-col items-center text-center group hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${themeColor}15 0%, ${darkenColor(themeColor, 40)}25 100%)`,
              borderTop: `1px solid ${themeColor}30`,
              borderLeft: `1px solid ${themeColor}20`,
            }}
          >
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-blue-400/40"
                  initial={{ x: '50%', y: '50%', opacity: 0 }}
                  animate={{ 
                    x: `${50 + Math.sin(i * 60) * 40}%`, 
                    y: `${50 + Math.cos(i * 60) * 40}%`,
                    opacity: [0, 0.7, 0],
                    scale: [0.5, 1.5, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3 + i, 
                    ease: "easeInOut",
                    delay: i * 0.2,
                    repeatDelay: 0.5
                  }}
                />
              ))}
            </div>
            
            {/* Enhanced background effects */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {/* Main glow effect */}
              <motion.div 
                className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-gradient-to-r rounded-2xl blur-xl transition-all duration-500"
                initial={{ scale: 0.95, opacity: 0 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
                style={{ 
                  background: `radial-gradient(circle at center, ${themeColor}40 0%, transparent 70%)`,
                  zIndex: -1 
                }}
              />
              
              {/* Colorful floating orbs */}
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`orb-${i}`}
                  className="absolute rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                  initial={{ scale: 0.5 }}
                  animate={{ 
                    scale: [0.5, 1.2, 0.5],
                    x: [0, Math.sin(i * 120) * 30, 0],
                    y: [0, Math.cos(i * 120) * 30, 0]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 5 + i,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: `${30 + i * 10}px`,
                    height: `${30 + i * 10}px`,
                    background: `radial-gradient(circle at 30%, ${themeColor}, ${darkenColor(themeColor, 40)})`,
                    filter: 'blur(10px)',
                    top: `${20 + i * 25}%`,
                    left: `${20 + i * 25}%`,
                    zIndex: -1
                  }}
                />
              ))}
              
              {/* Pulsing background */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.05, 0.8] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ 
                  background: `linear-gradient(135deg, ${themeColor}30 0%, ${darkenColor(themeColor, 30)}50 100%)`,
                  zIndex: -2
                }}
              />
            </div>
            
            {/* Border glow effect */}
            <motion.div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
              initial={{ borderWidth: 1, borderColor: `${themeColor}30` }}
              animate={{ borderWidth: [1, 2, 1], borderColor: [`${themeColor}30`, `${themeColor}80`, `${themeColor}30`] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{ 
                borderStyle: 'solid',
                boxShadow: `0 0 15px 1px ${themeColor}30`
              }}
            ></motion.div>
            
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-all duration-300 relative z-10"
              whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
              style={{ 
                background: `linear-gradient(135deg, ${themeColor}40 0%, ${darkenColor(themeColor, 20)}50 100%)`,
                boxShadow: `0 10px 15px -3px ${themeColor}20`
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="group-hover:text-blue-100"
              >
                <FaCalendarCheck className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h3 
              className="text-xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors duration-300 relative z-10"
              whileHover={{ scale: 1.05 }}
            >
              Appointment Booking
            </motion.h3>
            
            <p className="text-white/70 text-sm mb-5 group-hover:text-white/90 transition-colors duration-300 relative z-10">
              Schedule appointments with top doctors across various specialties with our easy-to-use booking system.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 mt-auto w-full"
            >
              <Link 
                href="/appointment" 
                className="py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300 w-full"
              >
                Explore <FaArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass relative isolate overflow-hidden p-6 rounded-2xl flex flex-col items-center text-center group hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, #F472B615 0%, ${darkenColor('#F472B6', 40)}25 100%)`,
              borderTop: `1px solid #F472B630`,
              borderLeft: `1px solid #F472B620`,
            }}
          >
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-pink-400/40"
                  initial={{ x: '50%', y: '50%', opacity: 0 }}
                  animate={{ 
                    x: `${50 + Math.sin(i * 60) * 40}%`, 
                    y: `${50 + Math.cos(i * 60) * 40}%`,
                    opacity: [0, 0.7, 0],
                    scale: [0.5, 1.5, 0.5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3 + i, 
                    ease: "easeInOut",
                    delay: i * 0.2,
                    repeatDelay: 0.5
                  }}
                />
              ))}
            </div>
            
            {/* Enhanced background effects */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {/* Main glow effect */}
              <motion.div 
                className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-gradient-to-r rounded-2xl blur-xl transition-all duration-500"
                initial={{ scale: 0.95, opacity: 0 }}
                whileHover={{ scale: 1.05, opacity: 1 }}
                style={{ 
                  background: `radial-gradient(circle at center, #F472B640 0%, transparent 70%)`,
                  zIndex: -1 
                }}
              />
              
              {/* Colorful floating orbs */}
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`orb-${i}`}
                  className="absolute rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300"
                  initial={{ scale: 0.5 }}
                  animate={{ 
                    scale: [0.5, 1.2, 0.5],
                    x: [0, Math.sin(i * 120) * 30, 0],
                    y: [0, Math.cos(i * 120) * 30, 0]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 5 + i,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: `${30 + i * 10}px`,
                    height: `${30 + i * 10}px`,
                    background: `radial-gradient(circle at 30%, #F472B6, ${darkenColor('#F472B6', 40)})`,
                    filter: 'blur(10px)',
                    top: `${20 + i * 25}%`,
                    left: `${20 + i * 25}%`,
                    zIndex: -1
                  }}
                />
              ))}
              
              {/* Pulsing background */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.05, 0.8] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                style={{ 
                  background: `linear-gradient(135deg, #F472B630 0%, ${darkenColor('#F472B6', 30)}50 100%)`,
                  zIndex: -2
                }}
              />
            </div>
            
            {/* Border glow effect */}
            <motion.div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
              initial={{ borderWidth: 1, borderColor: `#F472B630` }}
              animate={{ borderWidth: [1, 2, 1], borderColor: [`#F472B630`, `#F472B680`, `#F472B630`] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{ 
                borderStyle: 'solid',
                boxShadow: `0 0 15px 1px #F472B630`
              }}
            ></motion.div>
            
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-all duration-300 relative z-10"
              whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
              style={{ 
                background: `linear-gradient(135deg, #F472B640 0%, ${darkenColor('#F472B6', 20)}50 100%)`,
                boxShadow: `0 10px 15px -3px #F472B620`
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="group-hover:text-pink-100"
              >
                <FaStethoscope className="w-8 h-8 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h3 
              className="text-xl font-bold text-white mb-3 group-hover:text-pink-100 transition-colors duration-300 relative z-10"
              whileHover={{ scale: 1.05 }}
            >
              Disease Prediction
            </motion.h3>
            
            <p className="text-white/70 text-sm mb-5 group-hover:text-white/90 transition-colors duration-300 relative z-10">
              Use our AI-powered system to predict potential health conditions based on your symptoms.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 mt-auto w-full"
            >
              <Link 
                href="/disease" 
                className="py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300 w-full"
              >
                Explore <FaArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass relative isolate overflow-hidden p-6 rounded-2xl flex flex-col items-center text-center group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, #10B98115 0%, ${darkenColor('#10B981', 40)}25 100%)`,
              borderTop: `1px solid #10B98130`,
              borderLeft: `1px solid #10B98120`,
            }}
          >
            <div 
              className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-gradient-to-r rounded-2xl blur-xl transition-all duration-500"
              style={{ 
                background: `radial-gradient(circle at center, #10B98130 0%, transparent 70%)`,
                zIndex: -1 
              }}
            ></div>
            
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, #10B98140 0%, ${darkenColor('#10B981', 20)}50 100%)`,
                boxShadow: `0 10px 15px -3px #10B98120`
              }}
            >
              <FaFileMedical className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-100 transition-colors duration-300">Medical OCR</h3>
            <p className="text-white/70 text-sm mb-5 group-hover:text-white/80 transition-colors duration-300">Extract and analyze text from medical documents and prescriptions using our advanced OCR technology.</p>
            
            <Link 
              href="http://localhost:3001" 
              className="mt-auto py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-teal-500 transition-all duration-300"
            >
              Explore <FaArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass relative isolate overflow-hidden p-6 rounded-2xl flex flex-col items-center text-center group hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, #FBBF2415 0%, ${darkenColor('#FBBF24', 40)}25 100%)`,
              borderTop: `1px solid #FBBF2430`,
              borderLeft: `1px solid #FBBF2420`,
            }}
          >
            <div 
              className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-gradient-to-r rounded-2xl blur-xl transition-all duration-500"
              style={{ 
                background: `radial-gradient(circle at center, #FBBF2430 0%, transparent 70%)`,
                zIndex: -1 
              }}
            ></div>
            
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, #FBBF2440 0%, ${darkenColor('#FBBF24', 20)}50 100%)`,
                boxShadow: `0 10px 15px -3px #FBBF2420`
              }}
            >
              <FaFlask className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-100 transition-colors duration-300">Health Analytics</h3>
            <p className="text-white/70 text-sm mb-5 group-hover:text-white/80 transition-colors duration-300">Access advanced health analytics and personalized insights powered by cutting-edge AI.</p>
            
            <Link 
              href="http://localhost:8000" 
              className="mt-auto py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium text-white flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-yellow-500 transition-all duration-300"
            >
              Explore <FaArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Hygieia Health Companion. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
