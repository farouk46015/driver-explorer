import { Outlet } from 'react-router';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FileManagerContextProvider from '@/context/FileManagerContext';

export default function MainLayout() {
  return (
    <FileManagerContextProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </FileManagerContextProvider>
  );
}
