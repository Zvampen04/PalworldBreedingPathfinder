/**
 * Storage utilities for managing favorites, progress, and collections in the Palworld Breeding Calculator.
 * Provides functions for CRUD operations on favorites, progress tracking, and utility helpers.
 */

/**
 * Represents a favorited breeding path.
 * @property id - Unique identifier for the favorite.
 * @property name - Display name for the favorite.
 * @property startParent - Name of the starting parent Pal.
 * @property targetChild - Name of the target child Pal.
 * @property steps - Array of breeding steps.
 * @property dateAdded - ISO string of when the favorite was added.
 * @property customName - Optional custom name for the favorite.
 */
export interface FavoritePath {
  id: string;
  name: string;
  startParent: string;
  targetChild: string;
  steps: Array<{
    type: 'start' | 'breed';
    pal?: string;
    parents?: string;
    result?: string;
    step_number: number;
    is_final?: boolean;
  }>;
  dateAdded: string;
  customName?: string;
}

/**
 * Represents progress on a breeding path.
 * @property pathId - ID of the path.
 * @property completedSteps - Set of completed step numbers.
 * @property lastUpdated - ISO string of last update time.
 */
export interface PathProgress {
  pathId: string;
  completedSteps: Set<number>;
  lastUpdated: string;
}

/**
 * Represents all storage data (favorites and progress).
 * @property favorites - Array of favorited paths.
 * @property progress - Record of progress by path ID.
 */
export interface StorageData {
  favorites: FavoritePath[];
  progress: Record<string, PathProgress>;
}

/**
 * Represents a collection of favorite paths.
 * @property id - Unique identifier for the collection.
 * @property name - Name of the collection.
 * @property favoriteIds - Array of favorite IDs in the collection.
 */
export interface Collection {
  id: string;
  name: string;
  favoriteIds: string[];
}

const STORAGE_KEY = 'palworld-breeding-data';
const COLLECTIONS_KEY = 'palworld-breeding-collections';

/**
 * Get all storage data from localStorage.
 * @returns StorageData object with favorites and progress.
 */
export const getStorageData = (): StorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Convert Set from array back to Set for completed steps
      if (parsed.progress) {
        Object.keys(parsed.progress).forEach(pathId => {
          parsed.progress[pathId].completedSteps = new Set(parsed.progress[pathId].completedSteps || []);
        });
      }
      return {
        favorites: parsed.favorites || [],
        progress: parsed.progress || {}
      };
    }
  } catch (error) {
    console.error('Error reading storage data:', error);
  }
  return { favorites: [], progress: {} };
};

/**
 * Save all storage data to localStorage.
 * @param data - StorageData object to save.
 */
