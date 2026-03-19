import MapComponent from '../components/MapComponent';
import VehicleSidebar from '../components/VehicleSidebar';
import { useAuth } from '../contexts/AuthContext';

export default function MapPage() {
  const { isAuthenticated, role } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {isCarProvider && <VehicleSidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', position: 'relative' }}>
        <main style={{ flex: 1, width: '100%', position: 'relative' }}>
          <MapComponent />
        </main>
      </div>
    </div>
  );
}
