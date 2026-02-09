import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import "@/config/firebase";

interface CountdownTimerProps {
  startTime: string;
  className?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ startTime, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const difference = start - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  if (isExpired) {
    return null; // Don't show timer if expired
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-primary/80" />
      <span className="text-sm font-medium text-foreground">Starts in:</span>
      <div className="flex items-center gap-1">
        <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm font-semibold">
          {formatNumber(timeLeft.hours)}
        </span>
        <span className="text-primary/80 font-mono text-sm">:</span>
        <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm font-semibold">
          {formatNumber(timeLeft.minutes)}
        </span>
        <span className="text-primary/80 font-mono text-sm">:</span>
        <span className="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm font-semibold">
          {formatNumber(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
};

export default CountdownTimer;
