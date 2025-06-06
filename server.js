const express = require('express');
const cors = require('cors');

// Polyfill per fetch se necessario (Node < 18)
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

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

// Cache per memorizzare i nomi già usati (per sessione)
let usedNamesCache = new Set();
let allUsedNames = []; // Array per tenere traccia storica
let historicalNamesCache = {}; // Cache per nomi storici per stagione

// Cache Shopify con TTL
let shopifyCache = {
    data: {},
    timestamps: {},
    TTL: 5 * 60 * 1000 // 5 minuti di cache
};

// Helper functions per la cache
function getCachedProducts(seasonTag) {
    const cacheKey = seasonTag || 'all';
    const cached = shopifyCache.data[cacheKey];
    const timestamp = shopifyCache.timestamps[cacheKey];
    
    if (cached && timestamp && (Date.now() - timestamp < shopifyCache.TTL)) {
        console.log(`📦 Usando cache per ${cacheKey} (${cached.length} prodotti)`);
        return cached;
    }
    
    return null;
}

function setCachedProducts(seasonTag, products) {
    const cacheKey = seasonTag || 'all';
    shopifyCache.data[cacheKey] = products;
    shopifyCache.timestamps[cacheKey] = Date.now();
}

// POOL DI NOMI AGGIORNATO - 5000 nomi
const namePool = {
    // CITTÀ ITALIANE (200+)
    cities: [
        // Sicilia
        'Palermo', 'Catania', 'Messina', 'Siracusa', 'Trapani', 'Marsala', 'Gela', 'Ragusa', 
        'Modica', 'Vittoria', 'Caltanissetta', 'Agrigento', 'Enna', 'Taormina', 'Cefalù',
        'Noto', 'Sciacca', 'Mazara', 'Alcamo', 'Bagheria', 'Monreale', 'Avola', 'Augusta',
        'Milazzo', 'Barcellona', 'Licata', 'Favara', 'Acireale', 'Paternò', 'Misterbianco',
        'Caltagirone', 'Canicattì', 'Vittoria', 'Niscemi',
        
        // Nord Italia
        'Milano', 'Torino', 'Genova', 'Venezia', 'Verona', 'Padova', 'Trieste', 'Brescia',
        'Bergamo', 'Como', 'Varese', 'Monza', 'Parma', 'Modena', 'Ferrara', 'Ravenna',
        'Bologna', 'Rimini', 'Piacenza', 'Alessandria', 'Asti', 'Novara', 'Vercelli',
        'Mantova', 'Cremona', 'Pavia', 'Lodi', 'Lecco', 'Sondrio', 'Savona', 'Imperia',
        'Biella', 'Cuneo', 'Verbania', 'Vigevano', 'Legnano', 'Rho', 'Sesto', 'Cinisello',
        'Busto', 'Gallarate', 'Rozzano', 'Cologno', 'Seregno', 'Desio', 'Cantu', 'Lissone',
        
        // Centro Italia
        'Roma', 'Firenze', 'Pisa', 'Lucca', 'Siena', 'Arezzo', 'Livorno', 'Grosseto',
        'Prato', 'Pistoia', 'Perugia', 'Terni', 'Ancona', 'Pesaro', 'Macerata', 'Fermo',
        'Ascoli', 'Viterbo', 'Rieti', 'Latina', 'Frosinone', 'Chieti', 'Pescara', 'Teramo',
        'Massa', 'Carrara', 'Viareggio', 'Empoli', 'Scandicci', 'Campi', 'Capannori',
        'Foligno', 'Spoleto', 'Gubbio', 'Assisi', 'Orvieto', 'Narni',
        
        // Sud Italia
        'Napoli', 'Bari', 'Taranto', 'Foggia', 'Salerno', 'Lecce', 'Brindisi', 'Andria',
        'Barletta', 'Trani', 'Potenza', 'Matera', 'Cosenza', 'Reggio', 'Catanzaro',
        'Crotone', 'Vibo', 'Benevento', 'Avellino', 'Caserta', 'Sassari', 'Cagliari',
        'Nuoro', 'Oristano', 'Olbia', 'Alghero', 'Aosta', 'Trento', 'Bolzano', 'Udine',
        'Pordenone', 'Gorizia', 'Monfalcone', 'Muggia', 'Codroipo', 'Sacile', 'Spilimbergo',
        'Pozzuoli', 'Casoria', 'Afragola', 'Marano', 'Acerra', 'Giugliano',
        'Cava', 'Battipaglia', 'Nocera', 'Sarno', 'Angri', 'Scafati', 'Castellammare'
    ],
    
    // ANIMALI (250+)
    animals: [
        // Mammiferi terrestri
        'Leone', 'Tigre', 'Pantera', 'Leopardo', 'Ghepardo', 'Giaguaro', 'Puma', 'Lince',
        'Lupo', 'Volpe', 'Orso', 'Panda', 'Koala', 'Canguro', 'Elefante', 'Giraffa',
        'Zebra', 'Cavallo', 'Asino', 'Mulo', 'Cervo', 'Daino', 'Alce', 'Renna',
        'Gazzella', 'Antilope', 'Bufalo', 'Bisonte', 'Toro', 'Mucca', 'Pecora', 'Capra',
        'Maiale', 'Cinghiale', 'Coniglio', 'Lepre', 'Scoiattolo', 'Castoro', 'Lontra',
        'Procione', 'Tasso', 'Puzzola', 'Ermellino', 'Donnola', 'Furetto', 'Visone',
        'Riccio', 'Istrice', 'Armadillo', 'Bradipo', 'Formichiere', 'Ornitorinco',
        'Cammello', 'Dromedario', 'Lama', 'Alpaca', 'Vigogna',
        'Ippopotamo', 'Rinoceronte', 'Tapiro', 'Okapi',
        
        // Mammiferi marini
        'Balena', 'Orca', 'Delfino', 'Focena', 'Beluga', 'Narvalo', 'Capodoglio', 'Megattera',
        'Foca', 'Otaria', 'Tricheco', 'Lamantino', 'Dugongo',
        
        // Uccelli
        'Aquila', 'Falco', 'Poiana', 'Nibbio', 'Astore', 'Sparviero', 'Gheppio', 'Pellegrino',
        'Gufo', 'Civetta', 'Barbagianni', 'Allocco', 'Assiolo', 'Upupa',
        'Gruccione', 'Ghiandaia', 'Cornacchia', 'Corvo', 'Gazza', 'Taccola',
        'Picchio', 'Pettirosso', 'Rondine', 'Passero', 'Cardellino', 'Verdone', 'Fringuello',
        'Canarino', 'Usignolo', 'Merlo', 'Tordo', 'Allodola', 'Cappellaccia',
        'Cinciallegra', 'Cinciarella', 'Codirosso', 'Pigliamosche',
        'Capinera', 'Storno', 'Rigogolo', 'Averla', 'Pendolino',
        'Colibrì', 'Pappagallo', 'Ara', 'Cacatua', 'Calopsitte', 'Inseparabile',
        'Pavone', 'Fagiano', 'Pernice', 'Quaglia', 'Francolino',
        'Colomba', 'Piccione', 'Tortora', 'Colombaccio', 'Cuculo', 'Cucù',
        'Gabbiano', 'Albatro', 'Procellaria', 'Sula', 'Pellicano', 'Cormorano', 'Marangone',
        'Airone', 'Garzetta', 'Nitticora', 'Tarabuso', 'Cicogna', 'Ibis', 'Spatola',
        'Fenicottero', 'Cigno', 'Oca', 'Anatra', 'Germano', 'Marzaiola', 'Mestolone',
        'Folaga', 'Gallinella', 'Porciglione', 'Gru', 'Otarda',
        'Struzzo', 'Emù', 'Nandù', 'Casuario', 'Kiwi', 'Pinguino',
        
        // Rettili e anfibi
        'Serpente', 'Vipera', 'Biscia', 'Boa', 'Pitone', 'Anaconda', 'Cobra',
        'Lucertola', 'Geco', 'Iguana', 'Camaleonte', 'Varano', 'Drago', 'Basilisco',
        'Coccodrillo', 'Alligatore', 'Caimano', 'Tartaruga', 'Testuggine',
        'Rana', 'Rospo', 'Raganella', 'Tritone', 'Salamandra',
        
        // Pesci
        'Squalo', 'Razza', 'Manta', 'Murena', 'Anguilla', 'Cernia', 'Branzino', 'Orata',
        'Sogliola', 'Rombo', 'Merluzzo', 'Tonno', 'Marlin', 'Sgombro',
        'Acciuga', 'Sardina', 'Aringa', 'Salmone', 'Trota', 'Carpa', 'Luccio', 'Persico',
        'Piranha', 'Barracuda', 'Cavalluccio',
        
        // Insetti e artropodi
        'Farfalla', 'Monarca', 'Vanessa', 'Macaone', 'Aurora',
        'Falena', 'Libellula', 'Damigella',
        'Ape', 'Bombo', 'Vespa', 'Calabrone', 'Formica', 'Cicala', 'Grillo',
        'Cavalletta', 'Locusta', 'Mantide', 'Coccinella', 'Lucciola',
        'Ragno', 'Tarantola', 'Scorpione',
        'Granchio', 'Aragosta', 'Gambero', 'Scampo', 'Astice'
    ],
    
    // NATURA E GEOGRAFIA (320+)
    nature: [
        // Monti e cime famose
        'Etna', 'Vesuvio', 'Stromboli', 'Vulcano', 'Monviso', 'Cervino', 'Rosa',
        'Bianco', 'Adamello', 'Ortles', 'Bernina', 'Dolomiti', 'Marmolada', 'Pelmo',
        'Civetta', 'Antelao', 'Cristallo', 'Sorapis', 'Tofana', 'Lagazuoi', 'Averau',
        'Nuvolau', 'Croda', 'Sassolungo', 'Catinaccio',
        'Latemar', 'Sciliar', 'Rosengarten', 'Majella', 'Velino', 'Sirente', 'Terminillo',
        'Vettore', 'Sibillini', 'Nerone', 'Catria', 'Fumaiolo', 'Falterona', 'Amiata',
        'Argentario', 'Conero', 'Gargano', 'Pollino', 'Sila', 'Aspromonte', 'Serre',
        'Nebrodi', 'Madonie', 'Peloritani', 'Erei', 'Iblei', 'Sicani', 'Gennargentu',
        'Limbara', 'Supramonte', 'Prealpi', 'Appennini',
        
        // Mari e oceani
        'Adriatico', 'Tirreno', 'Ionio', 'Ligure', 'Mediterraneo', 'Atlantico', 'Pacifico',
        'Indiano', 'Artico', 'Antartico', 'Baltico', 'Nero', 'Caspio', 'Arabico', 'Rosso',
        
        // Laghi italiani
        'Garda', 'Como', 'Maggiore', 'Trasimeno', 'Bolsena', 'Bracciano', 'Iseo', 'Orta',
        'Lugano', 'Varese', 'Vico', 'Albano', 'Nemi', 'Averno', 'Fusaro', 'Lesina',
        'Varano', 'Massaciuccoli', 'Chiusi', 'Montepulciano', 'Corbara', 'Piediluco',
        'Scanno', 'Barrea', 'Campotosto', 'Bomba', 'Fiastra', 'Pilato', 'Cavedine',
        'Caldonazzo', 'Levico', 'Molveno', 'Tovel', 'Carezza', 'Braies', 'Dobbiaco',
        'Misurina', 'Alleghe', 'Fedaia', 'Cadore', 'Sauris', 'Barcis',
        'Cavazzo', 'Ragogna', 'Cornino', 'Redona', 'Ledro', 'Idro', 'Valvestino',
        
        // Fiumi italiani
        'Tevere', 'Arno', 'Adige', 'Po', 'Brenta', 'Piave', 'Tagliamento', 'Isonzo',
        'Livenza', 'Sile', 'Bacchiglione', 'Adda', 'Oglio', 'Mincio', 'Chiese', 'Ticino',
        'Sesia', 'Tanaro', 'Bormida', 'Scrivia', 'Trebbia', 'Taro', 'Parma', 'Enza',
        'Secchia', 'Panaro', 'Reno', 'Santerno', 'Lamone', 'Montone', 'Ronco', 'Savio',
        'Marecchia', 'Conca', 'Foglia', 'Metauro', 'Cesano', 'Misa', 'Esino', 'Musone',
        'Potenza', 'Chienti', 'Tenna', 'Aso', 'Tronto', 'Vomano', 'Pescara', 'Sangro',
        'Trigno', 'Biferno', 'Fortore', 'Ofanto', 'Volturno', 'Garigliano', 'Liri',
        'Sacco', 'Aniene', 'Velino', 'Nera', 'Turano', 'Salto', 'Ombrone', 'Serchio',
        'Cecina', 'Cornia', 'Pecora', 'Albegna', 'Fiora', 'Orcia', 'Paglia', 'Chiana',
        
        // Isole italiane
        'Sicilia', 'Sardegna', 'Elba', 'Capri', 'Ischia', 'Procida', 'Ponza', 'Ventotene',
        'Lipari', 'Salina', 'Panarea', 'Stromboli', 'Vulcano', 'Alicudi',
        'Filicudi', 'Ustica', 'Favignana', 'Levanzo', 'Marettimo', 'Pantelleria', 'Lampedusa',
        'Linosa', 'Lampione', 'Giglio', 'Giannutri', 'Montecristo', 'Pianosa', 'Gorgona',
        'Capraia', 'Palmaria', 'Tino', 'Tinetto', 'Gallinara', 'Bergeggi', 'Asinara',
        'Maddalena', 'Caprera', 'Spargi',
        'Budelli', 'Razzoli', 'Tavolara', 'Molara',
        
        // Venti mediterranei
        'Maestrale', 'Tramontana', 'Grecale', 'Levante', 'Scirocco', 'Libeccio', 'Ponente',
        'Ostro', 'Bora', 'Garbino', 'Zefiro', 'Aliseo', 'Brezza',
        
        // Fenomeni naturali
        'Aurora', 'Alba', 'Tramonto', 'Crepuscolo', 'Eclissi', 'Cometa', 'Meteora',
        'Arcobaleno', 'Miraggio',
        'Nebbia', 'Foschia', 'Caligine', 'Brina', 'Rugiada', 'Galaverna',
        'Neve', 'Grandine', 'Pioggia', 'Temporale', 'Fulmine', 'Tuono', 'Lampo', 'Saetta',
        'Nevischio', 'Tormenta', 'Bufera', 'Valanga', 'Slavina', 'Frana', 'Terremoto',
        'Maremoto', 'Tsunami', 'Eruzione', 'Geyser', 'Fumarola',
        'Marea', 'Corrente', 'Risacca', 'Bonaccia', 'Tempesta',
        
        // Valli e passi italiani (NUOVI - 20)
        'Valsesia', 'Valsassina', 'Valcamonica', 'Valtellina', 'Valdaosta', 'Valdarno',
        'Valdelsa', 'Valdera', 'Valdinievole', 'Valdichiana', 'Valnure', 'Valtrebbia',
        'Passo Stelvio', 'Passo Gavia', 'Passo Mortirolo', 'Passo Tonale', 'Passo Aprica',
        'Passo Bernina', 'Passo Maloja', 'Passo Sempione'
    ],
    
    // PIETRE E MINERALI (150+)
    stones: [
        // Pietre preziose
        'Diamante', 'Rubino', 'Zaffiro', 'Smeraldo', 'Topazio', 'Ametista', 'Acquamarina',
        'Berillo', 'Opale', 'Turchese', 'Perla', 'Ambra',
        'Corallo', 'Giada', 'Lapislazzuli', 'Malachite', 'Tormalina', 'Granato', 'Peridoto',
        'Tanzanite', 'Zircone', 'Spinello',
        
        // Pietre semipreziose comuni
        'Agata', 'Onice', 'Corniola', 'Calcedonio', 'Quarzo', 'Cristallo', 'Citrino',
        'Ametrina', 'Avventurina', 'Diaspro', 'Ossidiana', 'Rodonite',
        'Rodocrosite', 'Sodalite', 'Labradorite', 'Fluorite', 'Celestina', 'Angelite', 'Selenite',
        'Crisocolla', 'Crisoprasio', 'Amazzonite',
        
        // Minerali e rocce famosi
        'Pirite', 'Galena', 'Azzurrite',
        'Olivina', 'Ematite', 'Magnetite',
        'Barite', 'Gesso',
        
        // Rocce ornamentali
        'Marmo', 'Granito', 'Porfido', 'Travertino', 'Ardesia', 'Basalto',
        'Serpentino', 'Gneiss', 'Scisto',
        'Quarzite', 'Arenaria', 'Calcare', 'Dolomia', 'Alabastro', 'Pomice',
        'Tufo', 'Pozzolana', 'Peperino'
    ],
    
    // FIORI E PIANTE (365+)
    flowers: [
        // Fiori comuni
        'Rosa', 'Giglio', 'Tulipano', 'Orchidea', 'Iris', 'Dalia', 'Peonia', 'Camelia',
        'Gardenia', 'Magnolia', 'Gelsomino', 'Lavanda', 'Lillà', 'Glicine', 'Mimosa',
        'Ginestra', 'Oleandro', 'Azalea', 'Rododendro', 'Ortensia', 'Margherita', 'Girasole',
        'Papavero', 'Fiordaliso', 'Ranuncolo', 'Anemone', 'Garofano', 'Viola', 'Primula',
        'Giacinto', 'Narciso', 'Fresia', 'Calla', 'Gerbera', 'Zinnia', 'Calendula',
        'Tagete', 'Verbena', 'Petunia', 'Begonia', 'Ciclamino', 'Geranio', 'Pelargonio',
        'Surfinia', 'Impatiens', 'Pervinca', 'Digitale',
        'Aquilegia', 'Campanula', 'Malva', 'Altea', 'Ibisco', 'Buganvillea', 'Fucsia',
        'Lantana', 'Plumbago', 'Passiflora', 'Clematide', 'Caprifoglio',
        'Dipladenia', 'Allamanda', 'Bignonia', 'Cobea',
        'Ipomea', 'Convolvolo', 'Nasturzio', 'Elicriso', 'Statice',
        'Gypsophila', 'Aster', 'Crisantemo', 'Rudbeckia', 'Echinacea', 'Cosmea',
        'Astilbe', 'Hosta', 'Hemerocallis', 'Agapanto', 'Alstroemeria', 'Amaryllis',
        'Clivia', 'Nerine', 'Croco', 'Bucaneve', 'Mughetto', 'Elleboro',
        'Bergenia', 'Sedum', 'Sempervivum', 'Saxifraga', 'Aubretia', 'Arabis', 'Alyssum',
        'Phlox', 'Dianthus', 'Armeria', 'Cerastium', 'Saponaria', 'Silene',
        
        // Fiori selvatici italiani
        'Tarassaco', 'Trifoglio', 'Veccia', 'Lupinella',
        'Sulla', 'Ginestrino', 'Meliloto', 'Cicoria', 'Radicchio', 'Cardo',
        'Centaurea', 'Achillea', 'Tanaceto', 'Artemisia', 'Camomilla', 'Matricaria',
        'Bellis', 'Pratolina', 'Speronella',
        'Violetta', 'Mammola', 'Veronica', 'Salvia', 'Ajuga',
        'Prunella', 'Betonica', 'Stachys', 'Lamio', 'Ballota',
        'Mentuccia', 'Nepeta', 'Melissa', 'Clinopodio', 'Issopo', 'Santoreggia', 'Serpillo',
        
        // Alberi e arbusti comuni
        'Quercia', 'Rovere', 'Farnia', 'Cerro', 'Leccio', 'Sughera', 'Roverella', 'Faggio',
        'Castagno', 'Noce', 'Nocciolo', 'Betulla', 'Pioppo', 'Salice', 'Ontano', 'Olmo',
        'Bagolaro', 'Platano', 'Tiglio', 'Acero', 'Frassino', 'Orniello', 'Carpino',
        'Robinia', 'Ippocastano', 'Catalpa', 'Paulonia', 'Sofora', 'Albizzia', 'Cercis',
        'Maggiociondolo', 'Laburno', 'Sorbo', 'Biancospino', 'Prugnolo', 'Ciliegio',
        'Pesco', 'Albicocco', 'Susino', 'Mandorlo', 'Melo', 'Pero', 'Cotogno', 'Nespolo',
        'Giuggiolo', 'Azzeruolo', 'Melograno', 'Fico', 'Gelso', 'Kaki', 'Corbezzolo',
        'Mirto', 'Alloro', 'Lentisco', 'Terebinto', 'Carrubo', 'Olivastro', 'Fillirea',
        'Alaterno', 'Ilatro', 'Bosso', 'Ligustro', 'Evonimo', 'Viburno', 'Sambuco',
        'Lonicera', 'Weigela', 'Deutzia', 'Filadelfo', 'Spirea', 'Kerria',
        'Cotoneaster', 'Piracanta', 'Fotinia', 'Nandina', 'Aucuba', 'Skimmia', 'Pieris',
        'Corniolo', 'Cornus', 'Forsizia', 'Calicanto', 'Amamelide', 'Edgeworthia',
        
        // Conifere
        'Pino', 'Abete', 'Larice', 'Cedro', 'Cipresso', 'Tasso', 'Ginepro', 'Tuia',
        'Sequoia', 'Metasequoia', 'Ginkgo', 'Araucaria', 'Criptomeria', 'Cunninghamia',
        'Tsuga', 'Picea',
        
        // Piante aromatiche
        'Basilico', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana', 'Menta',
        'Melissa', 'Cedrina', 'Verbena', 'Citronella', 'Santolina',
        'Prezzemolo', 'Coriandolo', 'Aneto', 'Finocchio', 'Anice', 'Cumino',
        'Dragoncello', 'Cerfoglio', 'Levistico', 'Sedano', 'Aglio',
        'Scalogno', 'Porro', 'Zafferano', 'Zenzero', 'Curcuma', 'Cardamomo', 'Pepe',
        'Peperoncino', 'Paprika', 'Rafano', 'Senape', 'Cappero',
        
        // Fiori rari e poetici (NUOVI - 15)
        'Nontiscordardime', 'Fiordilegno', 'Fiordicuculo', 'Fiordilatte', 'Fiordimare',
        'Genzianella', 'Soldanella', 'Globularia', 'Drosera', 'Pinguicola', 'Utricularia',
        'Sarracenia', 'Dionea', 'Nepenthes', 'Aldrovanda'
    ],
    
    // CONCETTI POSITIVI (165+)
    concepts: [
        // Emozioni positive
        'Gioia', 'Letizia', 'Allegria', 'Felicità',
        'Amore', 'Affetto', 'Tenerezza', 'Dolcezza', 'Passione', 'Ardore',
        'Estasi', 'Incanto', 'Fascino', 'Magia', 'Stupore', 'Meraviglia',
        'Grazia', 'Eleganza', 'Raffinatezza', 'Finezza', 'Delicatezza',
        'Serenità', 'Pace', 'Calma', 'Quiete', 'Tranquillità',
        'Armonia', 'Equilibrio', 'Concordia', 'Sintonia', 'Accordo', 'Intesa', 'Unione',
        'Speranza', 'Fiducia', 'Fede', 'Certezza', 'Sicurezza', 'Costanza',
        'Mistero', 'Enigma', 'Arcano', 'Segreto',
        'Sogno', 'Fantasia', 'Immaginazione', 'Visione', 'Illusione', 'Chimera', 'Utopia',
        'Desiderio', 'Aspirazione', 'Ambizione',
        'Nostalgia', 'Rimpianto', 'Melanconia',
        'Coraggio', 'Audacia', 'Valore', 'Eroismo',
        
        // Qualità positive
        'Bellezza', 'Splendore', 'Magnificenza', 'Grandezza',
        'Nobiltà', 'Dignità', 'Decoro', 'Onore', 'Gloria', 'Fama',
        'Purezza', 'Innocenza', 'Candore', 'Umiltà',
        'Semplicità',
        'Gentilezza', 'Cortesia', 'Garbo',
        'Bontà', 'Benevolenza', 'Clemenza', 'Pietà', 'Compassione', 'Misericordia',
        'Generosità', 'Altruismo',
        'Giustizia', 'Equità', 'Integrità', 'Onestà', 'Sincerità',
        'Lealtà', 'Fedeltà', 'Devozione', 'Dedizione',
        'Saggezza', 'Sapienza', 'Prudenza',
        'Intelligenza', 'Ingegno', 'Acume',
        'Pazienza', 'Tolleranza', 'Perseveranza', 'Tenacia',
        'Fortezza', 'Forza', 'Vigore', 'Potenza',
        
        // Tempo e momenti
        'Aurora', 'Mattino', 'Mezzogiorno',
        'Pomeriggio', 'Vespro', 'Sera', 'Imbrunire', 'Tramonto',
        'Notte', 'Mezzanotte',
        'Primavera', 'Estate', 'Autunno', 'Inverno',
        'Eternità', 'Infinito', 'Perpetuo', 'Perenne', 'Immortale', 'Eterno',
        'Passato', 'Presente', 'Futuro', 'Ieri', 'Oggi', 'Domani', 'Sempre',
        
        // Concetti poetici e filosofici (NUOVI - 15)
        'Euforia', 'Epifania', 'Apoteosi', 'Catarsi', 'Nemesi', 'Hybris', 'Pathos',
        'Ethos', 'Logos', 'Kairos', 'Sophrosyne', 'Eudaimonia', 'Ataraxia', 'Aponia', 'Hedone'
    ],
    
    // NOMI FEMMINILI ITALIANI (400+)
    femaleNames: [
        // Nomi tradizionali più comuni
        'Agnese', 'Alba', 'Alessandra', 'Alessia', 'Alice', 'Amelia', 'Anna', 'Antonella',
        'Arianna', 'Asia', 'Aurora', 'Barbara', 'Beatrice', 'Benedetta', 'Bianca', 'Camilla',
        'Carla', 'Carlotta', 'Caterina', 'Cecilia', 'Chiara', 'Claudia', 'Cristina',
        'Daniela', 'Daria', 'Debora', 'Diana', 'Elena', 'Eleonora', 'Elisa', 'Elisabetta',
        'Emanuela', 'Emma', 'Erica', 'Erika', 'Federica', 'Fernanda', 'Flavia', 'Francesca',
        'Gabriella', 'Gaia', 'Gemma', 'Giada', 'Ginevra', 'Giorgia', 'Giovanna', 'Giulia',
        'Gloria', 'Grazia', 'Greta', 'Ilaria', 'Irene', 'Isabella', 'Jessica', 'Laura',
        'Lavinia', 'Letizia', 'Lidia', 'Liliana', 'Linda', 'Lisa', 'Livia', 'Lorena',
        'Loretta', 'Luana', 'Lucia', 'Luciana', 'Ludovica', 'Luisa', 'Luna', 'Mara',
        'Marcella', 'Margherita', 'Maria', 'Marianna', 'Marina', 'Marisa', 'Marta',
        'Martina', 'Matilde', 'Melania', 'Melissa', 'Michela', 'Milena', 'Miriam',
        'Monica', 'Nadia', 'Natalia', 'Nicole', 'Noemi', 'Olga', 'Olimpia', 'Paola',
        'Patrizia', 'Penelope', 'Petra', 'Rachele', 'Rebecca', 'Regina', 'Renata',
        'Rita', 'Roberta', 'Rosa', 'Rosanna', 'Rossella', 'Sabrina', 'Samantha', 'Sandra',
        'Sara', 'Serena', 'Silvia', 'Simona', 'Sofia', 'Sonia', 'Stefania', 'Stella',
        'Susanna', 'Teresa', 'Tiziana', 'Valentina', 'Valeria', 'Vanessa', 'Vera',
        'Veronica', 'Viola', 'Virginia', 'Vittoria', 'Viviana', 'Ylenia', 'Zaira', 'Zoe',
        
        // Nomi classici eleganti
        'Adelaide', 'Adele', 'Adriana', 'Agata', 'Alberta', 'Alda',
        'Allegra', 'Alma', 'Amalia', 'Amanda', 'Ambra', 'Anastasia', 'Andrea',
        'Angela', 'Angelica', 'Angelina', 'Anita', 'Annalisa', 'Annamaria',
        'Antonia', 'Apollonia', 'Arabella', 'Armida', 'Artemisia', 'Assunta', 'Astrid',
        'Augusta', 'Aurelia', 'Azzurra', 'Brigida', 'Bruna', 'Brunella',
        'Camelia', 'Candida', 'Carmela', 'Carmen', 'Carola', 'Carolina', 'Cassandra',
        'Catia', 'Celeste', 'Cesira', 'Cinzia', 'Clara', 'Clarissa', 'Clelia', 'Clementina',
        'Cleopatra', 'Colomba', 'Concetta', 'Consolata', 'Corinna', 'Cornelia', 'Cosima',
        'Costanza', 'Cristiana', 'Dalila', 'Dafne', 'Dalia', 'Damiana', 'Danila', 'Delia',
        'Desdemona', 'Diamante', 'Diletta', 'Dina', 'Dionisia', 'Dora', 'Doris', 'Doriana',
        'Edda', 'Edmea', 'Edvige', 'Elda', 'Elettra', 'Eliana', 'Elide', 'Elma', 'Eloisa',
        'Elvira', 'Emilia', 'Enrichetta', 'Enrica', 'Erminia', 'Ernesta', 'Ersilia',
        'Ester', 'Eugenia', 'Eulalia', 'Eva', 'Evelina', 'Fabiana', 'Fabiola', 'Fausta',
        'Felicia', 'Fiamma', 'Filomena', 'Fiorella', 'Fiorenza',
        'Flora', 'Floriana', 'Fortunata', 'Fosca', 'Franca', 'Fulvia', 'Gabriela',
        'Gaetana', 'Gelsomina', 'Germana', 'Giacinta',
        'Gianna', 'Gigliola', 'Gilda', 'Gioconda', 'Giordana', 'Gisella',
        'Giuditta', 'Giuliana', 'Giuseppa', 'Giuseppina', 'Glenda',
        'Guendalina', 'Guia', 'Ida', 'Igea', 'Ilda', 'Ileana', 'Ilenia',
        'Immacolata', 'Ines', 'Innocenza', 'Iolanda', 'Iole', 'Iona', 'Iride', 'Iris',
        'Isa', 'Isotta', 'Italia', 'Ivana', 'Ivonne', 'Katia', 'Lara', 'Lea', 'Leda',
        'Leila', 'Lelia', 'Lena', 'Leonia', 'Leonilda', 'Leonora', 'Lia',
        'Liana', 'Libera', 'Licia', 'Lilia', 'Lina',
        'Lionella', 'Liviana', 'Loredana', 'Lorella', 'Lorenza', 'Loreta',
        'Luce', 'Lucetta', 'Lucilla', 'Lucrezia', 'Ludmilla', 'Luigia', 'Luisella',
        'Maddalena', 'Mafalda', 'Magda', 'Malvina', 'Manuela', 'Marcellina',
        'Marella', 'Margot', 'Mariangela', 'Mariapia', 'Mariella', 'Marilena',
        'Marilisa', 'Maristella', 'Marzia', 'Matilda', 'Maura', 'Maurizia',
        'Melina', 'Mercedes', 'Micaela', 'Milva', 'Mina', 'Minerva', 'Miranda', 'Mirella',
        'Miriana', 'Mirta', 'Moira', 'Morena', 'Morgana', 'Myriam', 'Nanda', 'Narcisa',
        'Natalina', 'Nausica', 'Nazarena', 'Neera', 'Nella', 'Nerina', 'Nevina', 'Nicla',
        'Nicoletta', 'Nilde', 'Nina', 'Ninfa', 'Nives', 'Nora', 'Norma', 'Novella',
        'Nuccia', 'Nunzia', 'Odetta', 'Ofelia', 'Olinda', 'Olivia', 'Ombretta', 'Ondina',
        'Onorata', 'Orazia', 'Oriana', 'Orietta', 'Ornella', 'Orsola', 'Ortensia',
        'Osanna', 'Ottavia', 'Palma', 'Palmira', 'Pamela', 'Paolina', 'Pasqualina',
        'Perla', 'Petronilla', 'Pia', 'Piera', 'Pierina',
        'Polissena', 'Porzia', 'Prisca', 'Priscilla',
        'Quintilia', 'Quirina', 'Raffaella', 'Raimonda',
        'Ramona', 'Rea', 'Reginella', 'Remigia', 'Rina', 'Romana', 'Romilda', 'Romina', 'Romola', 'Rosalia', 'Rosalinda', 'Rosaria',
        'Rosella', 'Rosetta', 'Rosina', 'Rosita', 'Rossana',
        'Sabina', 'Salomè', 'Santina', 'Saveria', 'Savina', 'Sebastiana',
        'Selvaggia', 'Serafina', 'Severina', 'Sibilla',
        'Sidonia', 'Silvana', 'Silveria', 'Simonetta',
        'Smeralda', 'Sole', 'Speranza',
        'Stellina', 'Sveva', 'Tamara',
        'Tatiana', 'Tea', 'Tecla', 'Teodolinda', 'Teodora',
        'Tersilia', 'Tessa', 'Tilde', 'Tina', 'Tosca', 'Tullia',
        'Umberta', 'Urbana', 'Ursula',
        'Valchiria', 'Vanda', 'Vanna', 'Venera',
        'Verdiana', 'Verena', 'Vincenza', 'Violante',
        'Virna', 'Vita', 'Vitalba', 'Vittorina', 'Vivetta',
        'Wanda', 'Yara', 'Yasmine', 'Yolanda', 'Yvette', 'Yvonne', 'Zelda', 'Zelinda',
        'Zelmira', 'Zenaide', 'Zenobia', 'Zita', 'Zora', 'Zoraide'
    ],
    
    // GEOGRAFIA INTERNAZIONALE (500+)
    geographyInternational: [
        // Città europee
        'Parigi', 'Londra', 'Madrid', 'Barcellona', 'Valencia', 'Siviglia', 'Berlino', 'Monaco',
        'Amburgo', 'Colonia', 'Vienna', 'Salisburgo', 'Innsbruck', 'Praga', 'Budapest',
        'Varsavia', 'Cracovia', 'Lisbona', 'Porto', 'Coimbra', 'Amsterdam', 'Rotterdam',
        'Bruxelles', 'Bruges', 'Anversa', 'Zurigo', 'Ginevra', 'Berna', 'Lucerna', 'Losanna',
        'Stoccolma', 'Göteborg', 'Oslo', 'Bergen', 'Copenhagen', 'Helsinki', 'Tallinn',
        'Riga', 'Vilnius', 'Dublino', 'Cork', 'Edimburgo', 'Glasgow', 'Cardiff', 'Belfast',
        'Atene', 'Salonicco', 'Sofia', 'Bucarest', 'Belgrado', 'Zagabria', 'Lubiana',
        'Bratislava', 'Mosca', 'Pietroburgo', 'Kiev', 'Minsk', 'Istanbul', 'Ankara',
        
        // Città americane
        'Miami', 'Orlando', 'Tampa', 'Atlanta', 'Nashville', 'Memphis', 'Dallas', 'Houston',
        'Austin', 'Phoenix', 'Tucson', 'Denver', 'Seattle', 'Portland', 'Boston', 'Philadelphia',
        'Baltimore', 'Charlotte', 'Richmond', 'Charleston', 'Savannah', 'Detroit', 'Chicago',
        'Milwaukee', 'Minneapolis', 'Cincinnati', 'Cleveland', 'Pittsburgh', 'Buffalo',
        'Montreal', 'Toronto', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Quebec',
        'Winnipeg', 'Halifax', 'Victoria', 'Regina', 'Saskatoon',
        
        // Città sudamericane
        'Rio', 'Salvador', 'Recife', 'Fortaleza', 'Brasilia', 'Belo', 'Curitiba', 'Manaus',
        'Santos', 'Florianopolis', 'Lima', 'Cusco', 'Arequipa', 'Quito', 'Guayaquil',
        'Bogotà', 'Medellin', 'Cartagena', 'Cali', 'Caracas', 'Maracaibo', 'Valencia',
        'Santiago', 'Valparaiso', 'Concepcion', 'Montevideo', 'Asuncion', 'Cordoba',
        'Rosario', 'Mendoza', 'Mar del Plata', 'Bariloche', 'Ushuaia',
        
        // Città asiatiche
        'Tokyo', 'Kyoto', 'Osaka', 'Nara', 'Kobe', 'Yokohama', 'Nagoya', 'Sapporo',
        'Fukuoka', 'Hiroshima', 'Seoul', 'Busan', 'Beijing', 'Shanghai', 'Guangzhou',
        'Shenzhen', 'Chengdu', 'Xian', 'Nanjing', 'Hangzhou', 'Suzhou', 'Bangkok',
        'Phuket', 'Chiang Mai', 'Pattaya', 'Ayutthaya', 'Singapore', 'Kuala Lumpur',
        'Penang', 'Malacca', 'Jakarta', 'Bali', 'Yogyakarta', 'Manila', 'Cebu', 'Davao',
        'Hanoi', 'Saigon', 'Danang', 'Hue', 'Phnom Penh', 'Siem Reap', 'Vientiane',
        'Luang Prabang', 'Yangon', 'Mandalay', 'Delhi', 'Mumbai', 'Goa', 'Jaipur',
        'Agra', 'Varanasi', 'Calcutta', 'Chennai', 'Bangalore', 'Hyderabad', 'Colombo',
        'Kandy', 'Kathmandu', 'Pokhara', 'Thimphu', 'Islamabad', 'Karachi', 'Lahore',
        'Dhaka', 'Chittagong', 'Kabul', 'Tehran', 'Isfahan', 'Shiraz', 'Baghdad',
        'Basra', 'Amman', 'Petra', 'Beirut', 'Damascus', 'Aleppo', 'Jerusalem',
        'Tel Aviv', 'Haifa', 'Riyadh', 'Jeddah', 'Mecca', 'Dubai', 'Abu Dhabi',
        'Doha', 'Kuwait', 'Muscat', 'Manama', 'Sana\'a', 'Aden',
        
        // Città africane
        'Cairo', 'Alessandria', 'Luxor', 'Aswan', 'Sharm', 'Marrakech', 'Casablanca',
        'Rabat', 'Fez', 'Tangeri', 'Agadir', 'Tunisi', 'Hammamet', 'Sousse', 'Algeri',
        'Orano', 'Tripoli', 'Bengasi', 'Khartoum', 'Addis Abeba', 'Asmara', 'Mogadiscio',
        'Nairobi', 'Mombasa', 'Kampala', 'Kigali', 'Bujumbura', 'Dodoma', 'Zanzibar',
        'Lusaka', 'Harare', 'Bulawayo', 'Maputo', 'Beira', 'Windhoek', 'Gaborone',
        'Johannesburg', 'Pretoria', 'Durban', 'Capetown', 'Port Elizabeth', 'Bloemfontein',
        'Lagos', 'Abuja', 'Kano', 'Accra', 'Kumasi', 'Abidjan', 'Yamoussoukro', 'Dakar',
        'Bamako', 'Ouagadougou', 'Niamey', 'Conakry', 'Freetown', 'Monrovia', 'Lome',
        'Cotonou', 'Douala', 'Yaounde', 'Libreville', 'Kinshasa', 'Brazzaville', 'Luanda',
        
        // Città oceaniche
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Darwin',
        'Canberra', 'Gold Coast', 'Newcastle', 'Auckland', 'Wellington', 'Christchurch',
        'Queenstown', 'Dunedin', 'Hamilton', 'Suva', 'Nadi', 'Papeete', 'Noumea',
        'Port Vila', 'Honiara', 'Apia', 'Nuku\'alofa', 'Majuro', 'Pago Pago',
        
        // Regioni e luoghi famosi
        'Bretagna', 'Normandia', 'Provenza', 'Alsazia', 'Loira', 'Borgogna', 'Champagne',
        'Camargue', 'Costa Azzurra', 'Corsica', 'Savoia', 'Pirenei', 'Alpi', 'Dolomiti',
        'Baviera', 'Sassonia', 'Renania', 'Vestfalia', 'Amazzonia', 'Patagonia', 'Pampas',
        'Ande', 'Himalaya', 'Karakorum', 'Hindu Kush', 'Caucaso', 'Urali', 'Siberia',
        'Mongolia', 'Manciuria', 'Tibet', 'Kashmir', 'Punjab', 'Rajasthan', 'Kerala',
        'Tamil Nadu', 'Karnataka', 'Gujarat', 'Maharashtra', 'Bengal', 'Assam', 'Sahara',
        'Sahel', 'Maghreb', 'Nubia', 'Abissinia', 'Zanzibar', 'Masai Mara', 'Serengeti',
        'Okavango', 'Kalahari', 'Namib', 'Kruger', 'Skeleton Coast', 'Victoria Falls',
        'Kilimanjaro', 'Table Mountain', 'Atlas', 'Hoggar', 'Tibesti', 'Outback',
        'Great Barrier', 'Uluru', 'Kakadu', 'Tasmania', 'Fiordland', 'Milford Sound',
        'Bay of Islands', 'Rotorua', 'Queenstown', 'Franz Josef', 'Fox Glacier',
        
        // Fiumi famosi
        'Tamigi', 'Senna', 'Loira', 'Rodano', 'Reno', 'Danubio', 'Volga', 'Don',
        'Dnepr', 'Vistola', 'Elba', 'Oder', 'Tago', 'Duero', 'Ebro', 'Guadalquivir',
        'Mississippi', 'Missouri', 'Colorado', 'Columbia', 'Hudson', 'Potomac',
        'St. Lawrence', 'Mackenzie', 'Yukon', 'Amazon', 'Orinoco', 'Parana', 'Uruguay',
        'Magdalena', 'Nilo', 'Congo', 'Niger', 'Zambesi', 'Orange', 'Limpopo',
        'Okavango', 'Senegal', 'Gambia', 'Volta', 'Gange', 'Brahmaputra', 'Indo',
        'Mekong', 'Yangtze', 'Fiume Giallo', 'Amur', 'Lena', 'Yenisei', 'Ob',
        'Murray', 'Darling', 'Waikato', 'Clutha'
    ],
    
    // ARTE E CULTURA (400+)
    artCulture: [
        // Artisti famosi
        'Leonardo', 'Michelangelo', 'Raffaello', 'Donatello', 'Botticelli', 'Caravaggio',
        'Tiziano', 'Tintoretto', 'Veronese', 'Giorgione', 'Mantegna', 'Perugino',
        'Giotto', 'Cimabue', 'Masaccio', 'Piero', 'Bellini', 'Carpaccio', 'Canaletto',
        'Tiepolo', 'Bernini', 'Borromini', 'Brunelleschi', 'Bramante', 'Palladio',
        'Monet', 'Manet', 'Renoir', 'Degas', 'Cezanne', 'Gauguin', 'Toulouse', 'Seurat',
        'Pissarro', 'Sisley', 'Morisot', 'Cassatt', 'Klimt', 'Schiele', 'Munch',
        'Picasso', 'Braque', 'Matisse', 'Chagall', 'Mirò', 'Dalì', 'Magritte',
        'Frida', 'Diego', 'Tamara', 'Georgia', 'Basquiat', 'Warhol', 'Hockney',
        'Rembrandt', 'Vermeer', 'Rubens', 'Velazquez', 'Goya', 'Turner', 'Constable',
        'Gainsborough', 'Rossetti', 'Millais', 'Waterhouse', 'Alma', 'Leighton',
        
        // Opere d'arte famose
        'Gioconda', 'Primavera', 'Venere', 'David', 'Pietà', 'Creazione', 'Giudizio',
        'Nascita', 'Annunciazione', 'Trasfigurazione', 'Assunzione', 'Deposizione',
        'Crocifissione', 'Resurrezione', 'Adorazione', 'Visitazione', 'Natività',
        'Epifania', 'Battesimo', 'Tentazione', 'Predica', 'Miracolo', 'Parabola',
        'Ultima Cena', 'Getsemani', 'Flagellazione', 'Ecce Homo', 'Calvario',
        'Ninfee', 'Girasoli', 'Notte Stellata', 'Urlo', 'Bacio', 'Danza', 'Musica',
        'Poesia', 'Filosofia', 'Giustizia', 'Temperanza', 'Fortezza', 'Prudenza',
        'Fede', 'Speranza', 'Carità', 'Verità', 'Bellezza', 'Grazia', 'Virtù',
        
        // Movimenti artistici
        'Rinascimento', 'Barocco', 'Rococò', 'Neoclassico', 'Romantico', 'Realismo',
        'Impressionismo', 'Espressionismo', 'Cubismo', 'Futurismo', 'Dadaismo',
        'Surrealismo', 'Astrattismo', 'Informale', 'Pop Art', 'Minimalismo',
        'Concettuale', 'Liberty', 'Art Nouveau', 'Art Deco', 'Bauhaus', 'Costruttivismo',
        'Suprematismo', 'Neoplasticismo', 'Fauvismo', 'Simbolismo', 'Preraffaelliti',
        'Macchiaioli', 'Divisionismo', 'Pointillismo', 'Nabis', 'Secession',
        
        // Musei e gallerie (GENERICI)
        'Louvre', 'Orsay', 'Pompidou', 'Rodin', 'Picasso', 'Uffizi', 'Pitti',
        'Accademia', 'Bargello', 'Borghese', 'Vaticani', 'Sistina', 'Capitolini',
        'Palazzo', 'Galleria', 'Pinacoteca', 'Museo', 'Collezione', 'Fondazione',
        
        // Architettura
        'Duomo', 'Cattedrale', 'Basilica', 'Chiesa', 'Cappella', 'Battistero',
        'Campanile', 'Torre', 'Cupola', 'Arco', 'Ponte', 'Castello', 'Fortezza',
        'Palazzo', 'Villa', 'Giardino', 'Parco', 'Piazza', 'Fontana', 'Statua',
        'Colonna', 'Obelisco', 'Tempio', 'Teatro', 'Arena', 'Anfiteatro', 'Foro',
        'Terme', 'Acquedotto', 'Porta', 'Mura', 'Bastione', 'Rocca', 'Cittadella'
    ],
    
    // MUSICA E DANZA (150+)
    musicDance: [
        // Generi musicali
        'Opera', 'Sinfonia', 'Concerto', 'Sonata', 'Suite', 'Preludio', 'Fuga',
        'Notturno', 'Ballata', 'Romanza', 'Serenata', 'Cantata', 'Oratorio', 'Messa',
        'Requiem', 'Inno', 'Salmo', 'Corale', 'Madrigale', 'Mottetto', 'Canzone',
        'Aria', 'Recitativo', 'Duetto', 'Terzetto', 'Quartetto', 'Coro', 'Ouverture',
        'Intermezzo', 'Scherzo', 'Adagio', 'Allegro', 'Andante', 'Largo', 'Presto',
        'Vivace', 'Moderato', 'Maestoso', 'Dolce', 'Forte', 'Piano', 'Crescendo',
        'Diminuendo', 'Staccato', 'Legato', 'Pizzicato', 'Vibrato', 'Tremolo',
        
        // Strumenti
        'Violino', 'Viola', 'Violoncello', 'Contrabbasso', 'Arpa', 'Chitarra', 'Liuto',
        'Mandolino', 'Banjo', 'Ukulele', 'Pianoforte', 'Clavicembalo', 'Organo',
        'Fisarmonica', 'Flauto', 'Oboe', 'Clarinetto', 'Fagotto', 'Sassofono', 'Tromba',
        'Trombone', 'Corno', 'Tuba', 'Timpani', 'Tamburo', 'Grancassa', 'Piatti',
        'Triangolo', 'Xilofono', 'Marimba', 'Celesta', 'Campane', 'Castagnette',
        
        // Danze
        'Balletto', 'Valzer', 'Tango', 'Foxtrot', 'Quickstep', 'Rumba', 'Samba',
        'Cha Cha', 'Jive', 'Paso Doble', 'Flamenco', 'Bolero', 'Mazurka', 'Polka',
        'Tarantella', 'Saltarello', 'Gavotta', 'Minuetto', 'Sarabanda', 'Giga',
        'Allemanda', 'Corrente', 'Bourrée', 'Rigaudon', 'Pavana', 'Gagliarda',
        'Volta', 'Branle', 'Farandola', 'Carmagnola', 'Quadriglia', 'Contraddanza',
        'Ballata', 'Carola', 'Estampie', 'Rondò', 'Danza', 'Ballo', 'Festa'
    ],
    
    // ENOGASTRONOMIA (250+)
    enogastronomy: [
        // Termini generici del vino
        'Vendemmia', 'Vigna', 'Vigneto', 'Cantina', 'Barrique', 'Botte', 'Tonneau',
        'Anfora', 'Torchio', 'Tino', 'Mosto', 'Vinaccia', 'Raspo', 'Grappolo',
        'Acino', 'Buccia', 'Polpa', 'Tannino', 'Polifenoli', 'Antociani', 'Aromi',
        'Bouquet', 'Profumo', 'Sentore', 'Retrogusto', 'Persistenza', 'Equilibrio',
        'Struttura', 'Corpo', 'Rotondità', 'Morbidezza', 'Freschezza', 'Sapidità',
        'Mineralità', 'Acidità', 'Alcolicità', 'Gradazione', 'Affinamento', 'Invecchiamento',
        'Riserva', 'Millesimato', 'Cuvée', 'Blend', 'Assemblaggio', 'Uvaggio', 'Terroir',
        'Cru', 'Vigneron', 'Sommelier', 'Degustazione', 'Assaggio', 'Calice', 'Decanter',
        'Cavatappi', 'Tappo', 'Sughero', 'Etichetta', 'Annata', 'Vendemmia Tardiva',
        'Passito', 'Appassimento', 'Eiswein', 'Botrytis', 'Spumante', 'Frizzante',
        'Metodo Classico', 'Charmat', 'Brut', 'Extra Dry', 'Dry', 'Demi Sec', 'Dolce',
        'Rosso', 'Bianco', 'Rosato', 'Cerasuolo', 'Chiaretto', 'Novello', 'Superiore',
        'Classico', 'Biologico', 'Biodinamico', 'Naturale', 'Orange Wine', 'Macerato',
        
        // Piatti tradizionali
        'Antipasto', 'Aperitivo', 'Stuzzichino', 'Bruschetta', 'Crostino', 'Focaccia',
        'Pizza', 'Calzone', 'Piadina', 'Crescentina', 'Gnocco', 'Tigella', 'Farinata',
        'Panissa', 'Arancino', 'Supplì', 'Crocchetta', 'Frittata', 'Tortino', 'Sformato',
        'Insalata', 'Caprese', 'Panzanella', 'Caponata', 'Peperonata', 'Giardiniera',
        'Minestra', 'Zuppa', 'Vellutata', 'Passato', 'Brodetto', 'Cacciucco', 'Ribollita',
        'Minestrone', 'Pasta', 'Risotto', 'Polenta', 'Lasagna', 'Cannelloni', 'Ravioli',
        'Tortellini', 'Cappelletti', 'Agnolotti', 'Tagliatelle', 'Fettuccine', 'Pappardelle',
        'Linguine', 'Spaghetti', 'Bucatini', 'Rigatoni', 'Penne', 'Fusilli', 'Farfalle',
        'Orecchiette', 'Trofie', 'Strozzapreti', 'Malloreddus', 'Culurgiones', 'Pizzoccheri',
        'Canederli', 'Spätzle', 'Passatelli', 'Pisarei', 'Corzetti', 'Mandilli',
        
        // Carni e pesci
        'Brasato', 'Stufato', 'Spezzatino', 'Arrosto', 'Scaloppina', 'Cotoletta', 'Braciola',
        'Bistecca', 'Tagliata', 'Carpaccio', 'Bresaola', 'Vitello Tonnato', 'Bollito',
        'Lesso', 'Fritto Misto', 'Baccalà', 'Stoccafisso', 'Brandacujun', 'Cacciucco',
        'Brodetto', 'Zuppa di Pesce', 'Fritto di Paranza', 'Impepata', 'Guazzetto',
        'Acqua Pazza', 'Cartoccio', 'Sale', 'Crosta', 'Griglia', 'Brace', 'Spiedo',
        
        // Formaggi e salumi (termini generici)
        'Formaggio', 'Cacio', 'Pecorino', 'Caprino', 'Ricotta', 'Mascarpone', 'Stracchino',
        'Crescenza', 'Robiola', 'Toma', 'Fontina', 'Montasio', 'Latteria', 'Puzzone',
        'Salume', 'Prosciutto', 'Coppa', 'Lonza', 'Pancetta', 'Guanciale', 'Lardo',
        'Salame', 'Salsiccia', 'Soppressa', 'Finocchiona', 'Nduja', 'Bresaola',
        'Speck', 'Mortadella', 'Cotechino', 'Zampone', 'Culatello', 'Fiocchetto',
        
        // Dolci
        'Tiramisù', 'Panna Cotta', 'Zabaione', 'Semifreddo', 'Gelato', 'Sorbetto',
        'Granita', 'Cassata', 'Cannolo', 'Sfogliatella', 'Babà', 'Pastiera', 'Delizia',
        'Zeppola', 'Struffoli', 'Crostata', 'Sbrisolona', 'Amor Polenta', 'Krumiri',
        'Baci di Dama', 'Cantucci', 'Ricciarelli', 'Panforte', 'Cavallucci', 'Panpepato',
        'Pandoro', 'Panettone', 'Colomba', 'Focaccia', 'Schiacciata', 'Maritozzo'
    ],
    
    // ELEMENTI E FENOMENI (100+)
    elementsAndPhenomena: [
        // Elementi classici
        'Fuoco', 'Acqua', 'Terra', 'Aria', 'Etere', 'Luce', 'Ombra', 'Buio', 'Tenebra',
        'Fiamma', 'Scintilla', 'Brace', 'Cenere', 'Fumo', 'Vapore', 'Ghiaccio', 'Cristallo',
        'Neve', 'Grandine', 'Pioggia', 'Rugiada', 'Brina', 'Nebbia', 'Foschia', 'Nuvola',
        'Vento', 'Brezza', 'Tempesta', 'Uragano', 'Tifone', 'Tornado', 'Ciclone', 'Tromba',
        
        // Fenomeni atmosferici
        'Fulmine', 'Tuono', 'Lampo', 'Saetta', 'Arcobaleno', 'Aurora', 'Miraggio', 'Fata Morgana',
        'Alba', 'Tramonto', 'Crepuscolo', 'Eclissi', 'Cometa', 'Meteora', 'Stella Cadente',
        'Via Lattea', 'Galassia', 'Nebulosa', 'Costellazione', 'Zenith', 'Nadir', 'Orizzonte',
        
        // Fenomeni naturali
        'Marea', 'Onda', 'Corrente', 'Vortice', 'Mulinello', 'Cascata', 'Rapida', 'Sorgente',
        'Geyser', 'Fumarola', 'Solfatara', 'Vulcano', 'Lava', 'Magma', 'Eruzione', 'Cenere',
        'Terremoto', 'Scossa', 'Sisma', 'Maremoto', 'Tsunami', 'Valanga', 'Slavina', 'Frana',
        'Smottamento', 'Erosione', 'Sedimento', 'Stratificazione', 'Cristallizzazione',
        'Fossilizzazione', 'Metamorfosi', 'Sublimazione', 'Evaporazione', 'Condensazione',
        'Precipitazione', 'Solidificazione', 'Fusione', 'Ebollizione', 'Combustione',
        'Ossidazione', 'Corrosione', 'Fermentazione', 'Putrefazione', 'Decomposizione'
    ],
    
    // MARE E COSTE (150+)
    seaAndCoasts: [
        // Termini marini
        'Mare', 'Oceano', 'Golfo', 'Baia', 'Rada', 'Insenatura', 'Cala', 'Caletta',
        'Fiordo', 'Laguna', 'Stretto', 'Canale', 'Braccio', 'Bocca', 'Foce', 'Delta',
        'Estuario', 'Porto', 'Marina', 'Darsena', 'Molo', 'Banchina', 'Pontile', 'Faro',
        'Fanale', 'Boa', 'Gavitello', 'Ancora', 'Ormeggio', 'Approdo', 'Scalo', 'Arsenale',
        
        // Elementi costieri
        'Costa', 'Litorale', 'Riva', 'Sponda', 'Spiaggia', 'Arenile', 'Battigia', 'Bagnasciuga',
        'Scogliera', 'Falesia', 'Promontorio', 'Capo', 'Punta', 'Penisola', 'Istmo', 'Tombolo',
        'Cordone', 'Duna', 'Pineta', 'Macchia', 'Salina', 'Palude', 'Stagno', 'Acquitrino',
        
        // Vita marina
        'Onda', 'Cavallone', 'Maroso', 'Frangente', 'Risacca', 'Corrente', 'Gorgo', 'Mulinello',
        'Fondale', 'Abisso', 'Fossa', 'Scoglio', 'Secca', 'Banco', 'Barriera', 'Atollo',
        'Corallo', 'Madrepora', 'Posidonia', 'Alga', 'Conchiglia', 'Mollusco', 'Crostaceo',
        'Medusa', 'Riccio', 'Stella', 'Spugna', 'Anemone', 'Granchio', 'Paguro', 'Polpo',
        'Seppia', 'Calamaro', 'Murena', 'Cernia', 'Dentice', 'Orata', 'Branzino', 'Sarago',
        'Salpa', 'Occhiata', 'Mormora', 'Corvina', 'Ombrina', 'Ricciola', 'Palamita',
        'Tonno', 'Pesce Spada', 'Aguglia', 'Acciuga', 'Sardina', 'Sgombro', 'Tracina',
        
        // Navigazione
        'Vela', 'Randa', 'Fiocco', 'Spinnaker', 'Gennaker', 'Albero', 'Boma', 'Tangone',
        'Sartia', 'Drizza', 'Scotta', 'Cima', 'Gomena', 'Catena', 'Argano', 'Verricello',
        'Timone', 'Barra', 'Ruota', 'Prua', 'Prora', 'Poppa', 'Fiancata', 'Murata',
        'Carena', 'Chiglia', 'Deriva', 'Bulbo', 'Pinna', 'Skeg', 'Specchio', 'Opera Morta',
        'Opera Viva', 'Linea di Galleggiamento', 'Bordo Libero', 'Gavone', 'Sentina',
        'Pozzetto', 'Tuga', 'Tambucio', 'Oblò', 'Osteriggio', 'Boccaporto', 'Parabordo',
        'Salvagente', 'Zattera', 'Tender', 'Gommone', 'Canotto', 'Scialuppa'
    ],
    
    // TEATRO E CINEMA (200+)
    theaterAndCinema: [
        // Teatro
        'Teatro', 'Palcoscenico', 'Scena', 'Ribalta', 'Quinta', 'Sipario', 'Fondale',
        'Proscenio', 'Boccascena', 'Golfo Mistico', 'Platea', 'Palco', 'Galleria',
        'Loggione', 'Piccionaia', 'Foyer', 'Ridotto', 'Camerino', 'Sartoria', 'Attrezzeria',
        'Commedia', 'Tragedia', 'Dramma', 'Farsa', 'Melodramma', 'Opera', 'Operetta',
        'Musical', 'Balletto', 'Pantomima', 'Mimo', 'Cabaret', 'Varietà', 'Avanspettacolo',
        'Rivista', 'Sketch', 'Monologo', 'Dialogo', 'Battuta', 'Replica', 'Tirata',
        'Soliloquio', 'Aside', 'Prologo', 'Epilogo', 'Atto', 'Scena', 'Quadro', 'Intermezzo',
        'Entrata', 'Uscita', 'Colpo di Scena', 'Climax', 'Catarsi', 'Agnizione', 'Peripezia',
        
        // Ruoli teatrali
        'Protagonista', 'Deuteragonista', 'Antagonista', 'Eroe', 'Eroina', 'Villain',
        'Confidente', 'Spalla', 'Caratterista', 'Generico', 'Comparsa', 'Figurante',
        'Prima Donna', 'Primo Attore', 'Soubrette', 'Brillante', 'Amoroso', 'Ingenua',
        'Padre Nobile', 'Madre Nobile', 'Tiranno', 'Servo', 'Servetta', 'Innamorato',
        
        // Cinema
        'Cinema', 'Film', 'Pellicola', 'Lungometraggio', 'Cortometraggio', 'Documentario',
        'Fiction', 'Biopic', 'Remake', 'Sequel', 'Prequel', 'Spin-off', 'Saga', 'Trilogia',
        'Schermo', 'Proiezione', 'Première', 'Anteprima', 'Rassegna', 'Festival', 'Mostra',
        'Set', 'Location', 'Studio', 'Backstage', 'Ciak', 'Action', 'Stop', 'Cut', 'Print',
        'Ripresa', 'Inquadratura', 'Piano', 'Campo', 'Controcampo', 'Primissimo Piano',
        'Primo Piano', 'Mezzo Primo Piano', 'Piano Americano', 'Mezza Figura', 'Figura Intera',
        'Campo Totale', 'Campo Lungo', 'Campo Medio', 'Dettaglio', 'Particolare', 'Inserto',
        'Carrellata', 'Panoramica', 'Zoom', 'Dolly', 'Steadicam', 'Macchina a Mano',
        'Piano Sequenza', 'Montaggio', 'Editing', 'Dissolvenza', 'Stacco', 'Tendina',
        'Flashback', 'Flashforward', 'Ellissi', 'Ralenti', 'Accelerato', 'Fermo Immagine',
        'Voice Over', 'Fuori Campo', 'Colonna Sonora', 'Soundtrack', 'Score', 'Tema',
        'Effetti Speciali', 'CGI', 'Green Screen', 'Motion Capture', 'Post Produzione',
        'Color Correction', 'Grading', 'Dubbing', 'Sottotitoli', 'Credits', 'Trailer'
    ],
    
    // LETTERATURA (150+)
    literature: [
        // Generi letterari
        'Romanzo', 'Racconto', 'Novella', 'Fiaba', 'Favola', 'Leggenda', 'Mito', 'Saga',
        'Epica', 'Lirica', 'Elegia', 'Ode', 'Inno', 'Canzone', 'Sonetto', 'Ballata',
        'Madrigale', 'Epigramma', 'Satira', 'Parodia', 'Pastiche', 'Pamphlet', 'Saggio',
        'Trattato', 'Dialogo', 'Epistola', 'Cronaca', 'Memoria', 'Diario', 'Biografia',
        'Autobiografia', 'Aforisma', 'Massima', 'Sentenza', 'Proverbio', 'Motto', 'Adagio',
        
        // Elementi narrativi
        'Trama', 'Intreccio', 'Fabula', 'Storia', 'Racconto', 'Narrazione', 'Diegesi',
        'Incipit', 'Explicit', 'Prologo', 'Epilogo', 'Capitolo', 'Paragrafo', 'Periodo',
        'Frase', 'Parola', 'Verso', 'Strofa', 'Rima', 'Metrica', 'Ritmo', 'Accento',
        'Cesura', 'Enjambement', 'Allitterazione', 'Assonanza', 'Consonanza', 'Onomatopea',
        'Anafora', 'Epifora', 'Chiasmo', 'Ossimoro', 'Antitesi', 'Paradosso', 'Iperbole',
        'Litote', 'Sineddoche', 'Metonimia', 'Metafora', 'Similitudine', 'Allegoria',
        'Simbolo', 'Immagine', 'Figura', 'Topos', 'Leitmotiv', 'Climax', 'Anticlimax',
        
        // Figure letterarie
        'Autore', 'Scrittore', 'Poeta', 'Narratore', 'Romanziere', 'Novelliere', 'Saggista',
        'Drammaturgo', 'Commediografo', 'Librettista', 'Sceneggiatore', 'Giornalista',
        'Critico', 'Recensore', 'Editore', 'Redattore', 'Correttore', 'Traduttore',
        'Lettore', 'Bibliofilo', 'Erudito', 'Letterato', 'Umanista', 'Intellettuale',
        
        // Libro e pubblicazione
        'Libro', 'Volume', 'Tomo', 'Codice', 'Manoscritto', 'Incunabolo', 'Edizione',
        'Stampa', 'Pubblicazione', 'Tiratura', 'Ristampa', 'Copertina', 'Rilegatura',
        'Dorso', 'Taglio', 'Frontespizio', 'Colophon', 'Indice', 'Sommario', 'Prefazione',
        'Postfazione', 'Introduzione', 'Nota', 'Appendice', 'Bibliografia', 'Glossario',
        'Errata Corrige', 'Ex Libris', 'Dedica', 'Epigrafe', 'Citazione', 'Motto'
    ],
    
    // TEMPO E STAGIONI (100+)
    timeAndSeasons: [
        // Stagioni
        'Primavera', 'Estate', 'Autunno', 'Inverno', 'Equinozio', 'Solstizio',
        'Germoglio', 'Fioritura', 'Fruttificazione', 'Mietitura', 'Vendemmia', 'Raccolta',
        'Semina', 'Aratura', 'Potatura', 'Innesto', 'Letargo', 'Risveglio', 'Rinascita',
        
        // Mesi
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto',
        'Settembre', 'Ottobre', 'Novembre', 'Dicembre', 'Capodanno', 'Epifania', 'Carnevale',
        'Quaresima', 'Pasqua', 'Pentecoste', 'Ferragosto', 'Ognissanti', 'Avvento', 'Natale',
        
        // Momenti del giorno
        'Alba', 'Aurora', 'Mattino', 'Mattinata', 'Mezzogiorno', 'Meriggio', 'Pomeriggio',
        'Vespro', 'Sera', 'Serata', 'Imbrunire', 'Crepuscolo', 'Tramonto', 'Notte',
        'Mezzanotte', 'Ore Piccole', 'Primo Canto', 'Luccichio', 'Chiarore', 'Penombra',
        
        // Tempo atmosferico
        'Sereno', 'Nuvoloso', 'Coperto', 'Variabile', 'Perturbato', 'Tempestoso', 'Afoso',
        'Umido', 'Secco', 'Ventoso', 'Calmo', 'Nebbioso', 'Piovoso', 'Nevoso', 'Gelido',
        'Freddo', 'Fresco', 'Mite', 'Tiepido', 'Caldo', 'Torrido', 'Soffocante', 'Gradevole',
        
        // Concetti temporali
        'Tempo', 'Ora', 'Istante', 'Momento', 'Attimo', 'Secondo', 'Minuto', 'Ora',
        'Giorno', 'Settimana', 'Mese', 'Anno', 'Lustro', 'Decennio', 'Secolo', 'Millennio',
        'Era', 'Epoca', 'Età', 'Periodo', 'Fase', 'Ciclo', 'Eternità', 'Infinito'
    ],
    
    // ERBE E SPEZIE (200+)
    herbsAndSpices: [
        // Erbe aromatiche mediterranee
        'Basilico', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana', 'Menta',
        'Mentuccia', 'Prezzemolo', 'Alloro', 'Mirto', 'Lavanda', 'Santolina', 'Ruta',
        'Nepeta', 'Issopo', 'Santoreggia', 'Serpillo', 'Melissa', 'Cedrina', 'Verbena',
        'Citronella', 'Erba cipollina', 'Dragoncello', 'Cerfoglio', 'Aneto', 'Finocchio',
        'Finocchietto', 'Coriandolo', 'Cumino', 'Carvi', 'Anice', 'Anice stellato',
        
        // Spezie orientali e tropicali
        'Cannella', 'Cassia', 'Cardamomo', 'Chiodi di garofano', 'Noce moscata', 'Macis',
        'Zenzero', 'Galanga', 'Curcuma', 'Zafferano', 'Vaniglia', 'Pepe nero', 'Pepe bianco',
        'Pepe verde', 'Pepe rosa', 'Pepe lungo', 'Cubebe', 'Pepe di Sichuan', 'Pimento',
        'Coriandolo', 'Senape', 'Mostarda', 'Rafano', 'Wasabi', 'Sesamo', 'Nigella',
        'Papavero', 'Fieno greco', 'Tamarindo', 'Sommacco', 'Berbero', 'Harissa', 'Zaatar',
        
        // Erbe officinali
        'Camomilla', 'Malva', 'Altea', 'Calendula', 'Achillea', 'Arnica', 'Iperico',
        'Valeriana', 'Passiflora', 'Biancospino', 'Tiglio', 'Sambuco', 'Echinacea',
        'Ginseng', 'Guaranà', 'Matè', 'Rooibos', 'Karkadè', 'Rosa canina', 'Ribes',
        'Mirtillo', 'Lampone', 'Mora', 'Fragola', 'Ortica', 'Tarassaco', 'Carciofo',
        'Cardo mariano', 'Fumaria', 'Gramigna', 'Equiseto', 'Betulla', 'Frassino',
        'Salice', 'Eucalipto', 'Pino', 'Abete', 'Timo serpillo', 'Lichene islandico',
        
        // Mix di spezie
        'Curry', 'Masala', 'RaselHanout', 'Baharat', 'Dukkah', 'Shichimi', 'Furikake',
        'Herbes de Provence', 'Fines Herbes', 'Bouquet Garni', 'Soffritto', 'Mirepoix',
        'Gremolata', 'Persillade', 'Chermoula', 'Chimichurri', 'Pesto', 'Salsa Verde',
        
        // Erbe selvatiche commestibili
        'Asparago selvatico', 'Pungitopo', 'Luppolo', 'Barba di frate', 'Agretti',
        'Portulaca', 'Crescione', 'Rucola selvatica', 'Cicoria', 'Catalogna', 'Puntarelle',
        'Radicchio', 'Indivia', 'Scarola', 'Borragine', 'Bietola', 'Spinacio selvatico',
        'Farinello', 'Amaranto', 'Piantaggine', 'Acetosa', 'Acetosella', 'Silene',
        'Papavero', 'Senape selvatica', 'Rapa selvatica', 'Cavolo nero', 'Verza',
        'Ravanello selvatico', 'Ramolaccio', 'Barba di becco', 'Scorzonera', 'Topinambur',
        
        // Radici e bulbi
        'Zenzero', 'Curcuma', 'Galanga', 'Liquirizia', 'Genziana', 'Angelica', 'Levistico',
        'Sedano rapa', 'Pastinaca', 'Scorzonera', 'Salsify', 'Topinambur', 'Manioca',
        'Taro', 'Igname', 'Daikon', 'Ravanello', 'Ramolaccio', 'Barbabietola', 'Carota',
        
        // Cortecce e resine
        'Cannella', 'Cassia', 'Sassafrasso', 'Chinino', 'Mastice', 'Mirra', 'Incenso',
        'Benzoino', 'Storace', 'Sandalo', 'Agar', 'Canfora', 'Eucalipto'
    ],
    
    // ISOLE DEL MONDO (200+)
    worldIslands: [
        // Isole del Mediterraneo
        'Maiorca', 'Minorca', 'Ibiza', 'Formentera', 'Cabrera', 'Corsica', 'Sardegna',
        'Sicilia', 'Malta', 'Gozo', 'Comino', 'Creta', 'Rodi', 'Kos', 'Mykonos',
        'Santorini', 'Paros', 'Naxos', 'Ios', 'Milos', 'Sifnos', 'Serifos', 'Syros',
        'Tinos', 'Andros', 'Folegandros', 'Amorgos', 'Karpathos', 'Kasos', 'Kastellorizo',
        'Symi', 'Tilos', 'Nisyros', 'Patmos', 'Leros', 'Kalymnos', 'Astypalea',
        'Lesvos', 'Chios', 'Samos', 'Ikaria', 'Fourni', 'Psara', 'Oinousses',
        'Skiathos', 'Skopelos', 'Alonnisos', 'Skyros', 'Evia', 'Salamina', 'Aegina',
        'Poros', 'Hydra', 'Spetses', 'Kythira', 'Antikythera', 'Corfu', 'Paxos',
        'Lefkada', 'Kefalonia', 'Ithaca', 'Zakynthos', 'Kythira', 'Gavdos',
        'Cipro', 'Djerba', 'Kerkennah', 'Lampedusa', 'Pantelleria', 'Pelagie',
        
        // Isole dei Caraibi
        'Cuba', 'Giamaica', 'Hispaniola', 'Puerto Rico', 'Bahamas', 'Barbados',
        'Trinidad', 'Tobago', 'Aruba', 'Curacao', 'Bonaire', 'Grenada', 'Dominica',
        'Martinica', 'Guadalupa', 'Antigua', 'Barbuda', 'Saint Martin', 'Saint Barth',
        'Anguilla', 'Montserrat', 'Nevis', 'Saint Kitts', 'Saint Lucia', 'Saint Vincent',
        'Grenadine', 'Cayman', 'Turks', 'Caicos', 'Virgin Islands', 'Tortola',
        
        // Isole dell'Oceano Indiano
        'Madagascar', 'Mauritius', 'Reunion', 'Seychelles', 'Comoros', 'Mayotte',
        'Zanzibar', 'Pemba', 'Mafia', 'Socotra', 'Maldive', 'Laccadive', 'Andamane',
        'Nicobare', 'Sri Lanka', 'Langkawi', 'Penang', 'Phuket', 'Koh Samui',
        'Koh Phangan', 'Koh Tao', 'Koh Phi Phi', 'Koh Lanta', 'Koh Chang',
        
        // Isole del Pacifico
        'Hawaii', 'Maui', 'Oahu', 'Kauai', 'Molokai', 'Lanai', 'Tahiti', 'Moorea',
        'Bora Bora', 'Huahine', 'Raiatea', 'Tahaa', 'Marquesas', 'Tuamotu', 'Gambier',
        'Cook Islands', 'Samoa', 'Tonga', 'Fiji', 'Vanuatu', 'Solomon', 'Kiribati',
        'Tuvalu', 'Nauru', 'Palau', 'Guam', 'Saipan', 'Rota', 'Tinian', 'Marshall',
        'Micronesia', 'Easter Island', 'Galapagos', 'Juan Fernandez', 'Chiloe',
        
        // Isole dell'Atlantico
        'Azzorre', 'Madeira', 'Canarie', 'Tenerife', 'Gran Canaria', 'Lanzarote',
        'Fuerteventura', 'La Palma', 'La Gomera', 'El Hierro', 'Capo Verde',
        'Sao Vicente', 'Santo Antao', 'Sao Nicolau', 'Sal', 'Boa Vista', 'Maio',
        'Santiago', 'Fogo', 'Brava', 'Bermuda', 'Bahamas', 'Islanda', 'Faroe',
        'Shetland', 'Orcadi', 'Ebridi', 'Man', 'Wight', 'Scilly', 'Jersey', 'Guernsey',
        'Sark', 'Alderney', 'Belle-Ile', 'Ile de Re', 'Ile d\'Oleron', 'Noirmoutier',
        
        // Isole dell'Asia
        'Giappone', 'Honshu', 'Hokkaido', 'Kyushu', 'Shikoku', 'Okinawa', 'Taiwan',
        'Hainan', 'Hong Kong', 'Macao', 'Singapore', 'Borneo', 'Sumatra', 'Java',
        'Sulawesi', 'Molucche', 'Bali', 'Lombok', 'Sumbawa', 'Flores', 'Timor',
        'Mindanao', 'Luzon', 'Visayas', 'Palawan', 'Jeju', 'Ulleungdo'
    ],
    
    // PROFUMI NATURALI (200+)
    naturalScents: [
        // Fiori profumati
        'Rosa', 'Gelsomino', 'Tuberosa', 'Gardenia', 'Frangipani', 'Ylang-ylang',
        'Neroli', 'Zagara', 'Fiori d\'arancio', 'Magnolia', 'Mimosa', 'Violetta',
        'Iris', 'Mughetto', 'Lavanda', 'Eliotropio', 'Fresia', 'Giacinto', 'Lillà',
        'Caprifoglio', 'Tiglio', 'Gelsomino sambac', 'Osmanto', 'Boronia', 'Cassie',
        
        // Agrumi
        'Bergamotto', 'Limone', 'Lime', 'Pompelmo', 'Arancia', 'Mandarino', 'Clementina',
        'Cedro', 'Yuzu', 'Kumquat', 'Chinotto', 'Pomelo', 'Combava', 'Calamansi',
        'Arancia amara', 'Petitgrain', 'Limetta', 'Citron', 'Buddha\'s hand',
        
        // Legni profumati
        'Sandalo', 'Cedro', 'Patchouli', 'Vetiver', 'Oud', 'Agarwood', 'Palo santo',
        'Guaiaco', 'Ebano', 'Teak', 'Bambù', 'Cipresso', 'Ginepro', 'Pino', 'Abete',
        'Eucalipto', 'Tea tree', 'Cajeput', 'Niaouli', 'Canfora', 'Hinoki',
        
        // Resine e balsami
        'Incenso', 'Mirra', 'Benzoino', 'Storace', 'Labdano', 'Elemi', 'Copaiba',
        'Balsamo del Perù', 'Balsamo di Tolu', 'Opoponax', 'Galbano', 'Mastice',
        'Ambra', 'Colofonia', 'Propoli', 'Cera d\'api', 'Gomma arabica', 'Tragacanto',
        
        // Spezie profumate
        'Vaniglia', 'Cannella', 'Cardamomo', 'Chiodi di garofano', 'Noce moscata',
        'Zenzero', 'Pepe nero', 'Pepe rosa', 'Coriandolo', 'Anice stellato', 'Fava tonka',
        'Zafferano', 'Curcuma', 'Macis', 'Pimento', 'Ginepro', 'Fieno greco',
        
        // Erbe aromatiche
        'Basilico', 'Menta', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana',
        'Verbena', 'Citronella', 'Palmarosa', 'Geranio', 'Davana', 'Tagete', 'Estragon',
        'Angelica', 'Camomilla', 'Artemisia', 'Achillea', 'Tanaceto', 'Santolina',
        
        // Frutti profumati
        'Mela', 'Pera', 'Pesca', 'Albicocca', 'Prugna', 'Ciliegia', 'Fragola',
        'Lampone', 'Mora', 'Mirtillo', 'Ribes', 'Uva', 'Melone', 'Anguria', 'Ananas',
        'Mango', 'Papaya', 'Passion fruit', 'Litchi', 'Cocco', 'Banana', 'Guava',
        'Fico', 'Melograno', 'Kiwi', 'Pitaya', 'Durian', 'Jackfruit', 'Tamarindo',
        
        // Note marine e minerali
        'Salsedine', 'Alga', 'Ozono', 'Brezza marina', 'Corallo', 'Ambra grigia',
        'Muschio di quercia', 'Muschio bianco', 'Fougère', 'Cipriato', 'Talco',
        'Argilla', 'Gesso', 'Pietra', 'Minerale', 'Metallico', 'Terroso', 'Fumé'
    ],
    
    // INVERNO E NATALE (200+)
    winterAndChristmas: [
        // Spirito natalizio
        'Natale', 'Christmas', 'Noel', 'Navidad', 'Weihnachten', 'Yule', 'Festa', 'Gioia',
        'Pace', 'Amore', 'Speranza', 'Magia', 'Incanto', 'Miracolo', 'Dono', 'Regalo',
        'Sorpresa', 'Felicità', 'Armonia', 'Serenità', 'Calore', 'Famiglia', 'Unione',
        'Tradizione', 'Ricordo', 'Nostalgia', 'Infanzia', 'Sogno', 'Desiderio', 'Attesa',
        
        // Personaggi e simboli natalizi
        'Babbo Natale', 'Santa', 'San Nicola', 'Befana', 'Elfo', 'Folletto', 'Angelo',
        'Cherubino', 'Serafino', 'Stella', 'Cometa', 'Stella Polare', 'Betlemme',
        'Presepe', 'Natività', 'Capanna', 'Mangiatoia', 'Pastore', 'Gregge', 'Magi',
        'Re Magi', 'Gaspare', 'Melchiorre', 'Baldassarre', 'Oro', 'Incenso', 'Mirra',
        
        // Decorazioni natalizie
        'Albero', 'Abete', 'Pino', 'Conifera', 'Ghirlanda', 'Corona', 'Fiocco', 'Nastro',
        'Palla', 'Sfera', 'Pallina', 'Addobbo', 'Decorazione', 'Ornamento', 'Festoni',
        'Lucine', 'Luci', 'Luminaria', 'Candela', 'Cero', 'Lanterna', 'Candelabro',
        'Campanella', 'Campana', 'Sonagli', 'Tintinnio', 'Cristallo', 'Ghiacciolo',
        'Fiocco di neve', 'Cristallo di neve', 'Neve', 'Nevicata', 'Pupazzo', 'Renna',
        
        // Piante natalizie
        'Vischio', 'Agrifoglio', 'Pungitopo', 'Stella di Natale', 'Poinsettia', 'Edera',
        'Bacche', 'Pigna', 'Cannella', 'Spezie', 'Profumo', 'Essenza', 'Fragranza',
        
        // Atmosfera invernale
        'Inverno', 'Dicembre', 'Freddo', 'Gelo', 'Brina', 'Ghiaccio', 'Bianco',
        'Candore', 'Purezza', 'Silenzio', 'Quiete', 'Pace', 'Tranquillità',
        'Camino', 'Focolare', 'Fuoco', 'Fiamma', 'Ceppo', 'Legna', 'Brace', 'Tepore',
        'Coperta', 'Plaid', 'Lana', 'Cashmere', 'Morbidezza', 'Comfort', 'Rifugio',
        
        // Dolci e tradizioni
        'Panettone', 'Pandoro', 'Torrone', 'Panforte', 'Ricciarelli', 'Mandorle',
        'Zucchero', 'Miele', 'Cioccolato', 'Crema', 'Vaniglia', 'Caramello', 'Glassa',
        'Biscotti', 'Omino', 'Zenzero', 'Marzapane', 'Frutta secca', 'Nocciole',
        'Vin brulé', 'Cioccolata calda', 'Tè', 'Tisana', 'Infuso', 'Speziato',
        
        // Momenti e attività
        'Vigilia', 'Mezzanotte', 'Aurora', 'Alba', 'Tramonto', 'Sera', 'Notte Santa',
        'Messa', 'Preghiera', 'Canto', 'Coro', 'Melodia', 'Carola', 'Ninna nanna',
        'Brindisi', 'Auguri', 'Benedizione', 'Abbraccio', 'Bacio', 'Carezza', 'Coccola',
        'Pranzo', 'Cena', 'Cenone', 'Tavola', 'Convivio', 'Festa', 'Celebrazione',
        
        // Luoghi invernali
        'Montagna', 'Baita', 'Chalet', 'Rifugio', 'Capanna', 'Casa', 'Villaggio',
        'Borgo', 'Paese', 'Città', 'Piazza', 'Mercatino', 'Bottega', 'Vetrina',
        'Chiesa', 'Campanile', 'Torre', 'Castello', 'Palazzo', 'Villa', 'Cascina',
        
        // Emozioni natalizie
        'Stupore', 'Meraviglia', 'Emozione', 'Tenerezza', 'Dolcezza', 'Gratitudine',
        'Generosità', 'Altruismo', 'Condivisione', 'Solidarietà', 'Carità', 'Bontà',
        'Innocenza', 'Purezza', 'Semplicità', 'Autenticità', 'Verità', 'Sincerità'
    ],
    
    // APERITIVO E LIQUORI (100)
    aperitivoAndLiquori: [
        // Aperitivi e cocktail classici (nomi generici)
        'Spritz', 'Negroni', 'Americano', 'Sbagliato', 'Hugo', 'Mimosa', 'Bellini',
        'Rossini', 'Tintoretto', 'Puccini', 'Kir', 'Kir Royale', 'Garibaldi', 'Bicicletta',
        'Veneziano', 'Padovano', 'Trevigiano', 'Milano-Torino', 'Pirlo', 'Sour',
        
        // Cocktail internazionali classici
        'Martini', 'Manhattan', 'Daiquiri', 'Margarita', 'Caipirinha', 'Mojito', 'Gimlet',
        'Gibson', 'Cosmopolitan', 'Sidecar', 'Aviation', 'Boulevardier', 'Sazerac',
        'Old Fashioned', 'Mint Julep', 'Rob Roy', 'Rusty Nail', 'Paper Plane',
        'Brooklyn', 'Bronx', 'Clover Club', 'Ramos Fizz', 'Pisco Sour', 'Whiskey Sour',
        
        // Tiki e tropicali
        'Mai Tai', 'Zombie', 'Painkiller', 'Hurricane', 'Piña Colada', 'Blue Hawaii',
        'Planter\'s Punch', 'Rum Punch', 'Scorpion Bowl', 'Singapore Sling', 'Fog Cutter',
        'Navy Grog', 'Pearl Diver', 'Bahama Mama', 'Tiki Punch',
        
        // Long drink e highball
        'Gin Tonic', 'Vodka Tonic', 'Cuba Libre', 'Long Island', 'Moscow Mule', 'Paloma',
        'Highball', 'Rickey', 'Buck', 'Fizz', 'Collins', 'Screwdriver', 'Greyhound',
        'Salty Dog', 'Cape Cod', 'Madras', 'Sea Breeze', 'Bay Breeze', 'Tequila Sunrise',
        'Mule', 'Julep', 'Cooler', 'Punch', 'Sangria', 'Tinto de Verano',
        
        // Digestivi e after dinner (termini generici)
        'Amaro', 'Bitter', 'Vermouth', 'Grappa', 'Limoncello', 'Mirto', 'Nocino',
        'Rosolio', 'Centerba', 'Genepi', 'Sambuca', 'Anisette', 'Ratafia',
        
        // Stili di birra
        'Ipa', 'Stout', 'Porter', 'Lager', 'Pilsner', 'Weiss', 'Blanche', 'Saison',
        'Tripel', 'Dubbel', 'Lambic', 'Gose', 'Sour', 'Radler', 'Shandy'
    ]
};

