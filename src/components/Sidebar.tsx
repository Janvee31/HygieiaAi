'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  {
    name: 'Home - Landing',
    path: '/home',
    icon: '🏠',
    image: '/images/health.gif'
  },
  {
    name: 'ChatAI Assistant',
    path: '/chat-ai',
    icon: '🤖',
    image: '/images/chatai.jpg'
  },
  {
    name: 'Image Analysis',
    path: '/image-analysis',
    icon: '📷',
    image: '/images/image-analysis.jpg'
  },
  {
    name: 'Disease Prediction',
    path: '/disease',
    icon: '🏥',
    image: '/images/health.gif'
  },
  {
    name: 'Diabetes Prediction',
    path: '/diabetes',
    icon: '🩺',
    image: '/images/diabetes.jpg'
  },
  {
    name: 'Heart Disease',
    path: '/heart',
    icon: '❤️',
    image: '/images/heart.jpg'
  },
  {
    name: 'Liver Disease',
    path: '/liver',
    icon: '🫁',
    image: '/images/liver.jpg'
  },
  {
    name: 'Lung Cancer',
    path: '/lung',
    icon: '🫀',
    image: '/images/lung.png'
  },
  {
    name: 'Breast Cancer',
    path: '/breast-cancer',
    icon: '🧬',
    image: '/images/breast.webp'
  },
  {
    name: 'Skin Cancer',
    path: '/skin-cancer',
    icon: '🩺',
    image: '/images/skin-cancer-awareness-month-scaled.jpeg'
  },
  {
    name: 'Brain Tumor',
    path: '/brain-tumor',
    icon: '🧠',
    image: '/images/mental.webp'
  },
  {
    name: 'Kidney Disease',
    path: '/kidney',
    icon: '🦠',
    image: '/images/kidney.jpg'
  },
  {
    name: 'Thyroid Disease',
    path: '/thyroid',
    icon: '🧪',
    image: '/images/thyroid.jpg'
  },
  {
    name: 'Stroke Risk',
    path: '/stroke',
    icon: '🧠',
    image: '/images/stroke.jpg'
  },
  {
    name: 'Documentation',
    path: '/docs',
    icon: '📚',
    image: '/images/docs.jpg'
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { themeColor } = useTheme();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed top-0 left-0 h-screen backdrop-blur-lg border-r border-white/10 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          ${themeColor}20 0%, 
          ${darkenColor(themeColor, 0.8)}90 100%)`
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-blue-500 rounded-full filter blur-[80px] opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-purple-500 rounded-full filter blur-[100px] opacity-10 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
      
      <div className="flex flex-col h-full pt-3 relative z-10">
        <div className="py-2 flex items-center justify-between">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center w-full"
              >
                <div className="flex mr-8 items-center justify-center gap-2 mb-1">
                  <div className="relative w-16 h-16">
                    <Image 
                      src="/images/logo.webp" 
                      alt="Hygieia Logo" 
                      fill 
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-white">
                    Hygieia ~ Ai
                    <p className="text-white/30 mt-2 text-sm text-center">AI-Powered Health</p>
                  </h1>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white absolute right-2 top-4 z-20"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        <nav className="flex-1 px-2">
          <ul className="space-y-3 flex flex-col items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <motion.li 
                  key={item.path} 
                  className={`w-full ${isCollapsed ? 'flex justify-center' : ''}`}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <Link
                    href={item.path}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl relative overflow-hidden group z-10',
                      'hover:bg-white/10 transition-all duration-300',
                      'text-white/90 hover:text-white',
                      isCollapsed ? 'justify-center' : '',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-xl z-0"
                        style={{
                          background: `linear-gradient(135deg, ${themeColor}40, ${darkenColor(themeColor, 40)}60)`,
                          boxShadow: `0 0 20px 2px ${themeColor}30`
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                    <motion.span 
                      className="relative z-10 text-xl mr-3 flex items-center justify-center"
                      animate={isActive ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, 0, -10, 0],
                        transition: { duration: 0.5, delay: 0.2 }
                      } : {}}
                    >
                      {item.icon}
                    </motion.span>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="relative z-10 font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && !isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 w-2 h-2 rounded-full"
                        style={{ 
                          background: themeColor,
                          boxShadow: `0 0 10px 2px ${themeColor}80` 
                        }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>
      </div>
    </motion.aside>
  );
}
