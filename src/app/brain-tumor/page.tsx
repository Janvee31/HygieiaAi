'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { IconType } from 'react-icons';
import { FaStethoscope, FaPercent, FaInfoCircle, FaShieldAlt, FaChartBar, FaChartPie, FaUpload, FaSearch, FaMicroscope, FaHeartbeat, FaFileMedical, FaBrain, FaFlask } from 'react-icons/fa';
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

interface BrainTumorResult {
  prediction: boolean;
  probability: number;
  class: string;
  analysis: string;
}

export default function BrainTumorPage() {
  const [brainTumorAnalysis, setBrainTumorAnalysis] = useState<BrainTumorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { themeColor } = useTheme();
  
  // Brain tumor visualizations
  const brainTumorVisualizations = [
    {
      title: 'Brain Tumor Classification',
      type: 'pie' as const,
      data: [
        {
          values: [60, 40],
          labels: ['Normal', 'Tumor'],
          type: 'pie',
          marker: {
            colors: ['#4CAF50', '#F44336']
          }
        }
      ],
      layout: {
        title: 'Brain Scan Classification',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Distribution of normal vs. tumor brain scans in the dataset.'
    },
    {
      title: 'Model Training History',
      type: 'line' as const,
      data: [
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.65, 0.75, 0.82, 0.87, 0.90, 0.92, 0.94, 0.95, 0.96, 0.97],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Accuracy',
          marker: { color: '#2196F3' }
        },
        {
          x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          y: [0.72, 0.68, 0.45, 0.32, 0.25, 0.20, 0.15, 0.12, 0.10, 0.08],
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Loss',
          marker: { color: '#F44336' }
        }
      ],
      layout: {
        title: 'Training History',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 },
        legend: { font: { color: '#fff' } }
      },
      description: 'Training accuracy and loss over epochs.'
    },
    {
      title: 'Tumor Type Distribution',
      type: 'bar' as const,
      data: [
        {
          x: ['Glioma', 'Meningioma', 'Pituitary', 'Other'],
          y: [45, 30, 20, 5],
          type: 'bar',
          marker: {
            color: ['#9C27B0', '#E91E63', '#3F51B5', '#00BCD4']
          }
        }
      ],
      layout: {
        title: 'Distribution by Tumor Type',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Distribution of different types of brain tumors in the dataset.'
    },
    {
      title: 'Model Performance',
      type: 'bar' as const,
      data: [
        {
          x: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'Specificity'],
          y: [0.97, 0.96, 0.95, 0.95, 0.98],
          type: 'bar',
          marker: {
            color: ['#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#009688']
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
      description: 'Performance metrics of the brain tumor detection model.'
    }
  ];

  // Custom prompt for brain tumor images
  const brainTumorPrompt = `You are analyzing a brain MRI image that has already been processed by our ML model for brain tumor detection. The ML model results will be provided to you if available.
  
  Your task is to provide a comprehensive analysis that builds upon the ML model's findings (if available) or provides a standalone assessment (if ML results are unavailable).
  
  Provide a detailed analysis with the following sections:
  
  1) Prediction: State whether the image shows signs of a brain tumor or not. If ML model results are available, incorporate this information.
  
  2) Confidence: Provide a percentage indicating your confidence level in the assessment. If ML model confidence is available, reference it and provide your own assessment.
  
  3) Type: Specify the exact type of tumor or abnormality identified, if any.
  
  4) Risk Level: Indicate the severity or risk level (Low, Moderate, High) based on the findings.
  
  5) Detailed Analysis: Provide a thorough description of all visible features, abnormalities, and diagnostic insights. If the ML model has identified specific features, elaborate on these.
  
  6) Recommendations: Suggest appropriate next steps, further tests, or treatments.
  
  7) Precautions: List any precautions or lifestyle modifications that might be beneficial.
  
  Format your response clearly with these labeled sections. If you cannot determine something with confidence, state this clearly rather than making assumptions.`;

  // Handle the prediction result
  const handlePredictionResult = (result: any) => {
    if ('analysis' in result) {
      setBrainTumorAnalysis(result as BrainTumorResult);
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
            <Icon icon={FaBrain} className="text-4xl text-purple-500" />
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Brain Tumor Detection
            </motion.h1>
          </div>
          <motion.p
            variants={itemVariants}
            className="text-lg text-white/80 max-w-3xl mx-auto"
          >
            Upload a brain MRI scan for AI-powered tumor detection and analysis
          </motion.p>
        </motion.div>

        {/* Banner Image */}
        <motion.div
          variants={itemVariants}
          className="relative w-full max-w-4xl mx-auto aspect-[16/7] mb-8 rounded-2xl overflow-hidden"
        >
          <Image
            src="/images/tumor.jpg"
            alt="Brain Tumor Detection"
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
                <Icon icon={FaUpload} className="text-2xl text-purple-500 shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">Upload MRI Scan</h2>
                  <p className="text-white/60 text-sm">Upload a brain MRI scan for AI-powered analysis</p>
                </div>
              </div>


              
              <div className="flex-grow overflow-auto custom-scrollbar pr-2 mb-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <div className="flex gap-2 mb-2">
                    <FaInfoCircle className="text-purple-400 mt-1 shrink-0" />
                    <div>
                      <h3 className="text-white font-medium">AI-Powered Detection</h3>
                      <p className="text-white/60 text-sm">
                        Our AI model will analyze your brain MRI scan and provide a comprehensive assessment 
                        including tumor detection, confidence level, risk assessment, and detailed findings.
                      </p>
                    </div>
                  </div>
                </div>

                <ImageUpload 
                  onPredictionResult={handlePredictionResult}
                  setIsLoading={setIsLoading}
                  customPrompt={brainTumorPrompt}
                  diseaseType="brain_tumor"
                />
              </div>
            </div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key="analysis-container"
                initial="collapsed"
                animate={brainTumorAnalysis ? "expanded" : "collapsed"}
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
                {brainTumorAnalysis ? (
                  <>
                    <div className="flex items-start gap-3 mb-6">
                      <FaFileMedical className="text-2xl text-purple-500 shrink-0 mt-1" />
                      <div>
                        <h2 className="text-2xl font-semibold text-white mb-1">Analysis Results</h2>
                        <p className="text-white/60 text-sm">AI-powered brain tumor detection</p>
                      </div>
                    </div>
                    <AnalysisResult 
                      title="Brain Tumor Analysis Results"
                      analysis={brainTumorAnalysis?.analysis || ''}
                      diseaseType="brain_tumor"
                      result={brainTumorAnalysis}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full py-8">
                    <Image 
                      src="/images/brain.webp" 
                      alt="Brain Tumor Analysis" 
                      width={150} 
                      height={150}
                      className="mx-auto mb-6 rounded-xl opacity-70"
                    />
                    <h3 className="text-2xl font-semibold text-white mb-2">No Analysis Yet</h3>
                    <p className="text-white/60 max-w-md">
                      Upload a brain MRI scan to receive a detailed AI analysis and tumor detection results.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                      <FaHeartbeat className="text-purple-400" />
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Brain Tumor Research</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Data visualizations and model development for brain tumor detection
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-200px)] min-h-[800px] overflow-hidden">
          <NotebookViewer 
            notebookPath="brain_tumor.ipynb" 
            visualizations={brainTumorVisualizations} 
          />
        </motion.div>
      </motion.div>
    </div>
  );

  // Define tabs for the TabView component
  const tabs = [
    {
      id: 'analysis',
      label: 'Tumor Detection',
      icon: FaBrain,
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
        themeColor="#a855f7" // Purple color for brain tumor theme
      />
    </div>
  );
}
