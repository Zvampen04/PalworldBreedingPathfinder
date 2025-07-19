import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getFavorites, getCollections, getOngoingPaths, addFavorite, removeFavorite, addCollection, removeCollection, addPathToCollection, removePathFromCollection, removeFavoriteFromAllCollections, FavoritePath, PathProgress, Collection as StorageCollection } from '../../utils/storage';

/**
 * Context type for global favorites, collections, and ongoing state.
 * Provides state and mutators for all major app data.
 */
interface FavoritesContextType {
  favorites: FavoritePath[];
  collections: StorageCollection[];
  ongoing: Array<{ favorite: FavoritePath; progress: PathProgress }>;
  refreshFavorites: () => void;
  refreshCollections: () => void;
  refreshOngoing: () => void;
  addFavorite: typeof addFavorite;
  removeFavorite: typeof removeFavorite;
  addCollection: typeof addCollection;
  removeCollection: typeof removeCollection;
  addPathToCollection: typeof addPathToCollection;
  removePathFromCollection: typeof removePathFromCollection;
  removeFavoriteFromAllCollections: typeof removeFavoriteFromAllCollections;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

/**
 * React context for global favorites, collections, and ongoing state.
 * Use the FavoritesProvider to wrap your app.
 */
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoritePath[]>([]);
  const [collections, setCollections] = useState<StorageCollection[]>([]);
  const [ongoing, setOngoing] = useState<Array<{ favorite: FavoritePath; progress: PathProgress }>>([]);

  const refreshFavorites = useCallback(() => {
    setFavorites(getFavorites());
  }, []);
  const refreshCollections = useCallback(() => {
    setCollections(getCollections());
  }, []);
  const refreshOngoing = useCallback(() => {
    setOngoing(getOngoingPaths());
  }, []);

  // Initial load
  useEffect(() => {
    refreshFavorites();
    refreshCollections();
    refreshOngoing();
  }, [refreshFavorites, refreshCollections, refreshOngoing]);

  // Listen for storage and custom events
  useEffect(() => {
    const handleFavorites = () => refreshFavorites();
    const handleCollections = () => refreshCollections();
    const handleOngoing = () => refreshOngoing();
    window.addEventListener('favoritesUpdated', handleFavorites);
    window.addEventListener('collectionsUpdated', handleCollections);
    window.addEventListener('storage', handleFavorites);
    window.addEventListener('storage', handleCollections);
    window.addEventListener('storage', handleOngoing);
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavorites);
      window.removeEventListener('collectionsUpdated', handleCollections);
      window.removeEventListener('storage', handleFavorites);
      window.removeEventListener('storage', handleCollections);
      window.removeEventListener('storage', handleOngoing);
    };
  }, [refreshFavorites, refreshCollections, refreshOngoing]);

  // Wrap mutators to refresh state and dispatch events
  const addFavoriteWrapped = useCallback((fav: Omit<FavoritePath, 'id' | 'dateAdded'>) => {
    const id = addFavorite(fav);
    refreshFavorites();
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    return id;
  }, [refreshFavorites]);
  const removeFavoriteWrapped = useCallback((id: string) => {
    removeFavorite(id);
    refreshFavorites();
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  }, [refreshFavorites]);
  const addCollectionWrapped = useCallback((name: string) => {
    const id = addCollection(name);
    refreshCollections();
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
    return id;
  }, [refreshCollections]);
  const removeCollectionWrapped = useCallback((id: string) => {
    removeCollection(id);
    refreshCollections();
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  }, [refreshCollections]);
  const addPathToCollectionWrapped = useCallback((colId: string, favId: string) => {
    addPathToCollection(colId, favId);
    refreshCollections();
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  }, [refreshCollections]);
  const removePathFromCollectionWrapped = useCallback((colId: string, favId: string) => {
    removePathFromCollection(colId, favId);
    refreshCollections();
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  }, [refreshCollections]);
  const removeFavoriteFromAllCollectionsWrapped = useCallback((favId: string) => {
    removeFavoriteFromAllCollections(favId);
    refreshCollections();
    window.dispatchEvent(new CustomEvent('collectionsUpdated'));
  }, [refreshCollections]);

  const value: FavoritesContextType = {
    favorites,
    collections,
    ongoing,
    refreshFavorites,
    refreshCollections,
    refreshOngoing,
    addFavorite: addFavoriteWrapped,
    removeFavorite: removeFavoriteWrapped,
    addCollection: addCollectionWrapped,
    removeCollection: removeCollectionWrapped,
    addPathToCollection: addPathToCollectionWrapped,
    removePathFromCollection: removePathFromCollectionWrapped,
    removeFavoriteFromAllCollections: removeFavoriteFromAllCollectionsWrapped,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

/**
 * Hook to access favorites, collections, ongoing, and all mutators from context.
 * Throws if used outside a FavoritesProvider.
 */
export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}

/**
 * Hook to access collections and mutators from context.
 * Throws if used outside a FavoritesProvider.
 */
export function useCollections() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useCollections must be used within a FavoritesProvider');
  return ctx;
}

/**
 * Hook to access ongoing paths and mutators from context.
 * Throws if used outside a FavoritesProvider.
 */
export function useOngoing() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useOngoing must be used within a FavoritesProvider');
  return ctx;
} 