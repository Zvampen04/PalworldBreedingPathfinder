import React, { useMemo, useContext } from 'react';
import ExpandablePaths from '../ui/ExpandablePaths';
import { useFavorites } from '../context/FavoritesContext';
import { isFavoritedBySteps, addFavorite } from '../../utils/storage';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { ThemeContext } from '../context/ThemeContext';
import Input from '../ui/Input';

/**
 * Collections page/component for the Palworld Breeding Calculator.
 * Displays and manages user collections of favorite breeding paths.
 * @component
 */
const Collections: React.FC = () => {
  const { collections, favorites, addCollection, removeCollection, addPathToCollection, removePathFromCollection } = useFavorites();
  const [showModal, setShowModal] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState('');
  const [showAddToCollectionModal, setShowAddToCollectionModal] = React.useState(false);
  const [pathToAdd, setPathToAdd] = React.useState<any | null>(null);
  const [dialog, setDialog] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Removed unused state variable
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';

  // Removed: useEffect for loading collections/favorites and event listeners, now handled by context

  // Handler for creating a new collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim());
    setNewCollectionName('');
    setShowModal(false);
    setDialog({ message: 'Collection created!', type: 'success' });
    setTimeout(() => setDialog(null), 2000);
  };

  // Handler for opening the add-to-collection modal
  const handleAddToCollection = (path: any) => {
    setPathToAdd(path);
    setShowAddToCollectionModal(true);
  };

  // Handler for actually adding the path to the selected collection
  const handleSelectCollection = (collectionId: string) => {
    if (!pathToAdd || !collectionId) return;
    // Always ensure the path is a favorite before adding to collection
    let favId = isFavoritedBySteps(
      pathToAdd.startParent || pathToAdd.start_parent,
      pathToAdd.targetChild || pathToAdd.target_child,
      pathToAdd.steps
    );
    if (!favId) {
      // Get the actual parent and child names from the path steps
      const startStep = pathToAdd.steps.find((step: any) => step.type === 'start');
      const finalStep = pathToAdd.steps.find((step: any) => step.is_final);
      
      const startParent = pathToAdd.startParent || pathToAdd.start_parent || startStep?.pal || 'Unknown Parent';
      const targetChild = pathToAdd.targetChild || pathToAdd.target_child || finalStep?.result || 'Unknown Child';
      
      // Add as favorite and get the new id
      favId = addFavorite({
        name: `${startParent} → ${targetChild}`,
        startParent: startParent,
        targetChild: targetChild,
        steps: pathToAdd.steps,
      });
    }
    // Add favorite ID to collection
    const col = collections.find(c => c.id === collectionId);
    if (col && col.favoriteIds.includes(favId)) {
      setDialog({ message: 'Path already in collection.', type: 'error' });
    } else {
      addPathToCollection(collectionId, favId);
      setDialog({ message: 'Path added to collection!', type: 'success' });
    }
    setShowAddToCollectionModal(false);
    setPathToAdd(null);
    setTimeout(() => setDialog(null), 2000);
  };

  // Handler for removing a path from a collection
  const handleRemovePath = (colId: string, favoriteId: string) => {
    removePathFromCollection(colId, favoriteId);
    setDialog({ message: 'Path removed from collection.', type: 'success' });
    setTimeout(() => setDialog(null), 2000);
  };

  // Handler for removing a collection
  const handleRemoveCollection = (colId: string) => {
    removeCollection(colId);
    setDialog({ message: 'Collection removed.', type: 'success' });
    setTimeout(() => setDialog(null), 2000);
  };

  const memoizedCollections = useMemo(() => collections.map(col => {
    const validFavoriteIds = col.favoriteIds.filter(fid => favorites.some(f => f.id === fid));
    const memoizedFavorites = validFavoriteIds
      .map(favId => {
        const favorite = favorites.find(f => f.id === favId);
        if (!favorite) return undefined;
        const data = {
          success: true,
          start_parent: favorite.startParent,
          target_child: favorite.targetChild,
          total_paths: 1,
          min_steps: favorite.steps.filter((s: any) => s.type !== 'start').length,
          paths: [
            {
              type: 'single' as const,
              path: {
                id: 1,
                steps: favorite.steps,
                total_steps: favorite.steps.filter((s: any) => s.type !== 'start').length,
              },
            },
          ],
        };
        return { favId, favorite, data };
      })
      .filter((item): item is { favId: string; favorite: typeof favorites[number]; data: any } => !!item);
    return { col, memoizedFavorites };
  }), [collections, favorites]);

  return (
    <div className="p-8 flex flex-col items-center min-h-[60vh]">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>
            <span className="text-3xl">📚</span> Collections
          </h1>
          <Button
            className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={() => setShowModal(true)}
            dark={isDark}
          >
            + New Collection
          </Button>
        </div>
        {collections.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-4xl mb-2">📚</div>
            <div className="mb-1">No collections yet</div>
            <div className="text-xs">Create a collection to get started</div>
          </div>
        ) : (
          <div className="space-y-8">
            {memoizedCollections.map(({ col, memoizedFavorites }) => (
              <Card key={col.id} className={`p-4 shadow-xl-std rounded-xl-std ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-lg font-semibold ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>{col.name}</div>
                  <span className="text-xs text-gray-400">{memoizedFavorites.length} path{memoizedFavorites.length !== 1 ? 's' : ''}</span>
                  <Button
                    className={`ml-4 px-3 py-1 rounded border text-xs font-semibold transition ${isDark ? 'border-red-300 text-red-600 hover:bg-red-900 hover:border-red-500' : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500'}`}
                    title="Remove entire collection"
                    onClick={() => handleRemoveCollection(col.id)}
                    aria-label={`Remove collection ${col.name}`}
                    dark={isDark}
                  >
                    Remove Collection
                  </Button>
                </div>
                {memoizedFavorites.length === 0 ? (
                  <div className="text-gray-400 text-sm italic">No paths in this collection yet.</div>
                ) : (
                  <div className="space-y-6">
                    {memoizedFavorites.map(({ favId, favorite, data }) => (
                      <div key={favId} className="relative group">
                        <ExpandablePaths
                          data={data}
                          maxPaths={1}
                          hideSummaryHeader={true}
                          summaryHeaderText={`Collection contains ${memoizedFavorites.length} path${memoizedFavorites.length !== 1 ? 's' : ''}`}
                          onAddToCollection={handleAddToCollection}
                          bottomAction={
                            <Button
                              className={`absolute bottom-2 right-2 p-2 rounded-full text-lg z-20 opacity-80 hover:opacity-100 transition ${isDark ? 'hover:bg-red-900 text-red-400' : 'hover:bg-red-100 text-red-500'}`}
                              title="Remove this path from collection"
                              onClick={() => handleRemovePath(col.id, favId)}
                              aria-label={`Remove path from ${favorite.startParent} to ${favorite.targetChild} from collection ${col.name}`}
                              dark={isDark}
                            >
                              🗑️
                            </Button>
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Modal for new collection */}
      <Modal open={showModal} onClose={() => setShowModal(false)} className={`w-full max-w-sm border-blue-200 rounded-xl-std shadow-xl-std ${isDark ? 'bg-gradient-collection-modal-dark border-blue-800' : 'bg-gradient-collection-modal border-blue-200'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>Create New Collection</h2>
        <Input
          className="w-full px-3 py-2 rounded border mb-4"
          placeholder="Collection name"
          value={newCollectionName}
          onChange={e => setNewCollectionName(e.target.value)}
          autoFocus
          theme={isDark ? 'dark' : 'light'}
        />
        <div className="flex justify-end gap-2">
          <Button
            className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowModal(false)}
            dark={isDark}
          >
            Cancel
          </Button>
          <Button
            className={`px-4 py-2 rounded font-semibold transition ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={handleCreateCollection}
            disabled={!newCollectionName.trim()}
            dark={isDark}
          >
            Create
          </Button>
        </div>
      </Modal>
      {/* Modal for selecting collection to add a path */}
      <Modal open={showAddToCollectionModal} onClose={() => setShowAddToCollectionModal(false)} className={`w-full max-w-md border-2 flex flex-col items-center p-8 rounded-xl-std shadow-xl-std ${isDark ? 'bg-gradient-collection-modal-dark border-blue-800' : 'bg-gradient-collection-modal border-blue-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl"></span>
          <h2 className={`text-xl font-bold ${isDark ? 'text-accessible-dark' : 'text-accessible-light'}`}>Add Path to Collection</h2>
        </div>
        <div className="flex-1 w-full overflow-y-auto mb-6">
          {collections.length === 0 ? (
            <div className={`text-gray-400 text-sm text-center`}>No collections available. Create one first.</div>
          ) : (
            <ul className="space-y-2">
              {collections.map(col => (
                <li key={col.id}>
                  <Button
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium border shadow-sm transition ${isDark ? 'bg-blue-950 text-blue-200 border-blue-800 hover:bg-blue-800' : 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200'}`}
                    onClick={() => handleSelectCollection(col.id)}
                    dark={isDark}
                  >
                    {col.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end gap-2 w-full">
          <Button
            className={`px-4 py-2 rounded-lg font-semibold transition ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setShowAddToCollectionModal(false)}
            dark={isDark}
          >
            Cancel
          </Button>
        </div>
      </Modal>
      {/* Dialog for feedback */}
      <Modal open={!!dialog} onClose={() => setDialog(null)} className={`top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-xl-std font-semibold text-center transition-all ${dialog?.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} overlayClassName="bg-transparent flex items-start justify-center z-50">
        {dialog?.message}
      </Modal>
    </div>
  );
};

export default Collections; 