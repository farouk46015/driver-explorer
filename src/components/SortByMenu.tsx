import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, FileText, Clock, HardDrive, FileType } from 'lucide-react';

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

  const currentOption = sortOptions.find((opt) => opt.value === currentSort) ?? sortOptions[0];
  const CurrentIcon = currentOption.icon;

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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isOpen
            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
        }`}
        title="Sort options"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Sort: {currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
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
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{option.label}</span>
                </div>
                {isActive ? <Check className="w-4 h-4 text-blue-600" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
