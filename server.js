const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione Shopify
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
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
    // Pool di nomi predefiniti (100+) - AGGIORNATO
    // NOTA: Rimossi i colori (Viola, Rosa, Turchese) e nomi probabilmente già usati
    
    // Nomi femminili italiani
    'Aurora', 'Luna', 'Stella', 'Alba', 'Chiara', 'Serena', 'Marina', 'Elena',
    'Sofia', 'Giulia', 'Martina', 'Giorgia', 'Sara', 'Emma', 'Greta', 'Marta',
    'Anna', 'Francesca', 'Valentina', 'Alessia', 'Bianca', 'Ginevra', 'Beatrice',
    'Rebecca', 'Gaia', 'Arianna', 'Camilla', 'Elisa', 'Alice', 'Carlotta', 'Matilde',
    'Vittoria', 'Noemi', 'Nicole', 'Ludovica', 'Margherita', 'Agnese', 'Caterina', 'Ilaria',
    
    // Nomi natura (SENZA COLORI)
    'Iris', 'Dalia', 'Orchidea', 'Mimosa', 'Gardenia', 'Camelia', 'Azalea',
    'Magnolia', 'Peonia', 'Lavanda', 'Ginestra', 'Edera', 'Felce', 'Betulla', 'Quercia',
    'Perla', 'Ambra', 'Giada', 'Opale', 'Rubino', 'Zaffiro', 'Corallo', 'Cristallo',
    'Diamante', 'Smeraldo', 'Agata', 'Ametista', 'Topazio', 'Acquamarina', 'Onice',
    
    // Nomi evocativi
    'Aria', 'Brezza', 'Rugiada', 'Nebbia', 'Pioggia', 'Neve', 'Brina', 'Tempesta',
    'Onda', 'Marea', 'Schiuma', 'Conchiglia', 'Sabbia', 'Scogliera', 'Laguna', 'Baia',
    'Nuvola', 'Cielo', 'Cometa', 'Galassia', 'Eclissi', 'Zenith', 'Orizzonte', 'Tramonto',
    'Armonia', 'Melodia', 'Sinfonia', 'Cadenza', 'Accordo', 'Ritmo', 'Eco', 'Silenzio',
    
    // Nomi mitologici e classici
    'Dafne', 'Penelope', 'Cassandra', 'Elettra', 'Pandora', 'Andromeda', 'Calliope', 'Atena',
    'Diana', 'Venere', 'Minerva', 'Flora', 'Fauna', 'Terra', 'Giunone', 'Vesta',
    
    // Aggiunti nomi alternativi per compensare quelli rimossi
    'Celeste', 'Serena', 'Viviana', 'Silvana', 'Miriam', 'Simona', 'Patrizia', 'Luciana',
    'Loretta', 'Marilena', 'Elisabetta', 'Antonella', 'Rossella', 'Gabriella', 'Raffaella'
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

