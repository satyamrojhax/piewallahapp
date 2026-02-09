import React from 'react';
import DotsLoader from './DotsLoader';
import "@/config/firebase";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  text,
  color = 'rgb(59, 130, 246)' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <DotsLoader size={size} color={color} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
