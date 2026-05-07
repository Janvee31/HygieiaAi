/**
 * Advanced Menstrual Cycle Tracking Utility
 * Provides comprehensive period tracking, predictions, and notification capabilities
 */

import { supabase } from './supabase';
import { scheduleNotification } from './notificationService';

// Interfaces for menstrual tracking
export interface MenstrualCycle {
  id?: string;
  userId: string;
  cycleStartDate: string;
  cycleEndDate?: string;
  flow: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood: string[];
  notes?: string;
  createdAt?: string;
}

export interface MenstrualPrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDate: string;
  confidence: number;
}

export interface MenstrualStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleRegularity: 'regular' | 'irregular';
  longestCycle: number;
  shortestCycle: number;
}

// Ayurvedic insights for different phases
const ayurvedicInsights = {
  menstrual: [
    "During menstruation, Vata dosha is dominant. Focus on warm, nourishing foods and rest.",
    "Ayurveda recommends avoiding cold foods and drinks during your period to prevent cramping.",
    "Gentle movement like walking or yoga can help ease discomfort during menstruation.",
    "Warming herbs like ginger and cinnamon can help balance Vata and reduce period pain.",
    "According to Ayurveda, this is a time for introspection and self-care."
  ],
  follicular: [
    "In the post-menstrual phase, Kapha energy rises. It's a good time for building strength.",
    "Ayurveda suggests lighter, warming foods as your body prepares for ovulation.",
    "This is an ideal time for more vigorous exercise as your energy levels increase.",
    "Incorporate warming spices like turmeric and cumin to support this building phase.",
    "Your body is in a renewal phase - focus on nourishment and growth."
  ],
  ovulatory: [
    "During ovulation, Pitta dosha is dominant. Balance with cooling foods and activities.",
    "Ayurveda recommends sweet, bitter and astringent tastes during ovulation.",
    "This is a time of peak energy - channel it into creative projects and social connections.",
    "Cooling herbs like coriander and fennel can help balance the heat of Pitta.",
    "Stay hydrated with cooling drinks like coconut water or mint tea."
  ],
  luteal: [
    "In the pre-menstrual phase, Vata begins to rise again. Focus on grounding practices.",
    "Ayurveda suggests avoiding stimulants like caffeine which can increase anxiety.",
    "Regular meals and adequate rest help balance the increasing Vata energy.",
    "Warming, nourishing foods like soups and stews can help prevent PMS symptoms.",
    "Meditation and gentle yoga can help calm the mind during this transitional phase."
  ]
};

// Motivational quotes for period notifications
export const periodMotivationalQuotes = [
  "Your strength as a woman is not measured by the absence of pain, but by how you dance with it. Your period is a reminder of your power to create and transform.",
  "Embrace the rhythm of your body. Your cycle is not a burden but a beautiful reminder of your connection to nature's wisdom.",
  "Your period isn't just a biological process—it's a time to honor your body's incredible ability to renew itself month after month.",
  "Like the moon, you cycle through phases of darkness and light. Your period is a time to release what no longer serves you and prepare for new beginnings.",
  "Your menstrual cycle is your fifth vital sign—a monthly report on your overall health and wellbeing. Listen to what it's telling you.",
  "During your period, you're at your most intuitive. This is a powerful time for reflection, creativity, and inner wisdom.",
  "The discomfort you feel during your period is not weakness—it's your body working hard to keep you healthy. Honor that work with rest and self-care.",
  "Your cycle connects you to generations of women who have flowed before you. There is ancient wisdom in your body's rhythms.",
  "This is not just a period—it's a pause. A reminder to slow down, turn inward, and nurture yourself with the same care you give to others.",
  "Your body isn't inconveniencing you—it's reminding you that you possess the extraordinary power to create life. That deserves respect, not shame."
];

/**
 * Log a new menstrual cycle
 * @param cycleData The menstrual cycle data to log
 * @returns The created cycle data with ID
 */
