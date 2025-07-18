import React, { useState, useMemo, useCallback, useContext } from 'react';
import { FavoritePath, PathProgress } from '../../utils/storage';
import { useFavorites } from '../context/FavoritesContext';
import Button from '../ui/Button';
import { ThemeContext } from '../context/ThemeContext';

export type SidebarSection = 'home' | 'favorites' | 'ongoing' | 'settings' | 'collections';

interface SidebarProps {
  currentSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  onFavoriteSelect?: (favorite: FavoritePath) => void;
  onOngoingSelect?: (item: { favorite: FavoritePath; progress: PathProgress }) => void;
}

/**
 * Sidebar navigation and quick access for the Palworld Breeding Calculator.
 * Displays navigation, favorites, and ongoing paths. Responsive and accessible.
 * @component
 * @param {SidebarProps} props - Props for Sidebar component.
 */
const Sidebar: React.FC<SidebarProps> = ({ 
  currentSection, 
  onSectionChange,
  onFavoriteSelect,
  onOngoingSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { favorites, ongoing } = useFavorites();
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';

  // Removed: useEffect for loading data and event listeners, now handled by context

  const sidebarItems = useMemo(() => [
    { id: 'home' as SidebarSection, label: 'Home', icon: '🏠', count: null },
    { id: 'favorites' as SidebarSection, label: 'Favorites', icon: '⭐', count: favorites.length },
    { id: 'ongoing' as SidebarSection, label: 'Ongoing', icon: '🔄', count: ongoing.length },
    { id: 'collections' as SidebarSection, label: 'Collections', icon: '📚', count: null },
    { id: 'settings' as SidebarSection, label: 'Settings', icon: '⚙️', count: null }
  ], [favorites.length, ongoing.length]);

  const handleItemClick = (section: SidebarSection) => {
    onSectionChange(section);
    if (window.innerWidth < 768) {
      setIsExpanded(false); // Auto-collapse on mobile
    }
  };

  const renderFavoriteItem = useCallback((favorite: FavoritePath) => (
    <div
      key={favorite.id}
      onClick={() => onFavoriteSelect?.(favorite)}
      className={`p-3 rounded cursor-pointer transition-colors ${
        isDark 
          ? 'hover:bg-gray-700 text-gray-300' 
          : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <div className="text-sm font-medium truncate">
        {favorite.name || `${favorite.startParent} → ${favorite.targetChild}`}
      </div>
      <div className={`text-xs text-gray-500`}>
        {favorite.steps.filter((s: any) => s.type !== 'start').length} steps
      </div>
    </div>
  ), [isDark, onFavoriteSelect]);

  const renderOngoingItem = useCallback((item: { favorite: FavoritePath; progress: PathProgress }) => {
    const totalSteps = item.favorite.steps.filter((s: any) => s.type !== 'start').length;
    const completedSteps = item.progress.completedSteps.size;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return (
      <div
        key={item.favorite.id}
        onClick={() => onOngoingSelect?.(item)}
        className={`p-3 rounded cursor-pointer transition-colors ${
          isDark 
            ? 'hover:bg-gray-700 text-gray-300' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="text-sm font-medium truncate">
          {item.favorite.name || `${item.favorite.startParent} → ${item.favorite.targetChild}`}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className={`text-xs text-gray-500`}>
            {completedSteps}/{totalSteps} steps
          </div>
          <div className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            {progress}%
          </div>
        </div>
      </div>
    );
  }, [isDark, onOngoingSelect]);

  return (
    <>
      {/* Overlay for mobile */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        isExpanded ? (window.innerWidth < 640 ? 'sidebar-mobile' : 'w-80') : 'w-16'
      } ${
        isDark 
          ? 'bg-gray-900 border-r border-gray-700' 
          : 'bg-white border-r border-gray-200'
      }`}>
        
        {/* Toggle Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full h-16 flex items-center justify-center transition-colors ${
            isDark 
              ? 'hover:bg-gray-800 text-white' 
              : 'hover:bg-gray-100 text-gray-800'
          }`}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={isExpanded}
          dark={isDark}
        >
          <span className="text-xl">
            {isExpanded ? '◀' : '▶'}
          </span>
        </Button>

        {/* Navigation Items */}
        <nav aria-label="Main navigation" className="p-2">
          {sidebarItems.map((item, idx) => (
            <Button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full mb-2 p-4 rounded-lg transition-all duration-200 text-lg ${
                currentSection === item.id
                  ? (isDark 
                      ? 'bg-blue-600 text-accessible-dark' 
                      : 'bg-blue-500 text-accessible-light'
                    )
                  : (isDark 
                      ? 'hover:bg-gray-800 text-accessible-dark' 
                      : 'hover:bg-gray-100 text-accessible-light'
                    )
              }`}
              aria-label={item.label}
              aria-current={currentSection === item.id ? 'page' : undefined}
              tabIndex={0}
              role="button"
              dark={isDark}
              onKeyDown={(e: any) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const next = (idx + 1) % sidebarItems.length;
                  const el = document.querySelectorAll('[data-sidebar-nav]')[next];
                  if (el) (el as HTMLElement).focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const prev = (idx - 1 + sidebarItems.length) % sidebarItems.length;
                  const el = document.querySelectorAll('[data-sidebar-nav]')[prev];
                  if (el) (el as HTMLElement).focus();
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  const el = document.querySelectorAll('[data-sidebar-nav]')[0];
                  if (el) (el as HTMLElement).focus();
                } else if (e.key === 'End') {
                  e.preventDefault();
                  const el = document.querySelectorAll('[data-sidebar-nav]')[sidebarItems.length - 1];
                  if (el) (el as HTMLElement).focus();
                }
              }}
              data-sidebar-nav
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">{item.icon}</span>
                {isExpanded && (
                  <div className="ml-3 flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    {item.count !== null && item.count > 0 && (
                      <div className={`text-xs ${
                        currentSection === item.id 
                          ? 'text-white/80' 
                          : 'text-gray-500'
                      }`}>
                        {item.count} item{item.count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </nav>

        {/* Section Content */}
        {isExpanded && (
          <div className="flex-1 overflow-auto p-2">
            {currentSection === 'favorites' && (
              <div className="space-y-2">
                <h3 className={`text-sm font-semibold px-3 py-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Saved Paths ({favorites.length})
                </h3>
                {favorites.length === 0 ? (
                  <div className={`text-center py-8 text-gray-500`}>
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="text-sm">No favorites yet</div>
                    <div className="text-xs mt-1">Star paths to save them here</div>
                  </div>
                ) : (
                  favorites.map(renderFavoriteItem)
                )}
              </div>
            )}
            {currentSection === 'ongoing' && (
              <div className="space-y-2">
                <h3 className={`text-sm font-semibold px-3 py-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Ongoing ({ongoing.length})
                </h3>
                {ongoing.length === 0 ? (
                  <div className={`text-center py-8 text-gray-500`}>
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="text-sm">No ongoing paths</div>
                    <div className="text-xs mt-1">Start a path to track progress</div>
                  </div>
                ) : (
                  ongoing.map(renderOngoingItem)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar; 