import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Sidebar, { SidebarSection } from './components/layout/Sidebar';
import { FavoritePath, PathProgress, isFavoritedBySteps } from './utils/storage';
import { BreedingStep } from './components/ui/ExpandablePaths';
import { CSVReader } from './utils/csvReader';
import './App.css';
import { FavoritesProvider, useFavorites } from './components/context/FavoritesContext';
import { ThemeProvider } from './components/context/ThemeContext';
import Modal from './components/ui/Modal';
import ErrorBoundary from './components/ui/ErrorBoundary';
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
const Weaknesses = lazy(() => import('./components/pages/Weaknesses'));
const Settings = lazy(() => import('./components/pages/Settings'));

interface BreedingResult {
  type: 'parent_lookup' | 'path_finding' | 'child_lookup';
  result: string;
  error?: string;
  jsonData?: any; // Parsed JSON data for expandable paths
}

function AppContent() {
  const { favorites, collections, ongoing, removeFavorite, addFavorite, addPathToCollection } = useFavorites();
  // Separate state for lookup and pathfind modes
  const [lookupParent1, setLookupParent1] = useState<string>('');
  const [lookupParent2, setLookupParent2] = useState<string>('');
  const [pathfindParent1, setPathfindParent1] = useState<string>('');
  const [pathfindParent2, setPathfindParent2] = useState<string>('');
  const [pathfindTargetChild, setPathfindTargetChild] = useState<string>('');
  const [childLookupTarget, setChildLookupTarget] = useState<string>('');
  const [mode, setMode] = useState<'lookup' | 'pathfind' | 'childlookup'>('lookup');
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
        await runScriptWithProgress('binaries/image-scraper', 'images');
        await runScriptWithProgress('binaries/breeding-scraper', 'breeding data');
        await runScriptWithProgress('binaries/fullcalc-scraper', 'full calc');
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
        await runScriptWithProgress('binaries/image-scraper', 'images');
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
        await runScriptWithProgress('binaries/breeding-scraper', 'breeding data');
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
        await runScriptWithProgress('binaries/fullcalc-scraper', 'full calc');
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
      
      // Listen for progress events from the Rust backend
      const unlistenProgress = await listen('sidecar-progress', (event: any) => {
        const { script: eventScript, current: eventCurrent, max: eventMax } = event.payload;
        if (eventScript === script) {
          current = eventCurrent;
          max = eventMax;
          setProgress({ current, max, label });
          console.log(`📈 Progress update: ${current}/${max} for ${label}`);
        }
      });
      
      // Listen for output events
      const unlistenOutput = await listen('sidecar-output', (event: any) => {
        const { script: eventScript, output } = event.payload;
        if (eventScript === script) {
          console.log(`📊 [${script}] ${output}`);
        }
      });
      
      // Listen for error events
      const unlistenError = await listen('sidecar-error', (event: any) => {
        const { script: eventScript, error } = event.payload;
        if (eventScript === script) {
          console.error(`❌ [${script}] ${error}`);
        }
      });
      
      // Listen for completion events
      const unlistenComplete = await listen('sidecar-complete', (event: any) => {
        const { script: eventScript, success, exit_code } = event.payload;
        if (eventScript === script) {
          // Clean up listeners
          unlistenProgress();
          unlistenOutput();
          unlistenError();
          unlistenComplete();
          
          if (success) {
            console.log(`✅ Script ${script} completed successfully`);
            resolve();
          } else {
            console.error(`❌ Script ${script} failed with exit code ${exit_code}`);
            reject(new Error(`Script failed with exit code ${exit_code}`));
          }
        }
      });
      
      try {
        // Call the Rust command to run the sidecar
        await invoke('run_sidecar_with_progress', { script, label });
      } catch (error) {
        // Clean up listeners
        unlistenProgress();
        unlistenOutput();
        unlistenError();
        unlistenComplete();
        
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
    let childLookupTargetValue = mode === 'childlookup' ? childLookupTarget : '';
    
    if (mode === 'childlookup' && !childLookupTargetValue) {
      setResult({
        type: 'child_lookup',
        result: '',
        error: 'Please provide a target child'
      });
      return;
    }
    
    if (mode !== 'childlookup' && !parent1 && !parent2 && !targetChild) {
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
      // Handle lookup modes with direct CSV reading
      if (mode === 'lookup' && parent1 && parent2) {
        // Parent lookup mode: use CSV directly
        const child = await CSVReader.findChild(parent1, parent2);
        if (child) {
          setResult({
            type: 'parent_lookup',
            result: `${parent1} + ${parent2} = ${child}`,
            jsonData: { child, parent1, parent2 }
          });
        } else {
          setResult({
            type: 'parent_lookup',
            result: 'No breeding combination found',
            jsonData: { child: null, parent1, parent2 }
          });
        }
        setIsLoading(false);
        return;
      } else if (mode === 'childlookup' && childLookupTargetValue) {
        // Child lookup mode: use CSV directly
        const parents = await CSVReader.findParents(childLookupTargetValue);
        if (parents.length > 0) {
          // Format data for ExpandablePaths component
          const paths = parents.map((parentCombo, index) => ({
            id: index, // Use numeric ID for proper favorites integration
            startParent: parentCombo.parent1,
            targetChild: childLookupTargetValue,
            steps: [
              {
                type: 'start',
                pal: parentCombo.parent1,
                step_number: 0
              },
              {
                type: 'breed',
                parents: `${parentCombo.parent1} + ${parentCombo.parent2}`,
                result: childLookupTargetValue,
                step_number: 1,
                is_final: true
              }
            ],
            totalSteps: 1,
            totalBreedingSteps: 1
          }));

          setResult({
            type: 'child_lookup',
            result: `Found ${parents.length} parent combination(s) for ${childLookupTargetValue}`,
            jsonData: {
              success: true,
              start_parent: parents[0]?.parent1 || '', // Use first parent as start_parent for consistency
              target_child: childLookupTargetValue,
              total_paths: paths.length,
              min_steps: 1, // All child lookup paths are 1 step
              paths: paths.map((path, index) => ({
                type: 'single' as const,
                path: {
                  id: index,
                  steps: path.steps,
                  total_steps: 1
                }
              }))
            }
          });
        } else {
          setResult({
            type: 'child_lookup',
            result: 'No parent combinations found',
            jsonData: { 
              success: false,
              start_parent: '',
              target_child: childLookupTargetValue,
              total_paths: 0,
              min_steps: 0,
              paths: [],
              message: 'No parent combinations found for this child'
            }
          });
        }
        setIsLoading(false);
        return;
      }

      // Path finding mode still uses the Python script
      if (mode === 'pathfind') {
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
        if (parent1 && targetChild) {
          let args: string[] = [];
          args = ['-p1', parent1, '-c', targetChild, '--json', '--max-paths', String(effectiveMaxPaths)];
          if (maxSeconds > 0) {
            args.push('--max-seconds', String(maxSeconds));
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
              
              // Deduplicate paths if they exist
              if (jsonResult.paths && Array.isArray(jsonResult.paths)) {
                // First, collect all unique paths across all groups and singles
                const allPaths = new Map<string, any>();
                
                const processPath = (path: any) => {
                  if (path.type === 'single' && path.path) {
                    // Create a unique key for this path based on breeding steps
                    const breedingSteps = path.path.steps
                      .filter((step: any) => step.type === 'breed')
                      .map((step: any) => step.parents)
                      .sort()
                      .join('|');
                    
                    const startParent = path.path.steps.find((step: any) => step.type === 'start')?.pal || '';
                    const pathKey = `${startParent}|${breedingSteps}`;
                    
                    if (!allPaths.has(pathKey)) {
                      allPaths.set(pathKey, path);
                    }
                  }
                };
                
                // Process all paths recursively
                const processNode = (node: any) => {
                  if (node.type === 'single') {
                    processPath(node);
                  } else if (node.type === 'group' && node.children) {
                    node.children.forEach(processNode);
                  }
                };
                
                jsonResult.paths.forEach(processNode);
                
                // Now rebuild the structure with unique paths only
                const uniquePaths = Array.from(allPaths.values());
                
                // If we have multiple unique paths, group them by common steps
                if (uniquePaths.length > 1) {
                  // Group by common breeding steps
                  const groups = new Map<string, any[]>();
                  
                  uniquePaths.forEach(path => {
                    const breedingSteps = path.path.steps
                      .filter((step: any) => step.type === 'breed')
                      .map((step: any) => step.parents)
                      .sort()
                      .join('|');
                    
                    if (!groups.has(breedingSteps)) {
                      groups.set(breedingSteps, []);
                    }
                    groups.get(breedingSteps)!.push(path);
                  });
                  
                  // Convert groups back to the expected format
                  const deduplicatedPaths: any[] = [];
                  
                  groups.forEach((pathsInGroup) => {
                    if (pathsInGroup.length === 1) {
                      // Single path, no grouping needed
                      deduplicatedPaths.push(pathsInGroup[0]);
                    } else {
                      // Multiple paths with same breeding steps, group them
                      const commonSteps = pathsInGroup[0].path.steps.filter((step: any) => step.type === 'breed');
                      deduplicatedPaths.push({
                        type: 'group',
                        common_steps: commonSteps,
                        children: pathsInGroup,
                        count: pathsInGroup.length
                      });
                    }
                  });
                  
                  jsonResult.paths = deduplicatedPaths;
                  jsonResult.total_paths = uniquePaths.length;
                } else if (uniquePaths.length === 1) {
                  // Single unique path
                  jsonResult.paths = uniquePaths;
                  jsonResult.total_paths = 1;
                } else {
                  // No paths
                  jsonResult.paths = [];
                  jsonResult.total_paths = 0;
                }
              }
              
              setResult({
                type: 'path_finding',
                result: output.stdout,
                jsonData: jsonResult
              });
            } catch (parseError) {
              setResult({
                type: 'path_finding',
                result: output.stdout
              });
            }
          } else {
            setResult({
              type: 'path_finding',
              result: '',
              error: `Sidecar failed with exit code ${output.code}: ${output.stderr || 'No error message'}`
            });
          }
        } else {
          throw new Error('For pathfinding, provide a parent and a target child');
        }
      } else {
        throw new Error('Invalid parameter combination');
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
        type: mode === 'lookup' ? 'parent_lookup' : mode === 'childlookup' ? 'child_lookup' : 'path_finding',
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
    setChildLookupTarget('');
    setResult(null);
  };

  // Function to handle mode changes and clear results
  const handleModeChange = (newMode: 'lookup' | 'pathfind' | 'childlookup') => {
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
  const handleRemoveFavorite = (_fav: any) => {
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
    addFavorite({
      name: newName,
      startParent,
      targetChild,
      steps: renumbered,
      customName: newCustomName,
    });

    // Remove both old favorites using context
    removeFavorite(fav.id);
    removeFavorite(other.id);
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
    let favId = isFavoritedBySteps(pathToAdd.startParent, pathToAdd.targetChild, pathToAdd.steps);
    if (!favId) {
      // Get the actual parent and child names from the path steps
      const startStep = pathToAdd.steps.find((step: BreedingStep) => step.type === 'start');
      const finalStep = pathToAdd.steps.find((step: BreedingStep) => step.is_final);
      
      const startParent = pathToAdd.startParent || startStep?.pal || 'Unknown Parent';
      const targetChild = pathToAdd.targetChild || finalStep?.result || 'Unknown Child';
      
      // Create new favorite if not found
      const newFavorite = {
        name: `${startParent} → ${targetChild}`,
        startParent: startParent,
        targetChild: targetChild,
        steps: pathToAdd.steps,
      };
      favId = addFavorite(newFavorite);
    }
    // Add to collection
    addPathToCollection(pendingCollectionId, favId);
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

  function handleStartCombining(fav: any) {
    setCombiningFavoriteId(fav.id);
  }

  function handleCancelCombining() {
    setCombiningFavoriteId(null);
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
                  pathfindTargetChild={pathfindTargetChild}
                  setPathfindTargetChild={setPathfindTargetChild}
                  childLookupTarget={childLookupTarget}
                  setChildLookupTarget={setChildLookupTarget}
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
                  handleStartCombining={handleStartCombining}
                  handleCancelCombining={handleCancelCombining}
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
            {currentSection === 'weaknesses' && (
              <Suspense fallback={<LoadingSpinner />}>
                <Weaknesses />
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
  // Add debugging for production builds
  useEffect(() => {
    console.log('🚀 App starting...');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Base URL:', import.meta.env.BASE_URL);
    console.log('User Agent:', navigator.userAgent);
    
    // Update debug info on the page
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) {
      debugStatus.innerHTML += '<br>🚀 React App starting...';
      debugStatus.innerHTML += '<br>Environment: ' + import.meta.env.MODE;
      debugStatus.innerHTML += '<br>Base URL: ' + import.meta.env.BASE_URL;
    }
    
    // Check if we're in a Tauri environment
    if ((window as any).__TAURI__) {
      console.log('✅ Tauri environment detected');
      if (debugStatus) {
        debugStatus.innerHTML += '<br>✅ Tauri environment detected';
      }
    } else {
      console.log('⚠️  Not in Tauri environment');
      if (debugStatus) {
        debugStatus.innerHTML += '<br>⚠️  Not in Tauri environment';
      }
    }
    
    // Check for any errors
    window.addEventListener('error', (event) => {
      console.error('❌ Global error:', event.error);
      if (debugStatus) {
        debugStatus.innerHTML += '<br>❌ Global error: ' + (event.error?.message || 'Unknown error');
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
      if (debugStatus) {
        debugStatus.innerHTML += '<br>❌ Unhandled promise rejection: ' + event.reason;
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
