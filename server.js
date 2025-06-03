const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione CORS per permettere richieste da Claude.ai e altri domini
app.use(cors({
  origin: '*', // Permette tutte le origini
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware per gestire preflight OPTIONS
app.options('*', cors());

// Middleware
app.use(express.json());

// Variabili Shopify (da environment variables)
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

// Mapping stagioni
const SEASON_MAPPING = {
  'PE 25': '25E',
  'AI 25': '25I', 
  'PE 24': '24E',
  'AI 24': '24I',
  'PE 26': '26E',
  'AI 26': '26I'
};

// Funzione per estrarre il nome dal prodotto
function extractProductName(product) {
  const names = new Set();
  
  // 1. Estrai dal titolo
  if (product.title) {
    const patterns = [
      /LOFT\.?73\s*[-–]\s*(?:PANTALONE|MAGLIA|GIACCA|GONNA|ABITO|CAMICIA|TOP|BLUSA)\s+(\w+)/i,
      /(?:PANTALONE|MAGLIA|GIACCA|GONNA|ABITO|CAMICIA|TOP|BLUSA)\s+(\w+)/i,
      /LOFT\.?73\s*[-–]\s*(\w+)$/i,
      /^(\w+)\s*[-–]/i
    ];
    
    for (const pattern of patterns) {
      const match = product.title.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && !isCommonWord(name)) {
          names.add(capitalizeFirst(name));
        }
      }
    }
  }
  
  // 2. Estrai dallo SKU
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.sku) {
        const skuParts = variant.sku
          .replace(/LOFT\.?73[-_]?/gi, '')
          .replace(/HFD\d+[A-Z]*[-_]?/gi, '')
          .split(/[-_]/);
        
        skuParts.forEach(part => {
          if (part.length > 2 && 
              isNaN(part) && 
              !isCommonWord(part) &&
              !/^\d+[A-Z]+$/.test(part)) {
            names.add(capitalizeFirst(part));
          }
        });
      }
    });
  }
  
  // 3. Estrai dai tag
  if (product.tags) {
    const tagArray = product.tags.split(',').map(tag => tag.trim());
    tagArray.forEach(tag => {
      if (tag.length > 2 && 
          !isSeasonTag(tag) && 
          !isCommonWord(tag) &&
          isNaN(tag)) {
        names.add(capitalizeFirst(tag));
      }
    });
  }
  
  return Array.from(names);
}

// Helper functions
function isCommonWord(word) {
  const commonWords = [
    'PANTALONE', 'MAGLIA', 'GIACCA', 'GONNA', 'ABITO', 'CAMICIA', 'TOP', 'BLUSA',
    'LOFT', 'DONNA', 'UOMO', 'NERO', 'BIANCO', 'ROSSO', 'BLU', 'VERDE',
    'FANGO', 'GRIGIO', 'BEIGE', 'MARRONE', 'TU', 'XS', 'S', 'M', 'L', 'XL', 'XXL'
  ];
  return commonWords.includes(word.toUpperCase());
}

function isSeasonTag(tag) {
  return /^\d{2}[EI]$/i.test(tag) || 
         /^(PE|AI)\s*\d{2}$/i.test(tag) ||
         /^(PRIMAVERA|ESTATE|AUTUNNO|INVERNO)/i.test(tag);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'LOFT.73 Name Generator API',
    version: '2.0.0',
    shopify_connected: !!SHOPIFY_ACCESS_TOKEN && !!SHOPIFY_STORE_URL
  });
});

app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    shopify: {
      configured: !!SHOPIFY_ACCESS_TOKEN && !!SHOPIFY_STORE_URL,
      store: SHOPIFY_STORE_URL || 'not configured',
      api_version: SHOPIFY_API_VERSION
    }
  };
  res.json(healthCheck);
});