export const saveStorageData = (data: StorageData): void => {
  try {
    // Convert Set to array for JSON serialization
    const serializable = {
      ...data,
      progress: Object.fromEntries(
        Object.entries(data.progress).map(([pathId, progress]) => [
          pathId,
          {
            ...progress,
            completedSteps: Array.from(progress.completedSteps)
          }
        ])
      )
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving storage data:', error);
  }
};

/**
 * Get all favorited paths.
 * @returns Array of FavoritePath objects.
 */
export const getFavorites = (): FavoritePath[] => {
  return getStorageData().favorites;
};

/**
 * Add a new favorite path.
 * @param path - Path data (excluding id and dateAdded).
 * @returns The new favorite's ID.
 */
export const addFavorite = (path: Omit<FavoritePath, 'id' | 'dateAdded'>): string => {
  const data = getStorageData();
  const id = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const favorite: FavoritePath = {
    ...path,
    id,
    dateAdded: new Date().toISOString(),
    customName: path.customName,
  };
  
  data.favorites.push(favorite);
  saveStorageData(data);
  return id;
};

/**
 * Remove a favorite by ID.
 * @param id - ID of the favorite to remove.
 */
export const removeFavorite = (id: string): void => {
  const data = getStorageData();
  data.favorites = data.favorites.filter(fav => fav.id !== id);
  // Also remove progress for this favorite
  delete data.progress[id];
  saveStorageData(data);
};

/**
 * Check if a favorite exists for a parent/child pair.
 * @param startParent - Name of the starting parent Pal.
 * @param targetChild - Name of the target child Pal.
 * @returns The favorite's ID if found, otherwise null.
 */
export const isFavorited = (startParent: string, targetChild: string): string | null => {
  const favorites = getFavorites();
  const found = favorites.find(fav => 
    fav.startParent === startParent && fav.targetChild === targetChild
  );
  return found ? found.id : null;
};

/**
 * Check if a favorite exists for a specific path (by steps).
 * @param startParent - Name of the starting parent Pal.
 * @param targetChild - Name of the target child Pal.
 * @param steps - Array of breeding steps.
 * @returns The favorite's ID if found, otherwise null.
 */
export const isFavoritedBySteps = (startParent: string, targetChild: string, steps: Array<any>): string | null => {
  const favorites = getFavorites();
  const found = favorites.find(fav =>
    fav.startParent === startParent &&
    fav.targetChild === targetChild &&
    fav.steps.length === steps.length &&
    fav.steps.every((step, idx) => {
      const other = steps[idx];
      return step.type === other.type &&
        step.pal === other.pal &&
        step.parents === other.parents &&
        step.result === other.result &&
        step.step_number === other.step_number &&
        step.is_final === other.is_final;
    })
  );
  return found ? found.id : null;
};

/**
 * Get progress for a path by ID.
 * @param pathId - Path ID.
 * @returns PathProgress object or null.
 */
export const getProgress = (pathId: string): PathProgress | null => {
  const data = getStorageData();
  return data.progress[pathId] || null;
};

/**
 * Update progress for a path.
 * @param pathId - Path ID.
 * @param completedSteps - Set of completed step numbers.
 */
export const updateProgress = (pathId: string, completedSteps: Set<number>): void => {
  const data = getStorageData();
  data.progress[pathId] = {
    pathId,
    completedSteps,
    lastUpdated: new Date().toISOString()
  };
  saveStorageData(data);
};

/**
 * Toggle completion of a step for a path.
 * @param pathId - Path ID.
 * @param stepNumber - Step number to toggle.
 */
export const toggleStepCompletion = (pathId: string, stepNumber: number): void => {
  const data = getStorageData();
  if (!data.progress[pathId]) {
    data.progress[pathId] = {
      pathId,
      completedSteps: new Set(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  const progress = data.progress[pathId];
  if (progress.completedSteps.has(stepNumber)) {
    progress.completedSteps.delete(stepNumber);
  } else {
    progress.completedSteps.add(stepNumber);
  }
  progress.lastUpdated = new Date().toISOString();
  
  saveStorageData(data);
};

/**
 * Clear progress for a path.
 * @param pathId - Path ID.
 */
export const clearProgress = (pathId: string): void => {
  const data = getStorageData();
  if (data.progress[pathId]) {
    data.progress[pathId].completedSteps.clear();
    data.progress[pathId].lastUpdated = new Date().toISOString();
    saveStorageData(data);
  }
};

/**
 * Get all ongoing paths (not 100% complete).
 * @returns Array of objects with favorite and progress.
 */
export const getOngoingPaths = (): Array<{ favorite: FavoritePath; progress: PathProgress }> => {
  const data = getStorageData();
  const ongoing: Array<{ favorite: FavoritePath; progress: PathProgress }> = [];
  
  data.favorites.forEach(favorite => {
    const progress = data.progress[favorite.id];
    if (progress && progress.completedSteps.size > 0) {
      // Count non-start steps for completion calculation
      const totalSteps = favorite.steps.filter(step => step.type !== 'start').length;
      const isComplete = progress.completedSteps.size >= totalSteps;
      
      if (!isComplete) {
        ongoing.push({ favorite, progress });
      }
    }
  });
  
  // Sort by last updated
  ongoing.sort((a, b) => 
    new Date(b.progress.lastUpdated).getTime() - new Date(a.progress.lastUpdated).getTime()
  );
  
  return ongoing;
};

/**
 * Clear all storage data (favorites and progress).
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}; 

/**
 * Hash a string to a positive number.
 * @param str - Input string.
 * @returns Positive integer hash.
 */
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
} 

/**
 * Get the image path for a Pal by name.
 * @param palName - Name of the Pal.
 * @returns Image path string.
 */
export function getPalImage(palName: string) {
  // Convert pal name to match image filename format (handle variants)
  const imageName = palName.replace(/\s+/g, '_') + '.jpg';
  return `/Assets/${imageName}`;
} 

/**
 * Get all collections from localStorage.
 * @returns Array of Collection objects.
 */
export const getCollections = (): Collection[] => {
  try {
    const data = localStorage.getItem(COLLECTIONS_KEY);
    if (data) return JSON.parse(data);
  } catch (error) {
    console.error('Error reading collections:', error);
  }
  return [];
};

/**
 * Save all collections to localStorage.
 * @param collections - Array of Collection objects.
 */
export const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  } catch (error) {
    console.error('Error saving collections:', error);
  }
};

/**
 * Add a new collection.
 * @param name - Name of the collection.
 * @returns The new collection's ID.
 */
export const addCollection = (name: string): string => {
  const collections = getCollections();
  const id = `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  collections.push({ id, name, favoriteIds: [] });
  saveCollections(collections);
  return id;
};

/**
 * Remove a collection by ID.
 * @param id - ID of the collection to remove.
 */
export const removeCollection = (id: string): void => {
  const collections = getCollections().filter(col => col.id !== id);
  saveCollections(collections);
};

/**
 * Add a favorite to a collection.
 * @param collectionId - ID of the collection.
 * @param favoriteId - ID of the favorite to add.
 */
export const addPathToCollection = (collectionId: string, favoriteId: string): void => {
  const collections = getCollections();
  const col = collections.find(c => c.id === collectionId);
  if (col && !col.favoriteIds.includes(favoriteId)) {
    col.favoriteIds.push(favoriteId);
    saveCollections(collections);
  }
};

/**
 * Remove a favorite from a collection.
 * @param collectionId - ID of the collection.
 * @param favoriteId - ID of the favorite to remove.
 */
export const removePathFromCollection = (collectionId: string, favoriteId: string): void => {
  const collections = getCollections();
  const col = collections.find(c => c.id === collectionId);
  if (col) {
    col.favoriteIds = col.favoriteIds.filter(id => id !== favoriteId);
    saveCollections(collections);
  }
};

/**
 * Remove a favorite from all collections (e.g., when favorite is deleted).
 * @param favoriteId - ID of the favorite to remove from all collections.
 */
export const removeFavoriteFromAllCollections = (favoriteId: string): void => {
  const collections = getCollections();
  let changed = false;
  collections.forEach(col => {
    const before = col.favoriteIds.length;
    col.favoriteIds = col.favoriteIds.filter(id => id !== favoriteId);
    if (col.favoriteIds.length !== before) changed = true;
  });
  if (changed) saveCollections(collections);
}; 