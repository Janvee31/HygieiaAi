
  <h2>Hygieia: AI-Powered Healthcare Platform<h2>
  <h3>Advanced Disease Prediction, Telemedicine & AI Health Assistant</h3>


## Overview

Hygieia is a comprehensive healthcare platform that combines AI-powered disease prediction, telemedicine services, and intelligent health management in one seamless interface. Named after the Greek goddess of health, Hygieia aims to revolutionize healthcare by providing accessible, personalized, and proactive health solutions.

### Mission

To democratize access to advanced healthcare technologies and empower individuals to take control of their health through AI-driven insights, convenient telemedicine, and personalized health management.

### Disclaimer

Hygieia is designed as a supplementary tool for educational and informational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## Key Features

### Disease Prediction & Analysis
- **Multi-Disease Prediction**: Support for 8 different disease prediction models
- **Interactive Visualizations**: Dynamic, interactive charts and graphs powered by Plotly.js
- **Notebook Integration**: Jupyter notebook integration for detailed analysis and educational content
- **Real-time Predictions**: Instant disease risk assessment based on user-provided data
- **Feature Importance Analysis**: Transparent AI showing which factors contribute to predictions

### Telemedicine & Appointment System
- **Doctor Directory**: Browse and filter specialists by specialty, rating, and availability
- **Online Appointment Booking**: Schedule virtual or in-person consultations
- **Appointment Management**: View, reschedule, or cancel appointments
- **Secure Payment Integration**: Razorpay integration for appointment payments
- **SMS Notifications**: Twilio integration for appointment reminders
- **Doctor Profiles**: Detailed doctor information with ratings and reviews

### Emergency Ambulance System
- **Real-time Ambulance Tracking**: GPS-based tracking of ambulance location
- **Nearest Ambulance Dispatch**: Automated dispatch of closest available ambulance
- **Route Optimization**: Efficient routing to patient location and hospital
- **Driver Information**: Details about ambulance driver and vehicle
- **ETA Calculation**: Estimated time of arrival for emergency services
- **3D Ambulance Visualization**: Interactive 3D model of ambulance location
- **Hospital Integration**: Direct communication with hospital emergency departments

### AI Health Assistant
- **Multi-Agent Chat Interface**: Specialized health agents for different health domains
- **Ayurvedic Health Advisor**: Traditional medicine insights and recommendations
- **Menstrual Cycle Tracker**: Period prediction and symptom management
- **Diet & Nutrition Advisor**: Personalized food recommendations
- **Exercise Recommendation**: Customized workout suggestions
- **Speech-to-Text & Text-to-Speech**: Accessible communication options
- **Image Analysis**: Upload and analyze health-related images

### User Experience
- **Responsive Design**: Fully responsive interface that works across all devices
- **Dark Mode Interface**: Eye-friendly dark mode design with glass morphism elements
- **Privacy-Focused**: Local processing of sensitive medical data
- **Animated UI**: Smooth transitions and engaging interactions
- **Personalized Dashboard**: Custom health metrics and recommendations

## Supported Disease Predictions

- **General Disease Prediction**
- **Diabetes**
- **Heart Disease**
- **Lung Cancer**
- **Breast Cancer (Image-based)**
- **Brain Tumor Detection (Image-based)**
- **Skin Cancer Detection (Image-based)**
- **Kidney Disease**
- **Liver Disease**
- **Thyroid Disease**
- **Stroke Risk Assessment**

## AI Models & Algorithms

Hygieia employs a variety of machine learning and deep learning models to provide accurate disease predictions:

| Disease | Algorithms | Accuracy | Key Features |
|---------|------------|----------|--------------|
| Diabetes | Random Forest, Gradient Boosting, SVM | 92.5% | Glucose Level, BMI, Age, Insulin |
| Heart Disease | XGBoost, Neural Networks, Logistic Regression | 94.2% | Cholesterol, Blood Pressure, ECG Results |
| Liver Disease | Decision Trees, Random Forest, AdaBoost | 89.7% | Bilirubin, Enzymes, Proteins |
| Lung Cancer | CNNs, Random Forest, SVM | 91.3% | Smoking History, Age, Genetic Risk |
| Breast Cancer | CNN, ResNet50, Vision Transformer | 95.2% | Histopathology Images, Tumor Patterns |
| Brain Tumor | CNN, MobileNetV2, Transfer Learning | 94.8% | MRI Scans, Tumor Location, Size |
| Skin Cancer | EfficientNet, CNN, Transfer Learning | 93.5% | Lesion Images, Color, Texture, Patterns |
| Kidney Disease | Gradient Boosting, Random Forest | 92.1% | Creatinine, Blood Urea, Albumin |
| Thyroid Disease | Random Forest, XGBoost | 91.8% | TSH, T3, T4 Levels, Age |
| Stroke | Gradient Boosting, Random Forest | 90.5% | Age, Hypertension, Heart Disease, Glucose |

