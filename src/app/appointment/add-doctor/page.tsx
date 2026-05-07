'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { darkenColor } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { FaUserMd, FaUpload, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
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
      ease: "easeOut"
    }
  }
};

export default function AddDoctorPage() {
  const { themeColor } = useTheme();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    speciality: '',
    degree: '',
    experience: '',
    about: '',
    fees: 0,
    address: {
      line1: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as any,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error('Please upload a doctor image');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Upload image to Supabase Storage
      const fileName = `doctor_${Date.now()}_${imageFile.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('doctor_images')
        .upload(fileName, imageFile);
      
      if (fileError) throw fileError;
      
      // 2. Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('doctor_images')
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;
      
      // 3. Create doctor record in the database
      const { data, error } = await supabase
        .from('doctors')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            image: imageUrl,
            speciality: formData.speciality,
            degree: formData.degree,
            experience: formData.experience,
            about: formData.about,
            fees: formData.fees,
            address: {
              line1: formData.address.line1,
              city: formData.address.city,
              state: formData.address.state,
              pincode: formData.address.pincode
            },
            available: true
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('Doctor added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        speciality: '',
        degree: '',
        experience: '',
        about: '',
        fees: 0,
        address: {
          line1: '',
          city: '',
          state: '',
          pincode: ''
        }
      });
      setImageFile(null);
      setImagePreview(null);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/appointment/doctors');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error('Failed to add doctor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const specialities = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Obstetrics & Gynecology',
    'Oncology',
    'Ophthalmology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Radiology',
    'Urology'
  ];
  
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${darkenColor(themeColor, 20)} 0%, ${darkenColor(themeColor, 60)} 100%)`
      }}
    >
      <ToastContainer position="top-right" theme="dark" />
      
      {/* Header */}
      <div 
        className="py-8 px-4 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${themeColor}80 0%, ${darkenColor(themeColor, 40)} 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/appointment/doctors" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <FaArrowLeft />
              <span>Back to Doctors</span>
            </Link>
            <div className="flex space-x-4">
              <Link href="/appointment" className="text-white hover:text-white/80 transition-colors">
                Home
              </Link>
              <Link href="/appointment/doctors" className="text-white hover:text-white/80 transition-colors">
                Doctors
              </Link>
              <Link href="/appointment/my-appointments" className="text-white hover:text-white/80 transition-colors">
                My Appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
            <FaUserMd className="text-3xl" style={{ color: themeColor }} />
            <h1 className="text-3xl font-bold text-white">Add New Doctor</h1>
          </motion.div>
          
          <motion.form 
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="glass rounded-xl p-8"
            style={{
              background: `linear-gradient(135deg, ${themeColor}10 0%, ${darkenColor(themeColor, 40)}20 100%)`
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Image */}
              <div className="md:col-span-2 flex flex-col items-center justify-center">
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden mb-4 relative bg-white/10 flex items-center justify-center"
                  style={{ border: `2px dashed ${themeColor}40` }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Doctor preview" className="w-full h-full object-cover" />
                  ) : (
                    <FaUserMd className="text-4xl text-white/30" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2">
                  <FaUpload />
                  <span>Upload Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              {/* Basic Info */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Dr. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="doctor@example.com"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Speciality
                </label>
                <select
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="">Select Speciality</option>
                  {specialities.map((speciality) => (
                    <option key={speciality} value={speciality}>{speciality}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="MD, MBBS, etc."
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Experience
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="10+ years"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  name="fees"
                  value={formData.fees}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="1500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  About
                </label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Write a brief description about the doctor's expertise and experience..."
                ></textarea>
              </div>
              
              {/* Address */}
              <div className="md:col-span-2">
                <h3 className="text-white font-medium mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Address Line
                    </label>
                    <input
                      type="text"
                      name="address.line1"
                      value={formData.address.line1}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="123 Medical Center Dr."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Mumbai"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Maharashtra"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      required
                      className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl text-white font-medium transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-blue-600 to-blue-400 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ 
                  background: isSubmitting ? '' : `linear-gradient(135deg, ${themeColor} 0%, ${darkenColor(themeColor, 20)} 100%)` 
                }}
              >
                {isSubmitting ? 'Adding Doctor...' : 'Add Doctor'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
