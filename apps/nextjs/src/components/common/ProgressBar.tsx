
import { useEffect, useState } from "react";


// Progress bar component
export const ProgressBar: React.FC<{ label: string; value: number; maxValue?: number; isVisible?: boolean }> = ({ label, value, maxValue = 100, isVisible = false }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [progressWidth, setProgressWidth] = useState(0);
  
    useEffect(() => {
      if (isVisible) {
        const duration = 1500;
        const steps = 60;
        const increment = value / steps;
        const progressIncrement = Math.min((value / maxValue) * 100, 100) / steps;
        let current = 0;
        let currentProgress = 0;
        
        const timer = setInterval(() => {
          current += increment;
          currentProgress += progressIncrement;
          
          if (current >= value) {
            current = value;
            currentProgress = Math.min((value / maxValue) * 100, 100);
            clearInterval(timer);
          }
          
          setDisplayValue(Math.floor(current));
          setProgressWidth(Math.min(currentProgress, 100));
        }, duration / steps);
  
        return () => clearInterval(timer);
      }
    }, [isVisible, value, maxValue]);
  
    return (
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="font-bold">{label}</span>
          <span className={isVisible ? 'count-animate' : ''}>{displayValue}</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-2">
          <div 
            className="bg-gray-700 h-2 rounded-full transition-all duration-1500 ease-out"
            style={{ width: isVisible ? `${progressWidth}%` : '0%' }}
          />
        </div>
      </div>
    );
  }