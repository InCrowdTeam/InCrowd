// ...existing imports...

// CORS Configuration for Google OAuth
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://accounts.google.com',
    'https://www.googleapis.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Auth-Token'
  ]
};

app.use(cors(corsOptions));

// FedCM Well-Known endpoint for Google OAuth
app.get('/.well-known/web-identity', (req, res) => {
  res.json({
    provider_urls: ["https://accounts.google.com/gsi/issuer"]
  });
});

// FedCM Config endpoint
app.get('/fedcm.json', (req, res) => {
  res.json({
    accounts_endpoint: "/api/auth/fedcm/accounts",
    client_metadata_endpoint: "/api/auth/fedcm/client_metadata",
    id_assertion_endpoint: "/api/auth/fedcm/assertion"
  });
});

// ...existing middleware...