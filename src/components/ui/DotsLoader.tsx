import React from 'react';
import '../../styles/dots-loader.css';

interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const DotsLoader: React.FC<DotsLoaderProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'rgb(26, 26, 26)' 
}) => {
  const sizeMap = {
    sm: {
      container: 'dots-loader-sm',
      dot: 'dots-loader-dot-sm',
      spacing: 'gap-1'
    },
    md: {
      container: 'dots-loader-md',
      dot: 'dots-loader-dot-md',
      spacing: 'gap-2'
    },
    lg: {
      container: 'dots-loader-lg',
      dot: 'dots-loader-dot-lg',
      spacing: 'gap-3'
    }
  };

  const sizes = sizeMap[size];

  return (
    <div className={`${sizes.container} ${sizes.spacing} flex items-center justify-center ${className}`}>
      {/* Dot 1 */}
      <div 
        className={`${sizes.dot} dot-1 rounded-full`}
        style={{ backgroundColor: color }}
      />
      
      {/* Dot 2 */}
      <div 
        className={`${sizes.dot} dot-2 rounded-full`}
        style={{ backgroundColor: color }}
      />
      
      {/* Dot 3 */}
      <div 
        className={`${sizes.dot} dot-3 rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export default DotsLoader;