app.post('/api/shopify/products', async (req, res) => {
  const { season } = req.body;
  
  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_URL) {
    return res.status(500).json({ 
      success: false, 
      error: 'Shopify non configurato. Aggiungi le variabili ambiente su Railway.' 
    });
  }
  
  const shopifyTag = SEASON_MAPPING[season] || season;
  
  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const allNames = new Set();
    let productCount = 0;
    
    if (data.products) {
      data.products.forEach(product => {
        if (product.tags && product.tags.includes(shopifyTag)) {
          productCount++;
          const extractedNames = extractProductName(product);
          extractedNames.forEach(name => allNames.add(name));
          
          if (extractedNames.includes('Marina')) {
            console.log(`✓ Trovato "Marina" in prodotto:`, {
              title: product.title,
              sku: product.variants?.[0]?.sku,
              tags: product.tags,
              extracted: extractedNames
            });
          }
        }
      });
    }
    
    const namesArray = Array.from(allNames).sort();
    
    console.log(`✅ Trovati ${productCount} prodotti con tag "${shopifyTag}"`);
    console.log(`✅ Estratti ${namesArray.length} nomi unici:`, namesArray);
    
    res.json({ 
      success: true, 
      names: namesArray,
      count: productCount,
      shopify_tag: shopifyTag
    });
    
  } catch (error) {
    console.error('❌ Errore Shopify:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/generate-names', async (req, res) => {
  const { count = 20, existingNames = [] } = req.body;
  
  // Pool di nomi italiani
  const namePool = [
    'Aurora', 'Luna', 'Stella', 'Alba', 'Chiara', 'Serena', 'Marina', 'Viola',
    'Rosa', 'Giada', 'Perla', 'Ambra', 'Iris', 'Flora', 'Dalia', 'Gemma',
    'Nuvola', 'Brezza', 'Aria', 'Terra', 'Sole', 'Onda', 'Luce', 'Neve',
    'Fiamma', 'Acqua', 'Vento', 'Sabbia', 'Roccia', 'Foglia', 'Fiore', 'Ramo',
    'Cristallo', 'Diamante', 'Rubino', 'Zaffiro', 'Smeraldo', 'Opale', 'Corallo', 'Turchese',
    'Miriam', 'Sara', 'Rebecca', 'Noemi', 'Rachele', 'Lea', 'Ester', 'Giuditta',
    'Asia', 'Africa', 'Europa', 'America', 'Oceania', 'India', 'Cina', 'Grecia',
    'Primavera', 'Estate', 'Autunno', 'Inverno', 'Mattina', 'Sera', 'Notte', 'Giorno',
    'Melodia', 'Armonia', 'Sinfonia', 'Canzone', 'Musica', 'Danza', 'Ritmo', 'Suono',
    'Poesia', 'Prosa', 'Verso', 'Rima', 'Strofa', 'Sonetto', 'Ballata', 'Lirica',
    'Pennello', 'Colore', 'Tela', 'Dipinto', 'Scultura', 'Arte', 'Disegno', 'Forma',
    'Profumo', 'Essenza', 'Fragranza', 'Aroma', 'Bouquet', 'Petalo', 'Polline', 'Nettare',
    'Venezia', 'Firenze', 'Roma', 'Milano', 'Napoli', 'Torino', 'Verona', 'Siena',
    'Amore', 'Pace', 'Gioia', 'Speranza', 'Fede', 'Grazia', 'Gloria', 'Vittoria',
    'Sogno', 'Fantasia', 'Magia', 'Incanto', 'Mistero', 'Enigma', 'Favola', 'Leggenda',
    'Dea', 'Musa', 'Ninfa', 'Sirena', 'Fata', 'Regina', 'Principessa', 'Duchessa',
    'Orchidea', 'Gardenia', 'Camelia', 'Magnolia', 'Azalea', 'Begonia', 'Peonia', 'Glicine',
    'Farfalla', 'Libellula', 'Ape', 'Coccinella', 'Lucciola', 'Rondine', 'Colomba', 'Fenice',
    'Margherita', 'Gelsomino', 'Lavanda', 'Mimosa', 'Narciso', 'Papavero', 'Tulipano', 'Zinnia'
  ];
  
  // Filtra nomi già esistenti e genera lista unica
  const availableNames = namePool.filter(name => 
    !existingNames.some(existing => existing.toLowerCase() === name.toLowerCase())
  );
  
  // Genera nomi unici
  const generatedNames = [];
  const usedNames = new Set();
  
  for (let i = 0; i < count && i < availableNames.length; i++) {
    let randomIndex = Math.floor(Math.random() * availableNames.length);
    let selectedName = availableNames[randomIndex];
    
    // Assicurati che non ci siano duplicati nella stessa generazione
    while (usedNames.has(selectedName.toLowerCase()) && generatedNames.length < availableNames.length) {
      randomIndex = Math.floor(Math.random() * availableNames.length);
      selectedName = availableNames[randomIndex];
    }
    
    if (!usedNames.has(selectedName.toLowerCase())) {
      usedNames.add(selectedName.toLowerCase());
      generatedNames.push({
        id: Date.now() + i,
        name: selectedName
      });
    }
  }
  
  res.json({
    success: true,
    names: generatedNames,
    total: generatedNames.length
  });
});

app.post('/api/check-name', async (req, res) => {
  const { name, season } = req.body;
  
  // Implementazione futura per verificare singolo nome
  res.json({
    success: true,
    exists: false,
    message: 'Funzionalità in sviluppo'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LOFT.73 Name Generator API running on port ${PORT}`);
  console.log(`📦 Shopify connected: ${!!SHOPIFY_ACCESS_TOKEN && !!SHOPIFY_STORE_URL}`);
});