// Mapping stagioni - come sull'HTML
const SEASON_MAPPING = {
    'PE 25': '25E',
    'AI 25': '25I',
    'PE 24': '24E',
    'AI 24': '24I',
    'PE 26': '26E',
    'AI 26': '26I',
    'PE 27': '27E',
    'AI 27': '27I',
    'PE 28': '28E',
    'AI 28': '28I'
};

// Helper function per generare ID unico
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Helper function per ottenere tutti i nomi dal pool
function getAllPoolNames() {
    let allNames = [];
    for (const category in namePool) {
        allNames = allNames.concat(namePool[category]);
    }
    return allNames;
}

// Helper function per ottenere nomi da categorie specifiche
function getNamesFromCategories(categories) {
    let names = [];
    categories.forEach(category => {
        if (namePool[category]) {
            names = names.concat(namePool[category]);
        }
    });
    return names;
}

// Funzione per fetchare prodotti da Shopify
async function fetchAllShopifyProducts(seasonTag = null) {
    if (!SHOPIFY_ACCESS_TOKEN) {
        console.log('⚠️  Shopify non configurato - modalità demo');
        return [];
    }
    
    // Check cache first
    const cached = getCachedProducts(seasonTag);
    if (cached) {
        return cached;
    }
    
    console.log(`📥 Recupero prodotti${seasonTag ? ` per stagione ${seasonTag}` : ''} da Shopify...`);
    
    let allProducts = [];
    let page_info = null;
    let hasNextPage = true;
    let pageCount = 0;
    
    try {
        while (hasNextPage) {
            pageCount++;
            let url;
            
            if (page_info) {
                url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?page_info=${page_info}&limit=250&fields=id,title,tags`;
            } else {
                url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,tags`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`❌ Errore Shopify API: ${response.status}`);
                break;
            }
            
            const data = await response.json();
            
            // Filtra per stagione se specificata
            if (seasonTag) {
                const filtered = data.products.filter(product => 
                    product.tags && product.tags.split(', ').includes(seasonTag)
                );
                allProducts = allProducts.concat(filtered);
            } else {
                allProducts = allProducts.concat(data.products);
            }
            
            // Controlla paginazione
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const matches = linkHeader.match(/page_info=([^&>]+).*?rel="next"/);
                if (matches && matches[1]) {
                    page_info = matches[1];
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }
        
        console.log(`✅ Recuperati ${allProducts.length} prodotti in ${pageCount} pagine`);
        
        // Salva in cache
        setCachedProducts(seasonTag, allProducts);
        
    } catch (error) {
        console.error('❌ Errore durante il recupero prodotti:', error);
    }
    
    return allProducts;
}