export const logMenstrualCycle = async (cycleData: MenstrualCycle): Promise<MenstrualCycle | null> => {
  try {
    const { data, error } = await supabase
      .from('menstrual_cycles')
      .insert([{
        user_id: cycleData.userId,
        cycle_start_date: cycleData.cycleStartDate,
        cycle_end_date: cycleData.cycleEndDate,
        flow: cycleData.flow,
        symptoms: cycleData.symptoms,
        mood: cycleData.mood,
        notes: cycleData.notes,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Error logging menstrual cycle:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      // Format the response to match our interface
      return {
        id: data[0].id,
        userId: data[0].user_id,
        cycleStartDate: data[0].cycle_start_date,
        cycleEndDate: data[0].cycle_end_date,
        flow: data[0].flow,
        symptoms: data[0].symptoms,
        mood: data[0].mood,
        notes: data[0].notes,
        createdAt: data[0].created_at
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in logMenstrualCycle:', error);
    return null;
  }
};

/**
 * Get a user's menstrual cycle history
 * @param userId The user's ID
 * @param limit The maximum number of cycles to return
 * @returns Array of menstrual cycle data
 */
export const getMenstrualHistory = async (userId: string, limit = 12): Promise<MenstrualCycle[]> => {
  try {
    const { data, error } = await supabase
      .from('menstrual_cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_start_date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting menstrual history:', error);
      return [];
    }
    
    if (data) {
      // Format the response to match our interface
      return data.map(cycle => ({
        id: cycle.id,
        userId: cycle.user_id,
        cycleStartDate: cycle.cycle_start_date,
        cycleEndDate: cycle.cycle_end_date,
        flow: cycle.flow,
        symptoms: cycle.symptoms,
        mood: cycle.mood,
        notes: cycle.notes,
        createdAt: cycle.created_at
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error in getMenstrualHistory:', error);
    return [];
  }
};

/**
 * Calculate menstrual statistics based on history
 * @param userId The user's ID
 * @returns Menstrual statistics
 */
export const calculateMenstrualStats = async (userId: string): Promise<MenstrualStats | null> => {
  try {
    const cycles = await getMenstrualHistory(userId, 12);
    
    if (cycles.length < 2) {
      return null;
    }
    
    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];
    
    for (let i = 0; i < cycles.length - 1; i++) {
      // Ensure we have valid date strings before creating Date objects
      if (typeof cycles[i].cycleStartDate !== 'string' || typeof cycles[i + 1].cycleStartDate !== 'string') {
        continue;
      }
      
      const currentCycleStart = new Date(cycles[i].cycleStartDate);
      const nextCycleStart = new Date(cycles[i + 1].cycleStartDate);
      
      const cycleLength = Math.round((currentCycleStart.getTime() - nextCycleStart.getTime()) / (1000 * 60 * 60 * 24));
      cycleLengths.push(cycleLength);
      
      // Only process cycle end date if it's a valid string
      const cycleEndDate = cycles[i].cycleEndDate;
      if (cycleEndDate && typeof cycleEndDate === 'string') {
        try {
          const cycleEnd = new Date(cycleEndDate);
          if (!isNaN(cycleEnd.getTime())) { // Check if date is valid
            const periodLength = Math.round((cycleEnd.getTime() - currentCycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (periodLength > 0) { // Only add positive period lengths
              periodLengths.push(periodLength);
            }
          }
        } catch (e) {
          console.error('Error creating date from cycleEndDate:', e);
          // Continue with next cycle
        }
      }
    }
    
    // Calculate statistics
    const averageCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
    const averagePeriodLength = periodLengths.length > 0 
      ? periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length 
      : 5; // Default if no period end dates
    
    const longestCycle = Math.max(...cycleLengths);
    const shortestCycle = Math.min(...cycleLengths);
    
    // Determine regularity (if cycle varies by more than 5 days, consider irregular)
    const cycleRegularity = (longestCycle - shortestCycle) <= 5 ? 'regular' : 'irregular';
    
    return {
      averageCycleLength,
      averagePeriodLength,
      cycleRegularity,
      longestCycle,
      shortestCycle
    };
  } catch (error) {
    console.error('Error in calculateMenstrualStats:', error);
    return null;
  }
};

/**
 * Predict upcoming menstrual events
 * @param userId The user's ID
 * @returns Prediction data for next cycle
 */
export const predictNextCycle = async (userId: string): Promise<MenstrualPrediction | null> => {
  try {
    const cycles = await getMenstrualHistory(userId, 6);
    const stats = await calculateMenstrualStats(userId);
    
    if (!stats || cycles.length === 0) {
      return null;
    }
    
    // Get the most recent cycle start date
    if (typeof cycles[0].cycleStartDate !== 'string') {
      return null;
    }
    const lastCycleStart = new Date(cycles[0].cycleStartDate);
    
    // Calculate next period start date
    const nextPeriodStart = new Date(lastCycleStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + Math.round(stats.averageCycleLength));
    
    // Calculate next period end date
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + Math.round(stats.averagePeriodLength) - 1);
    
    // Calculate ovulation date (typically 14 days before next period)
    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);
    
    // Calculate fertile window (typically 5 days before ovulation to 1 day after)
    const fertileWindowStart = new Date(ovulationDate);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
    
    const fertileWindowEnd = new Date(ovulationDate);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);
    
    // Calculate confidence based on cycle regularity
    const confidence = stats.cycleRegularity === 'regular' ? 0.85 : 0.65;
    
    return {
      nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
      nextPeriodEnd: nextPeriodEnd.toISOString().split('T')[0],
      fertileWindowStart: fertileWindowStart.toISOString().split('T')[0],
      fertileWindowEnd: fertileWindowEnd.toISOString().split('T')[0],
      ovulationDate: ovulationDate.toISOString().split('T')[0],
      confidence
    };
  } catch (error) {
    console.error('Error in predictNextCycle:', error);
    return null;
  }
};

/**
 * Get Ayurvedic insights based on cycle phase
 * @param cycleDay The day of the cycle (1 = first day of period)
 * @param averageCycleLength The user's average cycle length
 * @returns Ayurvedic insights for the current phase
 */
export const getAyurvedicInsights = (cycleDay: number, averageCycleLength: number): string[] => {
  // Determine cycle phase
  if (cycleDay <= 5) {
    // Menstrual phase
    return ayurvedicInsights.menstrual;
  } else if (cycleDay <= 13) {
    // Follicular phase
    return ayurvedicInsights.follicular;
  } else if (cycleDay <= 16) {
    // Ovulatory phase
    return ayurvedicInsights.ovulatory;
  } else {
    // Luteal phase
    return ayurvedicInsights.luteal;
  }
};

/**
 * Schedule period notifications
 * @param userId The user's ID
 * @param phoneNumber The user's phone number
 * @param prediction The menstrual prediction data
 * @returns Success status
 */
export const schedulePeriodNotifications = async (
  userId: string,
  phoneNumber: string,
  prediction: MenstrualPrediction
): Promise<boolean> => {
  try {
    if (!prediction || !phoneNumber) {
      return false;
    }
    
    // Get a random motivational quote
    const randomQuote = periodMotivationalQuotes[Math.floor(Math.random() * periodMotivationalQuotes.length)];
    
    // Schedule period start notification (2 days before)
    const periodStartDate = new Date(prediction.nextPeriodStart);
    const notificationDate = new Date(periodStartDate);
    notificationDate.setDate(notificationDate.getDate() - 2);
    
    await scheduleNotification({
      userId,
      phone: phoneNumber,
      message: `Your period is expected to start in 2 days (${prediction.nextPeriodStart}). ${randomQuote}`,
      scheduledTime: notificationDate.toISOString(),
      type: 'menstrual'
    });
    
    // Schedule ovulation notification
    const ovulationDate = new Date(prediction.ovulationDate);
    const ovulationNotificationDate = new Date(ovulationDate);
    ovulationNotificationDate.setDate(ovulationNotificationDate.getDate() - 1);
    
    await scheduleNotification({
      userId,
      phone: phoneNumber,
      message: `Your ovulation is expected tomorrow (${prediction.ovulationDate}). This is a good time to track any changes in your body.`,
      scheduledTime: ovulationNotificationDate.toISOString(),
      type: 'menstrual'
    });
    
    return true;
  } catch (error) {
    console.error('Error in schedulePeriodNotifications:', error);
    return false;
  }
};

/**
 * Extract menstrual tracking information from user input
 * @param input The user's message text
 * @returns Extracted menstrual cycle data if found
 */
export const extractMenstrualInfo = (input: string): Partial<MenstrualCycle> | null => {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase();
  
  // Check if this is a period tracking request
  if (!lowerInput.includes('period') && 
      !lowerInput.includes('menstrual') && 
      !lowerInput.includes('cycle') && 
      !lowerInput.includes('flow') &&
      !lowerInput.includes('pms')) {
    return null;
  }
  
  const result: Partial<MenstrualCycle> = {};
  
  // Extract date
  const dateRegex = /(today|yesterday|(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.]?(\d{2,4})?)/i;
  const dateMatch = input.match(dateRegex);
  
  if (dateMatch) {
    if (dateMatch[1].toLowerCase() === 'today') {
      const today = new Date();
      result.cycleStartDate = today.toISOString().split('T')[0];
    } else if (dateMatch[1].toLowerCase() === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      result.cycleStartDate = yesterday.toISOString().split('T')[0];
    } else if (dateMatch[2] && dateMatch[3]) {
      // Handle DD/MM/YYYY format
      const day = dateMatch[2];
      const month = dateMatch[3];
      const year = dateMatch[4] || new Date().getFullYear().toString();
      
      // Adjust for 2-digit year
      const fullYear = year.length === 2 ? `20${year}` : year;
      
      // Format as YYYY-MM-DD
      result.cycleStartDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Extract flow
  if (lowerInput.includes('heavy flow') || lowerInput.includes('heavy period')) {
    result.flow = 'heavy';
  } else if (lowerInput.includes('light flow') || lowerInput.includes('light period')) {
    result.flow = 'light';
  } else {
    result.flow = 'medium';
  }
  
  // Extract symptoms
  const symptoms: string[] = [];
  
  if (lowerInput.includes('cramp')) symptoms.push('cramps');
  if (lowerInput.includes('headache')) symptoms.push('headache');
  if (lowerInput.includes('bloat')) symptoms.push('bloating');
  if (lowerInput.includes('back pain') || lowerInput.includes('backache')) symptoms.push('back pain');
  if (lowerInput.includes('nausea')) symptoms.push('nausea');
  if (lowerInput.includes('fatigue') || lowerInput.includes('tired')) symptoms.push('fatigue');
  if (lowerInput.includes('breast') && (lowerInput.includes('tender') || lowerInput.includes('sore'))) symptoms.push('breast tenderness');
  
  if (symptoms.length > 0) {
    result.symptoms = symptoms;
  }
  
  // Extract mood
  const moods: string[] = [];
  
  if (lowerInput.includes('irritable') || lowerInput.includes('irritability')) moods.push('irritable');
  if (lowerInput.includes('anxious') || lowerInput.includes('anxiety')) moods.push('anxious');
  if (lowerInput.includes('sad') || lowerInput.includes('depressed')) moods.push('sad');
  if (lowerInput.includes('mood swings')) moods.push('mood swings');
  if (lowerInput.includes('happy') || lowerInput.includes('good mood')) moods.push('happy');
  if (lowerInput.includes('calm')) moods.push('calm');
  
  if (moods.length > 0) {
    result.mood = moods;
  }
  
  return Object.keys(result).length > 0 ? result : null;
};

/**
 * Process a menstrual tracking request and generate a response
 * @param input The user's message text
 * @param userId The user's ID
 * @returns Object containing the response and extracted data
 */
export const processMenstrualRequest = async (
  input: string,
  userId: string
): Promise<{
  response: string;
  menstrualData?: Partial<MenstrualCycle>;
  prediction?: MenstrualPrediction;
}> => {
  try {
    // Extract menstrual info
    const menstrualData = extractMenstrualInfo(input);
    
    // Check if this is a notification request
    const isNotificationRequest = input.toLowerCase().includes('notif') || 
                                 input.toLowerCase().includes('remind') ||
                                 input.toLowerCase().includes('alert') ||
                                 input.toLowerCase().includes('bell');
    
    // Check if this is a prediction request
    const isPredictionRequest = input.toLowerCase().includes('predict') || 
                               input.toLowerCase().includes('when') ||
                               input.toLowerCase().includes('next period') ||
                               input.toLowerCase().includes('forecast') ||
                               input.toLowerCase().includes('expect');
    
    // If it's a notification request
    if (isNotificationRequest) {
      // Get prediction data
      const prediction = await predictNextCycle(userId);
      
      if (!prediction) {
        return {
          response: "I'd like to set up period notifications for you, but I need more cycle data first. Could you log your last period start date?"
        };
      }
      
      // Return response with notification info
      return {
        response: `I've set up notifications for your next period (expected ${prediction.nextPeriodStart}). You'll receive a reminder 2 days before with a motivational quote. Would you like me to also notify you about your ovulation date (${prediction.ovulationDate})?`,
        prediction
      };
    }
    
    // If it's a prediction request
    if (isPredictionRequest) {
      // Get prediction data
      const prediction = await predictNextCycle(userId);
      const stats = await calculateMenstrualStats(userId);
      
      if (!prediction || !stats) {
        return {
          response: "I'd like to predict your next period, but I need more cycle data first. Could you log your last period start date?"
        };
      }
      
      // Calculate days until next period
      const getDaysUntilNextPeriod = () => {
        if (!prediction) return null;
        
        const today = new Date();
        const nextPeriod = new Date(prediction.nextPeriodStart);
        
        const diffTime = nextPeriod.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      };
      
      // Get cycle phase
      const getCyclePhase = () => {
        if (!prediction) return 'Unknown';
        
        const today = new Date();
        const nextPeriod = prediction.nextPeriodStart ? new Date(prediction.nextPeriodStart) : null;
        const ovulation = prediction.ovulationDate ? new Date(prediction.ovulationDate) : null;
        
        if (!ovulation || !nextPeriod) {
          return 'Unknown';
        }
        
        if (today < ovulation) {
          return 'Follicular phase';
        } else if (today < nextPeriod) {
          return 'Luteal phase';
        } else {
          return 'Menstruation';
        }
      };
      
      const daysUntilNextPeriod = getDaysUntilNextPeriod();
      const cyclePhase = getCyclePhase();
      
      // Get Ayurvedic insights
      const today = new Date();
      const lastPeriod = new Date();
      if (prediction && prediction.nextPeriodStart) {
        const nextPeriodDate = new Date(prediction.nextPeriodStart);
        lastPeriod.setTime(nextPeriodDate.getTime());
        lastPeriod.setDate(lastPeriod.getDate() - Math.round(stats.averageCycleLength));
      }
      
      const daysSinceLastPeriod = Math.round((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const ayurvedicTip = getAyurvedicInsights(daysSinceLastPeriod, stats.averageCycleLength)[0];
      
      // Return response with prediction info
      return {
        response: `Based on your cycle history (average length: ${Math.round(stats.averageCycleLength)} days), your next period is expected to start on ${prediction.nextPeriodStart} (${Math.round(prediction.confidence * 100)}% confidence). You have ${daysUntilNextPeriod} days until your next period. Your fertile window will be from ${prediction.fertileWindowStart} to ${prediction.fertileWindowEnd}, with ovulation around ${prediction.ovulationDate}. You are currently in the ${cyclePhase}.

Ayurvedic insight for today: ${ayurvedicTip}`,
        menstrualData: menstrualData || undefined,
        prediction
      };
    }
    
    // If it's a period logging request
    if (menstrualData && menstrualData.cycleStartDate) {
      // Complete the data with defaults if needed
      const completeData: MenstrualCycle = {
        userId,
        cycleStartDate: menstrualData.cycleStartDate,
        flow: menstrualData.flow || 'medium',
        symptoms: menstrualData.symptoms || [],
        mood: menstrualData.mood || []
      };
      
      // Log the cycle
      await logMenstrualCycle(completeData);
      
      // Get prediction for next cycle
      const prediction = await predictNextCycle(userId);
      
      if (!prediction) {
        return {
          response: `I've logged your period starting on ${completeData.cycleStartDate}. As you log more cycles, I'll be able to provide predictions and insights.`,
          menstrualData: completeData
        };
      }
      
      // Return response with logged data and prediction
      return {
        response: `I've logged your period starting on ${completeData.cycleStartDate}. Based on your history, your next period is expected around ${prediction.nextPeriodStart}. Would you like to set up notifications for your next period?`,
        menstrualData: completeData,
        prediction
      };
    }
    
    // Default response if no specific request is detected
    return {
      response: "I can help you track your menstrual cycle, predict your next period, and provide Ayurvedic insights. Would you like to log your current period, get a prediction, or set up notifications?"
    };
  } catch (error) {
    console.error('Error processing menstrual request:', error);
    return {
      response: "I'm sorry, but I encountered an error while processing your menstrual tracking request. Please try again or contact our support team for assistance."
    };
  }
};
