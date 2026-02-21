import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useFileManager } from '@/context/FileManagerContext';

export default function BreadcrumbNav() {
  const { currentPath, setCurrentPath } = useFileManager();
  return (
    <nav className="flex items-center space-x-2 mb-6">
      {currentPath.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <ChevronRight className="w-4 h-4 text-gray-400" /> : null}
          <button
            onClick={() => {
              setCurrentPath(currentPath.slice(0, index + 1));
            }}
            className={`text-sm font-medium transition-colors ${
              index === currentPath.length - 1
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {segment}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
