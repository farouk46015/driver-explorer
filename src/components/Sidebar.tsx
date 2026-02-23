import { HardDrive, Clock, Star, FolderOpen, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useFileManager } from '@/context/FileManagerContext';
import formatFileSize from '@/utils/formateSize';

export default function Sidebar() {
  const { currentPath, setCurrentPath, storeStatus } = useFileManager();
  const navigate = useNavigate();
  const location = useLocation();

  const storageLimit = 15 * 1024 * 1024 * 1024; // 15 GB in bytes
  const usedPercentage = (storeStatus.totalSize / storageLimit) * 100;

  const menuItems = [
    { id: 'drive', label: 'My Drive', icon: HardDrive, path: ['My Drive'], route: '/' },
    { id: 'recent', label: 'Recent', icon: Clock, path: null, route: '/recent' },
    { id: 'starred', label: 'Starred', icon: Star, path: null, route: '/starred' },
  ];

  const isActive = (item: { path: string[] | null; route: string }) => {
    if (item.route === '/recent' || item.route === '/starred') {
      return location.pathname === item.route;
    }

    if (item.path) {
      return (
        location.pathname === item.route &&
        item.path.length === currentPath.length &&
        item.path.every((segment, i) => currentPath[i] === segment)
      );
    }
    return false;
  };

  const handleItemClick = (item: { path: string[] | null; route: string }) => {
    if (item.route === '/recent' || item.route === '/starred') {
      void navigate(item.route);
    } else if (item.path) {
      if (location.pathname !== '/') {
        void navigate('/');
      }
      setCurrentPath(item.path);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">File Manager</h1>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    handleItemClick(item);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {currentPath[0] === 'My Drive' ? (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Folders
            </h4>
            {/* <FolderTree/> */}
          </div>
        ) : null}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Storage</span>
            <span className="text-xs">
              {formatFileSize(storeStatus.totalSize)} of {formatFileSize(storageLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(usedPercentage, 100).toString()}%` }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Files</span>
              </div>
              <span className="font-medium">{storeStatus.fileCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-yellow-500" />
                <span>Folders</span>
              </div>
              <span className="font-medium">{storeStatus.folderCount.toString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
              <span>Total Items</span>
              <span className="font-semibold">{storeStatus.totalItems.toString()}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
