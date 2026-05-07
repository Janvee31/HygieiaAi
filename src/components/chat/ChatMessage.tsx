import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaUser, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    agentId: string;
    isLoading?: boolean;
    imageUrl?: string;
  };
  getAgentIcon: (agentId: string) => React.ReactNode;
  getAgentName: (agentId: string) => string;
  isSpeaking: boolean;
  toggleSpeaking: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  getAgentIcon,
  getAgentName,
  isSpeaking,
  toggleSpeaking
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <motion.div
        className={`max-w-[80%] rounded-2xl p-4 ${
          message.sender === 'user'
            ? 'bg-white/10 rounded-tr-none'
            : 'rounded-tl-none'
        }`}
        style={{
          background: message.sender === 'user' 
            ? `rgba(255, 255, 255, 0.1)` 
            : `rgba(0, 0, 0, 0.3)`
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <div className="flex items-center gap-2 mb-2">
          {message.sender === 'user' ? (
            <>
              <span className="font-semibold">You</span>
              <FaUser className="text-white/70" />
            </>
          ) : (
            <>
              {getAgentIcon(message.agentId)}
              <span className="font-semibold">
                {getAgentName(message.agentId)}
              </span>
            </>
          )}
        </div>
        
        {message.isLoading ? (
          <div className="flex space-x-2 justify-center items-center h-6">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.text}</p>
            
            {message.imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <Image 
                  src={message.imageUrl} 
                  alt="Uploaded image" 
                  width={300} 
                  height={200} 
                  className="object-contain"
                />
              </div>
            )}
            
            {message.sender === 'ai' && (
              <button
                onClick={() => toggleSpeaking(message.text)}
                className="mt-2 text-white/60 hover:text-white transition-colors"
              >
                {isSpeaking ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
            )}
          </>
        )}
        
        <div className="text-xs text-white/40 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage;
