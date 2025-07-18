import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { getPalImage } from '../../utils/storage';
import { ThemeContext } from '../context/ThemeContext';

/**
 * PalSelector component for selecting a Pal from a searchable dropdown list.
 * Used in various pages for parent/child selection in breeding calculations.
 */
interface PalSelectorProps {
  /**
   * Label for the selector.
   */
  label: string;
  /**
   * Currently selected Pal name.
   */
  value: string;
  /**
   * Handler for when a Pal is selected.
   */
  onChange: (value: string) => void;
  /**
   * List of all available Pal names.
   */
  palList: string[];
  /**
   * Whether selection is required.
   */
  required?: boolean;
  /**
   * Whether the selector is disabled.
   */
  disabled?: boolean;
}

const PalSelector: React.FC<PalSelectorProps> = ({
  label,
  value,
  onChange,
  palList,
  required = false,
  disabled = false
}) => {
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Memoize filtered pals
  const filteredPals = useMemo(() => {
    if (searchTerm) {
      return palList.filter(pal =>
        pal.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return palList;
  }, [searchTerm, palList]);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(filteredPals.findIndex(pal => pal === value));
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, filteredPals, value]);

  const handleSelect = (pal: string) => {
    onChange(pal);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredPals.length) {
        handleSelect(filteredPals[highlightedIndex]);
      } else if (!isOpen && filteredPals.length > 0 && !value) {
        setIsOpen(true);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => {
          const next = prev < filteredPals.length - 1 ? prev + 1 : 0;
          return next;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredPals.length - 1);
      } else {
        setHighlightedIndex(prev => {
          const next = prev > 0 ? prev - 1 : filteredPals.length - 1;
          return next;
        });
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        id={`palselector-label-${label.replace(/\s+/g, '-')}`}
        className={`block text-sm font-medium mb-2 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`palselector-listbox-${label.replace(/\s+/g, '-')}`}
        aria-labelledby={`palselector-label-${label.replace(/\s+/g, '-')}`}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `palselector-option-${label.replace(/\s+/g, '-')}-${filteredPals[highlightedIndex]}` : undefined}
        tabIndex={0}
        className={`relative rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:border-blue-500 ${
          isDark 
            ? 'bg-gray-800/80 border border-gray-600 text-white' 
            : 'bg-white/80 border border-gray-300 text-gray-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/50' : ''
        }`}
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {value && (
              <img
                src={getPalImage(value)}
                alt={value}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e: any) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className={value 
              ? (isDark ? 'text-white' : 'text-gray-800') 
              : (isDark ? 'text-gray-400' : 'text-gray-500')
            }>
              {value || `Select ${label}`}
            </span>
          </div>
          <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</div>
        </div>
      </div>

      {isOpen && (
        <div
          id={`palselector-listbox-${label.replace(/\s+/g, '-')}`}
          role="listbox"
          aria-labelledby={`palselector-label-${label.replace(/\s+/g, '-')}`}
          className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl backdrop-blur-sm max-h-80 overflow-hidden z-[100] ${
            isDark 
              ? 'bg-gray-800/95 border border-gray-600' 
              : 'bg-white/95 border border-gray-300'
          }`}
        >
          <div className={`p-2 ${
            isDark ? 'border-b border-gray-600' : 'border-b border-gray-300'
          }`}>
            <input
              ref={inputRef}
              type="text"
              aria-label={`Search ${label}`}
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 ${
                isDark 
                  ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              }`}
              autoComplete="off"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredPals.length > 0 ? (
              filteredPals.map((pal, idx) => (
                <div
                  key={pal}
                  id={`palselector-option-${label.replace(/\s+/g, '-')}-${pal}`}
                  role="option"
                  aria-selected={pal === value}
                  className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-700/50 text-white' 
                      : 'hover:bg-gray-100 text-gray-800'
                  } ${highlightedIndex === idx ? (isDark ? 'bg-blue-700/60' : 'bg-blue-100') : ''}`}
                  onClick={() => handleSelect(pal)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <img
                    src={getPalImage(pal)}
                    alt={pal}
                    className="w-6 h-6 rounded-full object-cover"
                    onError={(e: any) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span>{pal}</span>
                </div>
              ))
            ) : (
              <div className={`px-3 py-4 text-center ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No Pals found matching "{searchTerm}"
              </div>
            )}
          </div>

          {value && (
            <div className={`p-2 ${
              isDark ? 'border-t border-gray-600' : 'border-t border-gray-300'
            }`}>
              <button
                onClick={() => handleSelect('')}
                aria-label="Clear selection"
                className={`w-full text-left px-3 py-2 text-red-400 rounded transition-colors ${
                  isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                }`}
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PalSelector; 