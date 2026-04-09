import L from 'leaflet';

export const CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
</svg>`;

export const INSTRUCTOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
</svg>`;

export const USER_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" fill="#646cff" fill-opacity="0.25" stroke="#646cff" stroke-width="2"/>
  <circle cx="12" cy="12" r="4" fill="#646cff" stroke="white" stroke-width="2" />
</svg>`;

export const RETICLE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#646cff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" />
  <line x1="22" y1="12" x2="18" y2="12" />
  <line x1="6" y1="12" x2="2" y2="12" />
  <line x1="12" y1="6" x2="12" y2="2" />
  <line x1="12" y1="22" x2="12" y2="18" />
  <circle cx="12" cy="12" r="1.5" fill="#646cff" />
</svg>`;

export const carIcon = L.divIcon({
  className: 'car-marker',
  html: `<div class="car-marker__inner">${CAR_SVG}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export const carIconHighlighted = L.divIcon({
  className: 'car-marker car-marker--highlighted',
  html: `<div class="car-marker__inner car-marker__inner--highlighted">${CAR_SVG}</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

export const instructorIcon = L.divIcon({
  className: 'instructor-marker',
  html: `<div class="car-marker__inner">${INSTRUCTOR_SVG}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export const instructorIconHighlighted = L.divIcon({
  className: 'instructor-marker instructor-marker--highlighted',
  html: `<div class="car-marker__inner car-marker__inner--highlighted">${INSTRUCTOR_SVG}</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -24],
});

export const reticleIcon = L.divIcon({
  className: 'reticle-marker',
  html: `<div class="reticle-marker__inner">${RETICLE_SVG}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

export const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-location-marker__inner">${USER_SVG}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
