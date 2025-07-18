import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Reusable Card component for displaying content in a styled container.
 * Used for lists, summaries, and grouped UI elements.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  return (
    <div
      className={`rounded-xl border shadow-xl transition-all duration-300 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default React.memo(Card); 