import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePointsEarning = (initialPoints: number, hourlyIncome: number) => {
  const [points, setPoints] = useState(initialPoints);
  const lastUpdateRef = useRef(Date.now());
  const saveIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Calculate points per millisecond: hourly_income / 3,600,000
    const pointsPerMs = hourlyIncome / 3600000;

    // Update points every 100ms for smooth animation
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      const earnedPoints = pointsPerMs * elapsed;
      
      setPoints(prev => prev + earnedPoints);
      lastUpdateRef.current = now;
    }, 100);

    // Save to database every 5 seconds
    saveIntervalRef.current = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ points: Math.floor(points) })
          .eq('id', user.id);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [hourlyIncome, points]);

  const updatePoints = (newPoints: number) => {
    setPoints(newPoints);
    lastUpdateRef.current = Date.now();
  };

  return { points: Math.floor(points), updatePoints };
};
