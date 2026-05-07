import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaMicrophone, FaMicrophoneSlash, FaImage, FaPaperPlane, FaCamera } from 'react-icons/fa';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isListening: boolean;
  toggleListening: () => void;
  imagePreview: string | null;
  clearImagePreview: () => void;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCameraCapture?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSendMessage,
  handleKeyDown,
  isListening,
  toggleListening,
  imagePreview,
  clearImagePreview,
  triggerFileInput,
  fileInputRef,
  onCameraCapture
}) => {
  return (
    <div className="relative z-10">
      {imagePreview && (
        <div className="absolute bottom-full mb-2 left-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center gap-3 shadow-lg">
          <div className="relative">
            <Image 
              src={imagePreview} 
              alt="Preview" 
              width={80} 
              height={80} 
              className="rounded-md object-cover border border-white/20"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-md"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-white/70">Image ready to send</span>
            <motion.button 
              onClick={clearImagePreview}
              className="text-white/80 hover:text-white mt-1 py-1 px-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors text-xs flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✕ Remove
            </motion.button>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 bg-black bg-opacity-20 backdrop-blur-sm border border-white/10 rounded-full p-2 shadow-[0_0_15px_rgba(255,255,255,0.2)] ring-2 ring-white/10 ring-opacity-90">
        <motion.button
          onClick={toggleListening}
          className={`p-3 rounded-full transition-colors ${
            isListening ? 'bg-red-500 bg-opacity-30 text-red-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500 bg-opacity-90'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isListening ? <FaMicrophoneSlash className="text-lg text-white" /> : <FaMicrophone className="text-lg text-white" />}
        </motion.button>
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
        />
        
        <motion.button
          onClick={triggerFileInput}
          className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-90 text-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaImage className="text-lg text-white" />
        </motion.button>
        
        {onCameraCapture && (
          <motion.button
            onClick={onCameraCapture}
            className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 bg-opacity-90 text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaCamera className="text-lg text-white" />
          </motion.button>
        )}
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-white placeholder-white/50"
        />
        
        <motion.button
          onClick={handleSendMessage}
          disabled={!inputText.trim() && !imagePreview}
          className={`p-3 rounded-full ${
            inputText.trim() || imagePreview
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg'
              : 'bg-black bg-opacity-20 text-white/50'
          }`}
          whileHover={inputText.trim() || imagePreview ? { scale: 1.1 } : {}}
          whileTap={inputText.trim() || imagePreview ? { scale: 0.9 } : {}}
        >
          <FaPaperPlane className="text-lg text-white" />
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInput;
