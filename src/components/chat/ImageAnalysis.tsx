import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaFileMedical, FaCamera, FaFileAlt, FaSearch, FaClipboardList } from 'react-icons/fa';

interface ImageAnalysisProps {
  imageUrl: string;
  analysisResult?: string;
  isAnalyzing: boolean;
  reportType?: string;
  onCaptureScreenshot?: () => void;
  onRequestOCR?: () => void;
}

const ImageAnalysis: React.FC<ImageAnalysisProps> = ({
  imageUrl,
  analysisResult,
  isAnalyzing,
  reportType = 'general',
  onCaptureScreenshot,
  onRequestOCR
}) => {
  const [showControls, setShowControls] = useState(false);
  
  const getReportTypeLabel = (type: string): string => {
    switch (type) {
      case 'blood_test': return 'Blood Test Report';
      case 'x_ray': return 'X-Ray Image';
      case 'mri': return 'MRI Scan';
      case 'ct_scan': return 'CT Scan';
      case 'skin_condition': return 'Skin Condition';
      case 'prescription': return 'Medical Prescription';
      default: return 'Medical Document';
    }
  };
  
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'blood_test': return <FaClipboardList className="text-red-500" />;
      case 'x_ray': return <FaFileMedical className="text-blue-500" />;
      case 'mri': return <FaFileMedical className="text-purple-500" />;
      case 'ct_scan': return <FaFileMedical className="text-cyan-500" />;
      case 'prescription': return <FaFileAlt className="text-green-500" />;
      default: return <FaFileMedical className="text-white" />;
    }
  };
  return (
    <div 
      className="bg-black bg-opacity-20 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getReportIcon(reportType)}
          <h3 className="text-lg font-semibold ml-2">{getReportTypeLabel(reportType)}</h3>
        </div>
        
        {showControls && (
          <div className="flex gap-2">
            {onCaptureScreenshot && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCaptureScreenshot}
                className="p-2 bg-blue-500 bg-opacity-20 rounded-full text-blue-400 hover:bg-opacity-30 transition-colors"
                title="Capture screenshot"
              >
                <FaCamera />
              </motion.button>
            )}
            
            {onRequestOCR && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRequestOCR}
                className="p-2 bg-purple-500 bg-opacity-20 rounded-full text-purple-400 hover:bg-opacity-30 transition-colors"
                title="Extract text with OCR"
              >
                <FaSearch />
              </motion.button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3 relative group">
          <Image
            src={imageUrl}
            alt="Uploaded medical image"
            width={300}
            height={300}
            className="rounded-lg object-contain w-full border border-white/10"
          />
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
              Click for full view
            </span>
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white/70">Analyzing document...</p>
              <p className="text-white/50 text-sm mt-1">Using AI to extract and interpret medical information</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-black bg-opacity-10 p-4 rounded-lg border border-white/5"
            >
              <h4 className="text-md font-medium mb-2 flex items-center">
                <FaClipboardList className="mr-2 text-blue-400" />
                Analysis Results:
              </h4>
              <p className="text-white/80 whitespace-pre-wrap">{analysisResult}</p>
              
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-white/50 text-xs italic">
                  Note: This AI analysis is for informational purposes only and should not replace professional medical advice.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;
