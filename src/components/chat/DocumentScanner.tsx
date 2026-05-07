import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaRedo, FaCheck, FaFileAlt, FaSearch, FaDownload, FaTimes } from 'react-icons/fa';
import { generateGeminiImageAnalysis } from '@/utils/geminiAI';

interface DocumentScannerProps {
  onCapture: (imageData: string, analysisText?: string) => void;
  onCancel: () => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState<string>('');

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Add a state to track if video is actually playing
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const startCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }
      
      // Get camera stream with explicit constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };
      
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted:', stream);
      
      // Set streaming state first, then set the stream in the next render cycle
      setIsStreaming(true);
      setIsVideoPlaying(false); // Reset video playing state
      
      // Use setTimeout to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing...');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video playback started');
                  // Set video playing to true once playback has started
                  setIsVideoPlaying(true);
                })
                .catch(e => {
                  console.error('Error playing video:', e);
                  setIsStreaming(false);
                  setIsVideoPlaying(false);
                });
            }
          };
        } else {
          console.error('Video reference is still null after timeout');
          setIsStreaming(false);
          setIsVideoPlaying(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsStreaming(false);
      setIsVideoPlaying(false);
      alert('Could not access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setIsVideoPlaying(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        
        // Automatically analyze the captured image
        analyzeImage(imageData);
      }
    }
  };
  
  const analyzeImage = async (imageData: string) => {
    try {
      setIsAnalyzing(true);
      
      // Use Gemini to analyze the image
      const prompt = 'Analyze this medical document or scan image in detail. Extract any text using OCR and provide a comprehensive analysis. If it contains medical information, highlight key health metrics, diagnoses, or recommendations. Format your response with clear headings and bullet points where appropriate.';
      const analysis = await generateGeminiImageAnalysis(prompt, imageData);
      
      setAnalysisText(analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisText('Error analyzing image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setAnalysisText('');
    startCamera();
  };

  const confirmImage = () => {
    if (capturedImage) {
      onCapture(capturedImage, analysisText);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl overflow-hidden max-w-6xl w-full border border-purple-500/30 shadow-lg shadow-purple-500/10" style={{ backgroundColor: '#0f172a' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-900/40 to-gray-900">
          <h3 className="text-white font-semibold flex items-center text-lg">
            <FaFileAlt className="mr-2 text-purple-400" />
            Medical Document Scanner
          </h3>
          <button 
            onClick={onCancel}
            className="text-white/60 hover:text-white bg-black/30 rounded-full w-8 h-8 flex items-center justify-center transition-all hover:bg-red-500/30"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Main content - Two column layout */}
        <div className="flex flex-col md:flex-row">
          {/* Left column - Camera/Image */}
          <div className="w-full md:w-1/2 border-r border-gray-800">
            <div className="relative h-[550px] bg-black flex items-center justify-center overflow-hidden">
              {!capturedImage ? (
                isStreaming ? (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ background: '#000' }}
                    />
                    {isStreaming && !isVideoPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                      <button
                        onClick={captureImage}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaCamera className="mr-2" />
                        Capture
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-20 h-20 mx-auto bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                      <FaCamera className="text-purple-400 text-3xl" />
                    </div>
                    <h4 className="text-white text-xl mb-2">Camera not started</h4>
                    <p className="text-gray-400 mb-6">Start camera to capture medical documents</p>
                    <button
                      onClick={startCamera}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto"
                    >
                      <FaCamera className="mr-2" />
                      Start Camera
                    </button>
                    <p className="text-gray-500 text-xs mt-4">
                      If camera doesn't appear, please check your browser permissions
                    </p>
                  </div>
                )
              ) : (
                <>
                  <img 
                    src={capturedImage} 
                    alt="Captured document" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3">
                    <button
                      onClick={retakeImage}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <FaRedo className="mr-2" />
                      Retake
                    </button>
                    <button
                      onClick={confirmImage}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <FaCheck className="mr-2" />
                      Confirm
                    </button>
                  </div>
                </>
              )}
              
              {/* Hidden canvas for image capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
          
          {/* Right column - Analysis */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="p-3 bg-gradient-to-r from-purple-900/30 to-gray-900 border-b border-gray-800">
              <h4 className="text-white font-medium flex items-center">
                <FaSearch className="text-purple-400 mr-2" />
                Summary
              </h4>
            </div>
            
            <div className="flex-grow p-5 overflow-auto bg-gray-900 h-[450px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-center">Analyzing document...</p>
                </div>
              ) : analysisText ? (
                <div className="bg-gray-800/50 p-5 rounded-lg border border-purple-500/20 text-white shadow-inner h-full overflow-auto">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {analysisText}
                  </div>
                </div>
              ) : capturedImage ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <FaSearch className="text-purple-400 text-3xl mb-3" />
                  <p className="text-white text-center">Analysis will appear here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FaFileAlt className="text-gray-600 text-3xl mb-3" />
                  <h3 className="text-white text-xl mb-2">No Document Analyzed</h3>
                  <p className="text-gray-400 max-w-md">
                    Capture a medical document, report, or scan to see AI-powered analysis
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer with buttons */}
            <div className="p-4 border-t border-gray-800 bg-gradient-to-b from-gray-900 to-gray-800/80">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center">
                  <FaSearch className="text-purple-400 ml-2 mr-2" />
                  Powered by OCR & Gemini 2.0 Flash
                </span>
                
                {analysisText && (
                  <button 
                    className="text-purple-400 hover:text-purple-300 flex items-center text-sm"
                    onClick={() => navigator.clipboard.writeText(analysisText)}
                  >
                    <FaDownload className="mr-1" />
                    Download Analysis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentScanner;