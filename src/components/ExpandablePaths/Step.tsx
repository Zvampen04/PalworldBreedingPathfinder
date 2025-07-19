import * as React from 'react';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

interface StepProps {
  step: any;
  isLast?: boolean;
  showCheckbox?: boolean;
  path?: any;
  completedStepsMap: { [pathId: number]: Set<number> };
  favoriteIds: { [pathId: number]: string | null };
  handleStepToggle: (path: any, stepNumber: number) => void;
}

const Step: React.FC<StepProps> = ({ step, isLast = false, showCheckbox = false, path, completedStepsMap, favoriteIds, handleStepToggle }) => {
  const theme = useContext(ThemeContext);
  const isDarkMode = theme?.mode === 'dark';
  if (step.type === 'start') return null;
  const isCompleted = path && completedStepsMap[path.id]?.has(step.step_number);
  return (
    <div className={`flex items-center space-x-2 ${
      isLast
        ? (isDarkMode ? 'text-green-400 font-medium' : 'text-green-600 font-medium')
        : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
    } ${isCompleted ? 'opacity-60 line-through' : ''}`}>
      {showCheckbox && path && favoriteIds[path.id] && (
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => { e.stopPropagation(); handleStepToggle(path, step.step_number); }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-blue-500"
          aria-checked={isCompleted}
          aria-label={`Mark step ${step.step_number} as completed for breeding path from ${step.parents} to ${step.result}`}
        />
      )}
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
        isLast
          ? (isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
          : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
      } ${isCompleted ? 'bg-green-600 text-white' : ''}`}>
        {isCompleted ? '✓' : step.step_number}
      </span>
      <span>{step.parents} → {step.result}</span>
      {isLast && (
        <span className={`text-xs px-2 py-1 rounded ${
          isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
        }`}>
          TARGET
        </span>
      )}
    </div>
  );
};

export default Step; 