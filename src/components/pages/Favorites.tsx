import React, { useMemo, useContext } from 'react';
import ExpandablePaths from '../ui/ExpandablePaths';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Favorites page component for the Palworld Breeding Calculator.
 * Displays user's favorited breeding paths and allows editing, combining, and adding to collections.
 * @component
 * @param {FavoritesProps} props - Props for Favorites component.
 */
interface FavoritesProps {
  /**
   * Props for the Favorites component.
   * @property favorites - List of favorite paths.
   * @property selectedFavoriteId - Currently selected favorite ID.
   * @property highlightedFavoriteId - Currently highlighted favorite ID.
   * @property editingFavoriteId - ID of the favorite currently being edited.
   * @property editingName - Current editing name value.
   * @property combiningFavoriteId - ID of the favorite being combined.
   * @property handleEditFavoriteName - Handler to start editing a favorite name.
   * @property handleSaveFavoriteName - Handler to save an edited favorite name.
   * @property handleCancelEditFavoriteName - Handler to cancel editing.
   * @property handleCombineWithFavorite - Handler to combine two favorites.
   * @property handleStartCombining - Handler to start combining mode.
   * @property handleCancelCombining - Handler to cancel combining mode.
   * @property handleFavoriteSelect - Handler to select a favorite.
   * @property onAddToCollection - Handler to add a favorite to a collection.
   * @property favoriteRefs - Refs for favorite DOM elements.
   * @property onRemoveFavorite - Handler to remove a favorite.
   */
  favorites: any[];
  selectedFavoriteId: string | null;
  highlightedFavoriteId: string | null;
  editingFavoriteId: string | null;
  editingName: string;
  combiningFavoriteId: string | null;
  handleEditFavoriteName: (fav: any) => void;
  handleSaveFavoriteName: (fav: any) => void;
  handleCancelEditFavoriteName: () => void;
  handleCombineWithFavorite: (fav: any, otherId: string) => void;
  handleStartCombining: (fav: any) => void;
  handleCancelCombining: () => void;
  handleFavoriteSelect: (fav: any) => void;
  onAddToCollection: (fav: any) => void;
  favoriteRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onRemoveFavorite?: (fav: any) => void;
}