// Funzione SEMPLIFICATA per estrarre il nome - cerca SOLO le parole chiave
function extractProductName(product) {
    if (!product.title) return null;
    
    const originalTitle = product.title;
    const titleUpper = product.title.toUpperCase();
    
    // Lista COMPLETA di TUTTI i nomi possibili da cercare
    const allPossibleNames = [
        'AURORA', 'LUNA', 'STELLA', 'ALBA', 'CHIARA', 'SERENA', 'MARINA', 'ELENA',
        'SOFIA', 'GIULIA', 'MARTINA', 'GIORGIA', 'SARA', 'EMMA', 'GRETA', 'MARTA',
        'ANNA', 'FRANCESCA', 'VALENTINA', 'ALESSIA', 'BIANCA', 'GINEVRA', 'BEATRICE',
        'REBECCA', 'GAIA', 'ARIANNA', 'CAMILLA', 'ELISA', 'ALICE', 'CARLOTTA', 'MATILDE',
        'VITTORIA', 'NOEMI', 'NICOLE', 'LUDOVICA', 'MARGHERITA', 'AGNESE', 'CATERINA',
        'ILARIA', 'IRIS', 'DALIA', 'ORCHIDEA', 'MIMOSA', 'GARDENIA', 'CAMELIA', 'AZALEA',
        'MAGNOLIA', 'PEONIA', 'LAVANDA', 'GINESTRA', 'EDERA', 'FELCE', 'BETULLA', 'QUERCIA',
        'PERLA', 'AMBRA', 'GIADA', 'OPALE', 'RUBINO', 'ZAFFIRO', 'CORALLO', 'CRISTALLO',
        'DIAMANTE', 'SMERALDO', 'AGATA', 'AMETISTA', 'TOPAZIO', 'ACQUAMARINA', 'ONICE',
        'ARIA', 'BREZZA', 'RUGIADA', 'NEBBIA', 'PIOGGIA', 'NEVE', 'BRINA', 'TEMPESTA',
        'ONDA', 'MAREA', 'SCHIUMA', 'CONCHIGLIA', 'SABBIA', 'SCOGLIERA', 'LAGUNA', 'BAIA',
        'NUVOLA', 'CIELO', 'COMETA', 'GALASSIA', 'ECLISSI', 'ZENITH', 'ORIZZONTE', 'TRAMONTO',
        'ARMONIA', 'MELODIA', 'SINFONIA', 'CADENZA', 'ACCORDO', 'RITMO', 'ECO', 'SILENZIO',
        'DAFNE', 'PENELOPE', 'CASSANDRA', 'ELETTRA', 'PANDORA', 'ANDROMEDA', 'CALLIOPE', 'ATENA',
        'DIANA', 'VENERE', 'MINERVA', 'FLORA', 'FAUNA', 'TERRA', 'GIUNONE', 'VESTA'
    ];
    
    // STRATEGIA SEMPLICE: Cerca ogni nome possibile nel titolo
    // Non importa cosa c'è prima o dopo, se trova VENERE estrae Venere
    for (const possibleName of allPossibleNames) {
        // Usa word boundary per evitare match parziali (es. VENERE in VENEREOLOGIA)
        const regex = new RegExp(`\\b${possibleName}\\b`, 'i');
        if (regex.test(titleUpper)) {
            const properName = possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
            
            // Log per debug
            if (['VENERE', 'DIANA', 'FLORA', 'RUGIADA', 'CAMILLA', 'MARTA'].includes(possibleName)) {
                console.log(`✅ Trovato "${properName}" in: "${originalTitle}"`);
            }
            
            return properName;
        }
    }
    
    // Se non trova nessun nome conosciuto
    console.log(`❌ Nessun nome trovato in: "${originalTitle}"`);
    return null;
}

