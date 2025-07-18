import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Reusable Radio component for consistent radio button styling and theming.
 * Wraps a standard HTML radio input with additional styles and props.
 */
interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  theme?: 'light' | 'dark'; // fallback if context not available
}

const Radio: React.FC<RadioProps> = ({ className = '', theme, ...props }) => {
  const context = useContext(ThemeContext);
  const mode = theme || context?.mode || 'light';
  const themedClass = mode === 'dark'
    ? 'accent-blue-400 focus:ring-blue-400/50'
    : 'accent-blue-600 focus:ring-blue-500/50';
  return (
    <input
      type="radio"
      className={`${themedClass} focus:ring-2 ${className}`}
      {...props}
    />
  );
};

export default Radio; 