import React, { useContext } from 'react';
import Button from '../ui/Button';
import { ThemeContext } from '../context/ThemeContext';

interface SettingsProps {
  isRunning: boolean;
  progress: any;
  progressError: string | null;
  onUpdateAllData: () => void;
  onUpdateImages: () => void;
  onUpdateBreeding: () => void;
  onUpdateFullCalc: () => void;
  onResetLocalStorage: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  isRunning, progress, progressError,
  onUpdateAllData, onUpdateImages, onUpdateBreeding, onUpdateFullCalc, onResetLocalStorage
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  return (
    <div className={`p-8 rounded-xl-std shadow-xl-std transition-all duration-300 max-w-2xl mx-auto my-12 ${
      isDark 
        ? 'bg-white/10 backdrop-blur-md border border-white/20' 
        : 'bg-white/80 backdrop-blur-md border border-gray-200'
    }`}>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">⚙️</div>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>Settings</h2>
        <p className={isDark ? 'text-accessible-secondary-dark' : 'text-accessible-secondary-light'}>
          Manage your data, images, and local storage for the breeding calculator.
        </p>
      </div>
      <div className="space-y-4">
        <Button className="w-full py-3 px-4 rounded-lg font-semibold transition" variant="primary" dark={isDark} onClick={onUpdateAllData} disabled={isRunning}>
          Update All Data (CSV + Images)
        </Button>
        <Button className="w-full py-3 px-4 rounded-lg font-semibold transition" variant="primary" dark={isDark} onClick={onUpdateImages} disabled={isRunning}>
          Update Images Only
        </Button>
        <Button className="w-full py-3 px-4 rounded-lg font-semibold transition" variant="primary" dark={isDark} onClick={onUpdateBreeding} disabled={isRunning}>
          Update Breeding Data Only
        </Button>
        <Button className="w-full py-3 px-4 rounded-lg font-semibold transition" variant="primary" dark={isDark} onClick={onUpdateFullCalc} disabled={isRunning}>
          Update Full Calculator (CSV + Images)
        </Button>
        <Button className="w-full py-3 px-4 rounded-lg font-semibold transition" variant="danger" dark={isDark} onClick={onResetLocalStorage} disabled={isRunning}>
          Reset Local Storage (Favorites & Ongoing)
        </Button>
      </div>
      {/* Progress Bar and Status */}
      {progress && (
        <div className="mt-8">
          <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>{`Updating ${progress.label}...`}</div>
          {progress.max > 0 ? (
            <>
              <div className={`w-full rounded-full h-4 mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}> 
                <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.max) * 100}%` }}></div>
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{progress.current} / {progress.max}</div>
            </>
          ) : (
            <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Starting...</div>
          )}
        </div>
      )}
      {progressError && (
        <div className="mt-4 text-red-500 font-semibold">{progressError}</div>
      )}
    </div>
  );
};

export default Settings; 