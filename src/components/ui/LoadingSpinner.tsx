import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-card">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 border-4 border-white/20 rounded-full animate-spin spinner-blue-top"></div>
          
          {/* Inner spinning ring (opposite direction) */}
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent rounded-full animate-spin spinner-purple-bottom" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">Calculating Breeding Paths</h3>
          <p className="text-white/70">
            Analyzing breeding combinations and finding optimal paths...
          </p>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-1 mt-3">
            <div className="w-2 h-2 rounded-full animate-bounce dot-blue" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce dot-purple" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full animate-bounce dot-green" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 