// Fetch historical names from all seasons
async function fetchHistoricalNames() {
    const historicalNames = new Map();
    
    // Se non c'è Shopify configurato, ritorna vuoto
    if (!SHOPIFY_ACCESS_TOKEN) {
        return historicalNames;
    }
    
    try {
        const allProducts = await fetchAllShopifyProducts(); // Fetch tutti i prodotti
        
        // Raggruppa per nome e stagioni
        allProducts.forEach(product => {
            const name = product.title.trim();
            const tags = product.tags ? product.tags.split(', ') : [];
            
            // Trova tag stagione
            const seasonTag = tags.find(tag => /^\d{2}[EI]$/.test(tag));
            
            if (seasonTag) {
                if (!historicalNames.has(name)) {
                    historicalNames.set(name, new Set());
                }
                historicalNames.get(name).add(seasonTag);
            }
        });
        
        console.log(`📊 Trovati ${historicalNames.size} nomi unici storici`);
        
        // Salva in cache
        historicalNamesCache = {};
        historicalNames.forEach((seasons, name) => {
            historicalNamesCache[name] = Array.from(seasons);
        });
        
    } catch (error) {
        console.error('❌ Errore recupero nomi storici:', error);
    }
    
    return historicalNames;
}

// ROOT ENDPOINT
app.get('/', (req, res) => {
    const totalNames = getAllPoolNames().length;
    const categoriesCount = Object.keys(namePool).length;
    
    res.json({
        name: 'Loft.73 Name Generator API',
        version: '2.1',
        status: 'active',
        stats: {
            totalNames: totalNames,
            categories: categoriesCount,
            averagePerCategory: Math.round(totalNames / categoriesCount)
        },
        endpoints: {
            generate: '/api/generate-names',
            shopifyProducts: '/api/shopify/products',
            checkName: '/api/check-name',
            refreshHistorical: '/api/refresh-historical',
            stats: '/api/stats/usage'
        },
        shopify: {
            configured: !!SHOPIFY_ACCESS_TOKEN,
            store: SHOPIFY_STORE_URL
        }
    });
});

