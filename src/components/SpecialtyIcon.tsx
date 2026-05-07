'use client';

import { motion } from 'framer-motion';
import { 
  FaHeartbeat, 
  FaBrain, 
  FaLungs, 
  FaVial, 
  FaDisease, 
  FaUserMd,
  FaBone,
  FaEye,
  FaChild,
  FaTeeth,
  FaAllergies
} from 'react-icons/fa';
import { GiStomach } from 'react-icons/gi';
import { useTheme } from '@/context/ThemeContext';

interface SpecialtyIconProps {
  specialty: string;
  size?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function SpecialtyIcon({ specialty, size = 24, isActive = false, onClick }: SpecialtyIconProps) {
  const { themeColor } = useTheme();
  
  // Map specialties to icons and colors - using much more vibrant colors
  const specialtyMap: Record<string, { icon: React.ElementType; gradient: [string, string] }> = {
    'Cardiology': { 
      icon: FaHeartbeat, 
      gradient: ['#FF0844', '#FF3A6B'] 
    },
    'Neurology': { 
      icon: FaBrain, 
      gradient: ['#FFB700', '#FFDA00'] 
    },
    'Pulmonology': { 
      icon: FaLungs, 
      gradient: ['#00F260', '#0575E6'] 
    },
    'Endocrinology': { 
      icon: FaVial, 
      gradient: ['#0061FF', '#60EFFF'] 
    },
    'Gastroenterology': { 
      icon: GiStomach, 
      gradient: ['#7303c0', '#ec38bc'] 
    },
    'Oncology': { 
      icon: FaDisease, 
      gradient: ['#FF3CAC', '#784BA0'] 
    },
    'Orthopedics': { 
      icon: FaBone, 
      gradient: ['#8E2DE2', '#4A00E0'] 
    },
    'Ophthalmology': { 
      icon: FaEye, 
      gradient: ['#396afc', '#2948ff'] 
    },
    'Pediatrics': { 
      icon: FaChild, 
      gradient: ['#11998e', '#38ef7d'] 
    },
    'Dentistry': { 
      icon: FaTeeth, 
      gradient: ['#FC466B', '#3F5EFB'] 
    },
    'Dermatology': { 
      icon: FaAllergies, 
      gradient: ['#FF3CAC', '#2B86C5'] 
    }
  };

  // Default icon if specialty not found - using a gradient with the theme color
  const defaultIcon = { 
    icon: FaUserMd, 
    gradient: [themeColor, `${themeColor}80`] 
  };

  const { icon: Icon, gradient } = specialtyMap[specialty] || defaultIcon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: 5 }}
      whileTap={{ scale: 0.9, rotate: -5 }}
      onClick={onClick}
      className={`relative rounded-full flex items-center justify-center cursor-pointer overflow-hidden ${isActive ? 'ring-3 ring-white/70 shadow-lg shadow-white/20' : ''}`}
      style={{ 
        width: size * 2.5, 
        height: size * 2.5,
        boxShadow: isActive ? `0 0 15px ${gradient[0]}` : 'none',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          opacity: isActive ? 1 : 0.9
        }}
      />
      
      {/* Add a subtle shine effect */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)'
        }}
      />
      
      {/* Enhanced animated particles */}
      {isActive && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                backgroundColor: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`,
                boxShadow: `0 0 3px rgba(255, 255, 255, 0.5)`
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0],
                y: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0],
                opacity: [0, 0.8, 0.2, 0],
                scale: [0.5, 1 + Math.random(), 0.5]
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.random() * 2,
                ease: "easeInOut",
                delay: i * 0.2
              }}
            />
          ))}
        </>
      )}
      
      <motion.div
        animate={isActive ? { 
          scale: [1, 1.2, 1],
          rotate: [0, 8, 0, -8, 0],
          y: [0, -2, 0, 2, 0]
        } : {}}
        transition={{ 
          repeat: isActive ? Infinity : 0, 
          duration: 3,
          ease: "easeInOut"
        }}
        className="relative z-10"
      >
        <Icon 
          size={size * 1.2} 
          className="text-white drop-shadow-lg" 
          style={{
            filter: isActive ? 'drop-shadow(0 0 3px rgba(255,255,255,0.7))' : 'none'
          }}
        />
      </motion.div>
      
      {/* Add a pulsing ring effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
