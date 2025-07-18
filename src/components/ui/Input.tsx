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
  const themedClass = mode === 'dark'
    ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
    : 'bg-white text-gray-800 border-gray-300 placeholder-gray-500';
  return (
    <input
      className={`px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${themedClass} ${className}`}
      {...props}
    />
  );
};

export default Input; 