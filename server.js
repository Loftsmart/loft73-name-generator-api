const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Variabili Shopify da Railway
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'LOFT.73 Name Generator API',
    version: '2.0.0',
    shopify_connected: !!SHOPIFY_ACCESS_TOKEN
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    shopify_configured: !!SHOPIFY_ACCESS_TOKEN,
    store_url: SHOPIFY_STORE_URL
  });
});

// Funzione helper per chiamate Shopify
function callShopifyAPI(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE_URL,
      path: `/admin/api/${SHOPIFY_API_VERSION}${endpoint}`,
      method: method,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`Shopify API error: ${JSON.stringify(jsonData)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Shopify response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request failed: ${e.message}`));
    });

    req.end();
  });
}

// RECUPERA PRODOTTI REALI DA SHOPIFY
app.post('/api/shopify/products', async (req, res) => {
  try {
    const { season } = req.body;
    console.log(`Recupero prodotti REALI da Shopify per stagione: ${season}`);
    
    // Chiamata API Shopify per recuperare TUTTI i prodotti
    // Shopify limita a 250 prodotti per chiamata
    const shopifyData = await callShopifyAPI('/products.json?limit=250');
    
    // Filtra i prodotti per stagione basandosi sui tag
    const allProducts = shopifyData.products || [];
    const seasonProducts = allProducts.filter(product => {
      const tags = product.tags ? product.tags.toLowerCase() : '';
      return tags.includes(season.toLowerCase());
    });
    
    // Estrai solo i nomi (titoli) dei prodotti
    const productNames = seasonProducts.map(p => p.title);
    const uniqueNames = [...new Set(productNames)].sort();
    
    console.log(`Trovati ${uniqueNames.length} prodotti REALI per ${season}`);
    
    res.json({
      success: true,
      season: season,
      count: uniqueNames.length,
      names: uniqueNames,
      source: 'Shopify API',
      total_products_checked: allProducts.length
    });
    
  } catch (error) {
    console.error('Errore Shopify:', error.message);
    
    // Se Shopify non risponde, usa dati di fallback
    const fallbackNames = {
      'PE 25': ['Aurora', 'Luna', 'Stella'],
      'AI 24': ['Brezza', 'Nebbia', 'Alba'],
      'PE 24': ['Marina', 'Onda', 'Corallo']
    };
    
    res.json({
      success: false,
      season: req.body.season,
      count: fallbackNames[req.body.season]?.length || 0,
      names: fallbackNames[req.body.season] || [],
      error: error.message,
      source: 'Fallback data (Shopify non disponibile)'
    });
  }
});

// Genera nomi evitando duplicati
app.post('/api/generate-names', async (req, res) => {
  try {
    const { prompt, count = 10, existingNames = [] } = req.body;
    console.log(`Generazione ${count} nomi, evitando ${existingNames.length} nomi esistenti`);
    
    // Pool di nomi italiani femminili
    const allNames = [
      'Aurora', 'Luna', 'Stella', 'Alba', 'Chiara', 'Serena', 'Marina', 'Viola',
      'Rosa', 'Bianca', 'Elena', 'Sofia', 'Giulia', 'Emma', 'Giorgia', 'Marta',
      'Iris', 'Flora', 'Diana', 'Silvia', 'Gemma', 'Perla', 'Asia', 'Eva',
      'Brezza', 'Onda', 'Neve', 'Rugiada', 'Nebbia', 'Nuvola', 'Pioggia', 'Schiuma',
      'Margherita', 'Gardenia', 'Camelia', 'Dalia', 'Orchidea', 'Magnolia', 'Mimosa',
      'Lavanda', 'Verbena', 'Ortensia', 'Azalea', 'Begonia', 'Peonia', 'Fresia',
      'Ambra', 'Giada', 'Corallo', 'Cristallo', 'Diamante', 'Rubino', 'Zaffiro',
      'Smeraldo', 'Topazio', 'Ametista', 'Opale', 'Agata', 'Turchese', 'Acquamarina'
    ];
    
    // IMPORTANTE: Filtra via i nomi che già esistono su Shopify
    const availableNames = allNames.filter(name => 
      !existingNames.some(existing => 
        existing.toLowerCase() === name.toLowerCase()
      )
    );
    
    console.log(`${availableNames.length} nomi disponibili dopo aver filtrato i duplicati`);
    
    // Seleziona nomi casuali
    const shuffled = availableNames.sort(() => 0.5 - Math.random());
    const selectedNames = shuffled.slice(0, Math.min(count, availableNames.length));
    
    res.json({
      success: true,
      names: selectedNames.map((name, i) => ({
        id: Date.now() + i,
        name: name
      })),
      total_available: availableNames.length,
      duplicates_avoided: existingNames.length
    });
    
  } catch (error) {
    console.error('Errore generazione:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verifica nome singolo su Shopify
app.post('/api/check-name', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Cerca su Shopify se esiste un prodotto con questo nome
    const searchUrl = `/products.json?title=${encodeURIComponent(name)}`;
    const shopifyData = await callShopifyAPI(searchUrl);
    
    const exists = shopifyData.products && shopifyData.products.length > 0;
    
    res.json({
      success: true,
      exists,
      name,
      source: 'Shopify API'
    });
    
  } catch (error) {
    console.error('Errore verifica nome:', error);
    res.json({
      success: false,
      exists: false,
      error: error.message,
      source: 'Error'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server LOFT.73 attivo su porta ${PORT}`);
  console.log(`🛍️ Shopify Store: ${SHOPIFY_STORE_URL}`);
  console.log(`🔑 Token configurato: ${SHOPIFY_ACCESS_TOKEN ? 'Sì' : 'No'}`);
});
