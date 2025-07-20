import React, { useContext } from 'react';
import { ThemeContext, ThemeMode } from '../context/ThemeContext';

/**
 * Reusable Input component for consistent input styling and theming.
 * Wraps a standard HTML input with additional styles and props.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  theme?: ThemeMode; // fallback if context not available
}

const Input: React.FC<InputProps> = ({ className = '', theme, ...props }) => {
  const context = useContext(ThemeContext);
  const mode: ThemeMode = theme || context?.mode || 'light';
  const isDisabled = props.disabled;
  
  const themedClass = mode === 'dark'
    ? isDisabled 
      ? 'bg-gray-700 text-gray-400 border-gray-500 placeholder-gray-500 cursor-not-allowed opacity-50'
      : 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
    : isDisabled
      ? 'bg-gray-100 text-gray-500 border-gray-300 placeholder-gray-400 cursor-not-allowed opacity-50'
      : 'bg-white text-gray-800 border-gray-300 placeholder-gray-500';
      
  return (
    <input
      className={`px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${themedClass} ${className}`}
      {...props}
    />
  );
};

export default Input; 