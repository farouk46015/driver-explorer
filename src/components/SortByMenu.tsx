import { useState, useRef, useEffect } from 'react';
import { Check, SortAsc, FileText, Clock, HardDrive, FileType } from 'lucide-react';

interface SortByMenuProps {
  currentSort: 'name' | 'modified' | 'size' | 'type';
  onSortChange: (sort: 'name' | 'modified' | 'size' | 'type') => void;
}

const sortOptions = [
  { value: 'name' as const, label: 'Name', icon: FileText },
  { value: 'modified' as const, label: 'Modified', icon: Clock },
  { value: 'size' as const, label: 'Size', icon: HardDrive },
  { value: 'type' as const, label: 'Type', icon: FileType },
];

export default function SortByMenu({ currentSort, onSortChange }: SortByMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSortClick = (value: 'name' | 'modified' | 'size' | 'type') => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Sort options"
      >
        <SortAsc className="w-5 h-5" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            Sort by
          </div>
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = currentSort === option.value;

            return (
              <button
                key={option.value}
                onClick={() => {
                  handleSortClick(option.value);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </div>
                {isActive ? <Check className="w-4 h-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
