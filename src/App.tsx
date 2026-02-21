import { Routes, Route } from 'react-router';
import MainLayout from '@/layout/MainLayout';
import NotFound from '@/pages/NotFound';
import HomePage from '@/pages/HomePage';
import { AuthProvider } from '@/context/AuthContext';
// import { RequireAuth } from '@/components/RequireAuth';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* <Route element={<RequireAuth />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Route> */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
