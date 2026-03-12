import MapComponent from '../components/MapComponent';

export default function MapPage() {

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4rem', boxSizing: 'border-box' }}>
      <main style={{ flex: 1, width: '100%', position: 'relative' }}>
        <MapComponent />
      </main>
    </div>
  );
}
