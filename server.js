const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS - PRIMA DI TUTTO!
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
  
  // PRIORITÀ 1: Estrai dal titolo
  if (product.title) {
    // Pulisci il titolo
    let title = product.title
      .replace(/LOFT\.?73\s*[-–]\s*/gi, '')
      .replace(/[-–]\s*$/, '')
      .trim();
    
    // Lista di tipi di capo da rimuovere
    const tipiCapo = [
      'PANTALONE', 'PANTALONI', 'MAGLIA', 'GIACCA', 'GONNA', 'ABITO', 
      'CAMICIA', 'TOP', 'BLUSA', 'CAPPOTTO', 'GIUBBOTTO', 'CARDIGAN', 
      'PULLOVER', 'JEANS', 'SHORT', 'BERMUDA', 'VESTITO', 'FELPA',
      'T-SHIRT', 'POLO', 'CANOTTA', 'GILET', 'BLAZER', 'KIMONO'
    ];
    
    // Rimuovi il tipo di capo dal titolo
    tipiCapo.forEach(tipo => {
      title = title.replace(new RegExp(`^${tipo}\\s+`, 'i'), '');
      title = title.replace(new RegExp(`\\s+${tipo}$`, 'i'), '');
    });
    
    // Prendi la prima parola rimanente (dovrebbe essere il nome)
    const words = title.split(/\s+/);
    if (words.length > 0) {
      const potentialName = words[0];
      
      // Verifica che sia un nome valido
      if (potentialName.length > 2 && 
          potentialName.length < 20 &&
          /^[A-Za-zÀ-ÿ]+$/.test(potentialName) && // Solo lettere
          !potentialName.match(/^[A-Z0-9]+$/) && // Non tutto maiuscolo
          !isCommonWord(potentialName)) {
        names.add(capitalizeFirst(potentialName));
      }
    }
  }
  
  // PRIORITÀ 2: Se non trovato, cerca nei tag
  if (names.size === 0 && product.tags) {
    const tagArray = product.tags.split(',').map(tag => tag.trim());
    
    // Cerca tag che sembrano nomi propri
    for (const tag of tagArray) {
      if (tag.length > 2 && 
          tag.length < 20 &&
          /^[A-Z][a-z]+$/.test(tag) && // Inizia con maiuscola
          !isSeasonTag(tag) && 
          !isCommonWord(tag)) {
        names.add(tag);
      }
    }
  }
  
  // NON estrarre da SKU!
  
  return Array.from(names);
}

// Helper functions
function isCommonWord(word) {
  const commonWords = [
    // Capi
    'PANTALONE', 'MAGLIA', 'GIACCA', 'GONNA', 'ABITO', 'CAMICIA', 'TOP', 'BLUSA',
    'CAPPOTTO', 'GIUBBOTTO', 'CARDIGAN', 'PULLOVER', 'JEANS', 'SHORT', 'BERMUDA',
    // Attributi
    'LOFT', 'DONNA', 'UOMO', 'NERO', 'BIANCO', 'ROSSO', 'BLU', 'VERDE',
    'FANGO', 'GRIGIO', 'BEIGE', 'MARRONE', 
    // Taglie
    'TU', 'XS', 'S', 'M', 'L', 'XL', 'XXL',
    // Altri
    'COLLEZIONE', 'STAGIONE', 'NUOVO', 'ARRIVO'
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
      // Log di debug per i primi 3 prodotti
      console.log('\n📦 Esempi di prodotti trovati:');
      data.products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProdotto ${index + 1}:`, {
          title: product.title,
          tags: product.tags?.substring(0, 100) + '...',
          sku: product.variants?.[0]?.sku
        });
      });
      
      data.products.forEach(product => {
        if (product.tags && product.tags.includes(shopifyTag)) {
          productCount++;
          const extractedNames = extractProductName(product);
          extractedNames.forEach(name => allNames.add(name));
        }
      });
    }
    
    const namesArray = Array.from(allNames).sort();
    
    console.log(`\n✅ Trovati ${productCount} prodotti con tag "${shopifyTag}"`);
    console.log(`✅ Estratti ${namesArray.length} nomi unici:`, namesArray.slice(0, 20), '...');
    
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
  
  console.log(`\n🎯 Generazione ${count} nomi...`);
  console.log(`📋 Nomi esistenti da escludere: ${existingNames.length}`);
  
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
  
  // Filtra nomi già esistenti
  const availableNames = namePool.filter(name => 
    !existingNames.some(existing => existing.toLowerCase() === name.toLowerCase())
  );
  
  console.log(`✅ Nomi disponibili dopo filtro: ${availableNames.length}`);
  
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
  
  console.log(`✅ Generati ${generatedNames.length} nomi unici`);
  
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

// Endpoint di test per debug
app.get('/api/test-names/:season', async (req, res) => {
  const season = req.params.season;
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
    
    const data = await response.json();
    const allNames = new Set();
    let productExamples = [];
    
    if (data.products) {
      data.products.forEach(product => {
        if (product.tags && product.tags.includes(shopifyTag)) {
          const names = extractProductName(product);
          names.forEach(name => allNames.add(name));
          
          if (productExamples.length < 5) {
            productExamples.push({
              title: product.title,
              extractedNames: names,
              tags: product.tags.substring(0, 100) + '...'
            });
          }
        }
      });
    }
    
    res.json({
      totalNames: allNames.size,
      names: Array.from(allNames).sort(),
      productExamples: productExamples
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LOFT.73 Name Generator API running on port ${PORT}`);
  console.log(`📦 Shopify connected: ${!!SHOPIFY_ACCESS_TOKEN && !!SHOPIFY_STORE_URL}`);
});
