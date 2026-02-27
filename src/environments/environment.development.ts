export const environment = {
  production: false,
  apiUrl: 'https://saferoad-gedncdhpamdsftge.canadacentral-01.azurewebsites.net/api',
  signalrUrl: 'https://saferoad-gedncdhpamdsftge.canadacentral-01.azurewebsites.net',
  logLevel: 'verbose',
  mapbox: {
    defaultCenter: { lat: 41.0082, lng: 28.9784 }, // İstanbul
    defaultZoom: 12,
  },
  upload: {
    maxFileSizeMb: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
