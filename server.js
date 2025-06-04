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

// Funzione UNIVERSALE per estrarre il nome dal titolo prodotto
function extractProductName(product) {
    if (!product.title) return null;
    
    const originalTitle = product.title;
    let title = product.title.toUpperCase().trim();
    
    // Log per debug su alcuni prodotti
    const debugTitles = ['RUGIADA', 'CAMILLA', 'MARTA', 'RUBINO', 'MARINA'];
    const shouldDebug = debugTitles.some(name => title.includes(name));
    
    // Lista completa di tutti i tipi di prodotto
    const productTypes = [
        'PANTALONE', 'MAGLIA', 'CAMICIA', 'GIACCA', 'GONNA', 'VESTITO', 'ABITO', 
        'TOP', 'BLUSA', 'CARDIGAN', 'CAPPOTTO', 'GIUBBOTTO', 'JEANS', 'SHIRT', 
        'DRESS', 'PULLOVER', 'MAGLIONE', 'FELPA', 'SHORTS', 'BERMUDA', 'CANOTTA', 
        'POLO', 'GILET', 'PIUMINO', 'TRENCH', 'BLAZER', 'TUTA', 'LEGGINGS', 
        'JEGGINGS', 'CULOTTE', 'PALAZZO', 'BORSA', 'ZAINO', 'POCHETTE', 'TRACOLLA', 
        'SHOPPING', 'CLUTCH', 'BORSETTA', 'PORTAFOGLIO', 'CINTURA', 'SCIARPA', 
        'CAPPELLO', 'GUANTI', 'FOULARD', 'STOLA', 'PONCHO', 'MANTELLA', 'KIMONO',
        'SALOPETTE', 'JUMPSUIT', 'OVERALL', 'TUTINA', 'BODY', 'CORSETTO', 'BUSTINO',
        'T-SHIRT', 'MAGLIETTA', 'TANK', 'CROP', 'HOODIE', 'SWEATSHIRT', 'GIUBBINO',
        'PARKA', 'BOMBER', 'CHIODO', 'MONTGOMERY', 'PEACOAT', 'SPOLVERINO', 'IMPERMEABILE',
        'K-WAY', 'WINDBREAKER', 'SOFTSHELL', 'PILE', 'FLEECE', 'MAXI', 'MINI', 'MIDI'
    ];
    
    // Pattern UNIVERSALE: "QUALSIASI_BRAND - TIPO NOME"
    // Funziona per LOFT.73, ANGELA DAVIS, ANTONY MORATO, etc.
    const universalPattern = new RegExp(
        `^[^-–]+[-–]\\s*(?:${productTypes.join('|')})\\s+([A-Z]+)(?:\\s|$|-|,|\\.|;)`, 
        'i'
    );
    
    const universalMatch = title.match(universalPattern);
    if (universalMatch && universalMatch[1]) {
        const name = universalMatch[1];
        // Verifica che non sia un codice o una parola comune
        if (name.length >= 3 && name.length <= 20 && !/\d/.test(name)) {
            const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            if (shouldDebug) {
                console.log(`🎯 Universal Pattern: "${originalTitle}" → "${properName}"`);
            // Log esempi raggruppati per brand
        const brandExamples = {};
        debugExamples.forEach(ex => {
            const brand = ex.brand || 'Unknown';
            if (!brandExamples[brand]) brandExamples[brand] = [];
            if (brandExamples[brand].length < 3) { // Max 3 esempi per brand
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
            
            return properName;
        }
    }
    
    // Pattern secondario: cerca tipo prodotto seguito da nome OVUNQUE nel titolo
    const secondaryPattern = new RegExp(
        `(?:${productTypes.join('|')})\\s+([A-Z]{3,20})(?:\\s|$|-|,|\\.|;)`, 
        'i'
    );
    
    const secondaryMatch = title.match(secondaryPattern);
    if (secondaryMatch && secondaryMatch[1]) {
        const name = secondaryMatch[1];
        if (!/\d/.test(name) && !['CON', 'THE', 'AND', 'FOR', 'WITH', 'NEW', 'OLD'].includes(name)) {
            const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            if (shouldDebug) {
                console.log(`🎯 Secondary Pattern: "${originalTitle}" → "${properName}"`);
            }
            
            return properName;
        }
    }
    
    // Pattern per formati alternativi: "TIPO NOME - BRAND" o simili
    const parts = title.split(/[-–]/);
    for (const part of parts) {
        const trimmedPart = part.trim();
        // Cerca in ogni parte del titolo
        const partMatch = trimmedPart.match(new RegExp(`(?:${productTypes.join('|')})\\s+([A-Z]{3,20})(?:\\s|$)`, 'i'));
        if (partMatch && partMatch[1]) {
            const name = partMatch[1];
            if (!/\d/.test(name)) {
                const properName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                
                if (shouldDebug) {
                    console.log(`🎯 Part Pattern: "${originalTitle}" → "${properName}" (from part: "${trimmedPart}")`);
                }
                
                return properName;
            }
        }
    }
    
    // Ultimo tentativo: se il titolo contiene una parola che sappiamo essere un nome
    const knownNames = [
        'RUBINO', 'MARINA', 'AURORA', 'LUNA', 'STELLA', 'ALBA', 'CHIARA', 'SERENA',
        'ELENA', 'SOFIA', 'GIULIA', 'MARTINA', 'GIORGIA', 'SARA', 'EMMA', 'GRETA',
        'MARTA', 'ANNA', 'FRANCESCA', 'VALENTINA', 'ALESSIA', 'VIOLA', 'BIANCA',
        'GINEVRA', 'BEATRICE', 'REBECCA', 'GAIA', 'ARIANNA', 'CAMILLA', 'ELISA',
        'ALICE', 'CARLOTTA', 'MATILDE', 'VITTORIA', 'NOEMI', 'NICOLE', 'ROSA',
        'IRIS', 'DALIA', 'ORCHIDEA', 'MIMOSA', 'GARDENIA', 'CAMELIA', 'AZALEA',
        'MAGNOLIA', 'PEONIA', 'LAVANDA', 'PERLA', 'AMBRA', 'GIADA', 'OPALE',
        'ZAFFIRO', 'CORALLO', 'CRISTALLO', 'DIAMANTE', 'SMERALDO', 'TURCHESE',
        'RUGIADA', 'NEBBIA', 'PIOGGIA', 'NEVE', 'BRINA', 'TEMPESTA', 'ONDA',
        'MAREA', 'SCHIUMA', 'CONCHIGLIA', 'SABBIA', 'ARIA', 'BREZZA', 'CIELO'
    ];
    
    // Cerca nomi conosciuti nel titolo
    for (const knownName of knownNames) {
        if (title.includes(knownName)) {
            const properName = knownName.charAt(0).toUpperCase() + knownName.slice(1).toLowerCase();
            
            if (shouldDebug) {
                console.log(`🎯 Known Name Found: "${originalTitle}" → "${properName}"`);
            }
            
            return properName;
        }
    }
    
    if (shouldDebug) {
        console.log(`❌ No match for: "${originalTitle}"`);
    }
    
    return null;
}

// Funzione CORRETTA per recuperare TUTTI i prodotti con paginazione
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
                
                // Salva esempi per debug (specialmente RUBINO, RUGIADA, CAMILLA, MARTA)
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
        
        console.log(`📊 Estratti ${uniqueNames.length} nomi unici da ${products.length} prodotti`);
        console.log('🏷️ Prodotti per brand:', brandCount);
        
        // Log specifico per RUBINO
        if (uniqueNames.includes('Rubino')) {
            console.log('⚠️ TROVATO RUBINO nei prodotti esistenti!');
            const rubinoExample = debugExamples.find(ex => ex.extracted === 'Rubino');
            if (rubinoExample) {
                console.log('📍 Esempio prodotto RUBINO:', rubinoExample);
            }
        }
        
        // Log alcuni esempi per debug
        console.log('\n📝 Primi 10 esempi di estrazione:');
        debugExamples.slice(0, 10).forEach(ex => {
            console.log(`  "${ex.title}" → "${ex.extracted}" (${ex.brand})`);
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

// Endpoint di test (opzionale ma utile)
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

// Endpoint di test migliorato con più dettagli
app.get('/api/test-extraction', async (req, res) => {
    try {
        // Esempi di titoli reali da testare - MULTI BRAND
        const testTitles = [
            // LOFT.73
            'LOFT.73 - PANTALONE RUGIADA',
            'LOFT.73 - ABITO CAMILLA',
            'LOFT.73 - BORSA CAMILLA',
            'LOFT.73 - BORSA MARTA',
            'LOFT.73 - PANTALONE MARINA',
            'LOFT.73 - MAGLIA RUBINO',
            
            // ALTRI BRAND - stesso formato
            'ANGELA DAVIS - ABITO STELLA',
            'ANGELA DAVIS - BORSA RUGIADA',
            'ANGELA DAVIS - PANTALONE SOFIA',
            'ANTONY MORATO - MAGLIA MARCO',
            'ANTONY MORATO - GIACCA ALESSANDRO',
            'GUESS - VESTITO AURORA',
            'FRACOMINA - GONNA LUNA',
            'ONLY - JEANS SARA',
            'DIXIE - TOP VIOLA',
            'PLEASE - PANTALONE GIADA',
            'IMPERIAL - CAMICIA PERLA',
            'SURKANA - CARDIGAN AMBRA',
            'MOTEL - ABITO IRIS',
            'WHITE WISE - BLUSA ROSA',
            
            // Formati alternativi
            'PANTALONE AURORA - LOFT73',
            'BORSA LUNA ANGELA DAVIS',
            'MAGLIA STELLA ANTONY MORATO'
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
        
        // Raggruppa per brand
        const byBrand = {};
        results.forEach(r => {
            const brand = r.title.split(/[-–]/)[0].trim();
            if (!byBrand[brand]) byBrand[brand] = [];
            byBrand[brand].push(r);
        });
        
        res.json({
            test: 'Multi-Brand Extraction Test',
            totalTested: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            byBrand,
            allResults: results
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