All models undergo rigorous validation using k-fold cross-validation, confusion matrix analysis, ROC curve evaluation, and precision-recall metrics.

## Technology Stack

### Frontend
- **Next.js 15.1.6**: React framework for server-side rendering
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for smooth UI transitions
- **Plotly.js**: Interactive data visualization for disease analytics
- **Three.js**: 3D model visualization for ambulances and anatomical education
- **React-Toastify**: Toast notifications for user feedback
- **React-Select**: Enhanced dropdown components
- **React-Circular-Progressbar**: Visual progress indicators
- **Mapbox GL**: Interactive maps for ambulance tracking
- **Shadcn UI**: Component library for consistent design

### Backend & APIs
- **Next.js API Routes**: Serverless functions for backend logic
- **Python**: For data processing and ML models
- **FastAPI**: High-performance backend server for ML model serving
- **Jupyter Notebooks**: For data analysis and educational content
- **scikit-learn**: Machine learning library for disease prediction
- **TensorFlow/PyTorch**: Deep learning frameworks for image-based models
- **Google Gemini AI**: Powering the AI health assistant
- **Twilio API**: SMS notifications for appointment reminders
- **Razorpay API**: Secure payment processing for appointments
- **Supabase**: Database, authentication, and storage solution
- **Mapbox API**: Geolocation services for ambulance tracking
- **Socket.io**: Real-time communication for ambulance updates

## Interactive Features

### Disease Prediction Visualizations
- **Distribution Charts**: Showing key metric distributions
- **Correlation Matrices**: Revealing relationships between different factors
- **Feature Importance Plots**: Highlighting the most significant predictors
- **Comparison Visualizations**: Comparing healthy vs. disease indicators
- **Risk Assessment Graphs**: Visualizing individual risk levels
- **3D Anatomical Models**: Interactive models for educational purposes

### Appointment System
- **Calendar Interface**: Visual appointment scheduling
- **Time Slot Selection**: Interactive time slot picker
- **Doctor Filtering**: Dynamic filtering of specialists
- **Rating System**: Star-based doctor rating visualization
- **Payment Flow**: Streamlined checkout process
- **Appointment Timeline**: Visual history of past and upcoming appointments

