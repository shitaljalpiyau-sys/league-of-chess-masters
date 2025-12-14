import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePointsEarning = (userId: string | undefined) => {
  const [points, setPoints] = useState<number>(0);
  const [hourlyIncome, setHourlyIncome] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdateRef = useRef(Date.now());
  const saveIntervalRef = useRef<NodeJS.Timeout>();
  const animationIntervalRef = useRef<NodeJS.Timeout>();

  // Load points and calculate offline earnings
  const loadAndCalculatePoints = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('points, hourly_income, last_points_update')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading points:', error);
        setIsLoading(false);
        return;
      }

      if (profile) {
        const storedPoints = profile.points || 0;
        const income = profile.hourly_income || 30;
        const lastUpdate = profile.last_points_update 
          ? new Date(profile.last_points_update).getTime() 
          : Date.now();

        // Calculate points earned while offline
        const now = Date.now();
        const elapsedMs = now - lastUpdate;
        const pointsPerMs = income / 3600000; // hourly_income / ms in an hour
        const offlineEarnings = Math.floor(pointsPerMs * elapsedMs);

        const totalPoints = storedPoints + offlineEarnings;

        setPoints(totalPoints);
        setHourlyIncome(income);
        lastUpdateRef.current = now;

        // Save the updated points with offline earnings to database
        if (offlineEarnings > 0) {
          await supabase
            .from('profiles')
            .update({ 
              points: totalPoints,
              last_points_update: new Date().toISOString()
            })
            .eq('id', userId);
        }
      }
    } catch (err) {
      console.error('Error calculating points:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadAndCalculatePoints();
  }, [loadAndCalculatePoints]);

  // Real-time point animation (updates UI every 100ms)
  useEffect(() => {
    if (!userId || isLoading) return;

    const pointsPerMs = hourlyIncome / 3600000;

    animationIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      const earnedPoints = pointsPerMs * elapsed;
      
      setPoints(prev => prev + earnedPoints);
      lastUpdateRef.current = now;
    }, 100);

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [userId, hourlyIncome, isLoading]);

  // Save to database every 30 seconds
  useEffect(() => {
    if (!userId || isLoading) return;

    saveIntervalRef.current = setInterval(async () => {
      const currentPoints = Math.floor(points);
      
      await supabase
        .from('profiles')
        .update({ 
          points: currentPoints,
          last_points_update: new Date().toISOString()
        })
        .eq('id', userId);
    }, 30000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [userId, points, isLoading]);

  // Save on page unload
  useEffect(() => {
    if (!userId) return;

    const handleBeforeUnload = async () => {
      const currentPoints = Math.floor(points);
      
      // Use sendBeacon for reliable save on page close
      const data = JSON.stringify({
        points: currentPoints,
        last_points_update: new Date().toISOString()
      });
      
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        new Blob([data], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [userId, points]);

  const updatePoints = useCallback(async (newPoints: number) => {
    setPoints(newPoints);
    lastUpdateRef.current = Date.now();

    if (userId) {
      await supabase
        .from('profiles')
        .update({ 
          points: Math.floor(newPoints),
          last_points_update: new Date().toISOString()
        })
        .eq('id', userId);
    }
  }, [userId]);

  const spendPoints = useCallback(async (amount: number): Promise<boolean> => {
    const currentPoints = Math.floor(points);
    if (currentPoints < amount) return false;

    const newPoints = currentPoints - amount;
    await updatePoints(newPoints);
    return true;
  }, [points, updatePoints]);

  return { 
    points: Math.floor(points), 
    hourlyIncome,
    isLoading,
    updatePoints,
    spendPoints,
    refreshPoints: loadAndCalculatePoints
  };
};
