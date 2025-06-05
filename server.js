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

// POOL DI NOMI AGGIORNATO - 4700+ nomi
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
        'Pavone', 'Fagiano', 'Pernice', 'Starna', 'Quaglia', 'Francolino',
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
    
    // NATURA E GEOGRAFIA (300+)
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
        'Marea', 'Corrente', 'Risacca', 'Bonaccia', 'Tempesta'
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
    
    // FIORI E PIANTE (350+)
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
        'Mandevilla', 'Dipladenia', 'Allamanda', 'Bignonia', 'Cobea',
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
        'Peperoncino', 'Paprika', 'Rafano', 'Senape', 'Cappero'
    ],
    
    // CONCETTI POSITIVI (150+)
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
        'Purezza', 'Innocenza', 'Candore', 'Modestia', 'Umiltà',
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
        'Passato', 'Presente', 'Futuro', 'Ieri', 'Oggi', 'Domani', 'Sempre'
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
        
        // Musei e gallerie
        'Louvre', 'Orsay', 'Pompidou', 'Rodin', 'Picasso', 'Uffizi', 'Pitti',
        'Accademia', 'Bargello', 'Borghese', 'Vaticani', 'Sistina', 'Capitolini',
        'Prado', 'Reina Sofia', 'Thyssen', 'Hermitage', 'Tretyakov', 'British',
        'National', 'Tate', 'Victoria', 'Metropolitan', 'MoMA', 'Guggenheim',
        'Whitney', 'Frick', 'Getty', 'Smithsonian', 'Rijksmuseum', 'Mauritshuis',
        'Kunsthistorisches', 'Belvedere', 'Albertina', 'Pergamon', 'Neue', 'Alte',
        
        // Tecniche artistiche
        'Olio', 'Tempera', 'Acquerello', 'Gouache', 'Pastello', 'Carboncino',
        'Sanguigna', 'Seppia', 'China', 'Matita', 'Gessetto', 'Encausto',
        'Affresco', 'Mosaico', 'Intarsio', 'Tarsìa', 'Graffito', 'Stucco',
        'Bassorilievo', 'Altorilievo', 'Tuttotondo', 'Fusione', 'Cesello',
        'Sbalzo', 'Incisione', 'Acquaforte', 'Bulino', 'Puntasecca', 'Litografia',
        'Serigrafia', 'Xilografia', 'Collage', 'Assemblage', 'Decoupage',
        
        // Termini artistici
        'Chiaroscuro', 'Sfumato', 'Cangiante', 'Unione', 'Contrapposto', 'Scorco',
        'Prospettiva', 'Anatomia', 'Proporzione', 'Simmetria', 'Equilibrio',
        'Armonia', 'Ritmo', 'Movimento', 'Dinamismo', 'Tensione', 'Contrasto',
        'Tonalità', 'Luminosità', 'Saturazione', 'Velatura', 'Impasto', 'Pennellata',
        'Texture', 'Pattern', 'Composizione', 'Inquadratura', 'Punto di fuga',
        'Orizzonte', 'Profondità', 'Volume', 'Spazio', 'Forma', 'Linea', 'Colore',
        
        // Architettura
        'Colonna', 'Capitello', 'Architrave', 'Fregio', 'Cornice', 'Timpano',
        'Arco', 'Volta', 'Cupola', 'Abside', 'Navata', 'Transetto', 'Cripta',
        'Campanile', 'Guglia', 'Pinnacolo', 'Rosone', 'Loggia', 'Portico',
        'Chiostro', 'Cortile', 'Facciata', 'Balaustra', 'Cornicione', 'Lesena',
        'Parasta', 'Pilastro', 'Contrafforte', 'Arbotante', 'Merlatura', 'Bastione',
        
        // Letteratura e poesia
        'Sonetto', 'Canzone', 'Ballata', 'Madrigale', 'Ode', 'Elegia', 'Idillio',
        'Epigramma', 'Satira', 'Commedia', 'Tragedia', 'Dramma', 'Melodramma',
        'Novella', 'Romanzo', 'Fiaba', 'Favola', 'Leggenda', 'Mito', 'Saga',
        'Epopea', 'Cronaca', 'Memoria', 'Diario', 'Epistola', 'Trattato', 'Saggio'
    ],
    
    // MUSICA E DANZA (300+)
    musicDance: [
        // Strumenti musicali
        'Pianoforte', 'Clavicembalo', 'Organo', 'Celesta', 'Arpa', 'Lira', 'Cetra',
        'Violino', 'Viola', 'Violoncello', 'Contrabbasso', 'Chitarra', 'Liuto',
        'Mandolino', 'Banjo', 'Ukulele', 'Balalaika', 'Sitar', 'Bouzouki',
        'Flauto', 'Ottavino', 'Oboe', 'Clarinetto', 'Fagotto', 'Sassofono',
        'Tromba', 'Trombone', 'Corno', 'Tuba', 'Eufonio', 'Cornetta', 'Flicorno',
        'Tamburo', 'Timpano', 'Grancassa', 'Rullante', 'Tom', 'Bongo', 'Conga',
        'Djembe', 'Tabla', 'Darbuka', 'Cajon', 'Xilofono', 'Marimba', 'Vibrafono',
        'Glockenspiel', 'Campane', 'Campanelli', 'Piatti', 'Gong', 'Triangolo',
        'Nacchere', 'Maracas', 'Sonagli', 'Tamburello', 'Castagnette',
        
        // Generi musicali
        'Classica', 'Barocca', 'Romantica', 'Moderna', 'Contemporanea', 'Opera',
        'Operetta', 'Musical', 'Jazz', 'Blues', 'Swing', 'Bebop', 'Cool', 'Fusion',
        'Latin', 'Bossa Nova', 'Samba', 'Tango', 'Mambo', 'Salsa', 'Merengue',
        'Bachata', 'Reggaeton', 'Rock', 'Pop', 'Soul', 'Funk', 'Disco', 'House',
        'Techno', 'Trance', 'Ambient', 'Lounge', 'Chill', 'Folk', 'Country',
        'Gospel', 'Spiritual', 'Reggae', 'Ska', 'Dub', 'Afrobeat', 'Flamenco',
        
        // Forme musicali
        'Sinfonia', 'Concerto', 'Sonata', 'Suite', 'Partita', 'Toccata', 'Fuga',
        'Preludio', 'Fantasia', 'Rapsodia', 'Scherzo', 'Notturno', 'Serenata',
        'Divertimento', 'Cassazione', 'Variazione', 'Rondò', 'Minuetto', 'Gavotta',
        'Sarabanda', 'Giga', 'Allemanda', 'Corrente', 'Bourrée', 'Rigaudon',
        'Passacaglia', 'Ciaccona', 'Pavana', 'Gagliarda', 'Saltarello', 'Tarantella',
        'Mazurka', 'Polka', 'Valzer', 'Ländler', 'Polonaise', 'Barcarola',
        
        // Danze classiche
        'Ballet', 'Arabesque', 'Attitude', 'Plié', 'Relevé', 'Tendu', 'Dégagé',
        'Rond de jambe', 'Fondu', 'Frappé', 'Adagio', 'Pirouette', 'Fouetté',
        'Tour', 'Sauté', 'Échappé', 'Assemblé', 'Jeté', 'Sissonne', 'Cabriole',
        'Entrechat', 'Pas de deux', 'Pas de trois', 'Pas de quatre', 'Grand jeté',
        'Penché', 'Cambré', 'Port de bras', 'Épaulement', 'Croisé', 'Effacé',
        
        // Danze del mondo
        'Flamenco', 'Sevillanas', 'Bulería', 'Soleá', 'Alegrías', 'Fandango',
        'Paso doble', 'Jota', 'Sardana', 'Muñeira', 'Czardas', 'Krakowiak',
        'Hopak', 'Kazachok', 'Troika', 'Kalinka', 'Sirtaki', 'Hasapiko',
        'Hora', 'Dabke', 'Bellydance', 'Kathak', 'Bharatanatyam', 'Odissi',
        'Kuchipudi', 'Mohiniyattam', 'Kabuki', 'Noh', 'Butoh', 'Capoeira',
        'Forró', 'Frevo', 'Axé', 'Cumbia', 'Joropo', 'Marinera', 'Cueca',
        'Candombe', 'Murga', 'Milonga', 'Chacarera', 'Zamba', 'Chamame',
        
        // Termini musicali
        'Allegro', 'Andante', 'Adagio', 'Largo', 'Presto', 'Vivace', 'Moderato',
        'Maestoso', 'Dolce', 'Cantabile', 'Espressivo', 'Agitato', 'Tranquillo',
        'Crescendo', 'Diminuendo', 'Forte', 'Piano', 'Mezzo', 'Fortissimo',
        'Pianissimo', 'Staccato', 'Legato', 'Rubato', 'Accelerando', 'Ritardando',
        'Fermata', 'Corona', 'Segno', 'Coda', 'Fine', 'Ripresa', 'Volta'
    ],
    
    // ENOGASTRONOMIA (300+)
    enogastronomy: [
        // Vini italiani
        'Barolo', 'Barbaresco', 'Nebbiolo', 'Barbera', 'Dolcetto', 'Grignolino',
        'Freisa', 'Arneis', 'Cortese', 'Moscato', 'Brachetto', 'Ruché', 'Erbaluce',
        'Brunello', 'Rosso di Montalcino', 'Chianti', 'Vino Nobile', 'Morellino',
        'Carmignano', 'Bolgheri', 'Vernaccia', 'Trebbiano', 'Vermentino', 'Ansonica',
        'Amarone', 'Valpolicella', 'Prosecco', 'Franciacorta', 'Lugana', 'Bardolino',
        'Soave', 'Custoza', 'Pinot Grigio', 'Gewürztraminer', 'Müller-Thurgau',
        'Lagrein', 'Marzemino', 'Teroldego', 'Nosiola', 'Schiava', 'Refosco',
        'Friulano', 'Ribolla', 'Vitovska', 'Malvasia', 'Picolit', 'Ramandolo',
        'Verduzzo', 'Lambrusco', 'Sangiovese', 'Montepulciano', 'Aglianico',
        'Taurasi', 'Fiano', 'Falanghina', 'Greco', 'Coda di Volpe', 'Biancolella',
        'Forastera', 'Piedirosso', 'Primitivo', 'Negroamaro', 'Nero di Troia',
        'Bombino', 'Moscato di Trani', 'Castel del Monte', 'Gaglioppo', 'Cirò',
        'Pecorello', 'Mantonico', 'Greco di Bianco', 'Cerasuolo', 'Cannonau',
        'Vermentino di Sardegna', 'Carignano', 'Monica', 'Nuragus', 'Vernaccia di Oristano',
        'Malvasia di Bosa', 'Moscato di Sorso', 'Marsala', 'Passito di Pantelleria',
        'Malvasia delle Lipari', 'Grillo', 'Catarratto', 'Inzolia', 'Zibibbo',
        'Nero d\'Avola', 'Frappato', 'Perricone', 'Nerello Mascalese', 'Carricante',
        
        // Formaggi italiani
        'Parmigiano', 'Grana', 'Pecorino', 'Gorgonzola', 'Taleggio', 'Fontina',
        'Asiago', 'Montasio', 'Piave', 'Stracchino', 'Crescenza', 'Robiola',
        'Quartirolo', 'Bitto', 'Casera', 'Valtellina', 'Bagòss', 'Branzi',
        'Formai de Mut', 'Salva', 'Provolone', 'Caciocavallo', 'Ragusano',
        'Fiore Sardo', 'Castelmagno', 'Raschera', 'Toma', 'Murazzano', 'Bra',
        'Casciotta', 'Marzolino', 'Raviggiolo', 'Squacquerone', 'Formaggio di Fossa',
        'Casatella', 'Morlacco', 'Bastardo', 'Puzzone', 'Vezzena', 'Spressa',
        'Canestrato', 'Cacioricotta', 'Burrata', 'Stracciatella', 'Mozzarella',
        'Fior di Latte', 'Provola', 'Scamorza', 'Burrino', 'Manteca',
        
        // Salumi italiani
        'Prosciutto', 'Culatello', 'Mortadella', 'Salame', 'Coppa', 'Pancetta',
        'Guanciale', 'Lardo', 'Bresaola', 'Speck', 'Lonza', 'Finocchiona',
        'Soppressata', 'Nduja', 'Capocollo', 'Porchetta', 'Cotechino', 'Zampone',
        'Salama da sugo', 'Mariola', 'Violino', 'Mocetta', 'Salsiccia', 'Luganega',
        'Musetto', 'Ossocollo', 'Ciabuscolo', 'Ciauscolo', 'Lonzino', 'Ventricina',
        
        // Dolci e dessert
        'Tiramisù', 'Cannolo', 'Cassata', 'Sfogliatella', 'Babà', 'Pastiera',
        'Zeppola', 'Struffoli', 'Panettone', 'Pandoro', 'Colomba', 'Maritozzo',
        'Bignè', 'Profiterole', 'Millefoglie', 'Crostata', 'Sbrisolona', 'Torrone',
        'Cantucci', 'Ricciarelli', 'Amaretti', 'Baci di dama', 'Krumiri', 'Savoiardi',
        'Mostaccioli', 'Roccocò', 'Susamielli', 'Cartellate', 'Pignolata', 'Seadas',
        'Pardulas', 'Papassini', 'Gueffus', 'Cubbaita', 'Pignoccata', 'Torta Barozzi',
        'Torta Tenerina', 'Torta Caprese', 'Delizia', 'Pasticciotto', 'Bocconotto',
        'Fregolotta', 'Fugassa', 'Focaccia', 'Schiacciata', 'Pinza', 'Gubana',
        'Putizza', 'Presnitz', 'Strudel', 'Zelten', 'Panforte', 'Cavallucci',
        'Copate', 'Frustingo', 'Panpepato', 'Bensone', 'Spongata', 'Buccellato',
        
        // Piatti tipici
        'Carbonara', 'Amatriciana', 'Gricia', 'Cacio e pepe', 'Arrabbiata', 'Puttanesca',
        'Aglio e olio', 'Vongole', 'Pescatore', 'Norma', 'Trapanese', 'Pesto',
        'Ragù', 'Bolognese', 'Lasagne', 'Tortellini', 'Cappelletti', 'Passatelli',
        'Tagliatelle', 'Pappardelle', 'Maltagliati', 'Garganelli', 'Strozzapreti',
        'Orecchiette', 'Cavatelli', 'Trofie', 'Corzetti', 'Pansotti', 'Culurgiones',
        'Malloreddus', 'Fregola', 'Pizzoccheri', 'Canederli', 'Spätzle', 'Risotto',
        'Ossobuco', 'Cotoletta', 'Cassoeula', 'Trippa', 'Lampredotto', 'Peposo',
        'Cacciucco', 'Baccalà', 'Stoccafisso', 'Brodetto', 'Frittura', 'Polenta',
        'Farinata', 'Cecina', 'Panissa', 'Ribollita', 'Pappa', 'Acquacotta',
        'Panzanella', 'Fettunta', 'Bruschetta', 'Crostino', 'Supplì', 'Arancino',
        'Panzerotto', 'Calzone', 'Pizza', 'Focaccia', 'Piadina', 'Crescione',
        'Gnocco', 'Tigelle', 'Borlengo', 'Erbazzone', 'Pasqualina', 'Farinata',
        'Vitello tonnato', 'Bagna cauda', 'Finanziera', 'Bollito', 'Brasato',
        'Abbacchio', 'Saltimbocca', 'Involtini', 'Parmigiana', 'Caponata', 'Peperonata'
    ],
    
    // ELEMENTI E FENOMENI (200+)
    elementsAndPhenomena: [
        // Elementi naturali
        'Acqua', 'Aria', 'Terra', 'Fuoco', 'Ghiaccio', 'Vapore', 'Nebbia', 'Foschia',
        'Rugiada', 'Brina', 'Galaverna', 'Cristallo', 'Quarzo', 'Sale', 'Sabbia',
        'Polvere', 'Cenere', 'Lava', 'Magma', 'Roccia', 'Pietra', 'Argilla', 'Fango',
        'Torba', 'Humus', 'Linfa', 'Resina', 'Ambra', 'Cera', 'Miele', 'Nettare',
        
        // Fenomeni atmosferici
        'Vento', 'Brezza', 'Refolo', 'Folata', 'Raffica', 'Bufera', 'Tormenta',
        'Uragano', 'Tornado', 'Tromba', 'Ciclone', 'Monsone', 'Tempesta', 'Temporale',
        'Pioggia', 'Pioviggine', 'Acquazzone', 'Rovescio', 'Nubifragio', 'Diluvio',
        'Grandine', 'Neve', 'Nevischio', 'Slavina', 'Valanga', 'Gelo', 'Disgelo',
        'Fulmine', 'Lampo', 'Tuono', 'Saetta', 'Folgore', 'Baleno', 'Bagliore',
        
        // Fenomeni luminosi
        'Luce', 'Ombra', 'Penombra', 'Chiarore', 'Bagliore', 'Riflesso', 'Riverbero',
        'Luccichio', 'Scintillio', 'Barbaglio', 'Abbaglio', 'Raggio', 'Fascio',
        'Alone', 'Aureola', 'Nimbo', 'Corona', 'Iride', 'Arcobaleno', 'Spettro',
        'Prisma', 'Rifrazione', 'Diffrazione', 'Interferenza', 'Polarizzazione',
        
        // Fenomeni sonori
        'Suono', 'Rumore', 'Silenzio', 'Eco', 'Risonanza', 'Vibrazione', 'Onda',
        'Frequenza', 'Armonia', 'Melodia', 'Accordo', 'Dissonanza', 'Consonanza',
        'Sussurro', 'Bisbiglio', 'Mormorio', 'Fruscio', 'Sibilo', 'Fischio', 'Urlo',
        'Grido', 'Lamento', 'Gemito', 'Sospiro', 'Respiro', 'Soffio', 'Alito',
        
        // Fenomeni termici
        'Calore', 'Freddo', 'Tiepido', 'Gelido', 'Bollente', 'Ardente', 'Rovente',
        'Incandescente', 'Fiamma', 'Fiammella', 'Scintilla', 'Favilla', 'Brace',
        'Carbone', 'Tizzone', 'Combustione', 'Incendio', 'Rogo', 'Falò', 'Focolare',
        
        // Fenomeni temporali
        'Istante', 'Attimo', 'Momento', 'Secondo', 'Minuto', 'Ora', 'Giorno', 'Notte',
        'Alba', 'Aurora', 'Mattino', 'Mezzogiorno', 'Pomeriggio', 'Tramonto',
        'Crepuscolo', 'Imbrunire', 'Sera', 'Vespro', 'Notturno', 'Mezzanotte',
        'Stagione', 'Ciclo', 'Periodo', 'Era', 'Epoca', 'Età', 'Evo', 'Eternità',
        
        // Fenomeni cosmici
        'Cosmo', 'Universo', 'Galassia', 'Nebulosa', 'Stella', 'Pianeta', 'Satellite',
        'Asteroide', 'Cometa', 'Meteora', 'Meteorite', 'Eclissi', 'Congiunzione',
        'Opposizione', 'Solstizio', 'Equinozio', 'Zenith', 'Nadir', 'Orizzonte'
    ],
    
    // MARE E COSTE (200+)
    seaAndCoasts: [
        // Termini marini
        'Onda', 'Ondata', 'Maretta', 'Mareggiata', 'Marea', 'Riflusso', 'Flusso',
        'Risacca', 'Corrente', 'Gorgo', 'Mulinello', 'Vortice', 'Schiuma', 'Spuma',
        'Sprazzo', 'Salsedine', 'Brezza', 'Libeccio', 'Maestrale', 'Scirocco',
        'Tramontana', 'Grecale', 'Levante', 'Ponente', 'Bonaccia', 'Burrasca',
        
        // Elementi costieri
        'Spiaggia', 'Arenile', 'Battigia', 'Riva', 'Lido', 'Scogliera', 'Falesia',
        'Promontorio', 'Capo', 'Punta', 'Baia', 'Insenatura', 'Cala', 'Rada',
        'Porto', 'Approdo', 'Molo', 'Banchina', 'Pontile', 'Faro', 'Fanale',
        'Diga', 'Frangiflutti', 'Scalo', 'Darsena', 'Marina', 'Rimessaggio',
        
        // Vita marina
        'Alga', 'Posidonia', 'Corallo', 'Madrepora', 'Anemone', 'Attinia', 'Riccio',
        'Stella', 'Medusa', 'Polpo', 'Seppia', 'Calamaro', 'Totano', 'Moscardino',
        'Aragosta', 'Astice', 'Gambero', 'Scampo', 'Granchio', 'Paguro', 'Mitilo',
        'Cozza', 'Vongola', 'Tellina', 'Ostrica', 'Capasanta', 'Pettine', 'Fasolaro',
        'Cannolicchio', 'Dattero', 'Patella', 'Lumachino', 'Murice', 'Buccino',
        
        // Imbarcazioni
        'Barca', 'Nave', 'Vascello', 'Veliero', 'Brigantino', 'Goletta', 'Caravella',
        'Galeone', 'Fregata', 'Corvetta', 'Vela', 'Albero', 'Sartiame', 'Timone',
        'Prua', 'Poppa', 'Carena', 'Chiglia', 'Stiva', 'Ponte', 'Cabina', 'Cambusa',
        'Ancora', 'Catena', 'Ormeggio', 'Cima', 'Nodo', 'Gassa', 'Parabordo',
        'Salvagente', 'Zattera', 'Scialuppa', 'Canotto', 'Gommone', 'Kayak',
        
        // Spiagge italiane famose
        'Rimini', 'Riccione', 'Cattolica', 'Cesenatico', 'Cervia', 'Viareggio',
        'Forte dei Marmi', 'Marina di Pietrasanta', 'Lido di Camaiore', 'Castiglioncello',
        'San Vincenzo', 'Follonica', 'Punta Ala', 'Castiglione', 'Orbetello',
        'Ansedonia', 'Feniglia', 'Giannella', 'Argentario', 'Sperlonga', 'Gaeta',
        'Formia', 'Terracina', 'Sabaudia', 'San Felice', 'Fregene', 'Ostia',
        'Anzio', 'Nettuno', 'Circeo', 'Positano', 'Amalfi', 'Ravello', 'Maiori',
        'Minori', 'Cetara', 'Vietri', 'Sorrento', 'Massa Lubrense', 'Nerano',
        'Marina Grande', 'Marina Piccola', 'Palinuro', 'Marina di Camerota', 'Sapri',
        'Maratea', 'Praia', 'Scalea', 'Diamante', 'Tropea', 'Pizzo', 'Scilla',
        'Taormina', 'Giardini', 'Letojanni', 'Cefalù', 'Mondello', 'San Vito',
        'Scopello', 'Castellammare', 'Favignana', 'Levanzo', 'Marettimo',
        'Stintino', 'Pelosa', 'Alghero', 'Bosa', 'Cala Luna', 'Cala Goloritzè',
        'Villasimius', 'Chia', 'Tuerredda', 'Porto Pino', 'Costa Rei', 'San Teodoro'
    ],
    
    // TEATRO E CINEMA (200+)
    theaterAndCinema: [
        // Termini teatrali
        'Scena', 'Palcoscenico', 'Ribalta', 'Quinta', 'Fondale', 'Sipario',
        'Boccascena', 'Proscenio', 'Platea', 'Palco', 'Loggione', 'Galleria',
        'Camerino', 'Foyer', 'Ridotto', 'Botteghino', 'Maschera', 'Programma',
        'Locandina', 'Manifesto', 'Replica', 'Debutto', 'Prima', 'Anteprima',
        'Tournée', 'Cartellone', 'Stagione', 'Repertorio', 'Copione', 'Battuta',
        'Monologo', 'Dialogo', 'Tirata', 'Aparté', 'Didascalia', 'Prologo',
        'Epilogo', 'Atto', 'Scena', 'Quadro', 'Intermezzo', 'Intervallo',
        
        // Generi teatrali
        'Tragedia', 'Commedia', 'Dramma', 'Farsa', 'Pochade', 'Vaudeville',
        'Musical', 'Operetta', 'Cabaret', 'Varietà', 'Rivista', 'Avanspettacolo',
        'Mimo', 'Pantomima', 'Balletto', 'Danza', 'Performance', 'Happening',
        
        // Figure teatrali
        'Attore', 'Attrice', 'Protagonista', 'Deuteragonista', 'Antagonista',
        'Comparsa', 'Figurante', 'Corista', 'Ballerino', 'Mimo', 'Giullare',
        'Menestrello', 'Cantastorie', 'Regista', 'Scenografo', 'Costumista',
        'Truccatore', 'Parrucchiere', 'Direttore', 'Coreografo', 'Dramaturg',
        'Suggeritore', 'Macchinista', 'Elettricista', 'Fonico', 'Trovarobe',
        
        // Termini cinematografici  
        'Film', 'Pellicola', 'Cinema', 'Schermo', 'Proiezione', 'Inquadratura',
        'Piano', 'Campo', 'Controcampo', 'Sequenza', 'Scena', 'Take', 'Ciak',
        'Montaggio', 'Dissolvenza', 'Stacco', 'Flashback', 'Flashforward',
        'Zoom', 'Carrellata', 'Panoramica', 'Steadicam', 'Dolly', 'Travelling',
        'Primo piano', 'Piano americano', 'Campo lungo', 'Totale', 'Dettaglio',
        'Soggettiva', 'Oggettiva', 'Fuori campo', 'Voice over', 'Colonna sonora',
        'Doppiaggio', 'Sottotitoli', 'Titoli di testa', 'Titoli di coda', 'Credits',
        
        // Generi cinematografici
        'Western', 'Noir', 'Thriller', 'Horror', 'Fantasy', 'Fantascienza',
        'Avventura', 'Azione', 'Romantico', 'Drammatico', 'Biografico', 'Storico',
        'Guerra', 'Documentario', 'Animazione', 'Cortometraggio', 'Lungometraggio',
        
        // Premi e festival
        'Oscar', 'Cannes', 'Venezia', 'Berlino', 'Sundance', 'Toronto', 'Leone',
        'Palma', 'Orso', 'Coppa', 'David', 'Nastro', 'Ciak', 'Globo', 'Bafta',
        'César', 'Goya', 'Festival', 'Rassegna', 'Mostra', 'Concorso', 'Premio'
    ],
    
    // LETTERATURA (200+)
    literature: [
        // Generi letterari
        'Romanzo', 'Novella', 'Racconto', 'Fiaba', 'Favola', 'Leggenda', 'Mito',
        'Saga', 'Epopea', 'Poema', 'Poesia', 'Lirica', 'Epica', 'Didascalica',
        'Sonetto', 'Canzone', 'Ballata', 'Madrigale', 'Ode', 'Elegia', 'Idillio',
        'Egloga', 'Satira', 'Epigramma', 'Haiku', 'Tanka', 'Ghazal', 'Rondeau',
        
        // Elementi narrativi
        'Trama', 'Intreccio', 'Fabula', 'Intrigo', 'Climax', 'Epilogo', 'Prologo',
        'Incipit', 'Explicit', 'Flashback', 'Analessi', 'Prolessi', 'Ellissi',
        'Digressione', 'Suspense', 'Colpo di scena', 'Agnizione', 'Peripezia',
        'Catarsi', 'Deus ex machina', 'In medias res', 'Crescendo', 'Anticlimax',
        
        // Figure retoriche
        'Metafora', 'Similitudine', 'Allegoria', 'Simbolo', 'Metonimia', 'Sineddoche',
        'Ossimoro', 'Paradosso', 'Iperbole', 'Litote', 'Ironia', 'Sarcasmo',
        'Antitesi', 'Chiasmo', 'Anafora', 'Epifora', 'Allitterazione', 'Assonanza',
        'Consonanza', 'Onomatopea', 'Sinestesia', 'Enjambement', 'Cesura', 'Rima',
        
        // Personaggi letterari famosi
        'Beatrice', 'Laura', 'Fiammetta', 'Angelica', 'Bradamante', 'Clorinda',
        'Erminia', 'Armida', 'Sofronia', 'Silvia', 'Amarilli', 'Filli', 'Clori',
        'Giulietta', 'Desdemona', 'Ofelia', 'Cordelia', 'Miranda', 'Viola',
        'Porzia', 'Rosalinda', 'Elena', 'Ermengarda', 'Adelchi', 'Gertrude',
        'Lucia', 'Agnese', 'Perpetua', 'Pisana', 'Fosca', 'Lia', 'Silvia',
        
        // Autori classici
        'Dante', 'Petrarca', 'Boccaccio', 'Ariosto', 'Tasso', 'Machiavelli',
        'Guicciardini', 'Castiglione', 'Bembo', 'Poliziano', 'Boiardo', 'Pulci',
        'Goldoni', 'Alfieri', 'Parini', 'Foscolo', 'Leopardi', 'Manzoni',
        'Pellico', 'Grossi', 'Berchet', 'Porta', 'Belli', 'Giusti', 'Guerrazzi',
        'Carducci', 'Pascoli', 'D\'Annunzio', 'Gozzano', 'Saba', 'Ungaretti',
        'Montale', 'Quasimodo', 'Pavese', 'Vittorini', 'Moravia', 'Sciascia',
        'Calvino', 'Eco', 'Tabucchi', 'Magris', 'Consolo', 'Camilleri',
        
        // Termini editoriali
        'Libro', 'Volume', 'Tomo', 'Codice', 'Manoscritto', 'Incunabolo', 'Edizione',
        'Stampa', 'Ristampa', 'Tiratura', 'Bozza', 'Revisione', 'Impaginazione',
        'Copertina', 'Sovraccoperta', 'Frontespizio', 'Colophon', 'Indice', 'Capitolo',
        'Paragrafo', 'Pagina', 'Foglio', 'Recto', 'Verso', 'Margine', 'Nota'
    ],
    
    // TEMPO E STAGIONI (200+)
    timeAndSeasons: [
        // Stagioni
        'Primavera', 'Estate', 'Autunno', 'Inverno', 'Primaverile', 'Estivo',
        'Autunnale', 'Invernale', 'Equinozio', 'Solstizio', 'Mezza stagione',
        
        // Mesi
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio',
        'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre', 'Capodanno',
        'Epifania', 'Carnevale', 'Quaresima', 'Pasqua', 'Pasquetta', 'Liberazione',
        'Primo Maggio', 'Repubblica', 'Ferragosto', 'Ognissanti', 'Immacolata', 'Natale',
        
        // Momenti del giorno
        'Alba', 'Aurora', 'Mattino', 'Mattina', 'Mattutino', 'Antimeridiano',
        'Mezzogiorno', 'Mezzodì', 'Pomeriggio', 'Pomeridiano', 'Vespro', 'Sera',
        'Serata', 'Tramonto', 'Crepuscolo', 'Imbrunire', 'Notte', 'Nottata',
        'Mezzanotte', 'Notturno', 'Antelucano', 'Albeggiare', 'Spuntare', 'Sorgere',
        
        // Fasi lunari
        'Luna nuova', 'Luna crescente', 'Primo quarto', 'Gibbosa crescente',
        'Luna piena', 'Plenilunio', 'Gibbosa calante', 'Ultimo quarto',
        'Luna calante', 'Novilunio', 'Eclissi lunare', 'Luna blu', 'Superluna',
        
        // Tempo atmosferico
        'Sereno', 'Soleggiato', 'Nuvoloso', 'Coperto', 'Variabile', 'Instabile',
        'Perturbato', 'Piovoso', 'Temporalesco', 'Nevoso', 'Ventoso', 'Afoso',
        'Umido', 'Secco', 'Mite', 'Fresco', 'Freddo', 'Gelido', 'Caldo', 'Torrido',
        
        // Fenomeni stagionali
        'Fioritura', 'Germoglio', 'Bocciolo', 'Polline', 'Rinascita', 'Risveglio',
        'Rondine', 'Primula', 'Violetta', 'Margherita', 'Ciliegio', 'Pesco',
        'Canicola', 'Solleone', 'Afa', 'Arsura', 'Siccità', 'Temporale estivo',
        'Vendemmia', 'Raccolta', 'Foglie cadenti', 'Castagne', 'Funghi', 'Nebbia',
        'Brina', 'Gelo', 'Ghiaccio', 'Neve', 'Bufera', 'Camino', 'Focolare',
        
        // Tempi della vita
        'Nascita', 'Infanzia', 'Fanciullezza', 'Adolescenza', 'Giovinezza', 'Gioventù',
        'Maturità', 'Età adulta', 'Vecchiaia', 'Anzianità', 'Senilità', 'Eternità',
        'Momento', 'Istante', 'Attimo', 'Secondo', 'Minuto', 'Ora', 'Giorno',
        'Settimana', 'Mese', 'Anno', 'Lustro', 'Decennio', 'Secolo', 'Millennio',
        'Era', 'Epoca', 'Età', 'Periodo', 'Ciclo', 'Fase', 'Stagione della vita',
        
        // Ricorrenze
        'Compleanno', 'Onomastico', 'Anniversario', 'Ricorrenza', 'Festa', 'Festività',
        'Giubileo', 'Centenario', 'Bicentenario', 'Millenario', 'Commemorazione'
    ],
    
    // ERBE E SPEZIE (200+)
    herbsAndSpices: [
        // Erbe aromatiche mediterranee
        'Basilico', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana', 'Menta',
        'Mentuccia', 'Prezzemolo', 'Alloro', 'Mirto', 'Lavanda', 'Santolina',
        'Elicriso', 'Ruta', 'Artemisia', 'Assenzio', 'Dragoncello', 'Serpillo',
        'Santoreggia', 'Issopo', 'Melissa', 'Cedrina', 'Verbena', 'Citronella',
        'Erba cipollina', 'Aneto', 'Cerfoglio', 'Levistico', 'Borragine', 'Cappero',
        
        // Erbe selvatiche
        'Tarassaco', 'Ortica', 'Malva', 'Piantaggine', 'Achillea', 'Calendula',
        'Camomilla', 'Iperico', 'Equiseto', 'Betonica', 'Valeriana', 'Passiflora',
        'Biancospino', 'Tiglio', 'Sambuco', 'Rosa canina', 'Ribes', 'Echinacea',
        'Genziana', 'Arnica', 'Aloe', 'Ginkgo', 'Ginseng', 'Liquirizia', 'Altea',
        
        // Spezie orientali
        'Zenzero', 'Curcuma', 'Cardamomo', 'Cannella', 'Chiodi di garofano', 'Noce moscata',
        'Macis', 'Anice stellato', 'Pepe nero', 'Pepe bianco', 'Pepe verde', 'Pepe rosa',
        'Pepe lungo', 'Pepe di Sichuan', 'Coriandolo', 'Cumino', 'Carvi', 'Fieno greco',
        'Nigella', 'Sesamo', 'Papavero', 'Senape', 'Rafano', 'Wasabi', 'Sumac',
        'Berbere', 'Harissa', 'Ras el hanout', 'Garam masala', 'Curry', 'Tandoori',
        
        // Miscele e preparati
        'Erbe di Provenza', 'Fines herbes', 'Bouquet garni', 'Zahtar', 'Dukkah',
        'Chimichurri', 'Pesto', 'Salsa verde', 'Gremolata', 'Persillade', 'Tapenade',
        'Chermoula', 'Zhug', 'Adjika', 'Tkemali', 'Salmoriglio', 'Agliata',
        
        // Fiori commestibili
        'Violetta', 'Rosa', 'Gelsomino', 'Zagara', 'Sambuco', 'Acacia', 'Zucca',
        'Zucchina', 'Borragine', 'Nasturzio', 'Calendula', 'Viola del pensiero',
        'Primula', 'Malva', 'Ibisco', 'Lavanda', 'Rosmarino', 'Salvia', 'Timo',
        
        // Radici e bulbi
        'Zenzero', 'Curcuma', 'Galanga', 'Wasabi', 'Rafano', 'Daikon', 'Sedano rapa',
        'Pastinaca', 'Scorzonera', 'Topinambur', 'Manioca', 'Taro', 'Igname',
        'Aglio', 'Scalogno', 'Cipolla', 'Porro', 'Erba cipollina', 'Aglio orsino',
        
        // Semi e bacche
        'Anice', 'Finocchio', 'Aneto', 'Coriandolo', 'Cumino', 'Carvi', 'Nigella',
        'Sesamo', 'Papavero', 'Lino', 'Girasole', 'Zucca', 'Chia', 'Canapa',
        'Pepe', 'Ginepro', 'Pimento', 'Cardamomo', 'Vaniglia', 'Tamarindo',
        
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
        // Termini natalizi
        'Natale', 'Avvento', 'Epifania', 'Befana', 'Presepe', 'Capanna', 'Mangiatoia',
        'Stella Cometa', 'Magi', 'Oro', 'Incenso', 'Mirra', 'Angeli', 'Gloria', 'Pace',
        'Noel', 'Christmas', 'Xmas', 'Vigilia', 'Mezzanotte', 'Campane', 'Rintocco',
        'Candela', 'Cero', 'Lucerna', 'Lanterna', 'Luminaria', 'Ghirlanda', 'Corona',
        'Vischio', 'Agrifoglio', 'Pungitopo', 'Abete', 'Pino', 'Pigna', 'Renna',
        'Slitta', 'Campanella', 'Fiocco', 'Nastro', 'Pacchetto', 'Regalo', 'Dono',
        'Sorpresa', 'Gioia', 'Festa', 'Allegria', 'Tradizione', 'Famiglia', 'Focolare',
        'Camino', 'Ceppo', 'Brindisi', 'Auguri', 'Felicità', 'Benedizione', 'Grazia',
        
        // Dolci e tradizioni natalizie
        'Panettone', 'Pandoro', 'Torrone', 'Panforte', 'Ricciarelli', 'Cavallucci',
        'Mostaccioli', 'Struffoli', 'Roccocò', 'Susamielli', 'Mustacciuoli', 'Zampone',
        'Cotechino', 'Cappone', 'Capitone', 'Baccalà', 'Stoccafisso', 'Lenticchie',
        'Spumante', 'Prosecco', 'Champagne', 'Vin brulé', 'Cioccolata', 'Zabaione',
        'Crema', 'Cannella', 'Zenzero', 'Chiodi di garofano', 'Noce moscata', 'Anice',
        
        // Inverno generale
        'Inverno', 'Neve', 'Nevischio', 'Fiocco', 'Cristallo', 'Ghiaccio', 'Gelo',
        'Brina', 'Galaverna', 'Gelata', 'Ghiacciolo', 'Stalattite', 'Brinata',
        'Freddo', 'Gelido', 'Glaciale', 'Polare', 'Artico', 'Siberiano', 'Nordico',
        'Tormenta', 'Bufera', 'Tempesta', 'Valanga', 'Slavina', 'Cumulo', 'Turbine',
        'Vortice', 'Raffica', 'Tramontana', 'Bora', 'Maestrale', 'Grecale',
        
        // Attività invernali
        'Sci', 'Slalom', 'Discesa', 'Fondo', 'Snowboard', 'Bob', 'Slittino', 'Pattini',
        'Pattinaggio', 'Hockey', 'Curling', 'Racchette', 'Ciaspole', 'Scarponi',
        'Bastoncini', 'Skilift', 'Seggiovia', 'Funivia', 'Cabinovia', 'Ovovia',
        'Rifugio', 'Baita', 'Chalet', 'Malga', 'Bivacco', 'Pista', 'Tracciato',
        
        // Abbigliamento invernale
        'Cappotto', 'Piumino', 'Pelliccia', 'Montone', 'Parka', 'Giaccone', 'Eskimo',
        'Maglione', 'Pullover', 'Cardigan', 'Dolcevita', 'Lupetto', 'Pile', 'Felpa',
        'Sciarpa', 'Scialle', 'Stola', 'Pashmina', 'Foulard', 'Guanti', 'Muffole',
        'Berretto', 'Cuffia', 'Colbacco', 'Cappello', 'Paraorecchie', 'Balaclava',
        'Calzamaglia', 'Termico', 'Lana', 'Cashmere', 'Alpaca', 'Mohair', 'Merino',
        
        // Paesaggi invernali
        'Montagna', 'Vetta', 'Cima', 'Picco', 'Cresta', 'Crinale', 'Versante',
        'Pendio', 'Bosco', 'Foresta', 'Abetaia', 'Pineta', 'Lariceto', 'Faggeta',
        'Radura', 'Sentiero', 'Mulattiera', 'Valico', 'Passo', 'Gola', 'Valle',
        'Conca', 'Altopiano', 'Pascolo', 'Alpeggio', 'Lago ghiacciato', 'Cascata gelata',
        
        // Animali invernali
        'Orso bianco', 'Volpe artica', 'Ermellino', 'Lepre bianca', 'Pernice bianca',
        'Gufo delle nevi', 'Civetta', 'Allocco', 'Lupo', 'Lince', 'Camoscio', 'Stambecco',
        'Cervo', 'Capriolo', 'Alce', 'Renna', 'Caribù', 'Yak', 'Husky', 'Samoiedo',
        
        // Stelle e costellazioni invernali
        'Orione', 'Sirio', 'Aldebaran', 'Betelgeuse', 'Rigel', 'Pleiadi', 'Toro',
        'Gemelli', 'Auriga', 'Perseo', 'Cassiopea', 'Cefeo', 'Drago', 'Orsa Maggiore',
        'Orsa Minore', 'Polare', 'Vega', 'Altair', 'Deneb', 'Capella', 'Procione'
    ]
};