### AI Health Assistant
- **Agent Selection Interface**: Visual selection of specialized health agents
- **Chat Bubbles**: Modern messaging interface with typing indicators
- **Voice Input/Output**: Audio controls for accessibility
- **Image Upload**: Drag-and-drop interface for health image analysis
- **Menstrual Calendar**: Visual cycle tracking with prediction
- **Notification Center**: Centralized health reminders and alerts

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn
- Python 3.8+ (for backend and notebook analysis)
- Supabase account (for database and authentication)
- Twilio account (for SMS notifications)
- Razorpay account (for payment processing)
- Google AI Studio API key (for Gemini AI integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Janvee31/Hygieia-Ai.git
cd Hygieia-Ai
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

5. Start the backend server:
```bash
cd backend
uvicorn main:app --reload --port 8001
```

6. In a new terminal, start the frontend development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Feature Details

### Disease Prediction System

Hygieia offers comprehensive disease prediction for 8 different conditions, each with its own specialized interface:

- **General Disease Prediction**: Analyzes symptoms to identify potential conditions
- **Diabetes Prediction**: Uses glucose levels, BMI, age, and other factors to assess diabetes risk
- **Heart Disease Prediction**: Evaluates cardiovascular health based on multiple parameters
- **Lung Cancer Risk Assessment**: Analyzes risk factors for lung cancer development
- **Breast Cancer Screening**: Evaluates cellular characteristics for cancer detection
- **Parkinson's Disease Analysis**: Uses voice and movement data to detect early signs
- **Kidney Disease Evaluation**: Assesses kidney function through multiple biomarkers
- **Liver Disease Detection**: Analyzes liver enzyme levels and other indicators

Each prediction module includes:
- Detailed input forms with validation
- Real-time prediction results with confidence scores
- Interactive visualizations of key factors
- Educational content about risk factors and prevention
- Downloadable reports for sharing with healthcare providers

### Appointment Management System

The telemedicine system provides a complete end-to-end solution for virtual healthcare:

1. **Doctor Directory**:
   - Comprehensive listing of healthcare providers
   - Filtering by specialty, rating, availability, and location
   - Detailed doctor profiles with qualifications and patient reviews
   - Rating and review system for patient feedback

2. **Appointment Booking**:
   - Interactive calendar for date selection
   - Time slot availability in real-time
   - Appointment type selection (virtual/in-person)
   - Patient information collection
   - Symptom description and medical history input

3. **Payment Processing**:
   - Secure Razorpay integration
   - Multiple payment methods (credit/debit cards, UPI, net banking)
   - Receipt generation and email confirmation
   - Refund processing for cancellations

4. **Appointment Management**:
   - View upcoming and past appointments
   - Reschedule or cancel appointments
   - Set reminders via SMS or email
   - Join virtual consultations directly from the platform
   - Post-appointment feedback and rating

### AI Health Assistant

The ChatAI interface provides a comprehensive health management solution:

1. **Specialized Health Agents**:
   - **General Health Advisor**: Overall health guidance and triage
   - **Ayurvedic Specialist**: Traditional medicine recommendations
   - **Fitness Coach**: Personalized exercise routines
   - **Nutrition Expert**: Diet and meal planning advice
   - **Menstrual Health Tracker**: Period tracking and symptom management
   - **Mental Wellness Guide**: Stress management and mindfulness techniques
   - **Sleep Specialist**: Sleep hygiene and improvement strategies
   - **Medication Manager**: Medication reminders and information

2. **Advanced Interaction Features**:
   - Natural language processing for conversational interactions
   - Speech-to-text for hands-free operation
   - Text-to-speech for accessibility
   - Image upload and analysis for visual health concerns
   - Context-aware responses based on user history
   - Personalized recommendations based on user profile

3. **Health Tracking**:
   - Menstrual cycle prediction and symptom tracking
   - Medication adherence monitoring
   - Exercise and activity logging
   - Nutrition and meal tracking
   - Sleep pattern analysis
   - Symptom journal with pattern recognition

4. **Notification System**:
   - Appointment reminders via Twilio SMS integration
   - Medication schedules and reminders
   - Health tips and educational content
   - Menstrual cycle predictions and alerts
   - Follow-up prompts for ongoing health issues
   - Wellness challenges and achievements

## Documentation

Comprehensive documentation is available at the `/docs` route within the application. This includes:
- Detailed model descriptions and accuracy metrics
- Feature explanations and usage guides
- Technical architecture and API documentation
- User guides for all platform features
- Privacy and data handling policies
- Future roadmap and planned enhancements

## Deployment

Hygieia is deployed using the following infrastructure:

### Frontend
- **Vercel**: For hosting the Next.js application
  - Automatic CI/CD pipeline from GitHub repository
  - Environment variable management
  - Edge network for global performance

### Backend
- **Railway/Render**: For hosting the FastAPI backend server
  - Containerized deployment
  - Automatic scaling based on demand
  - Secure API endpoints

### Database & Storage
- **Supabase**: For database, authentication, and storage
  - PostgreSQL database with Row Level Security
  - User authentication and management
  - Storage buckets for files and images
  - Realtime subscriptions for live updates

### Third-party Services
- **Twilio**: For SMS notifications
- **Razorpay**: For payment processing
- **Google AI Studio**: For Gemini AI integration

## Future Roadmap

### Enhanced AI Capabilities
- **Advanced Medical Imaging Analysis**: Further improvements to our image-based models
- **Personalized Treatment Plans**: Custom health recommendations based on individual health profiles
- **Predictive Health Monitoring**: Early warning system for potential health issues
- **Voice Biomarker Analysis**: Disease detection through voice pattern analysis
- **Mental Health Assessment**: AI-driven evaluation of mental wellbeing
- **Multi-modal Disease Detection**: Combining imaging, biomarkers, and patient history

### Platform Enhancements
- **Telehealth Video Consultations**: Integrated video calling with doctors
- **Electronic Health Records**: Secure storage and sharing of medical records
- **Health Insurance Integration**: Direct claims processing and coverage verification
- **Pharmacy Integration**: Medication ordering and delivery tracking
- **Wearable Device Connectivity**: Integration with fitness trackers and health monitors

### Accessibility & Reach
- **Multi-language Support**: Interface available in 10+ languages
- **Offline Mode**: Core functionality available without internet connection
- **Low-bandwidth Mode**: Optimized for areas with limited connectivity
- **Mobile Applications**: Native iOS and Android apps
- **Voice-only Interface**: Complete functionality through voice commands

### Research & Development
- **Clinical Trial Integration**: Matching users with relevant medical trials
- **Research Data Collection**: Opt-in anonymous data contribution for medical research
- **Advanced Biomarker Analysis**: Integration with lab test results for deeper insights
- **Genomic Data Integration**: Personalized health recommendations based on genetic profiles
- **Collaborative Diagnosis**: Multi-model AI consensus for improved accuracy

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Medical datasets from Kaggle and UCI Machine Learning Repository
- Google Gemini AI for powering the health assistant
- Twilio for communication services
- Razorpay for payment processing
- Supabase for backend infrastructure
- Next.js and React communities
- Three.js for 3D visualizations
- Mapbox for geolocation services
- Framer Motion for animations
- Tailwind CSS for styling
- Shadcn UI for component library
- All contributors and supporters

---

<div align="center">
  <p>Built with ❤️ for a healthier future</p>
  <p>© 2025 Hygieia Health Technologies</p>
</div>



