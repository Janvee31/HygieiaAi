'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import Select from 'react-select';
import { IconType } from 'react-icons';
import { FaStethoscope, FaPercent, FaInfoCircle, FaShieldAlt, FaSearch, FaQuoteLeft } from 'react-icons/fa';
import TabView from '@/components/TabView';
import NotebookViewer from '@/components/NoteViewer';

// Create a wrapper component for icons
const Icon = ({ icon: IconComponent, className }: { icon: IconType; className?: string }) => {
  return <IconComponent className={className} />;
};

const RadialProgress = ({ value }: { value: number }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (100 - value) / 100 * circumference;
  const severity = value >= 70 ? 'High Risk' : value >= 40 ? 'Moderate Risk' : 'Low Risk';
  const color = value >= 70 ? '#ef4444' : value >= 40 ? '#eab308' : '#22c55e';

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-700"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-2xl font-bold" style={{ color }}>{value}%</span>
        <span className="text-sm opacity-80">{severity}</span>
      </div>
    </div>
  );
};

const motivationalQuotes = [
  `Your health is an investment, not an expense.
  "Taking care of your health is akin to investing in your future self. By prioritizing your well-being today, you ensure that you can enjoy a vibrant and fulfilling life tomorrow. Remember, every positive choice you make for your health pays dividends in vitality, longevity, and overall happiness. Treat your body with the care and respect it deserves, knowing that each investment in your health is a step towards a more prosperous and rewarding future."`,

  `Take care of your body, it's the only place you have to live.
  "Your body is your sanctuary, the vessel through which you experience life's wonders. Nourish it with wholesome foods, exercise that invigorates, and rest that rejuvenates. By cherishing your body's capabilities and respecting its limits, you cultivate a harmonious relationship with yourself. Remember, self-care is not selfish; it's a fundamental responsibility to cherish and safeguard the one place you must reside in throughout your journey."`,

  `Wellness is not a luxury, it's a necessity.
  "True wellness encompasses more than physical health; it encompasses mental clarity, emotional resilience, and spiritual equilibrium. Prioritize practices that promote balance in all aspects of your life, from mindful meditation to nourishing relationships. Embrace wellness as a vital pillar of your existence, recognizing that by nurturing your holistic well-being, you empower yourself to thrive amidst life's challenges and triumphs."`,

  `Prevention is better than cure.
  "Proactively safeguard your health through preventive measures that mitigate risks and promote longevity. Regular exercise, a balanced diet, and routine health screenings are proactive steps towards maintaining optimal well-being. By investing in prevention today, you minimize the likelihood of future health complications, ensuring a future characterized by vitality and resilience. Remember, prevention not only saves lives but enhances the quality of life by fostering a foundation of robust health."`,

  `Your body hears everything your mind says.
  "Cultivate a mindset that uplifts and empowers your body, recognizing the profound connection between mental health and physical well-being. Positive affirmations and a compassionate inner dialogue nurture a harmonious relationship between mind and body. Listen to your body's signals with attentiveness and respond with kindness, knowing that the thoughts you harbor profoundly influence your overall health and vitality."`,

  `Health is not valued till sickness comes.
  "Appreciate the gift of health by embracing proactive habits that prioritize your well-being daily. Recognize that good health is a priceless asset that deserves diligent care and attention. Through mindfulness and intentional self-care practices, you fortify your body's resilience and enhance its capacity to thrive. Value your health as a cherished treasure, recognizing that its preservation enriches every facet of your life with vibrancy and fulfillment."`,

  `The greatest wealth is health.
  "Health is the cornerstone upon which a fulfilling life is built. Its intrinsic value surpasses material possessions, for without health, all other pursuits lose their significance. Invest in your health with the same fervor and dedication as you would in the pursuit of wealth, knowing that true prosperity resides in the vitality and well-being that health affords. Embrace healthy habits as a testament to your commitment to living a life enriched by vitality, longevity, and profound well-being."`,

  `A healthy outside starts from the inside.
  "True radiance emanates from within, fueled by nourishment that sustains both body and soul. Embrace wholesome nutrition, mindful movement, and inner peace as cornerstones of your journey towards holistic health. By prioritizing inner balance and self-care, you cultivate a resilient foundation upon which external vitality flourishes. Remember, the glow of health is a reflection of your inner harmony, illuminating your path towards a life imbued with vitality, resilience, and enduring well-being."`,
];

