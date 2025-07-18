import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Sidebar, { SidebarSection } from './components/layout/Sidebar';
import { FavoritePath, PathProgress, addFavorite, getOngoingPaths, isFavoritedBySteps, areStepsEqual } from './utils/storage';
import './App.css';
import { FavoritesProvider, useFavorites } from './components/context/FavoritesContext';
import { ThemeProvider } from './components/context/ThemeContext';
import Modal from './components/ui/Modal';
// Remove direct imports of Home, Favorites, Ongoing, CollectionsSection, Settings
// import Home from './components/pages/Home';
// import Favorites from './components/pages/Favorites';
// import Ongoing from './components/pages/Ongoing';
// import CollectionsSection from './components/pages/CollectionsSection';
// import Settings from './components/pages/Settings';

const Home = lazy(() => import('./components/pages/Home'));
const Favorites = lazy(() => import('./components/pages/Favorites'));
const Ongoing = lazy(() => import('./components/pages/Ongoing'));
const CollectionsSection = lazy(() => import('./components/pages/CollectionsSection'));
const Settings = lazy(() => import('./components/pages/Settings'));

interface BreedingResult {
  type: 'parent_lookup' | 'path_finding';
  result: string;
  error?: string;
  jsonData?: any; // Parsed JSON data for expandable paths
}

