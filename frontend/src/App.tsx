import type { JSX } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { TripDetailPage } from './pages/TripDetailPage';

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage />} />
    </Routes>
  )
}

export default App