// List of all symptoms from the dataset
const symptoms = [
  'abdominal_pain', 'abnormal_menstruation', 'acidity', 'acute_liver_failure',
  'altered_sensorium', 'anxiety', 'back_pain', 'belly_pain', 'blackheads',
  'bladder_discomfort', 'blister', 'blood_in_sputum', 'bloody_stool',
  'blurred_and_distorted_vision', 'breathlessness', 'brittle_nails',
  'bruising', 'burning_micturition', 'chest_pain', 'chills',
  'cold_hands_and_feets', 'coma', 'congestion', 'constipation',
  'continuous_feel_of_urine', 'continuous_sneezing', 'cough', 'cramps',
  'dark_urine', 'dehydration', 'depression', 'diarrhoea', 'dischromic_patches',
  'distention_of_abdomen', 'dizziness', 'drying_and_tingling_lips',
  'enlarged_thyroid', 'excessive_hunger', 'extra_marital_contacts',
  'family_history', 'fast_heart_rate', 'fatigue', 'fluid_overload',
  'fluid_overload.1', 'foul_smell_of_urine', 'headache', 'high_fever',
  'hip_joint_pain', 'history_of_alcohol_consumption', 'increased_appetite',
  'indigestion', 'inflammatory_nails', 'internal_itching', 'irregular_sugar_level',
  'irritability', 'irritation_in_anus', 'itching', 'joint_pain', 'knee_pain',
  'lack_of_concentration', 'lethargy', 'loss_of_appetite', 'loss_of_balance',
  'loss_of_smell', 'malaise', 'mild_fever', 'mood_swings',
  'movement_stiffness', 'mucoid_sputum', 'muscle_pain', 'muscle_wasting',
  'muscle_weakness', 'nausea', 'neck_pain', 'nodal_skin_eruptions',
  'obesity', 'pain_behind_the_eyes', 'pain_during_bowel_movements',
  'pain_in_anal_region', 'painful_walking', 'palpitations', 'passage_of_gases',
  'patches_in_throat', 'phlegm', 'polyuria', 'prominent_veins_on_calf',
  'puffy_face_and_eyes', 'pus_filled_pimples', 'receiving_blood_transfusion',
  'receiving_unsterile_injections', 'red_sore_around_nose', 'red_spots_over_body',
  'redness_of_eyes', 'restlessness', 'runny_nose', 'rusty_sputum',
  'scurring', 'shivering', 'silver_like_dusting', 'sinus_pressure',
  'skin_peeling', 'skin_rash', 'slurred_speech', 'small_dents_in_nails',
  'spinning_movements', 'spotting_urination', 'stiff_neck', 'stomach_bleeding',
  'stomach_pain', 'sunken_eyes', 'sweating', 'swelled_lymph_nodes',
  'swelling_joints', 'swelling_of_stomach', 'swollen_blood_vessels',
  'swollen_extremeties', 'swollen_legs', 'throat_irritation',
  'toxic_look_typhos', 'ulcers_on_tongue', 'unsteadiness',
  'visual_disturbances', 'vomiting', 'watering_from_eyes',
  'weakness_in_limbs', 'weakness_of_one_body_side', 'weight_gain',
  'weight_loss', 'yellow_crust_ooze', 'yellow_urine', 'yellowing_of_eyes',
  'yellowish_skin'
].map(symptom => ({
  value: symptom,
  label: symptom.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}));

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface PredictionResult {
  prediction: string;
  probability: number;
  description: string;
  precautions: string[];
}

