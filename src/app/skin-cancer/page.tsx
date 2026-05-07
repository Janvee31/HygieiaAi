'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { IconType } from 'react-icons';
import { FaFemale, FaPercent, FaInfoCircle, FaShieldAlt, FaChartBar, FaChartLine, FaUpload, FaSearch, FaMicroscope, FaHeartbeat, FaFileMedical, FaFlask } from 'react-icons/fa';
import ImageUpload from '@/components/ImageUpload';
import AnalysisResult from '@/components/AnalysisResult';
import NotebookViewer from '@/components/NoteViewer';
import TabView from '@/components/TabView';

// Create a wrapper component for icons
const Icon = ({ icon: IconComponent, className }: { icon: IconType; className?: string }) => {
  return <IconComponent className={className} />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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
      ease: 'easeOut'
    }
  }
};

const cardVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: {
        duration: 0.4
      },
      opacity: {
        duration: 0.3,
        delay: 0.1
      }
    }
  }
};

interface SkinCancerResult {
  prediction: boolean;
  probability: number;
  class: string;
  analysis: string;
}

export default function SkinCancerPage() {
  const [skinCancerAnalysis, setSkinCancerAnalysis] = useState<SkinCancerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { themeColor } = useTheme();
  
  // Skin cancer visualizations
  const skinCancerVisualizations = [
    {
      title: 'Skin Lesion Distribution',
      type: 'pie' as const,
      data: [
        {
          values: [65, 35],
          labels: ['Benign', 'Malignant'],
          type: 'pie',
          marker: {
            colors: ['#4CAF50', '#F44336']
          }
        }
      ],
      layout: {
        title: 'Skin Lesion Type Distribution',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Distribution of benign vs. malignant skin lesions in the dataset.'
    },
    {
      title: 'Model Performance',
      type: 'bar' as const,
      data: [
        {
          x: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
          y: [0.91, 0.89, 0.92, 0.90],
          type: 'bar',
          marker: {
            color: ['#2196F3', '#FF9800', '#9C27B0', '#00BCD4']
          }
        }
      ],
      layout: {
        title: 'Model Performance Metrics',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Performance metrics of the skin cancer detection model.'
    },
    {
      title: 'Lesion Type Distribution',
      type: 'bar' as const,
      data: [
        {
          y: ['Melanoma', 'Basal Cell Carcinoma', 'Squamous Cell Carcinoma', 'Actinic Keratosis', 'Nevus', 'Seborrheic Keratosis'],
          x: [15, 20, 10, 12, 30, 13],
          type: 'bar',
          orientation: 'h',
          marker: {
            color: ['#FF5722', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3']
          }
        }
      ],
      layout: {
        title: 'Distribution by Lesion Type',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 180, r: 50 }
      },
      description: 'Distribution of different types of skin lesions in the dataset.'
    },
    {
      title: 'Training Progress',
      type: 'scatter' as const,
      data: [
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.65, 0.72, 0.78, 0.82, 0.85, 0.87, 0.89, 0.90, 0.91, 0.91],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Training Accuracy',
          marker: { color: '#4CAF50' }
        },
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.60, 0.68, 0.75, 0.79, 0.82, 0.84, 0.86, 0.87, 0.88, 0.89],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Validation Accuracy',
          marker: { color: '#2196F3' }
        }
      ],
      layout: {
        title: 'Model Training Progress',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 },
        xaxis: { title: 'Epochs' },
        yaxis: { title: 'Accuracy' },
        legend: { font: { color: '#fff' } }
      },
      description: 'Training and validation accuracy over epochs during model training.'
    }
  ];

  // Custom prompt for skin cancer images
  const skinCancerPrompt = `You are analyzing a dermatological image that has already been processed by our ML model for skin cancer detection. The ML model results will be provided to you if available.
  
  Your task is to provide a comprehensive analysis that builds upon the ML model's findings (if available) or provides a standalone assessment (if ML results are unavailable).
  
  Provide a detailed analysis with the following sections:
  
  1) Prediction: State whether the image shows signs of skin cancer or not. If ML model results are available, incorporate this information.
  
  2) Confidence: Provide a percentage indicating your confidence level in the assessment. If ML model confidence is available, reference it and provide your own assessment.
  
  3) Type: Specify the exact type of skin lesion or cancer identified, if any (e.g., melanoma, basal cell carcinoma, squamous cell carcinoma, etc.).
  
  4) Risk Level: Indicate the severity or risk level (Low, Moderate, High) based on the findings.
  
  5) Detailed Analysis: Provide a thorough description of all visible features, abnormalities, and diagnostic insights. If the ML model has identified specific features, elaborate on these.
  
  6) Recommendations: Suggest appropriate next steps, further tests, or treatments.
  
  7) Precautions: List any precautions or lifestyle modifications that might be beneficial.
  
  Format your response clearly with these labeled sections. If you cannot determine something with confidence, state this clearly rather than making assumptions.`;

  // Handle the prediction result
  const handlePredictionResult = (result: any) => {
    if ('analysis' in result) {
      setSkinCancerAnalysis(result as SkinCancerResult);
    }
  };

  // Define the Analysis Content
  const AnalysisContent = (
    <div className="min-h-screen mx-auto max-w-6xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-6 flex flex-col"
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon icon={FaMicroscope} className="text-4xl text-amber-500" />
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Skin Cancer Detection
            </motion.h1>
          </div>
          <motion.p
            variants={itemVariants}
            className="text-lg text-white/80 max-w-3xl mx-auto"
          >
            Upload a skin lesion image for AI-powered cancer detection and analysis
          </motion.p>
        </motion.div>

        {/* Banner Image */}
        <motion.div
          variants={itemVariants}
          className="relative w-full max-w-4xl mx-auto aspect-[16/7] mb-8 rounded-2xl overflow-hidden"
        >
          <Image
            src="/images/skin.jpeg"
            alt="Skin Cancer Detection"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent, ${darkenColor(themeColor, 100)})`
            }}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
          {/* Left Column - Upload Section */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <div className="glass p-6 rounded-2xl backdrop-blur-lg border border-white/10 flex flex-col h-full"
              style={{
                background: `linear-gradient(135deg, 
                  ${themeColor}10 0%, 
                  ${darkenColor(themeColor, 40)}20 100%
                )`
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <Icon icon={FaUpload} className="text-2xl text-amber-500 shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">Upload Skin Image</h2>
                  <p className="text-white/60 text-sm">Upload a skin lesion image for AI-powered analysis</p>
                </div>
              </div>


              
              <div className="flex-grow overflow-auto custom-scrollbar pr-2 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex gap-2 mb-2">
                    <FaInfoCircle className="text-amber-400 mt-1 shrink-0" />
                    <div>
                      <h3 className="text-white font-medium">AI-Powered Detection</h3>
                      <p className="text-white/60 text-sm">
                        Our AI model will analyze your skin lesion image and provide a comprehensive assessment 
                        including cancer detection, confidence level, risk assessment, and detailed findings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <ImageUpload 
                    onPredictionResult={handlePredictionResult}
                    setIsLoading={setIsLoading}
                    customPrompt={skinCancerPrompt}
                    diseaseType="skin_cancer"
                  />
                </div>

                {/* Information Box */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-medium flex items-center gap-2 mb-3">
                    <FaShieldAlt className="text-amber-400" />
                    Important Information
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    This tool is designed to assist in preliminary skin cancer detection but should not replace 
                    professional medical diagnosis. Always consult a dermatologist for proper evaluation.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <FaPercent className="text-amber-400" />
                      The AI provides a confidence score to indicate prediction reliability
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key="analysis-container"
                initial="collapsed"
                animate={skinCancerAnalysis ? "expanded" : "collapsed"}
                exit="collapsed"
                variants={cardVariants}
                className="glass p-6 rounded-2xl border border-white/10 overflow-hidden h-full"
                style={{
                  background: `linear-gradient(135deg, 
                    ${themeColor}10 0%, 
                    ${darkenColor(themeColor, 40)}20 100%
                  )`
                }}
              >
                {skinCancerAnalysis ? (
                  <>
                    <div className="flex items-start gap-3 mb-6">
                      <FaFileMedical className="text-2xl text-amber-500 shrink-0 mt-1" />
                      <div>
                        <h2 className="text-2xl font-semibold text-white mb-1">Analysis Results</h2>
                        <p className="text-white/60 text-sm">AI-powered skin cancer detection</p>
                      </div>
                    </div>
                    <AnalysisResult 
                      title="Skin Cancer Analysis Results"
                      analysis={skinCancerAnalysis?.analysis || ''}
                      diseaseType="skin_cancer"
                      result={skinCancerAnalysis}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full py-8">
                    <Image 
                      src="/images/skin.webp" 
                      alt="Skin Cancer Analysis" 
                      width={150} 
                      height={150}
                      className="mx-auto mb-6 rounded-xl opacity-70"
                    />
                    <h3 className="text-2xl font-semibold text-white mb-2">No Analysis Yet</h3>
                    <p className="text-white/60 max-w-md">
                      Upload a skin lesion image to receive a detailed AI analysis and cancer detection results.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                      <FaHeartbeat className="text-amber-400" />
                      <span>Early detection significantly improves treatment outcomes</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  // Define the Notebook Content
  const NotebookContent = (
    <div className="min-h-screen mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Skin Cancer Research</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Data visualizations and model development for skin cancer detection
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-200px)] min-h-[800px] overflow-hidden">
          <NotebookViewer 
            notebookPath="skin_cancer.ipynb" 
            visualizations={skinCancerVisualizations} 
          />
        </motion.div>
      </motion.div>
    </div>
  );

  // Define tabs for the TabView component
  const tabs = [
    {
      id: 'analysis',
      label: 'Cancer Detection',
      icon: FaMicroscope,
      content: AnalysisContent
    },
    {
      id: 'notebook',
      label: 'Research Notebook',
      icon: FaFlask,
      content: NotebookContent
    }
  ];

  return (
    <div className="min-h-screen">
      <TabView
        tabs={tabs}
        defaultTab="analysis"
        themeColor="#f59e0b" // Amber color for skin cancer theme
      />
    </div>
  );
}
