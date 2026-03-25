import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
