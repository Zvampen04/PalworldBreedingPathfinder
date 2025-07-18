import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  addFavorite, 
  removeFavorite, 
  isFavoritedBySteps,
  toggleStepCompletion, 
  getProgress,
  FavoritePath 
} from '../../utils/storage';
import Step from '../ExpandablePaths/Step';
import Button from './Button';
import { ThemeContext } from '../context/ThemeContext';

export interface BreedingStep {
  type: 'start' | 'breed';
  pal?: string;
  parents?: string;
  result?: string;
  step_number: number;
  is_final?: boolean;
}

export interface PathData {
  id: number;
  steps: BreedingStep[];
  total_steps: number;
}

interface GroupedPath {
  type: 'single' | 'group';
  path?: PathData;
  common_steps?: BreedingStep[];
  alternatives?: PathData[];
  count?: number;
}

interface ExpandablePathsData {
  success: boolean;
  start_parent: string;
  target_child: string;
  total_paths: number;
  min_steps: number;
  paths: GroupedPath[];
  message?: string;
  suggestions?: {
    start: string[];
    target: string[];
  };
}

interface ExpandablePathsProps {
  data: ExpandablePathsData;
  maxPaths?: number;
  onLoadMore?: () => void;
  hideSummaryHeader?: boolean;
  summaryHeaderText?: string; // New prop for custom summary text
  onAddToCollection?: (path: PathData) => void; // New prop for add to collection
  bottomAction?: ((path: PathData) => React.ReactNode) | React.ReactNode; // New prop for custom action at bottom of card
  onRemoveFavorite?: (path: PathData) => void; // New prop for removing favorite
}

// New recursive type for infinite-nesting
interface RecursiveGroupedPath {
  type: 'single' | 'group';
  path?: PathData;
  common_steps?: BreedingStep[];
  children?: RecursiveGroupedPath[];
  count?: number;
}

