import * as React from 'react';
import { useContext } from 'react';
import ExpandablePaths from '../ui/ExpandablePaths';
import Input from '../ui/Input';
import Radio from '../ui/Radio';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ThemeContext } from '../context/ThemeContext';
import PalSelector from '../ui/PalSelector';

/**
 * Home page component for the Palworld Breeding Calculator.
 * Allows users to look up breeding results or find breeding paths between Pals.
 * Handles mode switching, input selection, computation controls, and result display.
 */
interface HomeProps {
  /**
   * Props for the Home component.
   * @property isDarkMode - Whether dark mode is enabled.
   * @property mode - Current mode ('lookup' or 'pathfind').
   * @property setMode - Function to set the current mode.
   * @property lookupParent1 - Selected parent 1 for lookup mode.
   * @property setLookupParent1 - Setter for lookupParent1.
   * @property lookupParent2 - Selected parent 2 for lookup mode.
   * @property setLookupParent2 - Setter for lookupParent2.
   * @property pathfindParent1 - Selected parent 1 for pathfind mode.
   * @property setPathfindParent1 - Setter for pathfindParent1.
   * @property pathfindParent2 - Selected parent 2 for pathfind mode.
   * @property setPathfindParent2 - Setter for pathfindParent2.
   * @property pathfindTargetChild - Target child for pathfind mode.
   * @property setPathfindTargetChild - Setter for pathfindTargetChild.
   * @property palList - List of all available Pals.
   * @property computationTime - Time limit for computation (seconds).
   * @property setComputationTime - Setter for computationTime.
   * @property customTime - Custom time input value.
   * @property setCustomTime - Setter for customTime.
   * @property isLoading - Whether a computation is in progress.
   * @property result - Computation result data.
   * @property maxPaths - Maximum number of paths to display.
   * @property setMaxPaths - Setter for maxPaths.
   * @property maxPathsEnabled - Whether max paths limit is enabled.
   * @property setMaxPathsEnabled - Setter for maxPathsEnabled.
   * @property onRun - Handler to start computation.
   * @property onClear - Handler to clear all inputs/results.
   * @property onLoadMore - Handler to load more paths.
   * @property onAddToCollection - Handler to add a path to a collection.
   * @property progress - Progress data for ongoing computation.
   * @property progressError - Error message for progress/computation.
   */
  mode: 'lookup' | 'pathfind' | 'childlookup';
  setMode: (mode: 'lookup' | 'pathfind' | 'childlookup') => void;
  lookupParent1: string;
  setLookupParent1: (v: string) => void;
  lookupParent2: string;
  setLookupParent2: (v: string) => void;
  pathfindParent1: string;
  setPathfindParent1: (v: string) => void;

  pathfindTargetChild: string;
  setPathfindTargetChild: (v: string) => void;
  childLookupTarget: string;
  setChildLookupTarget: (v: string) => void;
  computationTime: number;
  setComputationTime: (n: number) => void;
  customTime: string;
  setCustomTime: (v: string) => void;
  isLoading: boolean;
  result: any;
  maxPaths: number;
  setMaxPaths: (n: number) => void;
  maxPathsEnabled: boolean;
  setMaxPathsEnabled: (b: boolean) => void;
  onRun: () => void;
  onClear: () => void;
  onLoadMore: () => void;
  onAddToCollection: (path: any) => void;
  progress: any;
  progressError: string | null;
  palList: string[];
}