const Favorites: React.FC<FavoritesProps> = ({
  favorites, selectedFavoriteId, highlightedFavoriteId, editingFavoriteId, editingName, combiningFavoriteId,
  handleEditFavoriteName, handleSaveFavoriteName, handleCancelEditFavoriteName, handleCombineWithFavorite,
  handleStartCombining, handleCancelCombining, handleFavoriteSelect, onAddToCollection, favoriteRefs, onRemoveFavorite
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  const memoizedFavorites = useMemo(() => favorites.map(fav => {
    const isSelected = selectedFavoriteId === fav.id;
    const isHighlighted = highlightedFavoriteId === fav.id;
    const isEditing = editingFavoriteId === fav.id;
    const data = {
      success: true,
      start_parent: fav.startParent,
      target_child: fav.targetChild,
      total_paths: 1,
      min_steps: fav.steps.filter((s: any) => s.type !== 'start').length,
      paths: [{ type: 'single' as const, path: {
        id: 1,
        steps: fav.steps,
        total_steps: fav.steps.filter((s: any) => s.type !== 'start').length,
      }}],
    };
    return { fav, isSelected, isHighlighted, isEditing, data };
  }), [favorites, selectedFavoriteId, highlightedFavoriteId, editingFavoriteId]);

  return (
    <div className={`p-8 rounded-xl-std shadow-xl-std transition-all duration-300 ${
      isDark 
        ? 'bg-white/10 backdrop-blur-md border border-white/20' 
        : 'bg-white/80 backdrop-blur-md border border-gray-200'
    }`}>
      <div className="text-center">
        <div className="text-4xl mb-4">⭐</div>
        <h2 className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-accessible-dark' : 'text-accessible-light'
        }`}>
          Favorite Paths
        </h2>
        <p className={isDark ? 'text-accessible-secondary-dark' : 'text-accessible-secondary-light'}>
          Your saved breeding paths appear here. Click items in the sidebar to load them into the calculator.
        </p>
      </div>
      {favorites.length === 0 ? (
        <div className="text-center text-gray-400">No favorites yet.</div>
      ) : (
        memoizedFavorites.map(({ fav, isSelected, isHighlighted, isEditing, data }) => (
          <div
            key={fav.id}
            ref={el => (favoriteRefs.current[fav.id] = el as HTMLDivElement | null)}
            tabIndex={0}
            role="button"
            aria-label={`Select favorite path ${fav.name || `${fav.startParent} → ${fav.targetChild}`}`}
            onClick={() => handleFavoriteSelect(fav)}
            className="mb-6 group cursor-pointer transition-all duration-200"
          >
            <Card
              className={
                isSelected ? 'border-blue-400 bg-blue-900/20' :
                isHighlighted ? 'border-purple-400 bg-purple-900/20' :
                isDark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-white'
              }
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`font-semibold group-hover:text-blue-700 ${isDark ? 'dark:group-hover:text-purple-300' : ''} transition-colors duration-200`}>
                  {isEditing ? (
                    <Input
                      className="px-2 py-1 rounded border"
                      value={editingName}
                      onChange={() => { /* setEditingName(e.target.value); */ }}
                      autoFocus
                      theme={isDark ? 'dark' : 'light'}
                    />
                  ) : (
                    fav.customName?.trim() ? fav.customName : fav.name
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="primary" size="sm" dark={isDark} className={isDark ? 'text-green-400' : 'text-green-600'} onClick={e => { e.stopPropagation(); handleSaveFavoriteName(fav); }} aria-label={`Save new name for favorite path ${fav.customName?.trim() ? fav.customName : fav.name}`}>Save</Button>
                      <Button variant="secondary" size="sm" dark={isDark} className="text-gray-500" onClick={e => { e.stopPropagation(); handleCancelEditFavoriteName(); }} aria-label={`Cancel editing name for favorite path ${fav.customName?.trim() ? fav.customName : fav.name}`}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="icon" size="sm" dark={isDark} className="ml-2 text-xs text-blue-500 hover:text-blue-700" title="Edit name" onClick={e => { e.stopPropagation(); handleEditFavoriteName(fav); }} aria-label={`Edit name for favorite path ${fav.customName?.trim() ? fav.customName : fav.name}`}>✏️</Button>
                      <Button variant="secondary" size="sm" dark={isDark} className="ml-1 text-xs text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400" title="Combine with another path" onClick={e => { e.stopPropagation(); handleStartCombining(fav); }} aria-label={`Combine favorite path ${fav.customName?.trim() ? fav.customName : fav.name} with another`}>🔗 Combine</Button>
                    </>
                  )}
                </div>
              </div>
              {combiningFavoriteId === fav.id && (
                <div 
                  className="mb-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <label className="block text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Combine with compatible path:</label>
                  {(() => {
                    const compatiblePaths = favorites.filter(other =>
                      other.id !== fav.id &&
                      (other.startParent === fav.targetChild || other.targetChild === fav.startParent)
                    );
                    
                    if (compatiblePaths.length === 0) {
                      return (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          No compatible paths found. A compatible path must have:
                          <ul className="list-disc list-inside mt-1 ml-2">
                            <li>Start parent matching this path's target child ({fav.targetChild})</li>
                            <li>OR target child matching this path's start parent ({fav.startParent})</li>
                          </ul>
                        </div>
                      );
                    }
                    
                    return (
                      <select
                        className={`w-full px-3 py-2 rounded border ${isDark ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-400 bg-white text-black'}`}
                        onChange={e => {
                          e.stopPropagation();
                          if (e.target.value) handleCombineWithFavorite(fav, e.target.value);
                        }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        defaultValue=""
                      >
                        <option value="" disabled>Select compatible path...</option>
                        {compatiblePaths.map(other => (
                          <option key={other.id} value={other.id}>
                            {other.customName?.trim() ? other.customName : other.name}
                            {other.startParent === fav.targetChild ? ` (${other.startParent} → ${other.targetChild})` : ` (${other.startParent} → ${other.targetChild})`}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      dark={isDark} 
                      className="text-gray-500 hover:text-gray-700" 
                      onClick={e => { e.stopPropagation(); handleCancelCombining(); }} 
                      aria-label={`Cancel combining favorite path ${fav.customName?.trim() ? fav.customName : fav.name}`}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <ExpandablePaths
                data={data}
                maxPaths={1}
                hideSummaryHeader={true}
                onAddToCollection={() => onAddToCollection(fav)}
                onRemoveFavorite={onRemoveFavorite ? () => onRemoveFavorite(fav) : undefined}
              />
            </Card>
          </div>
        ))
      )}
    </div>
  );
};

export default React.memo(Favorites);