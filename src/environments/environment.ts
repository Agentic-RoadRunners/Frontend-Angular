export const environment = {
  production: false,
  apiUrl: 'https://localhost:9001/api',
  aiServiceUrl: 'http://localhost:8000',
  signalrUrl: 'https://localhost:9001',
  logLevel: 'verbose',
  mapbox: {
    defaultCenter: { lat: 41.0082, lng: 28.9784 },
    defaultZoom: 12,
  },
  upload: {
    maxFileSizeMb: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