export default function DiseasePage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const { themeColor } = useTheme();

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const handleSymptomChange = (selected: any) => {
    setSelectedSymptoms(selected ? selected.map((item: any) => item.value) : []);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      console.log("Sending symptoms:", selectedSymptoms);  
      const response = await fetch('http://localhost:8001/predict/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms.map(s => s.toLowerCase())  
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get prediction');
      }

      const data = await response.json();
      setPrediction(data);
      // Get a new random quote when prediction is successful
      setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get prediction. Please try again.');
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Define interactive visualizations with Plotly data
  const diseaseVisualizations = [
    {
      title: 'Disease Prevalence by Age Group',
      type: 'bar' as const,
      data: [
        {
          x: ['18-30', '31-40', '41-50', '51-60', '61-70', '71+'],
          y: [15, 25, 35, 45, 40, 30],
          type: 'bar',
          marker: {
            color: ['rgba(55, 128, 191, 0.7)', 'rgba(55, 128, 191, 0.7)', 
                   'rgba(55, 128, 191, 0.7)', 'rgba(219, 64, 82, 0.7)', 
                   'rgba(219, 64, 82, 0.7)', 'rgba(219, 64, 82, 0.7)']
          }
        }
      ],
      layout: {
        title: 'Disease Prevalence by Age Group',
        xaxis: { title: 'Age Group' },
        yaxis: { title: 'Prevalence (%)' }
      },
      description: 'Distribution of disease prevalence across different age groups, showing increased risk in older populations.'
    },
    {
      title: 'Symptom Correlation Heatmap',
      type: 'heatmap' as const,
      data: [
        {
          z: [
            [1.0, 0.8, 0.6, 0.4, 0.2],
            [0.8, 1.0, 0.7, 0.5, 0.3],
            [0.6, 0.7, 1.0, 0.8, 0.5],
            [0.4, 0.5, 0.8, 1.0, 0.7],
            [0.2, 0.3, 0.5, 0.7, 1.0]
          ],
          x: ['Fever', 'Cough', 'Fatigue', 'Headache', 'Nausea'],
          y: ['Fever', 'Cough', 'Fatigue', 'Headache', 'Nausea'],
          type: 'heatmap',
          colorscale: 'Viridis'
        }
      ],
      layout: {
        title: 'Symptom Correlation Matrix',
        annotations: []
      },
      description: 'Correlation matrix showing relationships between common symptoms, helping identify symptom clusters.'
    },
    {
      title: 'Feature Importance for Disease Prediction',
      type: 'bar' as const,
      data: [
        {
          y: ['Age', 'BMI', 'Blood Pressure', 'Glucose Level', 'Family History'],
          x: [0.35, 0.25, 0.20, 0.15, 0.05],
          type: 'bar',
          orientation: 'h',
          marker: {
            color: 'rgba(55, 128, 191, 0.7)',
            line: {
              color: 'rgba(55, 128, 191, 1.0)',
              width: 1
            }
          }
        }
      ],
      layout: {
        title: 'Feature Importance',
        xaxis: { title: 'Importance Score' },
        yaxis: { title: 'Feature' }
      },
      description: 'Relative importance of different features in predicting disease risk, based on machine learning model analysis.'
    },
    {
      title: 'Disease Distribution by Type',
      type: 'pie' as const,
      data: [
        {
          values: [30, 20, 15, 10, 25],
          labels: ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Other'],
          type: 'pie',
          textinfo: 'label+percent',
          textposition: 'inside',
          marker: {
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
          }
        }
      ],
      layout: {
        title: 'Disease Distribution by Type'
      },
      description: 'Distribution of different disease categories in the dataset, showing prevalence of each type.'
    }
  ];

  // Content for the model tab
  const ModelContent = (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-5xl mx-auto py-8 px-4"
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Icon icon={FaStethoscope} className="text-4xl text-blue-500" />
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Disease Prediction with AI
          </motion.h1>
        </div>

        <motion.p
          variants={itemVariants}
          className="text-lg text-white/80"
        >
          Select your symptoms below and let our AI predict potential conditions
        </motion.p>
      </div>

      <motion.div
        variants={itemVariants}
        className="relative w-full aspect-[21/9] mb-8 rounded-2xl overflow-hidden"
      >
        <Image
          src="/images/health.gif"
          alt="AI Doctor"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="glass p-6 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, 
              ${themeColor}10 0%, 
              ${darkenColor(themeColor, 40)}20 100%
            )`
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <Icon icon={FaSearch} className="text-2xl text-blue-500 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">What are your symptoms?</h2>
              <p className="text-white/60 text-sm">Select one or more symptoms from the list below</p>
            </div>
          </div>
          
          <div className="mb-6">
            <Select
              instanceId="symptoms-select"  
              isMulti
              options={symptoms}
              onChange={handleSymptomChange}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Search symptoms..."
              styles={{
                control: (base) => ({
                  ...base,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.25rem',
                  boxShadow: 'none',
                  minHeight: '2.75rem',
                  '&:hover': {
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }
                }),
                menu: (base) => ({
                  ...base,
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  padding: '0.5rem'
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: 'white',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  '&:active': {
                    background: 'rgba(255, 255, 255, 0.2)'
                  }
                }),
                multiValue: (base) => ({
                  ...base,
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '0.5rem',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'white',
                  padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'white',
                  cursor: 'pointer',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }
                }),
                input: (base) => ({
                  ...base,
                  color: 'white'
                }),
                placeholder: (base) => ({
                  ...base,
                  color: 'rgba(255, 255, 255, 0.5)'
                })
              }}
            />
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white">
              {error}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-colors ${
              isLoading
                ? 'bg-blue-500/50 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Analyzing Symptoms...' : 'Predict Disease'}
          </button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass p-6 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, 
              ${themeColor}10 0%, 
              ${darkenColor(themeColor, 40)}20 100%
            )`
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <Icon icon={FaQuoteLeft} className="text-2xl text-blue-500 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Health Insight</h2>
              <p className="text-white/60 text-sm">Wisdom for your wellness journey</p>
            </div>
          </div>
          <blockquote className="text-white/80 italic p-4 border-l-4 border-blue-500/50 bg-white/5 rounded-r-lg">
            {quote}
          </blockquote>
        </motion.div>
      </div>

      <AnimatePresence>
        {prediction ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 glass p-6 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, 
                ${themeColor}10 0%, 
                ${darkenColor(themeColor, 40)}20 100%
              )`
            }}
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0 flex justify-center">
                <RadialProgress value={Math.round(prediction.probability * 100)} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Predicted Condition: <span className="text-blue-400">{prediction.prediction}</span>
                </h2>
                <p className="text-white/70 mb-4">{prediction.description}</p>
                
                <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                  <Icon icon={FaShieldAlt} className="text-blue-500" />
                  Recommended Precautions
                </h3>
                <ul className="list-disc list-inside text-white/70 space-y-1 mb-4">
                  {prediction.precautions.map((precaution, index) => (
                    <li key={index}>{precaution}</li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Icon icon={FaInfoCircle} className="text-blue-500" />
                  <p>This prediction is based on the symptoms you provided and should not replace professional medical advice.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );

  // Content for the visualizations tab
  const VisualizationsContent = (
    <div className="min-h-screen mx-auto max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 py-8"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Disease Analytics & Insights</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Explore data visualizations to understand disease patterns and risk factors
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl backdrop-blur-lg bg-black/30 border border-white/10 h-[calc(100vh-120px)] min-h-[1230px] overflow-hidden">
          <NotebookViewer 
            notebookPath="disease.ipynb" 
            visualizations={diseaseVisualizations}
          />
        </motion.div>
      </motion.div>
    </div>
  );


  const tabs = [
    {
      id: 'model',
      label: 'Disease Prediction',
      icon: FaStethoscope,
      content: ModelContent
    },
    {
      id: 'visualizations',
      label: 'Visualizations',
      icon: FaSearch,
      content: VisualizationsContent
    }
  ];

  return (
    <div
      className="min-h-screen"
    >
      <TabView
        tabs={tabs}
        defaultTab="model"
        themeColor={themeColor}
      />
    </div>
  );
}
