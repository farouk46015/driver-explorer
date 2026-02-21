import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Grid3X3, List, Upload, LogOut, User, Filter } from 'lucide-react';
import { useFileManager } from '@/context/FileManagerContext';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import SortByMenu from './SortByMenu';

export default function Header() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    showFileUpload,
    setShowFileUpload,
  } = useFileManager();
  const { user, onLogout } = useAuth();
  const navigate = useNavigate();

  const debouncedSearchQuery = useDebounce(searchQuery);

  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  const onAdvancedSearchClick = () => {
    // TODO: Implement advanced search logic
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">File Manager</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files and folders"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={onAdvancedSearchClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Advanced search"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <SortByMenu currentSort={sortBy} onSortChange={setSortBy} />

          <button
            onClick={() => {
              setShowFileUpload(!showFileUpload);
            }}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Upload files"
          >
            <Upload className="w-5 h-5" />
          </button>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setViewMode('grid');
              }}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('list');
              }}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={() => {
                onLogout();
                void navigate('/');
              }}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
