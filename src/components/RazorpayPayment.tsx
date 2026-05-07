'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-toastify';

// Define Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  appointmentId: string;
  amount: number;
  currency: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

export default function RazorpayPayment({
  appointmentId,
  amount,
  currency,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onFailure
}: RazorpayPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Initialize payment
  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Load Razorpay script
      const res = await loadRazorpayScript();
      
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        setIsLoading(false);
        if (onFailure) onFailure(new Error('Razorpay SDK failed to load'));
        return;
      }
      
      // Create order
      const response = await fetch('/api/payment/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.message || 'Failed to create payment');
        setIsLoading(false);
        if (onFailure) onFailure(new Error(data.message || 'Failed to create payment'));
        return;
      }
      
      // Initialize Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Hygieia Health Companion',
        description: 'Appointment Payment',
        order_id: data.order.id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/razorpay', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              toast.success('Payment successful!');
              if (onSuccess) onSuccess();
            } else {
              toast.error(verifyData.message || 'Payment verification failed');
              if (onFailure) onFailure(new Error(verifyData.message || 'Payment verification failed'));
            }
          } catch (error) {
            toast.error('Payment verification failed');
            if (onFailure) onFailure(error);
          }
          
          setIsLoading(false);
        },
      };
      
      // Create Razorpay instance
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
      // Handle payment failure
      paymentObject.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed');
        setIsLoading(false);
        if (onFailure) onFailure(new Error(response.error.description || 'Payment failed'));
      });
    } catch (error) {
      toast.error('Failed to process payment');
      setIsLoading(false);
      if (onFailure) onFailure(error);
    }
  };

  return (
    <motion.button
      onClick={handlePayment}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          <div className="relative w-16 h-6">
            <Image
              src="/images/razorpay_logo.png"
              alt="Razorpay"
              fill
              className="object-contain"
            />
          </div>
          <span>Pay {currency} {amount}</span>
        </>
      )}
    </motion.button>
  );
}