const ExpandablePaths: React.FC<ExpandablePathsProps> = ({ data, hideSummaryHeader = false, summaryHeaderText, onAddToCollection, bottomAction, onRemoveFavorite }) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  const [favoriteIds, setFavoriteIds] = useState<{ [pathId: number]: string | null }>({});
  const [completedStepsMap, setCompletedStepsMap] = useState<{ [pathId: number]: Set<number> }>({});

  // Memoize favoriteIds and completedStepsMap calculation
  const { memoizedFavoriteIds, memoizedCompletedStepsMap } = useMemo(() => {
    if (data.success && Array.isArray(data.paths)) {
      const newFavoriteIds: { [pathId: number]: string | null } = {};
      const newCompletedStepsMap: { [pathId: number]: Set<number> } = {};
      const collectSingles = (nodes: any[]) => {
        nodes.forEach(node => {
          if (node.type === 'single' && node.path) {
            const favId = isFavoritedBySteps(data.start_parent, data.target_child, node.path.steps);
            newFavoriteIds[node.path.id] = favId;
            if (favId) {
              const progress = getProgress(favId);
              if (progress) {
                newCompletedStepsMap[node.path.id] = progress.completedSteps;
              }
            }
          } else if (node.type === 'group' && node.children) {
            collectSingles(node.children);
          }
        });
      };
      collectSingles(data.paths);
      return { memoizedFavoriteIds: newFavoriteIds, memoizedCompletedStepsMap: newCompletedStepsMap };
    }
    return { memoizedFavoriteIds: {}, memoizedCompletedStepsMap: {} };
  }, [data.start_parent, data.target_child, data.success, data.paths]);

  // Update state when memoized values change
  useEffect(() => {
    setFavoriteIds(memoizedFavoriteIds);
    setCompletedStepsMap(memoizedCompletedStepsMap);
  }, [memoizedFavoriteIds, memoizedCompletedStepsMap]);

  // TODO: toggleGroup was previously defined but unused. If needed for future features, re-implement here.

  const handleFavorite = (path: PathData) => {
    if (!data.success) return;
    const favId = favoriteIds[path.id];
    if (favId) {
      removeFavorite(favId);
      setFavoriteIds(prev => ({ ...prev, [path.id]: null }));
      setCompletedStepsMap(prev => ({ ...prev, [path.id]: new Set() }));
      if (typeof onRemoveFavorite === 'function') {
        onRemoveFavorite(path);
      }
    } else {
      const newFavorite: Omit<FavoritePath, 'id' | 'dateAdded'> = {
        name: `${data.start_parent} → ${data.target_child}`,
        startParent: data.start_parent,
        targetChild: data.target_child,
        steps: path.steps
      };
      const id = addFavorite(newFavorite);
      setFavoriteIds(prev => ({ ...prev, [path.id]: id }));
      // Dispatch custom event to update sidebar
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
  };

  const handleStepToggle = (path: PathData, stepNumber: number) => {
    const favId = favoriteIds[path.id];
    if (!favId) return;
    toggleStepCompletion(favId, stepNumber);
    const prevSet = completedStepsMap[path.id] || new Set();
    const newCompletedSteps = new Set(prevSet);
    if (newCompletedSteps.has(stepNumber)) {
      newCompletedSteps.delete(stepNumber);
    } else {
      newCompletedSteps.add(stepNumber);
    }
    setCompletedStepsMap(prev => ({ ...prev, [path.id]: newCompletedSteps }));
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  const renderSinglePath = (path: PathData, showStepCount: boolean = true, showCheckboxes: boolean = false) => {
    const favId = favoriteIds[path.id];
    return (
      <div className="border-l-2 border-blue-200 pl-4 space-y-3 relative flex flex-col pb-14">
        <div className="absolute top-0 right-0 flex gap-2 z-10">
          <Button
            onClick={() => handleFavorite(path)}
            variant={favId ? 'danger' : 'icon'}
            size="sm"
            dark={isDark}
            title={favId ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={favId ? 'Remove from favorites' : 'Add to favorites'}
            className=""
          >
            {favId ? '\u2b50' : '\u2606'}
          </Button>
          <Button
            onClick={() => onAddToCollection && onAddToCollection(path)}
            variant="primary"
            size="sm"
            dark={isDark}
            title="Add to collection"
            aria-label={`Add path from ${data.start_parent} to ${data.target_child} to collection`}
            className=""
          >
            <span role="img" aria-label="Add to collection">📚</span>
          </Button>
        </div>
        {showStepCount && (
          <div className={`text-sm ${isDark ? 'text-accessible-secondary-dark' : 'text-accessible-secondary-light'} mb-2`}>
            {path.total_steps} breeding step{path.total_steps !== 1 ? 's' : ''}
          </div>
        )}
        {path.steps.filter(step => step.type !== 'start').map((step, stepIndex, filteredSteps) => (
          <div key={stepIndex} className="relative">
            <Step
              step={step}
              isLast={step.is_final}
              showCheckbox={showCheckboxes}
              path={path}
              completedStepsMap={completedStepsMap}
              favoriteIds={favoriteIds}
              handleStepToggle={handleStepToggle}
            />
            {stepIndex < filteredSteps.length - 1 && (
              <div className="ml-3 w-px h-4 bg-gray-300"></div>
            )}
          </div>
        ))}
        {/* Bottom action slot */}
        {typeof bottomAction === 'function' ? (bottomAction as (path: PathData) => React.ReactNode)(path) : bottomAction}
      </div>
    );
  };

  // Expanded state for all groups, managed as a Map
  // Expand all top-level groups (non-similar paths) by default, including merged single+group
  const [expandedMap, setExpandedMap] = useState<Map<string, boolean>>(() => {
    const map = new Map<string, boolean>();
    if (Array.isArray(data.paths)) {
      // Check for merged single+group case
      const singles = data.paths.filter(p => (p as RecursiveGroupedPath).type === 'single');
      const groups = data.paths.filter(p => (p as RecursiveGroupedPath).type === 'group');
      if (
        singles.length === 1 &&
        groups.length === 1 &&
        (groups[0] as RecursiveGroupedPath).common_steps &&
        (groups[0] as RecursiveGroupedPath).common_steps!.length > 0 &&
        (groups[0] as RecursiveGroupedPath).children
      ) {
        map.set('root-0-group', true);
      } else {
        data.paths.forEach((node, idx) => {
          if ((node as RecursiveGroupedPath).type === 'group') {
            map.set(`root-${idx}-group`, true);
          }
        });
      }
    }
    return map;
  });
  const toggleExpand = (key: string) => {
    setExpandedMap(prev => {
      const newMap = new Map(prev);
      newMap.set(key, !newMap.get(key));
      return newMap;
    });
  };

  // Recursive renderer for groups and singles
  const bgColorsDark = ['bg-gray-800', 'bg-gray-900', 'bg-gray-700'];
  const borderColorsDark = ['border-gray-600', 'border-gray-700', 'border-gray-500'];
  const bgColorsLight = ['bg-white', 'bg-gray-100', 'bg-gray-200'];
  const borderColorsLight = ['border-gray-200', 'border-gray-300', 'border-gray-400'];

  const renderNode = (node: RecursiveGroupedPath, depth: number, parentKey: string, expandedMap: Map<string, boolean>, toggleExpand: (key: string) => void) => {
    const bgColor = isDark ? bgColorsDark[depth % 3] : bgColorsLight[depth % 3];
    const borderColor = isDark ? borderColorsDark[depth % 3] : borderColorsLight[depth % 3];
    if (node.type === 'single') {
      return (
        <div key={parentKey} className={`border rounded-xl-std p-4 shadow-xl-std ${bgColor} ${borderColor}`}>
          {node.path && renderSinglePath(node.path, true, true)}
        </div>
      );
    }

    const groupKey = `${parentKey}-group`;
    const expanded = expandedMap.get(groupKey) || false;

    return (
      <div key={groupKey} className={`border rounded-xl-std shadow-xl-std ${bgColor} ${borderColor}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-medium ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {countDirectChildren(node)} Alternative Path{countDirectChildren(node) !== 1 ? 's' : ''} ({node.children?.[0]?.path?.total_steps || 0} steps)
            </h4>
          </div>
          {/* Show all common steps for this group */}
          {node.common_steps && node.common_steps.length > 0 && (
            <div className="mb-4 border-l-2 border-blue-200 pl-4 space-y-3">
              <div className={`text-xs mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Common steps:</div>
              {node.common_steps.filter(step => step.type !== 'start').map((step, stepIndex, filteredSteps) => (
                <div key={stepIndex} className="relative">
                  <Step
                    step={step}
                    isLast={false}
                    showCheckbox={true}
                    completedStepsMap={completedStepsMap}
                    favoriteIds={favoriteIds}
                    handleStepToggle={handleStepToggle}
                  />
                  {stepIndex < filteredSteps.length - 1 && (
                    <div className="ml-3 w-px h-4 bg-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => toggleExpand(groupKey)}
            variant="secondary"
            size="md"
            dark={isDark}
            className={`w-full text-left p-3 rounded border transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <span className={`text-sm font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {expanded ? 'Hide alternatives' : `Show ${countDirectChildren(node)} alternative${countDirectChildren(node) !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </Button>
          {expanded && node.children && (
            <div className="mt-3 space-y-3">
              {node.children.map((child, idx) => renderNode(child, depth + 1, `${groupKey}-${idx}`, expandedMap, toggleExpand))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to count only direct children for alternatives label
  const countDirectChildren = (node: RecursiveGroupedPath) => {
    if (!node.children) return 0;
    return node.children.filter(child => child.type === 'single' || child.type === 'group').length;
  };

  // Main render logic
  return (
    <div className="space-y-4 mt-8">
      {!hideSummaryHeader && (
        <div className={`rounded-xl-std p-4 border ${
          isDark 
            ? 'bg-green-900/30 border-green-800/50' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className={`font-medium ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>
            {summaryHeaderText || `Found ${data.total_paths} breeding path${data.total_paths !== 1 ? 's' : ''}`}
          </div>
          <div className={`text-sm ${isDark ? 'text-accessible-secondary-dark' : 'text-accessible-secondary-light'}`}>
            {data.start_parent} → {data.target_child} (minimum {data.min_steps} steps)
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.isArray(data.paths) && data.paths.length > 0
          ? (() => {
              // If there is a single top-level path and a group with common steps, move the single into the group as the first child
              const singles = data.paths.filter(p => (p as RecursiveGroupedPath).type === 'single');
              const groups = data.paths.filter(p => (p as RecursiveGroupedPath).type === 'group');
              if (
                singles.length === 1 &&
                groups.length === 1 &&
                (groups[0] as RecursiveGroupedPath).common_steps &&
                (groups[0] as RecursiveGroupedPath).common_steps!.length > 0 &&
                (groups[0] as RecursiveGroupedPath).children
              ) {
                // Prepend the single as the first child of the group
                const group = groups[0] as RecursiveGroupedPath;
                const newChildren = [singles[0] as RecursiveGroupedPath, ...group.children!];
                const newGroup = { ...group, children: newChildren };
                return [renderNode(newGroup, 0, `root-0`, expandedMap, toggleExpand)];
              }
              // Otherwise, use the previous logic
              return data.paths.flatMap((node, idx) => {
                const recNode = node as RecursiveGroupedPath;
                if (recNode.type === 'group' && (!recNode.common_steps || recNode.common_steps.length === 0) && recNode.children) {
                  // Render all children as singles, flatten the result
                  return recNode.children.map((child, cidx) =>
                    child.type === 'single'
                      ? renderNode(child, 0, `root-${idx}-child-${cidx}`, expandedMap, toggleExpand)
                      : null
                  );
                } else {
                  return [renderNode(recNode, 0, `root-${idx}`, expandedMap, toggleExpand)];
                }
              });
            })()
          : <div className="text-center text-gray-400">No breeding paths found.</div>
        }
      </div>
    </div>
  );
};

export default ExpandablePaths; 