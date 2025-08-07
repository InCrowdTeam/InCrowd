// Utility per verificare la configurazione Google OAuth
export const verifyGoogleConfig = () => {
  const config = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    currentOrigin: window.location.origin,
    currentHost: window.location.host,
    currentHostname: window.location.hostname,
    currentPort: window.location.port,
    currentProtocol: window.location.protocol,
    currentHref: window.location.href,
    userAgent: navigator.userAgent,
    isLocalhost: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.includes('localhost'),
    isHTTPS: window.location.protocol === 'https:',
    isDevelopment: import.meta.env.DEV
  };

  console.group("🔍 Google OAuth Configuration Check");
  console.log("📋 Configuration Details:", config);
  
  // Lista delle origini che dovresti aggiungere in Google Cloud Console
  const originsToAdd = [
    config.currentOrigin,
    `${config.currentProtocol}//${config.currentHostname}`,
    `${config.currentProtocol}//${config.currentHostname}:${config.currentPort || (config.currentProtocol === 'https:' ? '443' : '80')}`,
    'http://localhost:5173',
    import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://localhost:5173',
    'https://127.0.0.1:5173'
  ];

  console.log("🌐 Origini da aggiungere in Google Cloud Console:");
  originsToAdd.forEach((origin, index) => {
    console.log(`${index + 1}. ${origin}`);
  });

  console.log("⚠️  Assicurati che TUTTE queste origini siano aggiunte in:");
  console.log("   Google Cloud Console > APIs & Services > Credentials > Il tuo OAuth 2.0 Client > Origini JavaScript autorizzate");
  
  console.groupEnd();

  return config;
};

export const getRequiredOrigins = () => {
  const currentOrigin = window.location.origin;
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  return [
    currentOrigin,
    `${protocol}//${hostname}`,
    `${protocol}//${hostname}:${port || (protocol === 'https:' ? '443' : '80')}`,
    'http://localhost:5173',
    import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://localhost:5173',
    'https://127.0.0.1:5173'
  ].filter((origin, index, arr) => arr.indexOf(origin) === index); // Rimuovi duplicati
};