// Cache per memorizzare i nomi già usati (per sessione)
let usedNamesCache = new Set();
let allUsedNames = []; // Array per tenere traccia storica
let historicalNamesCache = {}; // Cache per nomi storici per stagione

// Funzione per ottenere TUTTI i prodotti da Shopify con paginazione
async function fetchAllShopifyProducts(seasonTag = null) {
    if (!SHOPIFY_ACCESS_TOKEN) {
        return [];
    }
    
    let allProducts = [];
    let page_info = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
        let url;
        if (page_info) {
            url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?page_info=${page_info}&limit=250&fields=id,title,tags`;
        } else {
            url = `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250&fields=id,title,tags`;
        }
        
        try {
            const response = await fetch(url, {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error(`Errore Shopify API: ${response.status}`);
                break;
            }
            
            const data = await response.json();
            
            // Filtra per stagione se specificata
            if (seasonTag) {
                const filtered = data.products.filter(product => 
                    product.tags && product.tags.includes(seasonTag)
                );
                allProducts = allProducts.concat(filtered);
            } else {
                allProducts = allProducts.concat(data.products);
            }
            
            // Controlla se c'è una pagina successiva
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
        } catch (error) {
            console.error('Errore durante il recupero prodotti:', error);
            hasNextPage = false;
        }
    }
    
    return allProducts;
}

// Funzione aggiornata per ottenere nomi storici da Shopify per tutte le stagioni
async function fetchHistoricalNames() {
    const seasons = ['24E', '24I', '25E', '25I', '26E', '26I'];
    const allHistoricalNames = new Set();
    
    if (!SHOPIFY_ACCESS_TOKEN) {
        console.log('Shopify non configurato - modalità demo');
        return allHistoricalNames;
    }
    
    try {
        // Recupera TUTTI i prodotti in una sola chiamata
        const allProducts = await fetchAllShopifyProducts();
        console.log(`Recuperati ${allProducts.length} prodotti totali da Shopify`);
        
        // Organizza i prodotti per stagione
        for (const product of allProducts) {
            if (product.tags) {
                const name = product.title.trim();
                
                // Aggiungi a set generale
                allHistoricalNames.add(name);
                
                // Aggiungi a cache per stagione
                for (const seasonTag of seasons) {
                    if (product.tags.includes(seasonTag)) {
                        if (!historicalNamesCache[seasonTag]) {
                            historicalNamesCache[seasonTag] = new Set();
                        }
                        historicalNamesCache[seasonTag].add(name);
                    }
                }
            }
        }
        
        // Log risultati per stagione
        for (const seasonTag of seasons) {
            const count = historicalNamesCache[seasonTag] ? historicalNamesCache[seasonTag].size : 0;
            if (count > 0) {
                console.log(`   - Stagione ${seasonTag}: ${count} nomi unici`);
            }
        }
        
    } catch (error) {
        console.error('Errore caricamento nomi storici:', error);
    }
    
    return allHistoricalNames;
}

// Funzione per ottenere tutti i nomi dal pool
function getAllPoolNames() {
    let allNames = [];
    for (const category in namePool) {
        allNames = allNames.concat(namePool[category]);
    }
    return allNames;
}

// Funzione per ottenere un nome casuale da una categoria
function getRandomNameFromCategory(category) {
    const names = namePool[category];
    return names[Math.floor(Math.random() * names.length)];
}

// Funzione per ottenere nomi casuali dal pool
async function getRandomNames(count, existingNames = [], mode = 'mixed', category = null, currentSeason = null) {
    let availablePool = [];
    
    // Se è specificata una categoria, usa solo quella
    if (category && namePool[category]) {
        availablePool = namePool[category];
    } else {
        // Altrimenti usa tutto il pool
        availablePool = getAllPoolNames();
    }
    
    const existingNamesLower = existingNames.map(n => n.toLowerCase().trim());
    
    // Ottieni i nomi storici da Shopify se non già caricati
    let historicalNames = await fetchHistoricalNames();
    const historicalNamesArray = Array.from(historicalNames);
    
    // Filtra i nomi già usati nella stagione corrente
    const availableNewNames = availablePool.filter(name => 
        !existingNamesLower.includes(name.toLowerCase().trim()) &&
        !historicalNamesArray.some(histName => histName.toLowerCase() === name.toLowerCase())
    );
    
    // Nomi da altre stagioni (già usati in passato ma NON in questa stagione)
    let namesFromOtherSeasons = historicalNamesArray.filter(name => 
        !existingNamesLower.includes(name.toLowerCase().trim())
    );
    
    // Se è specificata una categoria, filtra anche i nomi riutilizzati per quella categoria
    if (category && namePool[category]) {
        const categoryNamesLower = namePool[category].map(n => n.toLowerCase());
        namesFromOtherSeasons = namesFromOtherSeasons.filter(name => 
            categoryNamesLower.includes(name.toLowerCase())
        );
    }
    
    let selectedNames = [];
    let sources = {
        pool: 0,
        otherSeasons: 0
    };
    
    if (mode === 'new') {
        // Solo nomi mai usati
        const shuffled = [...availableNewNames].sort(() => 0.5 - Math.random());
        selectedNames = shuffled.slice(0, Math.min(count, shuffled.length))
            .map(name => ({
                name,
                source: 'pool',
                id: Math.random().toString(36).substring(7)
            }));
        sources.pool = selectedNames.length;
        
        if (selectedNames.length === 0) {
            console.warn('Nessun nome nuovo disponibile nel pool selezionato');
        }
    } else if (mode === 'reused') {
        // Solo nomi già usati in altre stagioni
        if (namesFromOtherSeasons.length === 0) {
            console.warn('Nessun nome riutilizzabile trovato. Verifica la connessione Shopify.');
            return { 
                names: [], 
                sources: { pool: 0, otherSeasons: 0 },
                warning: 'Nessun nome riutilizzabile trovato. I nomi riutilizzati devono provenire da prodotti esistenti su Shopify.'
            };
        }
        
        const shuffled = [...namesFromOtherSeasons].sort(() => 0.5 - Math.random());
        selectedNames = shuffled.slice(0, Math.min(count, shuffled.length))
            .map(name => ({
                name,
                source: 'other-seasons',
                id: Math.random().toString(36).substring(7)
            }));
        sources.otherSeasons = selectedNames.length;
    } else {
        // Mixed: 60% nuovi, 40% riutilizzati
        const newCount = Math.ceil(count * 0.6);
        const reusedCount = count - newCount;
        
        // Prendi nomi nuovi
        const shuffledNew = [...availableNewNames].sort(() => 0.5 - Math.random());
        const newNames = shuffledNew.slice(0, Math.min(newCount, shuffledNew.length))
            .map(name => ({
                name,
                source: 'pool',
                id: Math.random().toString(36).substring(7)
            }));
        
        // Prendi nomi riutilizzati (solo se esistono)
        let reusedNames = [];
        if (namesFromOtherSeasons.length > 0) {
            const shuffledReused = [...namesFromOtherSeasons].sort(() => 0.5 - Math.random());
            reusedNames = shuffledReused.slice(0, Math.min(reusedCount, shuffledReused.length))
                .map(name => ({
                    name,
                    source: 'other-seasons',
                    id: Math.random().toString(36).substring(7)
                }));
        }
        
        selectedNames = [...newNames, ...reusedNames].sort(() => 0.5 - Math.random());
        sources.pool = newNames.length;
        sources.otherSeasons = reusedNames.length;
    }
    
    // Se non abbiamo abbastanza nomi, aggiungi un avviso
    if (selectedNames.length < count) {
        console.warn(`Richiesti ${count} nomi, ma solo ${selectedNames.length} disponibili con modalità ${mode}`);
    }
    
    return { 
        names: selectedNames, 
        sources,
        totalHistoricalNames: historicalNames.size
    };
}

// ENDPOINTS

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'active',
        service: 'Loft.73 Name Generator API',
        version: '2.0',
        totalNames: getAllPoolNames().length,
        categories: Object.keys(namePool).length,
        endpoints: {
            generateNames: 'POST /api/generate-names',
            shopifyProducts: 'POST /api/shopify/products',
            statsPool: 'GET /api/stats/pool',
            statsUsage: 'GET /api/stats/usage'
        }
    });
});

// Endpoint per generare nomi
app.post('/api/generate-names', async (req, res) => {
    try {
        const { count = 20, existingNames = [], season, mode = 'mixed', category = null } = req.body;
        
        // Validazione input
        if (count < 1 || count > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Il numero di nomi deve essere tra 1 e 5000'
            });
        }
        
        // Se è specificata una categoria, verifica che esista
        if (category && !namePool[category]) {
            return res.status(400).json({
                success: false,
                error: `Categoria non valida: ${category}`
            });
        }
        
        // Genera i nomi
        const result = await getRandomNames(count, existingNames, mode, category, season);
        
        // Se modalità reused e nessun nome trovato, restituisci errore chiaro
        if (mode === 'reused' && result.names.length === 0) {
            return res.json({
                success: false,
                names: [],
                sources: result.sources,
                warning: result.warning || 'Nessun nome riutilizzabile trovato. Assicurati che Shopify sia configurato correttamente e che esistano prodotti nelle stagioni precedenti.',
                totalRequested: count,
                totalGenerated: 0
            });
        }
        
        console.log(`Generati ${result.names.length} nomi per stagione ${season} (modalità: ${mode}, categoria: ${category || 'tutte'})`);
        if (result.totalHistoricalNames) {
            console.log(`Totale nomi storici disponibili: ${result.totalHistoricalNames}`);
        }
        
        res.json({
            success: true,
            names: result.names,
            sources: result.sources,
            season: season,
            mode: mode,
            category: category,
            totalRequested: count,
            totalGenerated: result.names.length,
            warning: result.warning
        });
        
    } catch (error) {
        console.error('Errore generazione nomi:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante la generazione dei nomi'
        });
    }
});

// Endpoint per ottenere prodotti da Shopify
app.post('/api/shopify/products', async (req, res) => {
    try {
        const { season } = req.body;
        
        // Mapping stagioni per tag Shopify
        const seasonMapping = {
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
        
        const seasonTag = seasonMapping[season] || season;
        
        if (!SHOPIFY_ACCESS_TOKEN) {
            return res.json({
                success: true,
                names: [],
                count: 0,
                totalProducts: 0,
                message: 'Shopify non configurato - modalità demo'
            });
        }
        
        // Recupera TUTTI i prodotti per la stagione con paginazione
        const allSeasonProducts = await fetchAllShopifyProducts(seasonTag);
        
        // Estrai nomi unici
        const uniqueNames = [...new Set(allSeasonProducts.map(p => p.title.trim()))];
        
        // Salva i nomi nella cache storica per la stagione
        if (!historicalNamesCache[seasonTag]) {
            historicalNamesCache[seasonTag] = new Set();
        }
        uniqueNames.forEach(name => {
            historicalNamesCache[seasonTag].add(name);
        });
        
        // Conta prodotti per brand (solo sui primi 250 per performance)
        const brandBreakdown = {};
        allSeasonProducts.slice(0, 250).forEach(product => {
            const brand = product.vendor || 'Unknown';
            brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;
        });
        
        // Carica anche i nomi storici se non già fatto
        if (Object.keys(historicalNamesCache).length <= 1) {
            console.log('Caricamento nomi storici in background...');
            fetchHistoricalNames().then(names => {
                console.log(`Caricati ${names.size} nomi storici totali`);
            });
        }
        
        res.json({
            success: true,
            names: uniqueNames,
            count: uniqueNames.length,
            totalProducts: allSeasonProducts.length,
            seasonTag: seasonTag,
            brandBreakdown: brandBreakdown,
            message: allSeasonProducts.length > 250 ? 
                `Caricati tutti i ${allSeasonProducts.length} prodotti (paginazione attiva)` : 
                null
        });
        
    } catch (error) {
        console.error('Errore Shopify API:', error);
        res.json({
            success: true,
            names: [],
            count: 0,
            totalProducts: 0,
            error: 'Errore connessione Shopify'
        });
    }
});

// Endpoint per statistiche del pool
app.get('/api/stats/pool', (req, res) => {
    const stats = {};
    let total = 0;
    
    for (const category in namePool) {
        stats[category] = namePool[category].length;
        total += namePool[category].length;
    }
    
    res.json({
        success: true,
        totalNames: total,
        categories: stats,
        categoriesCount: Object.keys(namePool).length
    });
});

// Endpoint per statistiche di utilizzo
app.get('/api/stats/usage', async (req, res) => {
    const historicalNames = await fetchHistoricalNames();
    
    res.json({
        success: true,
        totalHistoricalNames: historicalNames.size,
        historicalBySeasonCount: Object.fromEntries(
            Object.entries(historicalNamesCache).map(([season, names]) => [season, names.size])
        ),
        message: historicalNames.size === 0 ? 
            'Nessun nome storico caricato. Verifica la configurazione Shopify.' : 
            `${historicalNames.size} nomi storici disponibili per il riutilizzo`
    });
});

// Endpoint per ottenere le categorie disponibili
app.get('/api/categories', (req, res) => {
    const categories = Object.keys(namePool).map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
        count: namePool[key].length
    }));
    
    res.json({
        success: true,
        categories: categories,
        total: categories.length
    });
});

// Endpoint per ottenere nomi storici disponibili
app.get('/api/historical-names', async (req, res) => {
    try {
        const historicalNames = await fetchHistoricalNames();
        const bySeasonCount = {};
        
        for (const [season, names] of Object.entries(historicalNamesCache)) {
            bySeasonCount[season] = names.size;
        }
        
        res.json({
            success: true,
            totalHistoricalNames: historicalNames.size,
            bySeasonCount: bySeasonCount,
            sample: Array.from(historicalNames).slice(0, 20)
        });
    } catch (error) {
        console.error('Errore recupero nomi storici:', error);
        res.status(500).json({
            success: false,
            error: 'Errore durante il recupero dei nomi storici'
        });
    }
});

// Avvio server
app.listen(PORT, async () => {
    console.log(`
    🚀 Loft.73 Name Generator API
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
