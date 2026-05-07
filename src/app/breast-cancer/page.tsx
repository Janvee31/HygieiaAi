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

interface BreastCancerResult {
  prediction: boolean;
  probability: number;
  class: string;
  analysis: string;
}

export default function BreastCancerImagePage() {
  const [breastCancerAnalysis, setBreastCancerAnalysis] = useState<BreastCancerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { themeColor } = useTheme();
  
  // Breast cancer visualizations
  const breastCancerVisualizations = [
    {
      title: 'Breast Cancer Distribution',
      type: 'pie' as const,
      data: [
        {
          values: [63, 37],
          labels: ['Benign', 'Malignant'],
          type: 'pie',
          marker: {
            colors: ['#4CAF50', '#F44336']
          }
        }
      ],
      layout: {
        title: 'Breast Cancer Type Distribution',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Distribution of benign vs. malignant breast cancer cases in the dataset.'
    },
    {
      title: 'Feature Importance',
      type: 'bar' as const,
      data: [
        {
          y: ['Concave Points', 'Area', 'Perimeter', 'Concavity', 'Radius'],
          x: [0.95, 0.92, 0.89, 0.87, 0.84],
          type: 'bar',
          orientation: 'h',
          marker: {
            color: '#2196F3'
          }
        }
      ],
      layout: {
        title: 'Top 5 Important Features',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 120, r: 50 }
      },
      description: 'The most important features for breast cancer prediction based on model analysis.'
    },
    {
      title: 'Model Performance',
      type: 'bar' as const,
      data: [
        {
          x: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC'],
          y: [0.95, 0.93, 0.94, 0.93, 0.97],
          type: 'bar',
          marker: {
            color: ['#9C27B0', '#E91E63', '#3F51B5', '#00BCD4', '#009688']
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
      description: 'Performance metrics of the breast cancer detection model.'
    },
    {
      title: 'Training History',
      type: 'scatter' as const,
      data: [
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.70, 0.78, 0.84, 0.88, 0.91, 0.92, 0.93, 0.94, 0.95, 0.95],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Training Accuracy',
          marker: { color: '#4CAF50' }
        },
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.68, 0.75, 0.82, 0.85, 0.88, 0.90, 0.91, 0.92, 0.93, 0.93],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Validation Accuracy',
          marker: { color: '#2196F3' }
        },
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.65, 0.45, 0.32, 0.25, 0.18, 0.15, 0.12, 0.10, 0.09, 0.08],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Loss',
          marker: { color: '#F44336' },
          yaxis: 'y2'
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
        yaxis: { title: 'Accuracy', range: [0.6, 1.0] },
        yaxis2: {
          title: 'Loss',
          titlefont: { color: '#F44336' },
          tickfont: { color: '#F44336' },
          overlaying: 'y',
          side: 'right',
          range: [0, 0.7]
        },
        legend: { font: { color: '#fff' } }
      },
      description: 'Training and validation accuracy and loss over epochs during model training.'
    }
  ];

  // Custom prompt for breast cancer images
  const breastCancerPrompt = `Analyze this mammogram or breast image for signs of cancer or abnormalities.
  
  Provide a detailed analysis with the following sections:
  
  1) Prediction: State whether the image shows signs of breast cancer or not.
  
  2) Confidence: Provide a percentage indicating your confidence level in the assessment.
  
  3) Type: Specify the exact type of abnormality identified, if any (e.g., mass, calcification, architectural distortion).
  
  4) Risk Level: Indicate the severity or risk level (Low, Moderate, High) based on the findings.
  
  5) Detailed Analysis: Provide a thorough description of all visible features, abnormalities, and diagnostic insights.
  
  6) Recommendations: Suggest appropriate next steps, further tests, or treatments.
  
  7) Precautions: List any precautions or lifestyle modifications that might be beneficial.
  
  Format your response clearly with these labeled sections. If you cannot determine something with confidence, state this clearly rather than making assumptions.`;

  // Handle the prediction result
  const handlePredictionResult = (result: any) => {
    if ('analysis' in result) {
      setBreastCancerAnalysis(result as BreastCancerResult);
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
            <Icon icon={FaMicroscope} className="text-4xl text-pink-500" />
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Breast Cancer Detection
            </motion.h1>
          </div>
          <motion.p
            variants={itemVariants}
            className="text-lg text-white/80 max-w-3xl mx-auto"
          >
            Upload a mammogram or breast image for AI-powered cancer detection and analysis
          </motion.p>
        </motion.div>

        {/* Banner Image */}
        <motion.div
          variants={itemVariants}
          className="relative w-full max-w-4xl mx-auto aspect-[16/7] mb-8 rounded-2xl overflow-hidden"
        >
          <Image
            src="/images/breast.webp"
            alt="Breast Cancer Detection"
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
                <Icon icon={FaUpload} className="text-2xl text-pink-500 shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">Upload Mammogram</h2>
                  <p className="text-white/60 text-sm">Upload a breast image for AI-powered analysis</p>
                </div>
              </div>
              
              <div className="flex-grow overflow-auto custom-scrollbar pr-2 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex gap-2 mb-2">
                    <FaInfoCircle className="text-pink-400 mt-1 shrink-0" />
                    <div>
                      <h3 className="text-white font-medium">AI-Powered Detection</h3>
                      <p className="text-white/60 text-sm">
                        Our AI model will analyze your breast image and provide a comprehensive assessment 
                        including cancer detection, confidence level, risk assessment, and detailed findings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <ImageUpload 
                    onPredictionResult={handlePredictionResult}
                    setIsLoading={setIsLoading}
                    customPrompt={breastCancerPrompt}
                    diseaseType="breast_cancer"
                  />
                </div>

                {/* Information Box */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-medium flex items-center gap-2 mb-3">
                    <FaShieldAlt className="text-pink-400" />
                    Important Information
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    This tool is designed to assist in preliminary breast cancer detection but should not replace 
                    professional medical diagnosis. Always consult an oncologist for proper evaluation.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <FaPercent className="text-pink-400" />
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
                animate={breastCancerAnalysis ? "expanded" : "collapsed"}
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
                {breastCancerAnalysis ? (
                  <>
                    <div className="flex items-start gap-3 mb-6">
                      <FaFileMedical className="text-2xl text-pink-500 shrink-0 mt-1" />
                      <div>
                        <h2 className="text-2xl font-semibold text-white mb-1">Analysis Results</h2>
                        <p className="text-white/60 text-sm">AI-powered breast cancer detection</p>
                      </div>
                    </div>
                    <AnalysisResult 
                      title="Breast Cancer Analysis Results"
                      analysis={breastCancerAnalysis?.analysis || ''}
                      diseaseType="breast_cancer"
                      result={breastCancerAnalysis}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full py-8">
                    <Image 
                      src="/images/breast.webp" 
                      alt="Breast Cancer Analysis" 
                      width={150} 
                      height={150}
                      className="mx-auto mb-6 rounded-xl opacity-70"
                    />
                    <h3 className="text-2xl font-semibold text-white mb-2">No Analysis Yet</h3>
                    <p className="text-white/60 max-w-md">
                      Upload a mammogram or breast image to receive a detailed AI analysis and cancer detection results.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                      <FaHeartbeat className="text-pink-400" />
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Breast Cancer Research</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Data visualizations and model development for breast cancer detection
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-200px)] min-h-[800px] overflow-hidden">
          <NotebookViewer 
            notebookPath="disease.ipynb" 
            visualizations={breastCancerVisualizations} 
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
        themeColor="#ec4899" // Pink color for breast cancer theme
      />
    </div>
  );
}
