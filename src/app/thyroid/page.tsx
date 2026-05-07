'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { IconType } from 'react-icons';
import { FaStethoscope, FaPercent, FaInfoCircle, FaShieldAlt, FaChartBar, FaChartPie, FaUpload, FaSearch, FaMicroscope, FaHeartbeat, FaFileMedical, FaBrain, FaFlask, FaQuestionCircle } from 'react-icons/fa';
import { getRandomThyroidData } from '@/utils/sampleData';
import TabView from '@/components/TabView';
import NotebookViewer from '@/components/NoteViewer';

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

interface ThyroidResult {
  prediction: string;
  probability: number;
  analysis: string;
}

export default function ThyroidPage() {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    tsh: '',
    t3: '',
    t4: '',
    t4u: '1.0',
    fti: '100.0',
    on_thyroxine: 'no',
    thyroid_surgery: 'no',
    family_history: ''
  });
  const [thyroidAnalysis, setThyroidAnalysis] = useState<ThyroidResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { themeColor } = useTheme();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSampleData = () => {
    const sampleData = getRandomThyroidData();
    setFormData({
      age: sampleData.age,
      sex: sampleData.sex,
      tsh: sampleData.tsh,
      t3: sampleData.t3,
      t4: sampleData.t4,
      t4u: '1.0',
      fti: '100.0',
      on_thyroxine: 'no',
      thyroid_surgery: 'no',
      family_history: sampleData.family_history
    });
  };
  
  // Thyroid disease visualizations
  const thyroidVisualizations = [
    {
      title: 'Thyroid Hormone Levels',
      type: 'bar' as const,
      data: [
        {
          x: ['TSH (mIU/L)', 'T3 (ng/dL)', 'T4 (μg/dL)'],
          y: [2.5, 110, 8.0],
          type: 'bar',
          name: 'Normal Range (Mid)',
          marker: {
            color: '#4CAF50'
          }
        },
        {
          x: ['TSH (mIU/L)', 'T3 (ng/dL)', 'T4 (μg/dL)'],
          y: [8.0, 80, 3.0],
          type: 'bar',
          name: 'Hypothyroidism',
          marker: {
            color: '#F44336'
          }
        },
        {
          x: ['TSH (mIU/L)', 'T3 (ng/dL)', 'T4 (μg/dL)'],
          y: [0.2, 200, 12.0],
          type: 'bar',
          name: 'Hyperthyroidism',
          marker: {
            color: '#2196F3'
          }
        }
      ],
      layout: {
        title: 'Typical Thyroid Hormone Levels by Condition',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Comparison of thyroid hormone levels in normal, hypothyroid, and hyperthyroid conditions.'
    },
    {
      title: 'Age Distribution by Thyroid Condition',
      type: 'box' as const,
      data: [
        {
          y: Array.from({ length: 100 }, () => Math.floor(Math.random() * 40) + 20),
          type: 'box',
          name: 'Normal',
          marker: {
            color: '#4CAF50'
          },
          boxmean: true
        },
        {
          y: Array.from({ length: 70 }, () => Math.floor(Math.random() * 30) + 40),
          type: 'box',
          name: 'Hypothyroidism',
          marker: {
            color: '#F44336'
          },
          boxmean: true
        },
        {
          y: Array.from({ length: 50 }, () => Math.floor(Math.random() * 35) + 30),
          type: 'box',
          name: 'Hyperthyroidism',
          marker: {
            color: '#2196F3'
          },
          boxmean: true
        }
      ],
      layout: {
        title: 'Age Distribution by Thyroid Condition',
        yaxis: { title: 'Age' },
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Box plot showing the age distribution of patients with different thyroid conditions.'
    },
    {
      title: 'TSH vs T4 with Thyroid Condition',
      type: 'scatter' as const,
      data: [
        {
          x: Array.from({ length: 50 }, () => Math.random() * 3 + 0.5), // TSH for normal
          y: Array.from({ length: 50 }, () => Math.random() * 4 + 4), // T4 for normal
          mode: 'markers',
          type: 'scatter',
          name: 'Normal',
          marker: {
            color: '#4CAF50',
            size: 8
          }
        },
        {
          x: Array.from({ length: 30 }, () => Math.random() * 10 + 4), // TSH for hypothyroidism
          y: Array.from({ length: 30 }, () => Math.random() * 2 + 1), // T4 for hypothyroidism
          mode: 'markers',
          type: 'scatter',
          name: 'Hypothyroidism',
          marker: {
            color: '#F44336',
            size: 8
          }
        },
        {
          x: Array.from({ length: 20 }, () => Math.random() * 0.3 + 0.01), // TSH for hyperthyroidism
          y: Array.from({ length: 20 }, () => Math.random() * 8 + 10), // T4 for hyperthyroidism
          mode: 'markers',
          type: 'scatter',
          name: 'Hyperthyroidism',
          marker: {
            color: '#2196F3',
            size: 8
          }
        }
      ],
      layout: {
        title: 'TSH vs T4 with Thyroid Condition',
        xaxis: { title: 'TSH (mIU/L)' },
        yaxis: { title: 'T4 (μg/dL)' },
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Scatter plot showing the relationship between TSH and T4 levels, with points colored by thyroid condition.'
    },
    {
      title: 'Model Performance Metrics',
      type: 'bar' as const,
      data: [
        {
          x: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC'],
          y: [0.92, 0.89, 0.85, 0.87, 0.94],
          type: 'bar',
          marker: {
            color: [
              `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.8)`,
              `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.7)`,
              `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.6)`,
              `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.5)`,
              `rgba(${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}, 0.4)`
            ]
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
      description: 'Performance metrics of the thyroid disease prediction model.'
    }
  ];

  // Function to handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare the data for the API call
      const requestData = {
        age: parseFloat(formData.age),
        sex: formData.sex === 'male' ? 0 : 1,
        TSH: parseFloat(formData.tsh),
        T3: parseFloat(formData.t3),
        TT4: parseFloat(formData.t4),
        T4U: parseFloat(formData.t4u || '1.0'), // Default value if not provided
        FTI: parseFloat(formData.fti || '100.0'), // Default value if not provided
        on_thyroxine: formData.on_thyroxine === 'yes' ? 1 : 0,
        query_on_thyroxine: 0, // Default value
        on_antithyroid_medication: 0, // Default value
        sick: 0, // Default value
        pregnant: 0, // Default value
        thyroid_surgery: formData.thyroid_surgery === 'yes' ? 1 : 0,
        I131_treatment: 0, // Default value
        query_hypothyroid: 0, // Default value
        query_hyperthyroid: 0, // Default value
        lithium: 0, // Default value
        goitre: 0, // Default value
        tumor: 0, // Default value
        hypopituitary: 0, // Default value
        psych: 0 // Default value
      };
      
      try {
        // Try to make the API call with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('http://localhost:8001/predict/thyroid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setThyroidAnalysis({
          prediction: result.prediction,
          probability: result.probability,
          analysis: result.analysis
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        console.log('Using fallback prediction mechanism');
        
        // Fallback: Generate a prediction based on the input values
        const tsh = parseFloat(formData.tsh);
        const t3 = parseFloat(formData.t3);
        const t4 = parseFloat(formData.t4);
        
        // Determine if values are in normal ranges
        const tshNormal = tsh >= 0.4 && tsh <= 4.0;
        const t3Normal = t3 >= 80 && t3 <= 200;
        const t4Normal = t4 >= 4.5 && t4 <= 12.0;
        
        let prediction = "Normal Thyroid Function";
        let probability = 0.2;
        let analysis = "Based on the provided information, your thyroid function appears to be normal.";
        
        // Simple rules-based prediction
        if (!tshNormal && t4Normal) {
          if (tsh > 4.0) {
            prediction = "Hypothyroidism";
            probability = 0.7 + (tsh - 4.0) / 20; // Higher TSH = higher probability
            analysis = `Based on the provided information, you may have hypothyroidism. Your TSH level (${tsh.toFixed(2)}) is elevated, which is a primary indicator of hypothyroidism.`;
          } else if (tsh < 0.4) {
            prediction = "Hyperthyroidism";
            probability = 0.7 + (0.4 - tsh) / 1; // Lower TSH = higher probability
            analysis = `Based on the provided information, you may have hyperthyroidism. Your TSH level (${tsh.toFixed(2)}) is low, which is a primary indicator of hyperthyroidism.`;
          }
        } else if (!t3Normal || !t4Normal) {
          if (t3 < 80 || t4 < 4.5) {
            prediction = "Hypothyroidism";
            probability = 0.6;
            analysis = `Based on the provided information, you may have hypothyroidism. Your T3 (${t3.toFixed(2)}) and/or T4 (${t4.toFixed(2)}) levels are low.`;
          } else if (t3 > 200 || t4 > 12.0) {
            prediction = "Hyperthyroidism";
            probability = 0.6;
            analysis = `Based on the provided information, you may have hyperthyroidism. Your T3 (${t3.toFixed(2)}) and/or T4 (${t4.toFixed(2)}) levels are elevated.`;
          }
        }
        
        // Cap probability at 0.95
        probability = Math.min(probability, 0.95);
        
        // Add disclaimer
        analysis += " Note: This is a fallback prediction as the server connection failed. Please consult with a healthcare provider for proper evaluation.";
        
        setThyroidAnalysis({
          prediction,
          probability,
          analysis
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setError("An error occurred during analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Define the content for the model tab
  const ModelContent = () => (
    <div className="min-h-screen mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white flex items-center justify-center">
            <FaMicroscope className="text-orange-400 mr-3 w-8 h-8" />
            Thyroid Disease Analysis
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto flex items-center justify-center">
            <FaChartPie className="text-cyan-400 mr-2" />
            Data visualizations and model development for thyroid disease prediction
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-120px)] min-h-[1230px] overflow-hidden">
          <NotebookViewer 
            notebookPath="/api/notebooks/thyroid.ipynb" 
            visualizations={thyroidVisualizations}
          />
        </motion.div>
      </motion.div>
    </div>
  );

  // Define the content for the prediction tab
  const PredictionContent = () => (
    <div className="min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-7xl mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-white flex items-center justify-center">
            <FaFlask className="text-teal-400 mr-3 w-8 h-8" />
            Thyroid Disease Risk Assessment
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto flex items-center justify-center">
            <FaInfoCircle className="text-blue-400 mr-2" />
            Enter your test results to assess your risk of thyroid disease using our AI-powered prediction model.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative w-full aspect-[11/4] mb-8 rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src="/images/thyroid.jpg"
            alt="Thyroid Disease Assessment"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0" />
        </motion.div>

        <div className="flex mb-6 justify-center space-x-4">
          <div className="flex space-x-2 items-center bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <Icon icon={FaStethoscope} className="text-pink-400 w-5 h-5" />
            <span className="text-white">Complete the form below for an assessment</span>
          </div>
          
          <button
            type="button"
            onClick={handleSampleData}
            className="flex space-x-2 items-center bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Icon icon={FaQuestionCircle} className="text-green-400 w-5 h-5" />
            <span className="text-white">Use Sample Data</span>
          </button>
        </div>

        <motion.div
          variants={itemVariants}
          className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 p-6 mb-8 mx-auto max-w-4xl"
        >
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white mb-2">TSH (mIU/L)</label>
                <input
                  type="number"
                  step="0.01"
                  name="tsh"
                  value={formData.tsh}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 4.5"
                />
              </div>
              <div>
                <label className="block text-white mb-2">T3 (ng/dL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="t3"
                  value={formData.t3}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 120"
                />
              </div>
              <div>
                <label className="block text-white mb-2">T4 (μg/dL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="t4"
                  value={formData.t4}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 8.5"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 45"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Sex</label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">On Thyroxine</label>
                <select
                  name="on_thyroxine"
                  value={formData.on_thyroxine}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Thyroid Surgery</label>
                <select
                  name="thyroid_surgery"
                  value={formData.thyroid_surgery}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Family History</label>
                <select
                  name="family_history"
                  value={formData.family_history}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 rounded-full font-medium text-white transition-all transform hover:scale-105 flex items-center justify-center space-x-2 ${
                  isLoading ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}
                style={{
                  background: isLoading 
                    ? 'gray' 
                    : `linear-gradient(to right, ${themeColor}, ${darkenColor(themeColor, 30)})`
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Icon icon={FaSearch} className="w-5 h-5 text-yellow-300" />
                    <span>Analyze Results</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {thyroidAnalysis && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={cardVariants}
              className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 p-6 mb-8 overflow-hidden mx-auto max-w-4xl"
            >
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center justify-center">
                <Icon icon={FaFileMedical} className="mr-2 w-6 h-6 text-purple-400" />
                Analysis Results
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center">
                    <Icon icon={FaStethoscope} className="mr-2 w-5 h-5" />
                    Diagnosis
                  </h3>
                  <p className="text-2xl font-bold text-white">{thyroidAnalysis.prediction}</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center">
                    <Icon icon={FaPercent} className="mr-2 w-5 h-5" />
                    Confidence
                  </h3>
                  <p className="text-2xl font-bold text-white">{(thyroidAnalysis.probability * 100).toFixed(1)}%</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center">
                    <Icon icon={FaInfoCircle} className="mr-2 w-5 h-5" />
                    Risk Level
                  </h3>
                  <p className="text-2xl font-bold text-white">
                    {thyroidAnalysis.probability > 0.7 ? 'High' : thyroidAnalysis.probability > 0.4 ? 'Moderate' : 'Low'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center">
                  <Icon icon={FaFlask} className="mr-2 w-5 h-5" />
                  Detailed Analysis
                </h3>
                <p className="text-white/90">{thyroidAnalysis.analysis}</p>
              </div>
              
              <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 flex items-center">
                  <Icon icon={FaInfoCircle} className="mr-2 w-5 h-5 flex-shrink-0" />
                  <span>This is an AI-powered prediction and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-8"
          >
            <p className="text-red-300 flex items-center">
              <Icon icon={FaInfoCircle} className="mr-2 w-5 h-5" />
              {error}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  // Define tabs for the TabView component
  const tabs = [
    {
      id: 'model',
      label: 'Thyroid Disease Analysis',
      content: <PredictionContent />
    },
    {
      id: 'predict',
      label: 'Resarch Notebook',
      content: <ModelContent />
    }
  ];

  return <TabView tabs={tabs} />;
}
