import React, { useMemo, useContext, useState, useEffect } from 'react';
import ExpandablePaths from '../ui/ExpandablePaths';
import Card from '../ui/Card';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Ongoing page component for the Palworld Breeding Calculator.
 * Displays breeding paths with ongoing progress and allows users to track and update their progress.
 * @component
 * @param {OngoingProps} props - Props for Ongoing component.
 */
interface OngoingProps {
  /**
   * Props for the Ongoing component.
   * @property ongoing - List of ongoing favorite paths with progress.
   * @property handleOngoingSelect - Handler to select an ongoing path.
   * @property onAddToCollection - Handler to add a favorite to a collection.
   * @property pulseItemId - ID of the item to pulse (for animation).
   */
  ongoing: any[];
  handleOngoingSelect: (item: any) => void;
  onAddToCollection: (fav: any) => void;
  pulseItemId?: string | null;
}

const Ongoing: React.FC<OngoingProps> = ({ ongoing, handleOngoingSelect, onAddToCollection, pulseItemId }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  const [animatingItems, setAnimatingItems] = useState<Set<string>>(new Set());
  
  // Handle pulse animation when pulseItemId changes
  useEffect(() => {
    if (pulseItemId) {
      setAnimatingItems(prev => new Set(prev).add(pulseItemId));
      const timer = setTimeout(() => {
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(pulseItemId);
          return newSet;
        });
      }, 2000); // Animation duration
      
      return () => clearTimeout(timer);
    }
  }, [pulseItemId]);
  const memoizedOngoing = useMemo(() => ongoing.map(item => {
    const totalSteps = item.favorite.steps.filter((s: any) => s.type !== 'start').length;
    const completedSteps = item.progress.completedSteps.size;
    const percent = Math.round((completedSteps / totalSteps) * 100);
    const data = {
      success: true,
      start_parent: item.favorite.startParent,
      target_child: item.favorite.targetChild,
      total_paths: 1,
      min_steps: totalSteps,
      paths: [{ type: 'single' as const, path: {
        id: 1,
        steps: item.favorite.steps,
        total_steps: totalSteps,
      }}],
    };
    return { item, totalSteps, completedSteps, percent, data };
  }), [ongoing]);

  return (
    <div className={`p-8 rounded-xl-std shadow-xl-std transition-all duration-300 ${
      isDark 
        ? 'bg-white/10 backdrop-blur-md border border-white/20' 
        : 'bg-white/80 backdrop-blur-md border border-gray-200'
    }`}>
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-accessible-dark' : 'text-accessible-light'
        }`}>
          Ongoing Paths
        </h2>
        <p className={isDark ? 'text-accessible-secondary-dark' : 'text-accessible-secondary-light'}>
          Track your progress on favorited breeding paths. Check off completed steps to see your progress.
        </p>
      </div>
      {ongoing.length === 0 ? (
        <div className="text-center text-gray-400">No ongoing paths.</div>
      ) : (
        memoizedOngoing.map(({ item, totalSteps, completedSteps, percent, data }) => {
          const isAnimating = animatingItems.has(item.favorite.id);
          return (
            <Card
              key={item.favorite.id}
              className={`flex flex-col gap-1 cursor-pointer transition group p-4 ${
                isDark ? 'bg-white/10 border border-gray-700' : 'bg-white border border-gray-300'
              } ${
                isAnimating 
                  ? 'animate-pulse border-purple-400 bg-purple-900/20 shadow-lg shadow-purple-500/25' 
                  : ''
              }`}
              onClick={() => handleOngoingSelect(item)}
              tabIndex={0}
              role="button"
              aria-label={`Go to favorite path ${item.favorite.name || `${item.favorite.startParent} → ${item.favorite.targetChild}`}`}
            >
            <div className={`font-semibold group-hover:text-blue-700 ${isDark ? 'dark:group-hover:text-purple-300' : ''} transition-colors duration-200`}>{item.favorite.name || `${item.favorite.startParent} → ${item.favorite.targetChild}`}</div>
            <div className="text-xs text-gray-400">{completedSteps}/{totalSteps} steps ({percent}%)</div>
            <ExpandablePaths
              data={data}
              maxPaths={1}
              hideSummaryHeader={true}
              onAddToCollection={onAddToCollection}
            />
          </Card>
          );
        })
      )}
    </div>
  );
};

export default React.memo(Ongoing); 