// ENDPOINT: Get Shopify products for a season
app.post('/api/shopify/products', async (req, res) => {
    const { season, forceRefresh = false } = req.body;
    
    if (!season) {
        return res.status(400).json({ 
            success: false, 
            error: 'Season parameter required' 
        });
    }
    
    const seasonTag = SEASON_MAPPING[season];
    if (!seasonTag) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid season' 
        });
    }
    
    try {
        // Se forceRefresh, svuota prima la cache
        if (forceRefresh) {
            delete shopifyCache.data[seasonTag];
            delete shopifyCache.timestamps[seasonTag];
        }
        
        const products = await fetchAllShopifyProducts(seasonTag);
        const names = [...new Set(products.map(p => p.title.trim()))];
        
        // Calcola età cache
        const cacheAge = shopifyCache.timestamps[seasonTag] ? 
            Math.round((Date.now() - shopifyCache.timestamps[seasonTag]) / 1000) : 0;
        
        res.json({
            success: true,
            season: season,
            seasonTag: seasonTag,
            totalProducts: products.length,
            count: names.length,
            names: names,
            cached: !forceRefresh && cacheAge > 0,
            cacheAge: cacheAge
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch products' 
        });
    }
});

// ENDPOINT: Generate names
app.post('/api/generate-names', async (req, res) => {
    const { count, season, mode = 'mixed', categories = [], existingNames = [] } = req.body;
    
    if (!count || count < 1) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid count parameter' 
        });
    }
    
    const seasonTag = SEASON_MAPPING[season];
    if (!seasonTag) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid season' 
        });
    }
    
    try {
        // Ottieni i nomi dal pool in base alle categorie selezionate
        let poolNames = categories.length > 0 
            ? getNamesFromCategories(categories) 
            : getAllPoolNames();
        
        // Rimuovi duplicati e converti a lowercase per confronto
        poolNames = [...new Set(poolNames)];
        const existingLower = existingNames.map(n => n.toLowerCase().trim());
        
        // Filtra i nomi disponibili (non usati nella stagione corrente)
        const availableNames = poolNames.filter(name => 
            !existingLower.includes(name.toLowerCase().trim())
        );
        
        let selectedNames = [];
        let sourceCounts = { pool: 0, otherSeasons: 0 };
        
        if (mode === 'new') {
            // Solo nomi mai usati prima
            const historicalNames = await fetchHistoricalNames();
            const neverUsedNames = availableNames.filter(name => 
                !historicalNames.has(name)
            );
            
            if (neverUsedNames.length < count) {
                return res.json({
                    success: false,
                    warning: `Solo ${neverUsedNames.length} nomi mai usati disponibili. Riduci la quantità o cambia modalità.`,
                    names: [],
                    sources: sourceCounts
                });
            }
            
            // Shuffle e seleziona
            const shuffled = neverUsedNames.sort(() => 0.5 - Math.random());
            selectedNames = shuffled.slice(0, count).map(name => ({
                id: generateId(),
                name: name,
                source: 'pool'
            }));
            sourceCounts.pool = count;
            
        } else if (mode === 'reused') {
            // Solo nomi già usati in altre stagioni
            const historicalNames = await fetchHistoricalNames();
            const reusableNames = availableNames.filter(name => {
                const seasons = historicalNames.get(name);
                return seasons && seasons.size > 0 && !seasons.has(seasonTag);
            });
            
            if (reusableNames.length < count) {
                return res.json({
                    success: false,
                    warning: `Solo ${reusableNames.length} nomi riutilizzabili disponibili. Assicurati che Shopify abbia prodotti di altre stagioni.`,
                    names: [],
                    sources: sourceCounts
                });
            }
            
            // Shuffle e seleziona
            const shuffled = reusableNames.sort(() => 0.5 - Math.random());
            selectedNames = shuffled.slice(0, count).map(name => ({
                id: generateId(),
                name: name,
                source: 'other-seasons'
            }));
            sourceCounts.otherSeasons = count;
            
        } else {
            // Mode 'mixed' - 60% nuovi, 40% riutilizzati
            const newCount = Math.ceil(count * 0.6);
            const reusedCount = count - newCount;
            
            // Fetch historical names
            const historicalNames = await fetchHistoricalNames();
            
            // Separa nomi nuovi e riutilizzabili
            const neverUsedNames = availableNames.filter(name => 
                !historicalNames.has(name)
            );
            const reusableNames = availableNames.filter(name => {
                const seasons = historicalNames.get(name);
                return seasons && seasons.size > 0 && !seasons.has(seasonTag);
            });
            
            // Genera nomi nuovi
            let newNames = [];
            if (neverUsedNames.length >= newCount) {
                const shuffled = neverUsedNames.sort(() => 0.5 - Math.random());
                newNames = shuffled.slice(0, newCount).map(name => ({
                    id: generateId(),
                    name: name,
                    source: 'pool'
                }));
                sourceCounts.pool = newCount;
            } else {
                // Se non ci sono abbastanza nuovi, usa tutti quelli disponibili
                newNames = neverUsedNames.map(name => ({
                    id: generateId(),
                    name: name,
                    source: 'pool'
                }));
                sourceCounts.pool = newNames.length;
            }
            
            // Genera nomi riutilizzati
            let reusedNames = [];
            const remainingCount = count - newNames.length;
            if (reusableNames.length >= remainingCount) {
                const shuffled = reusableNames.sort(() => 0.5 - Math.random());
                reusedNames = shuffled.slice(0, remainingCount).map(name => ({
                    id: generateId(),
                    name: name,
                    source: 'other-seasons'
                }));
                sourceCounts.otherSeasons = remainingCount;
            } else {
                // Se non ci sono abbastanza riutilizzabili, usa il resto dal pool nuovo
                reusedNames = reusableNames.map(name => ({
                    id: generateId(),
                    name: name,
                    source: 'other-seasons'
                }));
                sourceCounts.otherSeasons = reusedNames.length;
                
                // Completa con altri nomi nuovi se necessario
                const stillNeeded = count - newNames.length - reusedNames.length;
                if (stillNeeded > 0) {
                    const remainingNew = neverUsedNames
                        .filter(n => !newNames.find(nn => nn.name === n))
                        .sort(() => 0.5 - Math.random())
                        .slice(0, stillNeeded)
                        .map(name => ({
                            id: generateId(),
                            name: name,
                            source: 'pool'
                        }));
                    newNames = newNames.concat(remainingNew);
                    sourceCounts.pool += remainingNew.length;
                }
            }
            
            selectedNames = [...newNames, ...reusedNames];
        }
        
        // Mescola risultato finale
        selectedNames = selectedNames.sort(() => 0.5 - Math.random());
        
        // Aggiungi ai nomi usati
        selectedNames.forEach(item => {
            usedNamesCache.add(item.name);
            allUsedNames.push({
                name: item.name,
                season: seasonTag,
                timestamp: new Date()
            });
        });
        
        res.json({
            success: true,
            count: selectedNames.length,
            names: selectedNames,
            sources: sourceCounts,
            season: season,
            seasonTag: seasonTag,
            mode: mode,
            categories: categories
        });
        
    } catch (error) {
        console.error('Error generating names:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate names' 
        });
    }
});

