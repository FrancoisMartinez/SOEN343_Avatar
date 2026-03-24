const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

type NominatimAddress = {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
};

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

function toShortAddress(address?: NominatimAddress, displayName?: string): string {
  const street = [address?.house_number, address?.road].filter(Boolean).join(' ').trim();
  const city =
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.hamlet ??
    '';

  if (street && city) return `${street}, ${city}`;
  if (street) return street;
  if (city) return city;

  const parts = (displayName ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  if (parts.length === 1) return parts[0];
  return '';
}

export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    addressdetails: '1',
    limit: '5',
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });

  if (!res.ok) throw new Error('Geocoding request failed');

  const data: NominatimResult[] = await res.json();
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    displayName: toShortAddress(item.address, item.display_name),
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: 'json',
    addressdetails: '1',
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });

  if (!res.ok) throw new Error('Reverse geocoding request failed');

  const data: NominatimResult = await res.json();
  return toShortAddress(data.address, data.display_name) || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