function AppContent() {
  const { favorites, collections, ongoing } = useFavorites();
  // Separate state for lookup and pathfind modes
  const [lookupParent1, setLookupParent1] = useState<string>('');
  const [lookupParent2, setLookupParent2] = useState<string>('');
  const [pathfindParent1, setPathfindParent1] = useState<string>('');
  const [pathfindParent2, setPathfindParent2] = useState<string>('');
  const [pathfindTargetChild, setPathfindTargetChild] = useState<string>('');
  const [mode, setMode] = useState<'lookup' | 'pathfind'>('lookup');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BreedingResult | null>(null);
  const [currentSection, setCurrentSection] = useState<SidebarSection>('home');
  const [computationTime, setComputationTime] = useState<number>(3); // Default 3 seconds
  const [customTime, setCustomTime] = useState<string>('');
  const [maxPaths, setMaxPaths] = useState<number>(20);
  const [maxPathsEnabled, setMaxPathsEnabled] = useState(true);
  const [progress, setProgress] = useState<{ current: number; max: number; label: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [highlightedFavoriteId, setHighlightedFavoriteId] = useState<string | null>(null);
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [combiningFavoriteId, setCombiningFavoriteId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [pathToAdd, setPathToAdd] = useState<any | null>(null);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(null);
  const [palList, setPalList] = useState<string[]>([]);
  const [pulseOngoingItemId, setPulseOngoingItemId] = useState<string | null>(null);

  function showDialog(message: string, type: 'success' | 'error') {
    setDialog({ message, type });
    setTimeout(() => setDialog(null), 2500);
  }

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Load Pal list from Tauri command
  useEffect(() => {
    const loadPalList = async () => {
      try {
        console.log('Loading Pal list from Tauri command...');
        
        // Call the Tauri command to get the Pal list
        const palNames = await invoke<string[]>('get_pal_list');
        setPalList(palNames);
        console.log(`✓ Received ${palNames.length} Pal names from Tauri command`);
        
      } catch (error) {
        console.error('❌ Failed to load Pal list from Tauri command:', error);
        setPalList([]);
      }
    };

    loadPalList();
  }, []);

  useEffect(() => {
    // Handler for running all three scripts
    const handleUpdateAllData = async () => {
      setProgress({ current: 0, max: 0, label: 'all' });
      setIsRunning(true);
      setProgressError(null);
      try {
        await runScriptWithProgress('palworld_image_scraper.py', 'images');
        await runScriptWithProgress('palworld_breeding_scraper.py', 'breeding data');
        await runScriptWithProgress('palworld_fullCalc_scraper.py', 'full calc');
        setProgress(null);
        alert('All data updated successfully!');
      } catch (e) {
        setProgressError('Failed to update all data: ' + e);
      }
      setIsRunning(false);
    };
    const handleUpdateImages = async () => {
      setProgress({ current: 0, max: 0, label: 'images' });
      setIsRunning(true);
      setProgressError(null);
      try {
        await runScriptWithProgress('palworld_image_scraper.py', 'images');
        setProgress(null);
        alert('Images updated successfully!');
      } catch (e) {
        setProgressError('Failed to update images: ' + e);
      }
      setIsRunning(false);
    };
    const handleUpdateBreeding = async () => {
      setProgress({ current: 0, max: 0, label: 'breeding data' });
      setIsRunning(true);
      setProgressError(null);
      try {
        await runScriptWithProgress('palworld_breeding_scraper.py', 'breeding data');
        setProgress(null);
        alert('Breeding data updated successfully!');
      } catch (e) {
        setProgressError('Failed to update breeding data: ' + e);
      }
      setIsRunning(false);
    };
    const handleUpdateFullCalc = async () => {
      setProgress({ current: 0, max: 0, label: 'full calc' });
      setIsRunning(true);
      setProgressError(null);
      try {
        await runScriptWithProgress('palworld_fullCalc_scraper.py', 'full calc');
        setProgress(null);
        alert('Full calculator updated successfully!');
      } catch (e) {
        setProgressError('Failed to update full calculator: ' + e);
      }
      setIsRunning(false);
    };
    const handleResetLocalStorage = () => {
      if (window.confirm('Are you sure you want to reset all favorites and ongoing progress? This cannot be undone.')) {
        localStorage.removeItem('favorites');
        localStorage.removeItem('ongoing');
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
        alert('Local storage reset!');
      }
    };
    window.addEventListener('updateAllData', handleUpdateAllData);
    window.addEventListener('updateImages', handleUpdateImages);
    window.addEventListener('updateBreeding', handleUpdateBreeding);
    window.addEventListener('updateFullCalc', handleUpdateFullCalc);
    window.addEventListener('resetLocalStorage', handleResetLocalStorage);
    return () => {
      window.removeEventListener('updateAllData', handleUpdateAllData);
      window.removeEventListener('updateImages', handleUpdateImages);
      window.removeEventListener('updateBreeding', handleUpdateBreeding);
      window.removeEventListener('updateFullCalc', handleUpdateFullCalc);
      window.removeEventListener('resetLocalStorage', handleResetLocalStorage);
    };
  }, []);

  // Removed: useEffect for loading favorites/ongoing, now handled by context

  // When selectedFavoriteId changes, set highlight and clear after 5s
  useEffect(() => {
    if (selectedFavoriteId) {
      setHighlightedFavoriteId(selectedFavoriteId);
      const timeout = setTimeout(() => setHighlightedFavoriteId(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [selectedFavoriteId]);

  // Helper to run a script and update progress
  async function runScriptWithProgress(script: string, label: string) {
    return new Promise<void>(async (resolve, reject) => {
      let current = 0;
      let max = 0;
      setProgress({ current, max, label });
      
      try {
        const command = Command.sidecar(script, []);
        const output = await command.execute();
        
        if (output.code === 0) {
          console.log(`✅ Script ${script} completed successfully`);
          resolve();
        } else {
          console.error(`❌ Script ${script} failed with exit code ${output.code}: ${output.stderr}`);
          reject(new Error(`Script failed with exit code ${output.code}: ${output.stderr || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(`💥 Error running script ${script}:`, error);
        reject(error);
      }
    });
  }

  const executeBreedingScript = async (overrideMaxPaths?: number) => {
    // Use the correct state for the current mode
    let parent1 = mode === 'lookup' ? lookupParent1 : pathfindParent1;
    let parent2 = mode === 'lookup' ? lookupParent2 : pathfindParent2;
    let targetChild = mode === 'pathfind' ? pathfindTargetChild : '';
    if (!parent1 && !parent2 && !targetChild) {
      setResult({
        type: 'parent_lookup',
        result: '',
        error: 'Please provide at least two parameters'
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let args: string[] = [];
      if (mode === 'lookup' && parent1 && parent2) {
        // Parent lookup mode: -p1 "Parent1" -p2 "Parent2" --json
        args = ['-p1', parent1, '-p2', parent2, '--json'];
      } else if (mode === 'pathfind') {
        // Pathfinding mode: (-p1 or -p2) and -c --json --max-paths N
        let maxSeconds = computationTime;
        if (customTime && !isNaN(Number(customTime))) {
          maxSeconds = Number(customTime);
        }
        let effectiveMaxPaths: number;
        if (maxPathsEnabled) {
          if (typeof overrideMaxPaths === 'number') {
            effectiveMaxPaths = overrideMaxPaths;
          } else if (typeof maxPaths === 'number') {
            effectiveMaxPaths = maxPaths;
          } else {
            effectiveMaxPaths = 20; // fallback default
          }
        } else {
          effectiveMaxPaths = 1000000; // Effectively unlimited
        }
        if (isNaN(effectiveMaxPaths)) effectiveMaxPaths = 20;
        if ((parent1 || parent2) && targetChild) {
          if (parent1) {
            args = ['-p1', parent1, '-c', targetChild, '--json', '--max-paths', String(effectiveMaxPaths)];
          } else {
            args = ['-p2', parent2, '-c', targetChild, '--json', '--max-paths', String(effectiveMaxPaths)];
          }
          if (maxSeconds > 0) {
            args.push('--max-seconds', String(maxSeconds));
          }
        } else {
          throw new Error('For pathfinding, provide one parent and a target child');
        }
      } else {
        throw new Error('Invalid parameter combination');
      }

      console.log(`🚀 Executing Python sidecar in ${mode} mode`);
      console.log(`📝 Sidecar: binaries/breeding-path ${args.join(' ')}`);
      console.log(`📋 Arguments:`, args);

      // Add extensive debugging for binary discovery
      console.log(`🔍 DEBUGGING BINARY DISCOVERY:`);
      console.log(`   Target binary: binaries/breeding-path (Tauri will auto-resolve to .exe on Windows)`);
      console.log(`   Platform: ${navigator.platform}`);
      console.log(`   User agent: ${navigator.userAgent}`);
      
      console.log(`📁 Tauri sidecar will automatically resolve the binary name based on platform`);

      // Log command creation details
      console.log(`⚙️ Creating sidecar command...`);

      // Execute the sidecar using Tauri's sidecar API
      const command = Command.sidecar('binaries/breeding-path', args);
      console.log(`✅ Command object created successfully`);
      console.log(`🎯 Executing command...`);
      const output = await command.execute();

      console.log(`🎉 Sidecar executed successfully`);
      console.log(`📋 Exit code:`, output.code);
      console.log(`📋 STDOUT:`, output.stdout);
      console.log(`📋 STDERR:`, output.stderr);
      
      if (output.code === 0) {
        try {
          // Try to parse JSON response
          const jsonResult = JSON.parse(output.stdout);
          if (mode === 'lookup') {
            setResult({
              type: 'parent_lookup',
              result: jsonResult.child ? `${parent1} + ${parent2} = ${jsonResult.child}` : 'No breeding combination found',
              jsonData: jsonResult
            });
          } else {
            setResult({
              type: 'path_finding',
              result: output.stdout,
              jsonData: jsonResult
            });
          }
        } catch (parseError) {
          setResult({
            type: mode === 'lookup' ? 'parent_lookup' : 'path_finding',
            result: output.stdout
          });
        }
      } else {
        setResult({
          type: mode === 'lookup' ? 'parent_lookup' : 'path_finding',
          result: '',
          error: `Sidecar failed with exit code ${output.code}: ${output.stderr || 'No error message'}`
        });
      }
      
    } catch (error) {
      console.error(`💥 Exception during sidecar execution:`, error);
      console.error(`💥 Error type:`, typeof error);
      console.error(`💥 Error constructor:`, error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error(`💥 Error message:`, error.message);
        console.error(`💥 Error stack:`, error.stack);
      }
      
      // Additional debugging for the specific error
      console.error(`🔬 DETAILED ERROR ANALYSIS:`);
      console.error(`   Error string representation:`, String(error));
      console.error(`   Error JSON:`, JSON.stringify(error, null, 2));
      
      // Check if it's the specific "not found" error
      if (String(error).includes('not found')) {
        console.error(`🎯 BINARY NOT FOUND ERROR DETECTED`);
        console.error(`   This suggests Tauri cannot locate the sidecar binary`);
        console.error(`   Check the following:`);
        console.error(`   1. Binary exists in src-tauri/binaries/`);
        console.error(`   2. tauri.conf.json externalBin configuration`);
        console.error(`   3. capabilities/default.json permissions`);
        console.error(`   4. Binary naming convention matches platform`);
      }
      
      setResult({
        type: mode === 'lookup' ? 'parent_lookup' : 'path_finding',
        result: '',
        error: `Sidecar execution failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
    } finally {
      setIsLoading(false);
      console.log(`🏁 Sidecar execution finished, loading state cleared`);
    }
  };

  const clearAll = () => {
    setLookupParent1('');
    setLookupParent2('');
    setPathfindParent1('');
    setPathfindParent2('');
    setPathfindTargetChild('');
    setResult(null);
  };

  // Function to handle mode changes and clear results
  const handleModeChange = (newMode: 'lookup' | 'pathfind') => {
    setMode(newMode);
    setResult(null); // Clear results when switching modes to prevent JSON plaintext display
  };

  const handleFavoriteSelect = (favorite: FavoritePath) => {
    setPathfindParent1(favorite.startParent);
    setPathfindTargetChild(favorite.targetChild);
    setMode('pathfind');
    setCurrentSection('home');
    setResult(null);
  };

  const handleOngoingSelect = (item: { favorite: FavoritePath; progress: PathProgress }) => {
    setCurrentSection('favorites');
    setSelectedFavoriteId(null);
    setTimeout(() => setSelectedFavoriteId(item.favorite.id), 0);
    
    // Trigger pulse animation in ongoing when going back
    setPulseOngoingItemId(item.favorite.id);
    setTimeout(() => setPulseOngoingItemId(null), 2000);
  };

  // Handler for removing a favorite and staying on the favorites page
  const handleRemoveFavorite = (fav: any) => {
    // This function will be called when a favorite is removed from the favorites page
    // The favorite will already be removed by the ExpandablePaths component
    // We don't need to navigate away, just stay on the favorites page
  };

  // Handler for loading more paths
  const handleLoadMore = () => {
    const newMax = maxPaths + 20;
    setMaxPaths(newMax);
    executeBreedingScript(newMax);
  };

  // Fix favoriteRefs type
  const favoriteRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedFavoriteId && favoriteRefs.current[selectedFavoriteId]) {
      favoriteRefs.current[selectedFavoriteId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedFavoriteId]);

  function handleCombineWithFavorite(fav: FavoritePath, otherId: string) {
    const other = favorites.find(f => f.id === otherId);
    if (!other) return;
    let combinedSteps = [];
    let startParent = '';
    let targetChild = '';
    // Append: fav.targetChild === other.startParent
    if (fav.targetChild === other.startParent) {
      combinedSteps = [...fav.steps, ...other.steps.filter(s => s.type !== 'start')];
      startParent = fav.startParent;
      targetChild = other.targetChild;
    } else if (other.targetChild === fav.startParent) {
      // Prepend: other.targetChild === fav.startParent
      combinedSteps = [...other.steps, ...fav.steps.filter(s => s.type !== 'start')];
      startParent = other.startParent;
      targetChild = fav.targetChild;
    } else {
      showDialog('Paths do not connect!', 'error');
      setCombiningFavoriteId(null);
      return;
    }
    // Renumber steps
    let stepNum = 1;
    const renumbered = combinedSteps.map((s) => {
      if (s.type === 'breed') {
        return { ...s, step_number: stepNum++, is_final: false };
      } else {
        return { ...s };
      }
    });
    // Mark last breed step as final
    for (let i = renumbered.length - 1; i >= 0; --i) {
      if (renumbered[i].type === 'breed') {
        renumbered[i].is_final = true;
        break;
      }
    }
    // Default name: first two parents + final child
    const breedSteps = renumbered.filter(s => s.type === 'breed');
    let parent1 = breedSteps[0]?.parents?.split(' + ')[0] || '';
    let parent2 = breedSteps[0]?.parents?.split(' + ')[1] || '';
    if (!parent2 && breedSteps[1]) {
      parent2 = breedSteps[1]?.parents?.split(' + ')[0] || '';
    }
    const child = breedSteps[breedSteps.length - 1]?.result || targetChild;
    const defaultName = `${parent1}${parent2 ? ' + ' + parent2 : ''} → ${child}`;
    // Name logic: use customName of the selected (dropdown) path if set, else default
    const newName = other.customName?.trim() ? other.customName : defaultName;
    const newCustomName = other.customName?.trim() ? other.customName : undefined;
    // Add the new favorite using addFavorite to get id/dateAdded
    const newId = addFavorite({
      name: newName,
      startParent,
      targetChild,
      steps: renumbered,
      customName: newCustomName,
    });

  // Handler for loading more paths
  const handleLoadMore = () => {
    const newMax = maxPaths + 20;
    setMaxPaths(newMax);
    executeBreedingScript(newMax);
  };

  // Fix favoriteRefs type
  const favoriteRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedFavoriteId && favoriteRefs.current[selectedFavoriteId]) {
      favoriteRefs.current[selectedFavoriteId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedFavoriteId]);

    // Remove both old favorites and any duplicate of the new favorite (by steps)
    let data = favorites.filter(f => f.id !== fav.id && f.id !== other.id && !areStepsEqual(f.steps, renumbered));
    const newFav = favorites.find(f => f.id === newId);
    if (newFav) data.push(newFav);
    localStorage.setItem('palworld-breeding-data', JSON.stringify({
      favorites: data,
      progress: getOngoingPaths().reduce((acc: Record<string, PathProgress>, o) => { acc[o.favorite.id] = o.progress; return acc; }, {})
    }));
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    setCombiningFavoriteId(null);
    showDialog('Paths combined!', 'success');
  }

  // Handler for opening the add-to-collection modal
  const handleAddToCollection = (path: any) => {
    setPathToAdd(path);
    setShowAddToCollectionModal(true);
  };
  // Handler for actually adding the path to the selected collection
  const handleSelectCollection = () => {
    if (!pathToAdd || !pendingCollectionId) return;
    // Always use the canonical favorite object for the collection
    let favorite = null;
    const favId = isFavoritedBySteps(pathToAdd.startParent, pathToAdd.targetChild, pathToAdd.steps);
    if (favId) {
      favorite = favorites.find(f => f.id === favId);
    } else {
      // Create new favorite if not found
      const newFavorite = {
        name: `${pathToAdd.startParent} → ${pathToAdd.targetChild}`,
        startParent: pathToAdd.startParent,
        targetChild: pathToAdd.targetChild,
        steps: pathToAdd.steps,
      };
      const newId = addFavorite(newFavorite);
      favorite = favorites.find(f => f.id === newId);
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }
    if (!favorite) return;
    // Now handled by context mutators; just close modal and show dialog
    setShowAddToCollectionModal(false);
    setShowConfirmAddModal(false);
    setPathToAdd(null);
    setPendingCollectionId(null);
    showDialog('Path added to collection!', 'success');
  };

  // Removed: useEffect for persisting collections, now handled by context

  function handleEditFavoriteName(fav: any) {
    setEditingFavoriteId(fav.id);
    setEditingName(fav.customName ?? '');
  }
  function handleSaveFavoriteName() {
    // Save logic here (implement as needed)
    setEditingFavoriteId(null);
    setEditingName('');
  }
  function handleCancelEditFavoriteName() {
    setEditingFavoriteId(null);
    setEditingName('');
  }

  return (
    <>
      {/* Fixed repeating background gradient */}
      <div className="fixed inset-0 -z-10 w-screen h-screen bg-repeat-y bg-gradient-repeat" style={{ pointerEvents: 'none' }} />
      <div className="min-h-screen transition-colors duration-300">
        <Sidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          onFavoriteSelect={handleFavoriteSelect}
          onOngoingSelect={handleOngoingSelect}
        />
        
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 relative">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-header-text">
                Palworld Breeding Calculator
              </h1>
              <p className={`text-lg ${
                document.documentElement.classList.contains('dark') ? 'text-white/80' : 'text-gray-600'
              }`}>
                Find breeding combinations and shortest paths to your desired Pals
              </p>
            </div>

            {/* Section-specific content: Only one section visible at a time */}
            {currentSection === 'settings' && (
              <Suspense fallback={<LoadingSpinner />}>
                <Settings
                  isRunning={isRunning}
                  progress={progress}
                  progressError={progressError}
                  onUpdateAllData={() => window.dispatchEvent(new CustomEvent('updateAllData'))}
                  onUpdateImages={() => window.dispatchEvent(new CustomEvent('updateImages'))}
                  onUpdateBreeding={() => window.dispatchEvent(new CustomEvent('updateBreeding'))}
                  onUpdateFullCalc={() => window.dispatchEvent(new CustomEvent('updateFullCalc'))}
                  onResetLocalStorage={() => window.dispatchEvent(new CustomEvent('resetLocalStorage'))}
                />
              </Suspense>
            )}
            {currentSection === 'home' && (
              <Suspense fallback={<LoadingSpinner />}>
                <Home
                  mode={mode}
                  setMode={handleModeChange}
                  lookupParent1={lookupParent1}
                  setLookupParent1={setLookupParent1}
                  lookupParent2={lookupParent2}
                  setLookupParent2={setLookupParent2}
                  pathfindParent1={pathfindParent1}
                  setPathfindParent1={setPathfindParent1}
                  pathfindParent2={pathfindParent2}
                  setPathfindParent2={setPathfindParent2}
                  pathfindTargetChild={pathfindTargetChild}
                  setPathfindTargetChild={setPathfindTargetChild}
                  computationTime={computationTime}
                  setComputationTime={setComputationTime}
                  customTime={customTime}
                  setCustomTime={setCustomTime}
                  isLoading={isLoading}
                  result={result}
                  maxPaths={maxPaths}
                  setMaxPaths={setMaxPaths}
                  maxPathsEnabled={maxPathsEnabled}
                  setMaxPathsEnabled={setMaxPathsEnabled}
                  onRun={executeBreedingScript}
                  onClear={clearAll}
                  onLoadMore={handleLoadMore}
                  onAddToCollection={handleAddToCollection}
                  progress={progress}
                  progressError={progressError}
                  palList={palList}
                />
              </Suspense>
            )}

            {currentSection === 'favorites' && (
              <Suspense fallback={<LoadingSpinner />}>
                <Favorites
                  favorites={favorites}
                  selectedFavoriteId={selectedFavoriteId}
                  highlightedFavoriteId={highlightedFavoriteId}
                  editingFavoriteId={editingFavoriteId}
                  editingName={editingName}
                  combiningFavoriteId={combiningFavoriteId}
                  handleEditFavoriteName={handleEditFavoriteName}
                  handleSaveFavoriteName={handleSaveFavoriteName}
                  handleCancelEditFavoriteName={handleCancelEditFavoriteName}
                  handleCombineWithFavorite={handleCombineWithFavorite}
                  handleFavoriteSelect={handleFavoriteSelect}
                  onAddToCollection={handleAddToCollection}
                  favoriteRefs={favoriteRefs}
                  onRemoveFavorite={handleRemoveFavorite}
                />
              </Suspense>
            )}

            {currentSection === 'ongoing' && (
              <Suspense fallback={<LoadingSpinner />}>
                <Ongoing
                  ongoing={ongoing}
                  handleOngoingSelect={handleOngoingSelect}
                  onAddToCollection={handleAddToCollection}
                  pulseItemId={pulseOngoingItemId}
                />
              </Suspense>
            )}

            {currentSection === 'collections' && (
              <Suspense fallback={<LoadingSpinner />}>
                <CollectionsSection />
              </Suspense>
            )}

            {/* Results - Only show on Home section */}
            {currentSection === 'home' && (
              <>
                {/* REMOVE these duplicate renders: */}
                {/* {isLoading && <LoadingSpinner />} */}
                {/* {result && !isLoading && result.type === 'path_finding' && result.jsonData && (
                  <ExpandablePaths
                    data={result.jsonData}
                    isDarkMode={isDarkMode}
                    maxPaths={maxPaths}
                    onLoadMore={() => handleLoadMore()}
                  />
                )} */}
              </>
            )}
          </div>
        </div>
      </div>
      {dialog && (
        <Modal open={!!dialog} onClose={() => setDialog(null)} className={`top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl-std shadow-xl-std font-semibold text-center transition-all ${dialog.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} overlayClassName="bg-transparent flex items-start justify-center z-50">
          {dialog.message}
        </Modal>
      )}
      {/* Modal for selecting collection to add a path */}
      {showAddToCollectionModal && (
        <Modal open={showAddToCollectionModal} onClose={() => setShowAddToCollectionModal(false)} className="w-full max-w-sm border-blue-200 rounded-xl-std shadow-xl-std bg-white dark:bg-gray-800 flex flex-col">
          <h2 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-200">Add Path to Collection</h2>
          <div className="flex-1 overflow-y-auto mb-4">
            {collections.length === 0 ? (
              <div className="text-gray-400 text-sm text-center">No collections available. Create one first.</div>
            ) : (
              <ul className="space-y-2">
                {collections.map((col: any) => (
                  <li key={col.id}>
                    <button
                      className="w-full text-left px-4 py-2 rounded transition font-medium border border-gray-300 dark:border-gray-700 group bg-gray-50 dark:bg-gray-800
                        hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900 dark:hover:to-purple-900
                        hover:shadow-lg hover:border-blue-400 dark:hover:border-purple-500"
                      onClick={() => { setPendingCollectionId(col.id); setShowConfirmAddModal(true); }}
                    >
                      <span className="text-base font-semibold text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-purple-300 transition-colors duration-200">{col.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => setShowAddToCollectionModal(false)}
            >
              Cancel
            </button>
          </div>
          {/* Confirmation Modal */}
          {showConfirmAddModal && (
            <Modal open={showConfirmAddModal} onClose={() => { setShowConfirmAddModal(false); setPendingCollectionId(null); }} className="w-full max-w-sm border-blue-200 rounded-xl-std shadow-xl-std bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold mb-4 text-blue-700 dark:text-blue-200">Confirm Add</h2>
              <div className="mb-4 text-gray-700 dark:text-gray-200">Are you sure you want to add this path to the selected collection?</div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => { setShowConfirmAddModal(false); setPendingCollectionId(null); }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  onClick={handleSelectCollection}
                >
                  Confirm
                </button>
              </div>
            </Modal>
          )}
        </Modal>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </ThemeProvider>
  );
}