// ENDPOINT: Check name availability
app.post('/api/check-name', async (req, res) => {
    const { name, currentSeason } = req.body;
    
    if (!name) {
        return res.status(400).json({ 
            success: false, 
            error: 'Name parameter required' 
        });
    }
    
    try {
        // Verifica se il nome esiste nel pool
        const allPoolNames = getAllPoolNames();
        const existsInPool = allPoolNames.some(n => 
            n.toLowerCase().trim() === name.toLowerCase().trim()
        );
        
        // Fetch tutti i prodotti Shopify per verificare uso storico
        const allProducts = await fetchAllShopifyProducts();
        
        // Trova tutte le stagioni dove è stato usato
        const usedInSeasons = [];
        allProducts.forEach(product => {
            if (product.title.toLowerCase().trim() === name.toLowerCase().trim()) {
                const tags = product.tags ? product.tags.split(', ') : [];
                const seasonTag = tags.find(tag => /^\d{2}[EI]$/.test(tag));
                if (seasonTag && !usedInSeasons.find(s => s.tag === seasonTag)) {
                    // Converti tag in formato leggibile
                    const year = '20' + seasonTag.substring(0, 2);
                    const season = seasonTag.endsWith('E') ? 'PE' : 'AI';
                    usedInSeasons.push({
                        tag: seasonTag,
                        display: `${season} ${year}`
                    });
                }
            }
        });
        
        // Verifica disponibilità per la stagione corrente
        const availableInCurrentSeason = !usedInSeasons.some(s => s.tag === currentSeason);
        
        res.json({
            success: true,
            name: name,
            existsInPool: existsInPool,
            usedInSeasons: usedInSeasons,
            availableInCurrentSeason: availableInCurrentSeason,
            currentSeason: currentSeason
        });
        
    } catch (error) {
        console.error('Error checking name:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check name' 
        });
    }
});

