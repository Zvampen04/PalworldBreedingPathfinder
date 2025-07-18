import React from 'react';

/**
 * Weaknesses page component that displays the elemental weaknesses chart.
 * Shows the ElementalWeaknesses.webp image in a responsive container.
 * @component
 */
const Weaknesses: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-header-text">
          Elemental Weaknesses
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Reference chart showing type effectiveness in Palworld
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="relative max-w-full">
          <img
            src="/Assets/ElementalWeaknesses.webp"
            alt="Elemental Weaknesses Chart"
            className="w-full h-auto max-w-4xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            style={{ maxHeight: '80vh' }}
          />
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Use this chart to understand type advantages and disadvantages in breeding and combat.</p>
      </div>
    </div>
  );
};

export default Weaknesses; 