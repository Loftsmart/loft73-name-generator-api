const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione Shopify
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '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';
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'loft-73.myshopify.com';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

// Middleware CORS - DEVE essere prima di tutto
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

// Middleware per parsing JSON
app.use(express.json());

// Pool di nomi predefiniti (100+)
const namePool = [
    // Nomi femminili italiani
    'Aurora', 'Luna', 'Stella', 'Alba', 'Chiara', 'Serena', 'Marina', 'Elena',
    'Sofia', 'Giulia', 'Martina', 'Giorgia', 'Sara', 'Emma', 'Greta', 'Marta',
    'Anna', 'Francesca', 'Valentina', 'Alessia', 'Viola', 'Bianca', 'Ginevra', 'Beatrice',
    'Rebecca', 'Gaia', 'Arianna', 'Camilla', 'Elisa', 'Alice', 'Carlotta', 'Matilde',
    'Vittoria', 'Noemi', 'Nicole', 'Ludovica', 'Margherita', 'Agnese', 'Caterina', 'Ilaria',
    
    // Nomi natura
    'Rosa', 'Iris', 'Dalia', 'Orchidea', 'Mimosa', 'Gardenia', 'Camelia', 'Azalea',
    'Magnolia', 'Peonia', 'Lavanda', 'Ginestra', 'Edera', 'Felce', 'Betulla', 'Quercia',
    'Perla', 'Ambra', 'Giada', 'Opale', 'Rubino', 'Zaffiro', 'Corallo', 'Cristallo',
    'Diamante', 'Smeraldo', 'Turchese', 'Agata', 'Ametista', 'Topazio', 'Acquamarina', 'Onice',
    
    // Nomi evocativi
    'Aria', 'Brezza', 'Rugiada', 'Nebbia', 'Pioggia', 'Neve', 'Brina', 'Tempesta',
    'Onda', 'Marea', 'Schiuma', 'Conchiglia', 'Sabbia', 'Scogliera', 'Laguna', 'Baia',
    'Nuvola', 'Cielo', 'Cometa', 'Galassia', 'Eclissi', 'Zenith', 'Orizzonte', 'Tramonto',
    'Armonia', 'Melodia', 'Sinfonia', 'Cadenza', 'Accordo', 'Ritmo', 'Eco', 'Silenzio',
    
    // Altri nomi
    'Dafne', 'Penelope', 'Cassandra', 'Elettra', 'Pandora', 'Andromeda', 'Calliope', 'Atena',
    'Diana', 'Venere', 'Minerva', 'Flora', 'Fauna', 'Terra', 'Giunone', 'Vesta'
];

// Mapping stagioni UI -> Shopify tags
const SEASON_MAPPING = {
    'PE 25': '25E',
    'AI 25': '25I',
    'PE 24': '24E',
    'AI 24': '24I',
    'PE 26': '26E',
    'AI 26': '26I'
};

// Funzione per estrarre il nome dal titolo prodotto
function extractProductName(product) {
    if (!product.title) return null;
    
    let title = product.title;
    
    // Rimuovi prefissi comuni
    title = title.replace(/^LOFT\.?73\s*[-–]\s*/i, '');
    title = title.replace(/^LOFT\s*[-–]\s*/i, '');
    
    // Pattern per estrarre il nome
    const patterns = [
        // PANTALONE MARINA -> Marina
        /(?:PANTALONE|MAGLIA|CAMICIA|GIACCA|GONNA|VESTITO|ABITO|TOP|BLUSA|CARDIGAN|CAPPOTTO|GIUBBOTTO)\s+([A-Z][a-z]+)/i,
        // Se non trova pattern specifico, prende la prima parola maiuscola
        /\b([A-Z][a-z]+)\b/
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match && match[1]) {
            const name = match[1];
            // Verifica che non sia un codice (no numeri, lunghezza ragionevole)
            if (!/\d/.test(name) && name.length >= 3 && name.length <= 20) {
                // Capitalizza correttamente
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
        }
    }
    
    return null;
}

// Funzione per recuperare TUTTI i prodotti con paginazione
async function fetchAllShopifyProducts(season) {
    const allProducts = [];
    let pageInfo = null;
    let hasNextPage = true;
    
    console.log(`🔍 Recupero TUTTI i prodotti per stagione ${season}...`);
    
    while (hasNextPage) {
        try {
            // Costruisci URL con paginazione
            let url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;
            
            if (pageInfo) {
                url += `&page_info=${pageInfo}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.status}`);
            }
            
            const data = await response.json();
            allProducts.push(...data.products);
            
            // Controlla se ci sono altre pagine
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                // Estrai page_info dal link header
                const matches = linkHeader.match(/page_info=([^>;&]+)/);
                if (matches) {
                    pageInfo = matches[1];
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
            
            console.log(`📦 Recuperati ${data.products.length} prodotti (totale: ${allProducts.length})`);
            
        } catch (error) {
            console.error('Errore paginazione:', error);
            hasNextPage = false;
        }
    }
    
    // Filtra per stagione
    const filteredProducts = allProducts.filter(product => 
        product.tags && product.tags.includes(season)
    );
    
    console.log(`✅ Totale prodotti per ${season}: ${filteredProducts.length}`);
    
    return filteredProducts;
}

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'LOFT.73 Name Generator API',
        version: '2.0.0',
        shopify_connected: true
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        shopify: {
            configured: true,
            store: SHOPIFY_STORE_URL,
            api_version: SHOPIFY_API_VERSION
        }
    });
});