// Funzione per recuperare TUTTI i prodotti con paginazione
async function fetchAllShopifyProducts(season) {
    const allProducts = [];
    let sinceId = 0;
    let hasMore = true;
    
    console.log(`🔍 Recupero TUTTI i prodotti per stagione ${season}...`);
    
    while (hasMore) {
        try {
            // Usa since_id per paginazione invece di page_info
            const url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&since_id=${sinceId}`;
            
            console.log(`📡 Chiamata API: since_id=${sinceId}`);
            
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.products && data.products.length > 0) {
                allProducts.push(...data.products);
                
                // Prendi l'ID più alto per la prossima pagina
                const lastId = Math.max(...data.products.map(p => p.id));
                sinceId = lastId;
                
                console.log(`📦 Recuperati ${data.products.length} prodotti (totale: ${allProducts.length})`);
                
                // Se abbiamo meno di 250 prodotti, siamo all'ultima pagina
                if (data.products.length < 250) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
            
            // Piccola pausa per non sovraccaricare l'API
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            
        } catch (error) {
            console.error('❌ Errore paginazione:', error.message);
            hasMore = false;
        }
    }
    
    console.log(`📊 Totale prodotti recuperati: ${allProducts.length}`);
    
    // Filtra per stagione
    const filteredProducts = allProducts.filter(product => 
        product.tags && product.tags.includes(season)
    );
    
    console.log(`✅ Prodotti filtrati per tag ${season}: ${filteredProducts.length}`);
    
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
        // Recupera TUTTI i prodotti con paginazione corretta
        const products = await fetchAllShopifyProducts(shopifyTag);
        
        // Estrai nomi da TUTTI i brand
        const names = new Set();
        const brandCount = {};
        const debugExamples = [];
        
        products.forEach(product => {
            const extractedName = extractProductName(product);
            if (extractedName && extractedName.length > 1) {
                names.add(extractedName);
                
                // Salva esempi per debug
                const criticalNames = ['Rubino', 'Rugiada', 'Camilla', 'Marta', 'Marina'];
                if (debugExamples.length < 50 || criticalNames.includes(extractedName)) {
                    debugExamples.push({
                        title: product.title,
                        extracted: extractedName,
                        brand: product.vendor
                    });
                }
                
                // Conta per brand (per debug)
                const brand = product.vendor || 'Unknown';
                brandCount[brand] = (brandCount[brand] || 0) + 1;
            }
        });
        
        const uniqueNames = Array.from(names).sort();
        
        // Log dettagliati con focus su VENERE
        console.log(`\n📊 REPORT ESTRAZIONE NOMI:`);
        console.log(`   Totale prodotti analizzati: ${products.length}`);
        console.log(`   Nomi unici estratti: ${uniqueNames.length}`);
        console.log(`   Prodotti per brand:`, brandCount);
        
        // Verifica nomi specifici (FOCUS SU VENERE)
        const checkNames = ['Rubino', 'Rugiada', 'Camilla', 'Marta', 'Marina', 'Venere', 'Diana', 'Flora', 'Minerva', 'Terra'];
        console.log(`\n🔍 VERIFICA NOMI CRITICI:`);
        checkNames.forEach(name => {
            if (uniqueNames.includes(name)) {
                console.log(`   ✅ ${name} TROVATO nei prodotti`);
                const examples = debugExamples.filter(ex => ex.extracted === name);
                examples.slice(0, 3).forEach(ex => {
                    console.log(`      → "${ex.title}"`);
                });
            } else {
                console.log(`   ❌ ${name} NON TROVATO`);
                // Cerca se esiste nel titolo ma non è stato estratto
                const notExtracted = products.filter(p => p.title.toUpperCase().includes(name.toUpperCase()));
                if (notExtracted.length > 0) {
                    console.log(`      ⚠️ ERRORE ESTRAZIONE! Trovato in ${notExtracted.length} prodotti:`);
                    notExtracted.slice(0, 3).forEach(p => {
                        console.log(`         - "${p.title}"`);
                    });
                }
            }
        });
        
        // Log primi esempi di estrazione
        if (debugExamples.length > 0) {
            console.log(`\n📝 ESEMPI DI ESTRAZIONE (primi 20):`);
            debugExamples.slice(0, 20).forEach(ex => {
                console.log(`   "${ex.title}" → "${ex.extracted}" (${ex.brand})`);
            });
        }
        
        // Log esempi raggruppati per brand
        const brandExamples = {};
        debugExamples.forEach(ex => {
            const brand = ex.brand || 'Unknown';
            if (!brandExamples[brand]) brandExamples[brand] = [];
            if (brandExamples[brand].length < 3) {
                brandExamples[brand].push(ex);
            }
        });
        
        console.log(`\n📦 ESEMPI DI ESTRAZIONE PER BRAND:`);
        Object.entries(brandExamples).forEach(([brand, examples]) => {
            console.log(`\n   ${brand}:`);
            examples.forEach(ex => {
                console.log(`      "${ex.title}" → "${ex.extracted}"`);
            });
        });
        
        res.json({
            success: true,
            names: uniqueNames,
            count: uniqueNames.length,
            totalProducts: products.length,
            shopify_tag: shopifyTag,
            brandBreakdown: brandCount
        });
        
    } catch (error) {
        console.error('❌ Errore recupero prodotti:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante il recupero dei prodotti: ' + error.message
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
        const existingLower = existingNames.map(n => n.toLowerCase().trim());
        
        // Log per debug
        if (existingLower.includes('rubino')) {
            console.log('⚠️ RUBINO è presente nei nomi esistenti da escludere!');
        }
        
        // Filtra il pool escludendo i nomi esistenti (case-insensitive)
        const availableNames = namePool.filter(name => 
            !existingLower.includes(name.toLowerCase().trim())
        );
        
        console.log(`🎲 Pool disponibile: ${availableNames.length} nomi`);
        console.log(`🚫 Esclusi dal pool: ${namePool.length - availableNames.length} duplicati`);
        
        // Verifica specificamente alcuni nomi
        const checkNames = ['Rubino', 'Marina', 'Aurora'];
        checkNames.forEach(name => {
            if (existingLower.includes(name.toLowerCase())) {
                console.log(`   ❌ ${name} escluso (già esistente)`);
            } else if (availableNames.includes(name)) {
                console.log(`   ✅ ${name} disponibile nel pool`);
            }
        });
        
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
        console.error('❌ Errore generazione:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante la generazione dei nomi'
        });
    }
});

// Endpoint di test per verificare estrazione
app.get('/api/test-extraction', async (req, res) => {
    try {
        // Esempi di titoli reali da testare - INCLUSO COMPLETO VENERE
        const testTitles = [
            // Test specifico per VENERE
            'LOFT.73 - COMPLETO VENERE',
            'COMPLETO VENERE',
            'VENERE COMPLETO',
            'ABITO VENERE LOFT73',
            
            // LOFT.73 standard
            'LOFT.73 - PANTALONE RUGIADA',
            'LOFT.73 - ABITO CAMILLA',
            'LOFT.73 - BORSA CAMILLA',
            'LOFT.73 - BORSA MARTA',
            'LOFT.73 - PANTALONE MARINA',
            'LOFT.73 - MAGLIA RUBINO',
            
            // Altri formati
            'ANGELA DAVIS - ABITO STELLA',
            'ANGELA DAVIS - BORSA RUGIADA',
            'PANTALONE AURORA - LOFT73',
            'BORSA LUNA ANGELA DAVIS',
            
            // Test estremi
            'VENERE',
            'xxxVENERExxx',
            'PRODOTTO VENERE SPECIALE',
            'SUPER VENERE DELUXE'
        ];
        
        const results = testTitles.map(title => {
            const mockProduct = { title };
            const extracted = extractProductName(mockProduct);
            return {
                title,
                extracted,
                success: extracted !== null
            };
        });
        
        res.json({
            test: 'Extraction Test - Focus VENERE',
            totalTested: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint di test per verificare nomi per stagione
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
        const brandBreakdown = {};
        
        products.forEach(product => {
            const name = extractProductName(product);
            if (name) {
                names.add(name);
                
                // Conta per brand
                const brand = product.vendor || 'Unknown';
                brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;
                
                if (examples.length < 20) {
                    examples.push({
                        brand: product.vendor,
                        title: product.title,
                        extracted: name
                    });
                }
            }
        });
        
        res.json({
            totalProducts: products.length,
            totalNames: names.size,
            brandBreakdown: brandBreakdown,
            names: Array.from(names).sort(),
            productExamples: examples
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint per verificare nomi specifici
app.get('/api/check-name/:name', async (req, res) => {
    const { name } = req.params;
    const searchName = name.toUpperCase();
    
    try {
        console.log(`🔍 Cerco prodotti con nome: ${name}`);
        
        // Cerca in tutti i prodotti (senza filtro stagione)
        const url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        const found = [];
        
        data.products.forEach(product => {
            if (product.title.toUpperCase().includes(searchName)) {
                found.push({
                    title: product.title,
                    vendor: product.vendor,
                    tags: product.tags
                });
            }
        });
        
        res.json({
            searchedName: name,
            found: found.length > 0,
            count: found.length,
            examples: found.slice(0, 5)
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
