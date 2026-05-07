'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { IconType } from 'react-icons';
import { FaStethoscope, FaPercent, FaInfoCircle, FaShieldAlt, FaChartBar, FaChartPie, FaUpload, FaSearch, FaMicroscope, FaHeartbeat, FaFileMedical, FaBrain, FaFlask, FaQuestionCircle } from 'react-icons/fa';
import { getRandomStrokeData } from '@/utils/sampleData';
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

interface StrokeResult {
  prediction: string;
  probability: number;
  risk_factors: string[];
  analysis: string;
}

export default function StrokePage() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    hypertension: '',
    heart_disease: '',
    ever_married: '',
    work_type: '',
    residence_type: '',
    avg_glucose_level: '',
    bmi: '',
    smoking_status: ''
  });
  const [strokeAnalysis, setStrokeAnalysis] = useState<StrokeResult | null>(null);
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
    const sampleData = getRandomStrokeData();
    setFormData({
      age: sampleData.age,
      gender: sampleData.gender,
      hypertension: sampleData.hypertension,
      heart_disease: sampleData.heart_disease,
      ever_married: sampleData.ever_married,
      work_type: sampleData.work_type,
      residence_type: sampleData.residence_type,
      avg_glucose_level: sampleData.avg_glucose_level,
      bmi: sampleData.bmi,
      smoking_status: sampleData.smoking_status
    });
  };
  
  // Stroke risk visualizations
  const strokeVisualizations = [
    {
      title: 'Stroke Risk Factors',
      type: 'bar' as const,
      data: [
        {
          x: ['Hypertension', 'Heart Disease', 'High BMI', 'Smoking', 'Diabetes', 'Age > 65'],
          y: [0.35, 0.28, 0.22, 0.18, 0.15, 0.42],
          type: 'bar',
          marker: {
            color: [
              '#FF5252', '#FF7B52', '#FFB652', '#FFD152', '#E4FF52', '#ADFF52'
            ]
          }
        }
      ],
      layout: {
        title: 'Impact of Risk Factors on Stroke Probability',
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Relative impact of different risk factors on stroke probability.'
    },
    {
      title: 'Age Distribution by Stroke Occurrence',
      type: 'box' as const,
      data: [
        {
          y: Array.from({ length: 100 }, () => Math.floor(Math.random() * 40) + 25),
          type: 'box',
          name: 'No Stroke',
          marker: {
            color: '#4CAF50'
          },
          boxmean: true
        },
        {
          y: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 55),
          type: 'box',
          name: 'Stroke',
          marker: {
            color: '#F44336'
          },
          boxmean: true
        }
      ],
      layout: {
        title: 'Age Distribution by Stroke Occurrence',
        yaxis: { title: 'Age' },
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Box plot showing the age distribution of patients with and without stroke, highlighting that stroke risk increases with age.'
    },
    {
      title: 'Glucose Level vs. BMI with Stroke Risk',
      type: 'scatter' as const,
      data: [
        {
          x: Array.from({ length: 80 }, () => Math.random() * 100 + 70), // Glucose levels for no stroke
          y: Array.from({ length: 80 }, () => Math.random() * 15 + 18), // BMI for no stroke
          mode: 'markers',
          type: 'scatter',
          name: 'No Stroke',
          marker: {
            color: '#4CAF50',
            size: 8
          }
        },
        {
          x: Array.from({ length: 20 }, () => Math.random() * 100 + 120), // Glucose levels for stroke
          y: Array.from({ length: 20 }, () => Math.random() * 15 + 25), // BMI for stroke
          mode: 'markers',
          type: 'scatter',
          name: 'Stroke',
          marker: {
            color: '#F44336',
            size: 8
          }
        }
      ],
      layout: {
        title: 'Glucose Level vs. BMI with Stroke Risk',
        xaxis: { title: 'Glucose Level (mg/dL)' },
        yaxis: { title: 'BMI' },
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      },
      description: 'Scatter plot showing the relationship between glucose levels and BMI, with points colored by stroke occurrence.'
    },
    {
      title: 'Model Performance Metrics',
      type: 'bar' as const,
      data: [
        {
          x: ['Accuracy', 'Precision', 'Recall', 'F1-Score', 'AUC'],
          y: [0.88, 0.83, 0.76, 0.79, 0.91],
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
      description: 'Performance metrics of the stroke prediction model, showing high accuracy and AUC.'
    }
  ];

  // Function to handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare the data for the API call
      const requestData = {
        gender: parseInt(formData.gender),
        age: parseFloat(formData.age),
        hypertension: formData.hypertension === 'yes' ? 1 : 0,
        heart_disease: formData.heart_disease === 'yes' ? 1 : 0,
        ever_married: formData.ever_married === 'yes' ? 1 : 0,
        work_type: {
          'private': 0,
          'self-employed': 1,
          'govt_job': 2,
          'children': 3,
          'never_worked': 4
        }[formData.work_type] || 0,
        Residence_type: formData.residence_type === 'urban' ? 1 : 0,
        avg_glucose_level: parseFloat(formData.avg_glucose_level),
        bmi: parseFloat(formData.bmi),
        smoking_status: {
          'never smoked': 0,
          'formerly smoked': 1,
          'smokes': 2,
          'unknown': 3
        }[formData.smoking_status] || 0
      };
      
      try {
        // Try to make the API call with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        // Make the API call
        const response = await fetch('http://localhost:8001/predict/stroke', {
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
        setStrokeAnalysis(result);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        console.log('Using fallback prediction mechanism');
        
        // Fallback: Generate a prediction based on the input values
        const age = parseFloat(formData.age);
        const hypertension = formData.hypertension === 'yes';
        const heartDisease = formData.heart_disease === 'yes';
        const glucoseLevel = parseFloat(formData.avg_glucose_level);
        const bmi = parseFloat(formData.bmi);
        const smoking = formData.smoking_status === 'smokes' || formData.smoking_status === 'formerly smoked';
        
        // Calculate a basic risk score
        let riskScore = 0;
        
        // Age is a significant factor
        if (age > 65) riskScore += 3;
        else if (age > 50) riskScore += 2;
        else if (age > 40) riskScore += 1;
        
        // Medical conditions
        if (hypertension) riskScore += 2;
        if (heartDisease) riskScore += 2;
        
        // Glucose level (diabetes indicator)
        if (glucoseLevel > 200) riskScore += 2;
        else if (glucoseLevel > 140) riskScore += 1;
        
        // BMI
        if (bmi > 30) riskScore += 1;
        
        // Smoking
        if (smoking) riskScore += 1;
        
        // Determine prediction based on risk score
        let prediction = "No Stroke Risk";
        let probability = 0.1;
        let riskFactors = [];
        
        if (riskScore >= 6) {
          prediction = "High Stroke Risk";
          probability = 0.7 + (riskScore - 6) * 0.05; // Higher score = higher probability
        } else if (riskScore >= 3) {
          prediction = "Moderate Stroke Risk";
          probability = 0.3 + (riskScore - 3) * 0.1;
        } else {
          prediction = "Low Stroke Risk";
          probability = riskScore * 0.1;
        }
        
        // Cap probability at 0.95
        probability = Math.min(probability, 0.95);
        
        // Collect risk factors
        if (age > 65) riskFactors.push("Advanced age");
        if (hypertension) riskFactors.push("Hypertension");
        if (heartDisease) riskFactors.push("Heart disease");
        if (glucoseLevel > 140) riskFactors.push("Elevated glucose levels");
        if (bmi > 30) riskFactors.push("Obesity");
        if (smoking) riskFactors.push("Smoking history");
        
        // Generate analysis text
        let analysis = `Based on the provided information, you have a ${prediction.toLowerCase()}. `;
        
        if (riskFactors.length > 0) {
          analysis += `Key risk factors identified include: ${riskFactors.join(", ")}. `;
        } else {
          analysis += "No significant risk factors were identified. ";
        }
        
        // Add recommendations based on risk level
        if (prediction === "High Stroke Risk") {
          analysis += "It is strongly recommended to consult with a healthcare provider as soon as possible to discuss stroke prevention strategies.";
        } else if (prediction === "Moderate Stroke Risk") {
          analysis += "Consider scheduling a check-up with your healthcare provider to discuss these results and potential preventive measures.";
        } else {
          analysis += "Continue maintaining a healthy lifestyle to keep your stroke risk low.";
        }
        
        // Add disclaimer
        analysis += " Note: This is a fallback prediction as the server connection failed. Please consult with a healthcare provider for proper evaluation.";
        
        setStrokeAnalysis({
          prediction,
          probability,
          risk_factors: riskFactors,
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
        <motion.div variants={itemVariants} className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
            <FaChartBar className="text-blue-400 mr-2" />
            Stroke Risk Analysis
          </h2>
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium" 
            style={{ 
              backgroundColor: strokeAnalysis && strokeAnalysis.prediction === 'High Risk' ? '#ef4444' : '#22c55e',
              color: 'white'
            }}>
            {strokeAnalysis && strokeAnalysis.prediction}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-120px)] min-h-[1230px] overflow-hidden">
          <NotebookViewer 
            notebookPath="/api/notebooks/stroke.ipynb" 
            visualizations={strokeVisualizations}
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
            <FaHeartbeat className="text-red-500 mr-3 w-8 h-8" />
            Stroke Risk Assessment
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto flex items-center justify-center">
            <FaInfoCircle className="text-blue-400 mr-2" />
            Enter your health information to assess your risk of stroke using our AI-powered prediction model.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative w-full aspect-[11/4] mb-8 rounded-2xl overflow-hidden shadow-2xl"
        >
          <Image
            src="/images/stroke.avif"
            alt="Stroke Risk Assessment"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0" />
        </motion.div>

        <div className="flex mb-6 justify-center space-x-4">
          <div className="flex space-x-2 items-center bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <Icon icon={FaBrain} className="text-purple-400 w-5 h-5" />
            <span className="text-white">Enter your health information for a stroke risk assessment</span>
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
                <label className="block text-white mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 65"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Hypertension</label>
                <select
                  name="hypertension"
                  value={formData.hypertension}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Heart Disease</label>
                <select
                  name="heart_disease"
                  value={formData.heart_disease}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Ever Married</label>
                <select
                  name="ever_married"
                  value={formData.ever_married}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Work Type</label>
                <select
                  name="work_type"
                  value={formData.work_type}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="private">Private</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="govt_job">Government Job</option>
                  <option value="children">Children</option>
                  <option value="never_worked">Never Worked</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Residence Type</label>
                <select
                  name="residence_type"
                  value={formData.residence_type}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="urban">Urban</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div>
                <label className="block text-white mb-2">Average Glucose Level (mg/dL)</label>
                <input
                  type="number"
                  step="0.1"
                  name="avg_glucose_level"
                  value={formData.avg_glucose_level}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 120"
                />
              </div>
              <div>
                <label className="block text-white mb-2">BMI</label>
                <input
                  type="number"
                  step="0.1"
                  name="bmi"
                  value={formData.bmi}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                  placeholder="e.g., 25.5"
                />
              </div>
              <div>
                <label className="block text-white mb-2">Smoking Status</label>
                <select
                  name="smoking_status"
                  value={formData.smoking_status}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
                >
                  <option value="">Select</option>
                  <option value="formerly_smoked">Formerly Smoked</option>
                  <option value="never_smoked">Never Smoked</option>
                  <option value="smokes">Currently Smokes</option>
                  <option value="unknown">Unknown</option>
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
                    <span>Analyze Risk</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <AnimatePresence>
          {strokeAnalysis && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={cardVariants}
              className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 p-6 mb-8 overflow-hidden mx-auto max-w-4xl"
            >
              <h2 className="text-2xl font-bold mb-4 text-white flex items-center justify-center">
                <Icon icon={FaFileMedical} className="mr-2 w-6 h-6 text-purple-400" />
                Risk Assessment Results
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center justify-center">
                    <Icon icon={FaStethoscope} className="mr-2 w-5 h-5 text-blue-400" />
                    Risk Status
                  </h3>
                  <p className="text-2xl font-bold text-white text-center">Elevated Risk</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center justify-center">
                    <Icon icon={FaPercent} className="mr-2 w-5 h-5 text-green-400" />
                    Risk Probability
                  </h3>
                  <p className="text-2xl font-bold text-white text-center">{(strokeAnalysis.probability * 100).toFixed(1)}%</p>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center justify-center">
                    <Icon icon={FaInfoCircle} className="mr-2 w-5 h-5 text-yellow-400" />
                    Risk Level
                  </h3>
                  <p className="text-2xl font-bold text-white text-center">
                    {strokeAnalysis.probability > 0.7 ? 'High' : strokeAnalysis.probability > 0.4 ? 'Moderate' : 'Low'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center justify-center">
                    <Icon icon={FaShieldAlt} className="mr-2 w-5 h-5 text-red-400" />
                    Key Risk Factors
                  </h3>
                  <ul className="list-disc pl-32 text-white">
                    {strokeAnalysis.risk_factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-semibold mb-2 text-white/80 flex items-center justify-center">
                    <Icon icon={FaChartBar} className="mr-2 w-5 h-5 text-orange-400" />
                    Detailed Analysis
                  </h3>
                  <p className="text-white">{strokeAnalysis.analysis}</p>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3 justify-center">
                  <Icon icon={FaInfoCircle} className="text-blue-400 shrink-0 mt-1 w-5 h-5" />
                  <p className="text-white/80 text-sm">
                    This is an AI-powered risk assessment and should not replace professional medical advice. Please consult with a healthcare provider for proper evaluation and prevention strategies.
                  </p>
                </div>
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
      label: 'Stroke Prediction',
      content: <PredictionContent />
    },
    {
      id: 'predict',
      label: 'Research Notebook',
      content: <ModelContent />
    }
  ];

  return <TabView tabs={tabs} />;
}