// Endpoint per recuperare prodotti esistenti
app.post('/api/shopify/products', async (req, res) => {
    const { season } = req.body;
    
    if (!season) {
        return res.status(400).json({ 
            success: false, 
            error: 'Season parameter required' 
        });
    }
    
    // Converti season UI in tag Shopify
    const shopifyTag = SEASON_MAPPING[season];
    if (!shopifyTag) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid season' 
        });
    }
    
    try {
        // Usa la nuova funzione con paginazione
        const products = await fetchAllShopifyProducts(shopifyTag);
        
        // Estrai nomi con logica migliorata
        const names = new Set();
        
        products.forEach(product => {
            const extractedName = extractProductName(product);
            if (extractedName && extractedName.length > 1) {
                names.add(extractedName);
            }
        });
        
        const uniqueNames = Array.from(names).sort();
        
        console.log(`📊 Estratti ${uniqueNames.length} nomi unici da ${products.length} prodotti`);
        
        // Log alcuni esempi per debug
        if (uniqueNames.length > 0) {
            console.log('Esempi nomi estratti:', uniqueNames.slice(0, 10).join(', '));
        }
        
        res.json({
            success: true,
            names: uniqueNames,
            count: uniqueNames.length,
            totalProducts: products.length,
            shopify_tag: shopifyTag
        });
        
    } catch (error) {
        console.error('Errore recupero prodotti:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante il recupero dei prodotti'
        });
    }
});

// Endpoint per generare nomi
app.post('/api/generate-names', async (req, res) => {
    const { prompt, count, season, existingNames = [] } = req.body;
    
    if (!count || count < 1) {
        return res.status(400).json({ 
            success: false, 
            error: 'Count must be greater than 0' 
        });
    }
    
    console.log(`\n🎯 Richiesta generazione: ${count} nomi per stagione ${season}`);
    console.log(`📝 Prompt ricevuto: ${prompt.substring(0, 100)}...`);
    console.log(`🚫 Nomi esistenti da escludere: ${existingNames.length}`);
    
    try {
        // Converti tutti i nomi esistenti in lowercase per confronto
        const existingLower = existingNames.map(n => n.toLowerCase());
        
        // Filtra il pool escludendo i nomi esistenti (case-insensitive)
        const availableNames = namePool.filter(name => 
            !existingLower.includes(name.toLowerCase())
        );
        
        console.log(`🎲 Pool disponibile: ${availableNames.length} nomi`);
        console.log(`🚫 Esclusi: ${namePool.length - availableNames.length} duplicati`);
        
        // Genera nomi casuali dal pool filtrato
        const generatedNames = [];
        const usedNames = new Set();
        
        for (let i = 0; i < count && generatedNames.length < availableNames.length; i++) {
            let randomName;
            do {
                randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
            } while (usedNames.has(randomName.toLowerCase()));
            
            usedNames.add(randomName.toLowerCase());
            generatedNames.push({
                id: Date.now() + i,
                name: randomName
            });
        }
        
        console.log(`✅ Generati ${generatedNames.length} nomi unici`);
        
        res.json({
            success: true,
            names: generatedNames,
            total: generatedNames.length
        });
        
    } catch (error) {
        console.error('Errore generazione:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante la generazione dei nomi'
        });
    }
});

// Endpoint di test (opzionale)
app.get('/api/test-names/:season', async (req, res) => {
    const { season } = req.params;
    
    const shopifyTag = SEASON_MAPPING[season];
    if (!shopifyTag) {
        return res.status(400).json({ error: 'Invalid season' });
    }
    
    try {
        const products = await fetchAllShopifyProducts(shopifyTag);
        const names = new Set();
        const examples = [];
        
        products.forEach(product => {
            const name = extractProductName(product);
            if (name) {
                names.add(name);
                if (examples.length < 10) {
                    examples.push({
                        title: product.title,
                        extracted: name
                    });
                }
            }
        });
        
        res.json({
            totalProducts: products.length,
            totalNames: names.size,
            names: Array.from(names).sort(),
            productExamples: examples
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Avvia server
app.listen(PORT, () => {
    console.log(`
🚀 LOFT.73 Name Generator API
📍 Running on port ${PORT}
🔗 Shopify Store: ${SHOPIFY_STORE_URL}
📅 ${new Date().toLocaleString()}
    `);
});
