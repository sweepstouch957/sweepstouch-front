'use client';

import { useEffect, useState } from 'react';
import { getBusinessDate } from './event-urgency';

export function useBusinessDate() {
  const [today, setToday] = useState(getBusinessDate);
  useEffect(() => {
    const update = () => setToday(getBusinessDate());
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, []);
  return today;
}