// ENDPOINT: Refresh historical names cache
app.post('/api/refresh-historical', async (req, res) => {
    try {
        // Svuota tutte le cache
        shopifyCache.data = {};
        shopifyCache.timestamps = {};
        
        // Ricarica nomi storici
        const historicalNames = await fetchHistoricalNames();
        
        res.json({
            success: true,
            totalHistoricalNames: historicalNames.size,
            message: 'Cache refreshed successfully'
        });
    } catch (error) {
        console.error('Error refreshing historical data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to refresh historical data' 
        });
    }
});

// ENDPOINT: Get usage statistics
app.get('/api/stats/usage', async (req, res) => {
    try {
        const historicalNames = await fetchHistoricalNames();
        const totalPoolNames = getAllPoolNames().length;
        
        // Calcola statistiche
        const neverUsedCount = totalPoolNames - historicalNames.size;
        const usedOnceCount = Array.from(historicalNames.values()).filter(s => s.size === 1).length;
        const usedMultipleCount = Array.from(historicalNames.values()).filter(s => s.size > 1).length;
        
        res.json({
            success: true,
            totalPoolNames: totalPoolNames,
            totalHistoricalNames: historicalNames.size,
            neverUsedNames: neverUsedCount,
            usedOnceNames: usedOnceCount,
            usedMultipleTimesNames: usedMultipleCount,
            categoriesCount: Object.keys(namePool).length,
            shopifyConfigured: !!SHOPIFY_ACCESS_TOKEN
        });
    } catch (error) {
        console.error('Error getting usage stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get usage statistics' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        shopify: {
            configured: !!SHOPIFY_ACCESS_TOKEN,
            cacheSize: Object.keys(shopifyCache.data).length
        }
    });
});

// Avvio server
app.listen(PORT, async () => {
    console.log(`
    🚀 Loft.73 Name Generator API v2.1
    ✅ Server attivo su porta ${PORT}
    📊 Totale nomi nel pool: ${getAllPoolNames().length}
    📁 Categorie disponibili: ${Object.keys(namePool).length}
    🔗 Endpoint principale: http://localhost:${PORT}
    `);
    
    // Log delle categorie
    console.log('\n📋 Categorie e conteggi:');
    for (const category in namePool) {
        console.log(`   - ${category}: ${namePool[category].length} nomi`);
    }
    
    // Precarica i nomi storici se Shopify è configurato
    if (SHOPIFY_ACCESS_TOKEN) {
        console.log('\n⏳ Caricamento nomi storici da Shopify...');
        const historicalNames = await fetchHistoricalNames();
        console.log(`✅ Caricati ${historicalNames.size} nomi storici totali`);
    } else {
        console.log('\n⚠️  Shopify non configurato - modalità demo attiva');
    }
});
