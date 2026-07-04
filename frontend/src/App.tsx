import { useEffect } from 'react';
import type { JSX } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TripPage } from './pages/TripPage';
import { useMe } from './hooks/useMe';
import { useAuthStore } from './store/authStore';

function App(): JSX.Element {
  const { data, isLoading, isSuccess, isError } = useMe();
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const user = useAuthStore((state) => state.user);

  
  useEffect(() => {
    if (isSuccess && data) {
      setUser(data.user);
    } else if (isError) {
      clearUser();
    }
  }, [isSuccess, isError, data, setUser, clearUser]);

  if (isLoading) {
    return <p>Loading…</p>;
  }

  // Not logged in — every path except /register falls back to the login
  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips/:tripId" element={<TripPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