const Home: React.FC<HomeProps> = ({
  mode, setMode,
  lookupParent1, setLookupParent1, lookupParent2, setLookupParent2,
  pathfindParent1, setPathfindParent1, pathfindTargetChild, setPathfindTargetChild,
  childLookupTarget, setChildLookupTarget,
  computationTime, setComputationTime, customTime, setCustomTime,
  isLoading, result, maxPaths, setMaxPaths, maxPathsEnabled, setMaxPathsEnabled,
  onRun, onClear, onLoadMore, onAddToCollection, progress, progressError,
  palList
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  return (
    <div id="main-content" className={`p-6 md:p-8 mb-6 rounded-xl-std shadow-xl-std transition-all duration-300 ${
      isDark 
        ? 'bg-white/10 backdrop-blur-md border border-white/20' 
        : 'bg-white/80 backdrop-blur-md border border-gray-200'
    }`}>
      {/* Mode Selector */}
      <div className="mb-6">
        <label className={`block font-semibold mb-3 ${
          isDark ? 'text-accessible-dark' : 'text-accessible-light'
        }`}>Mode:</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center cursor-pointer">
            <Radio
              type="radio"
              name="mode"
              value="lookup"
              checked={mode === 'lookup'}
              onChange={(e) => setMode(e.target.value as 'lookup' | 'pathfind')}
              className="sr-only"
              theme={isDark ? 'dark' : 'light'}
            />
            <Button
              type="button"
              variant={mode === 'lookup' ? 'primary' : 'secondary'}
              size="lg"
              dark={isDark}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              onClick={() => setMode('lookup')}
              aria-pressed={mode === 'lookup'}
            >
              🔍 Parent Lookup
            </Button>
          </label>
          <label className="flex items-center cursor-pointer">
            <Radio
              type="radio"
              name="mode"
              value="pathfind"
              checked={mode === 'pathfind'}
              onChange={(e) => setMode(e.target.value as 'lookup' | 'pathfind')}
              className="sr-only"
              theme={isDark ? 'dark' : 'light'}
            />
            <Button
              type="button"
              variant={mode === 'pathfind' ? 'primary' : 'secondary'}
              size="lg"
              dark={isDark}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              onClick={() => setMode('pathfind')}
              aria-pressed={mode === 'pathfind'}
            >
              🎯 Path Finding
            </Button>
          </label>
          <label className="flex items-center cursor-pointer">
            <Radio
              type="radio"
              name="mode"
              value="childlookup"
              checked={mode === 'childlookup'}
              onChange={(e) => setMode(e.target.value as 'lookup' | 'pathfind' | 'childlookup')}
              className="sr-only"
              theme={isDark ? 'dark' : 'light'}
            />
            <Button
              type="button"
              variant={mode === 'childlookup' ? 'primary' : 'secondary'}
              size="lg"
              dark={isDark}
              className="px-6 py-3 rounded-lg font-semibold transition-all"
              onClick={() => setMode('childlookup')}
              aria-pressed={mode === 'childlookup'}
            >
              🔍 Child Lookup
            </Button>
          </label>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {mode === 'lookup' && (
          <>
            <div className="col-span-1 mb-4">
              <PalSelector
                label="Parent 1"
                value={lookupParent1}
                onChange={setLookupParent1}
                palList={palList}
                required
                disabled={isLoading}
              />
            </div>
            <div className="col-span-1 mb-4">
              <PalSelector
                label="Parent 2"
                value={lookupParent2}
                onChange={setLookupParent2}
                palList={palList}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}
        {mode === 'pathfind' && (
          <>
            <div className="col-span-1 mb-4">
              <PalSelector
                label="Parent 1"
                value={pathfindParent1}
                onChange={setPathfindParent1}
                palList={palList}
                required
                disabled={isLoading}
              />
            </div>
            <div className="col-span-1 mb-4">
              <PalSelector
                label="Target Child"
                value={pathfindTargetChild}
                onChange={setPathfindTargetChild}
                palList={palList}
                required
                disabled={isLoading}
              />
            </div>
          </>
        )}
        {mode === 'childlookup' && (
          <div className="col-span-1 mb-4">
            <PalSelector
              label="Target Child"
              value={childLookupTarget}
              onChange={setChildLookupTarget}
              palList={palList}
              required
              disabled={isLoading}
            />
          </div>
        )}
      </div>

      {/* Computation Time Controls (only for pathfind mode) */}
      {mode === 'pathfind' && (
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>Computation Time:</span>
            {[1, 3, 5, 10].map((sec) => (
              <Button
                key={sec}
                onClick={() => { setComputationTime(sec); setCustomTime(''); }}
                variant={computationTime === sec && !customTime ? 'primary' : 'secondary'}
                size="sm"
                dark={isDark}
              >
                {sec}s
              </Button>
            ))}
            <Input
              type="number"
              min={1}
              max={60}
              placeholder="Custom"
              value={customTime}
              onChange={e => {
                setCustomTime(e.target.value);
                setComputationTime(Number(e.target.value) || computationTime);
              }}
              className="w-20 ml-2"
              theme={isDark ? 'dark' : 'light'}
            />
            <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              checked={maxPathsEnabled}
              onChange={e => setMaxPathsEnabled(e.target.checked)}
              className="mr-2"
              theme={isDark ? 'dark' : 'light'}
            />
            <span className={`font-medium ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>Limit Max Paths</span>
            <Input
              type="number"
              min={1}
              max={1000}
              value={maxPaths}
              onChange={e => setMaxPaths(Number(e.target.value) || 20)}
              className="w-20 ml-2"
              theme={isDark ? 'dark' : 'light'}
              disabled={!maxPathsEnabled}
            />
            <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>paths</span>
          </div>
        </div>
      )}

      {/* Progress Bar and Status */}
      {progress && (
        <div className="mt-8">
          <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>{`Updating ${progress.label}...`}</div>
          {progress.max > 0 ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2 dark:bg-gray-700">
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <Button
          onClick={onRun}
          disabled={
            mode === 'lookup' ? (!lookupParent1 || !lookupParent2) : 
            mode === 'childlookup' ? (!childLookupTarget) :
            (isLoading || !pathfindParent1 || !pathfindTargetChild)
          }
          variant="primary"
          size="lg"
          loading={isLoading}
          dark={isDark}
        >
          {isLoading ? 'Calculating...' : `${mode === 'lookup' ? 'Find Child' : mode === 'childlookup' ? 'Find Parents' : 'Find Paths'}`}
        </Button>
        <Button
          onClick={onClear}
          variant="secondary"
          size="lg"
          dark={isDark}
        >
          Clear All
        </Button>
      </div>

      {/* Results */}
      {mode === 'lookup' && result && !isLoading && (
        <div className="mt-8 text-center">
          <div className={`text-2xl font-bold ${isDark ? 'text-green-200' : 'text-green-800'}`}>Breeding Result</div>
          <div className={`mt-4 text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{result.result}</div>
        </div>
      )}
      {mode === 'childlookup' && result && !isLoading && result.type === 'child_lookup' && result.jsonData && (
        <div className="mt-8">
          <div className={`text-2xl font-bold text-center mb-6 ${isDark ? 'text-green-200' : 'text-green-800'}`}>
            Parent Combinations for {result.jsonData.target_child}
          </div>
          <ExpandablePaths
            data={result.jsonData}
            maxPaths={result.jsonData.total_paths}
            onLoadMore={() => {}} // No more paths to load for child lookup
            onAddToCollection={onAddToCollection}
          />
        </div>
      )}
      {mode === 'pathfind' && result && !isLoading && result.type === 'path_finding' && result.jsonData && (
        <ExpandablePaths
          data={result.jsonData}
          maxPaths={maxPaths}
          onLoadMore={onLoadMore}
          onAddToCollection={onAddToCollection}
        />
      )}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default Home; 