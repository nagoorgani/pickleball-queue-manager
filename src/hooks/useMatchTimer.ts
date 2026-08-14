import { useState, useEffect } from 'react';

export function useMatchTimer(startTime: number | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsedSeconds(0);
      return;
    }

    // Set initial
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    elapsedSeconds,
    formattedTime,
    minutes,
    seconds,
  };
}
