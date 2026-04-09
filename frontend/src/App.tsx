import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReservationsPage from './pages/ReservationsPage';
import ProviderReservationsPage from './pages/ProviderReservationsPage';
import InstructorReservationsPage from './pages/InstructorReservationsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Header />
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/provider-reservations" element={<ProviderReservationsPage />} />
            <Route path="/instructor-reservations" element={<InstructorReservationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
