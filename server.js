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

// POOL DI NOMI CURATO - Solo nomi con significato chiaro
const namePool = {
    // CITTÀ ITALIANE (200+)
    cities: [
        // Sicilia
        'Palermo', 'Catania', 'Messina', 'Siracusa', 'Trapani', 'Marsala', 'Gela', 'Ragusa', 
        'Modica', 'Vittoria', 'Caltanissetta', 'Agrigento', 'Enna', 'Taormina', 'Cefalù',
        'Noto', 'Sciacca', 'Mazara', 'Alcamo', 'Bagheria', 'Monreale', 'Avola', 'Augusta',
        'Milazzo', 'Barcellona', 'Licata', 'Favara', 'Acireale', 'Paternò', 'Misterbianco',
        'Caltagirone', 'Canicattì', 'Gela', 'Vittoria', 'Avola', 'Niscemi',
        
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
        'Massa', 'Carrara', 'Viareggio', 'Empoli', 'Scandicci', 'Sesto', 'Campi', 'Capannori',
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
    
    // ANIMALI (250+) - Solo nomi familiari
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
        'Piranha', 'Barracuda',
        'Cavalluccio',
        
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
        
        // Isole
        'Sicilia', 'Sardegna', 'Elba', 'Capri', 'Ischia', 'Procida', 'Ponza', 'Ventotene',
        'Lipari', 'Salina', 'Panarea', 'Stromboli', 'Vulcano', 'Alicudi',
        'Filicudi', 'Ustica', 'Favignana', 'Levanzo', 'Marettimo', 'Pantelleria', 'Lampedusa',
        'Linosa', 'Lampione', 'Giglio', 'Giannutri', 'Montecristo', 'Pianosa', 'Gorgona',
        'Capraia', 'Palmaria', 'Tino', 'Tinetto', 'Gallinara', 'Bergeggi', 'Asinara',
        'Maddalena', 'Caprera', 'Spargi',
        'Budelli', 'Razzoli', 'Tavolara', 'Molara',
        
        // Venti mediterranei
        'Maestrale', 'Tramontana', 'Grecale', 'Levante', 'Scirocco', 'Libeccio', 'Ponente',
        'Ostro', 'Bora', 'Garbino', 'Zefiro',
        'Aliseo', 'Brezza',
        
        // Fenomeni naturali
        'Aurora', 'Alba', 'Tramonto', 'Crepuscolo', 'Eclissi', 'Cometa', 'Meteora',
        'Arcobaleno', 'Miraggio',
        'Nebbia', 'Foschia', 'Caligine', 'Brina', 'Rugiada', 'Galaverna',
        'Neve', 'Grandine', 'Pioggia', 'Temporale', 'Fulmine', 'Tuono', 'Lampo', 'Saetta',
        'Nevischio', 'Tormenta', 'Bufera', 'Valanga', 'Slavina', 'Frana', 'Terremoto',
        'Maremoto', 'Tsunami', 'Eruzione', 'Geyser', 'Fumarola',
        'Marea', 'Corrente', 'Risacca', 'Bonaccia', 'Tempesta'
    ],
    
    // PIETRE E MINERALI (150+) - Solo i più conosciuti
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
    
    // FIORI E PIANTE (350+) - Solo nomi comuni
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
    
    // CONCETTI POSITIVI (150+) - Solo quelli comprensibili
    concepts: [
        // Emozioni positive
        'Gioia', 'Letizia', 'Allegria', 'Felicità', 'Esultanza',
        'Amore', 'Affetto', 'Tenerezza', 'Dolcezza', 'Passione', 'Ardore',
        'Estasi', 'Incanto', 'Fascino', 'Magia', 'Stupore', 'Meraviglia',
        'Grazia', 'Eleganza', 'Raffinatezza', 'Finezza', 'Delicatezza',
        'Serenità', 'Pace', 'Calma', 'Quiete', 'Tranquillità',
        'Armonia', 'Equilibrio', 'Concordia', 'Sintonia', 'Accordo', 'Intesa', 'Unione',
        'Speranza', 'Fiducia', 'Fede', 'Certezza', 'Sicurezza', 'Fermezza', 'Costanza',
        'Mistero', 'Enigma', 'Arcano', 'Segreto',
        'Sogno', 'Fantasia', 'Immaginazione', 'Visione', 'Illusione', 'Chimera', 'Utopia',
        'Desiderio', 'Brama', 'Anelito', 'Aspirazione', 'Ambizione',
        'Nostalgia', 'Rimpianto', 'Melanconia', 'Tristezza',
        'Coraggio', 'Ardimento', 'Audacia', 'Valore', 'Eroismo',
        
        // Qualità positive
        'Bellezza', 'Splendore', 'Magnificenza', 'Grandezza',
        'Nobiltà', 'Dignità', 'Decoro', 'Onore', 'Gloria', 'Fama',
        'Purezza', 'Innocenza', 'Candore', 'Modestia', 'Umiltà',
        'Semplicità', 'Sobrietà',
        'Gentilezza', 'Cortesia', 'Garbo',
        'Bontà', 'Benevolenza', 'Clemenza', 'Pietà', 'Compassione', 'Misericordia',
        'Generosità', 'Altruismo',
        'Giustizia', 'Equità', 'Rettitudine', 'Integrità', 'Onestà', 'Sincerità',
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
    
    // NOMI FEMMINILI ITALIANI (400+) - Solo i più usati
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
    
    // MITOLOGIA CLASSICA (150+) - Solo nomi familiari
    mythology: [
        // Mitologia greca/romana famosa
        'Zeus', 'Era', 'Poseidone', 'Demetra', 'Atena', 'Apollo', 'Artemide', 'Ares',
        'Afrodite', 'Efesto', 'Ermes', 'Estia', 'Dioniso', 'Ade', 'Persefone', 'Ecate',
        'Selene', 'Eos', 'Elio', 'Nike',
        'Muse', 'Calliope', 'Clio', 'Erato', 'Euterpe', 'Melpomene',
        'Polimnia', 'Tersicore', 'Urania',
        'Oceano', 'Teti',
        'Crono', 'Rea', 'Prometeo', 'Atlante',
        'Leto', 'Asteria',
        'Eolo', 'Borea', 'Noto', 'Euro', 'Zefiro', 'Iris', 'Aura', 'Anfitrite',
        'Tritone', 'Nereo', 'Galatea',
        'Cirene', 'Aretusa', 'Dafne', 'Siringa', 'Io', 'Europa', 'Leda', 'Danae',
        'Semele', 'Alcmena', 'Antiope', 'Niobe', 'Tantalo', 'Sisifo', 'Orfeo', 'Euridice',
        'Pandora', 'Achille', 'Ettore', 'Paride', 'Elena', 'Menelao',
        'Agamennone', 'Clitemnestra', 'Oreste', 'Elettra', 'Ifigenia', 'Cassandra',
        'Andromaca', 'Ecuba', 'Priamo', 'Enea', 'Didone', 'Ulisse', 'Penelope',
        'Telemaco', 'Circe', 'Calipso', 'Nausicaa', 'Polifemo', 'Scilla', 'Cariddi',
        'Atalanta', 'Giasone', 'Medea', 'Teseo', 'Arianna', 'Fedra',
        'Minotauro', 'Dedalo', 'Icaro', 'Perseo', 'Andromeda', 'Pegaso', 'Bellerofonte',
        'Chimera', 'Sfinge', 'Cerbero', 'Idra', 'Centauri', 'Chirone', 'Amazzoni',
        
        // Mitologia romana
        'Giove', 'Giunone', 'Nettuno', 'Cerere', 'Minerva', 'Febo', 'Diana', 'Marte',
        'Venere', 'Vulcano', 'Mercurio', 'Vesta', 'Bacco', 'Plutone', 'Proserpina',
        'Saturno', 'Giano',
        'Fortuna', 'Vittoria', 'Concordia', 'Pax',
        'Flora', 'Pomona', 'Vertumno', 'Silvano', 'Fauno'
    ],
    
    // ASTRONOMIA (100+) - Solo stelle e costellazioni famose
    astronomy: [
        // Costellazioni dello zodiaco
        'Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione',
        'Sagittario', 'Capricorno', 'Acquario', 'Pesci',
        
        // Costellazioni famose
        'Orione', 'Cassiopea', 'Andromeda',
        'Perseo', 'Pegaso',
        'Cigno', 'Aquila', 'Delfino',
        'Drago', 'Ercole', 'Lira',
        'Centauro', 'Fenice', 'Pavone', 'Tucano', 'Gru',
        
        // Stelle principali
        'Sirio', 'Canopo', 'Arturo', 'Vega', 'Capella', 'Rigel', 'Procione',
        'Betelgeuse', 'Altair', 'Aldebaran', 'Spica', 'Antares',
        'Polluce', 'Fomalhaut', 'Deneb', 'Regolo',
        
        // Pianeti e satelliti
        'Mercurio', 'Venere', 'Terra', 'Marte', 'Giove', 'Saturno', 'Urano', 'Nettuno',
        'Plutone', 'Luna', 'Io', 'Europa', 'Ganimede', 'Callisto', 'Titano',
        'Mimas', 'Rea', 'Dione', 'Teti', 'Miranda', 'Ariel',
        'Oberon', 'Titania', 'Tritone', 'Nereide', 'Caronte'
    ],
    
    // COLORI E SFUMATURE (200+) - Solo quelli riconoscibili
    colors: [
        // Rossi
        'Rosso', 'Scarlatto', 'Cremisi', 'Vermiglio', 'Carminio', 'Granata', 'Bordeaux',
        'Amaranto', 'Rubino', 'Corallo', 'Salmone', 'Pesca', 'Albicocca', 'Terracotta',
        'Mattone', 'Ruggine', 'Rame', 'Marsala', 'Sangria', 'Ciliegia', 'Fragola',
        'Lampone', 'Ribes', 'Melograno', 'Papavero', 'Geranio', 'Azalea', 'Fucsia',
        
        // Arancioni
        'Arancione', 'Mandarino', 'Aragosta', 'Zucca', 'Carota', 'Papaya', 'Melone',
        'Albicocca', 'Pesca', 'Corallo', 'Salmone', 'Gambero', 'Tramonto', 'Ambra',
        'Cognac', 'Whisky', 'Brandy', 'Caramello', 'Miele', 'Zafferano', 'Curcuma',
        
        // Gialli
        'Giallo', 'Limone', 'Canarino', 'Girasole', 'Mimosa', 'Ginestra', 'Senape',
        'Ocra', 'Sabbia', 'Paglia', 'Vaniglia', 'Crema', 'Burro', 'Champagne', 'Oro',
        'Ottone', 'Bronzo', 'Topazio', 'Ambra', 'Miele', 'Biondo', 'Paglierino', 'Dorato',
        
        // Verdi
        'Verde', 'Smeraldo', 'Giada', 'Malachite', 'Prato', 'Menta', 'Salvia', 'Oliva',
        'Militare', 'Bosco', 'Pino', 'Abete', 'Muschio', 'Felce', 'Edera', 'Alloro',
        'Basilico', 'Lime', 'Pistacchio', 'Avocado', 'Kiwi', 'Mela',
        'Celadon', 'Veronese', 'Bottiglia', 'Petrolio', 'Acqua', 'Tiffany', 'Turchese',
        
        // Blu
        'Blu', 'Azzurro', 'Celeste', 'Cielo', 'Mare', 'Oceano', 'Cobalto', 'Zaffiro',
        'Navy', 'Notte', 'Indaco', 'Denim', 'Jeans', 'Petrolio', 'Pavone', 'Pervinca',
        'Fiordaliso', 'Lavanda', 'Avio', 'Polvere', 'Acciaio', 'Ardesia',
        'Ciano', 'Acquamarina', 'Turchese', 'Klein', 'Elettrico',
        
        // Viola
        'Viola', 'Violetto', 'Lilla', 'Glicine', 'Lavanda', 'Malva', 'Orchidea', 'Iris',
        'Ametista', 'Prugna', 'Melanzana', 'Vinaccia', 'Borgogna', 'Magenta', 'Ciclamino',
        'Erica', 'Pervinca', 'Indaco', 'Porpora', 'Cardinale',
        
        // Rosa
        'Rosa', 'Cipria', 'Confetto', 'Fucsia', 'Magenta', 'Corallo', 'Salmone', 'Pesca', 'Nudo', 'Blush',
        'Malva', 'Orchidea', 'Ciclamino', 'Azalea', 'Peonia', 'Camelia', 'Ortensia',
        
        // Marroni
        'Marrone', 'Cioccolato', 'Cacao', 'Caffè', 'Espresso', 'Cappuccino', 'Nocciola',
        'Castagna', 'Mogano', 'Ebano', 'Noce', 'Teak', 'Quercia', 'Faggio', 'Betulla',
        'Terra', 'Siena', 'Ombra', 'Seppia', 'Tabacco', 'Cuoio', 'Cognac', 'Caramello',
        'Cannella', 'Ruggine', 'Rame', 'Bronzo', 'Ottone', 'Ambra', 'Miele', 'Biscotto',
        
        // Grigi
        'Grigio', 'Argento', 'Perla', 'Cenere', 'Fumo', 'Grafite', 'Antracite', 'Carbone',
        'Piombo', 'Acciaio', 'Ferro', 'Cemento', 'Asfalto', 'Ardesia', 'Pietra', 'Roccia',
        'Nebbia', 'Foschia', 'Bruma', 'Tempesta', 'Nuvola', 'Ombra',
        'Tortora', 'Talpa', 'Topo', 'Elefante', 'Colomba', 'Piccione', 'Ghiaccio',
        
        // Bianchi e neri
        'Bianco', 'Neve', 'Latte', 'Panna', 'Avorio', 'Crema', 'Gesso', 'Calce', 'Perla',
        'Madreperla', 'Alabastro', 'Magnolia', 'Giglio', 'Candido',
        'Nero', 'Ebano', 'Carbone', 'Inchiostro', 'Catrame', 'Pece', 'Ossidiana', 'Onice',
        'Corvino', 'Notte', 'Mezzanotte', 'Abisso', 'Cosmo', 'Infinito'
    ]
};

// Funzione per ottenere tutti i nomi disponibili
function getAllNames() {
    const allNames = [];
    for (const category in namePool) {
        allNames.push(...namePool[category]);
    }
    // Rimuovi duplicati e FILTRA NOMI COMPOSTI (con spazi)
    const uniqueNames = [...new Set(allNames)];
    const singleWordNames = uniqueNames.filter(name => !name.includes(' '));
    
    console.log(`Nomi totali: ${uniqueNames.length}, dopo filtro singola parola: ${singleWordNames.length}`);
    return singleWordNames;
}

// Cache per i nomi già utilizzati nelle diverse stagioni
let allShopifyNamesCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// Mapping stagioni
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

// Funzione per estrarre il nome dal titolo del prodotto
function extractProductName(title) {
    if (!title) return null;
    
    const allPossibleNames = getAllNames();
    
    // Sort by length descending per matchare prima i nomi più lunghi
    allPossibleNames.sort((a, b) => b.length - a.length);
    
    for (const name of allPossibleNames) {
        // Crea pattern che matcha il nome come parola intera
        const pattern = new RegExp(`\\b${name}\\b`, 'i');
        const match = title.match(pattern);
        
        if (match) {
            console.log(`✓ Trovato: "${name}" in "${title}"`);
            return match[0];
        }
    }
    
    console.log(`✗ Nessun nome trovato in: "${title}"`);
    return null;
}

// Funzione per recuperare TUTTI i nomi da TUTTE le stagioni di Shopify
async function getAllShopifyNames() {
    // Usa cache se valida
    if (allShopifyNamesCache && lastCacheUpdate && (Date.now() - lastCacheUpdate < CACHE_DURATION)) {
        console.log('Uso cache per tutti i nomi Shopify');
        return allShopifyNamesCache;
    }
    
    try {
        const allProducts = [];
        let hasNextPage = true;
        let pageInfo = null;
        
        console.log('Recupero TUTTI i prodotti da Shopify per il mix...');
        
        while (hasNextPage) {
            const url = new URL(`https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json`);
            url.searchParams.append('limit', '250');
            url.searchParams.append('fields', 'id,title,vendor');
            
            if (pageInfo) {
                url.searchParams.append('page_info', pageInfo);
            }
            
            const response = await fetch(url.toString(), {
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
            
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const matches = linkHeader.match(/<[^>]+page_info=([^>]+)>; rel="next"/);
                if (matches && matches[1]) {
                    pageInfo = matches[1];
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }
        
        // Filtra solo prodotti LOFT.73 ed estrai nomi
        const allNames = new Set();
        allProducts.forEach(product => {
            const isLoft73 = !product.vendor || product.vendor === 'LOFT.73' || product.vendor === 'Loft.73';
            if (isLoft73) {
                const extractedName = extractProductName(product.title);
                if (extractedName) {
                    const normalizedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
                    allNames.add(normalizedName);
                }
            }
        });
        
        // Aggiorna cache
        allShopifyNamesCache = Array.from(allNames);
        lastCacheUpdate = Date.now();
        
        console.log(`Trovati ${allNames.size} nomi unici da ${allProducts.length} prodotti totali`);
        return allShopifyNamesCache;
        
    } catch (error) {
        console.error('Errore recupero tutti i nomi:', error);
        return [];
    }
}

// Funzione per mescolare array (Fisher-Yates)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Funzione per generare nomi in base alla modalità
async function generateNamesByMode(availableNames, currentSeasonNames, count, mode) {
    const result = [];
    const sources = {
        pool: 0,
        otherSeasons: 0
    };
    
    // Recupera TUTTI i nomi da Shopify
    const allShopifyNames = await getAllShopifyNames();
    
    // Trova nomi MAI usati in nessuna stagione
    const neverUsedNames = availableNames.filter(name => 
        !allShopifyNames.includes(name)
    );
    
    // Trova nomi usati in altre stagioni ma NON in questa
    const reusableNames = allShopifyNames.filter(name => 
        !currentSeasonNames.includes(name) && availableNames.includes(name)
    );
    
    console.log(`Modalità: ${mode}`);
    console.log(`Nomi mai usati disponibili: ${neverUsedNames.length}`);
    console.log(`Nomi riutilizzabili da altre stagioni: ${reusableNames.length}`);
    
    switch (mode) {
        case 'new':
            // Solo nomi nuovi
            const shuffledNew = shuffleArray(neverUsedNames);
            const selectedNew = shuffledNew.slice(0, Math.min(count, shuffledNew.length));
            selectedNew.forEach(name => {
                result.push({
                    id: Date.now() + Math.random(),
                    name: name,
                    source: 'pool'
                });
                sources.pool++;
            });
            break;
            
        case 'reused':
            // Solo nomi riutilizzati
            const shuffledReused = shuffleArray(reusableNames);
            const selectedReused = shuffledReused.slice(0, Math.min(count, shuffledReused.length));
            selectedReused.forEach(name => {
                result.push({
                    id: Date.now() + Math.random(),
                    name: name,
                    source: 'other-seasons'
                });
                sources.otherSeasons++;
            });
            break;
            
        case 'mixed':
        default:
            // Mix 60% nuovi, 40% riutilizzati
            const newNamesCount = Math.ceil(count * 0.6);
            const reusedNamesCount = count - newNamesCount;
            
            // Prima aggiungi i riutilizzati (40%)
            if (reusableNames.length > 0) {
                const shuffledReusedMix = shuffleArray(reusableNames);
                const selectedReusedMix = shuffledReusedMix.slice(0, Math.min(reusedNamesCount, shuffledReusedMix.length));
                selectedReusedMix.forEach(name => {
                    result.push({
                        id: Date.now() + Math.random(),
                        name: name,
                        source: 'other-seasons'
                    });
                    sources.otherSeasons++;
                });
            }
            
            // Poi aggiungi i nuovi (60%)
            const remainingSlots = count - result.length;
            if (remainingSlots > 0 && neverUsedNames.length > 0) {
                const shuffledNewMix = shuffleArray(neverUsedNames);
                const selectedNewMix = shuffledNewMix.slice(0, Math.min(remainingSlots, shuffledNewMix.length));
                selectedNewMix.forEach(name => {
                    result.push({
                        id: Date.now() + Math.random(),
                        name: name,
                        source: 'pool'
                    });
                    sources.pool++;
                });
            }
            
            // Se ancora non bastano, usa qualsiasi nome disponibile
            const stillRemaining = count - result.length;
            if (stillRemaining > 0) {
                const anyAvailable = availableNames.filter(name => 
                    !currentSeasonNames.includes(name) && 
                    !result.find(item => item.name === name)
                );
                const shuffledAny = shuffleArray(anyAvailable);
                const selectedAny = shuffledAny.slice(0, Math.min(stillRemaining, shuffledAny.length));
                selectedAny.forEach(name => {
                    result.push({
                        id: Date.now() + Math.random(),
                        name: name,
                        source: allShopifyNames.includes(name) ? 'other-seasons' : 'pool'
                    });
                    if (allShopifyNames.includes(name)) {
                        sources.otherSeasons++;
                    } else {
                        sources.pool++;
                    }
                });
            }
            break;
    }
    
    // Mescola il risultato finale
    return {
        names: shuffleArray(result),
        sources: sources
    };
}

// Endpoint per verificare lo stato del servizio
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'LOFT.73 Name Generator API',
        version: '6.0.0',
        endpoints: {
            'GET /': 'Stato del servizio',
            'POST /api/shopify/products': 'Recupera prodotti esistenti per stagione',
            'POST /api/generate-names': 'Genera nuovi nomi con modalità (new/reused/mixed)',
            'GET /api/name-categories': 'Mostra categorie disponibili'
        },
        total_names_available: getAllNames().length
    });
});

// Endpoint per recuperare i prodotti da Shopify
app.post('/api/shopify/products', async (req, res) => {
    const { season } = req.body;
    
    if (!season) {
        return res.status(400).json({ 
            success: false, 
            error: 'Season parameter is required' 
        });
    }
    
    const shopifyTag = SEASON_MAPPING[season];
    if (!shopifyTag) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid season. Valid seasons: ' + Object.keys(SEASON_MAPPING).join(', ')
        });
    }
    
    try {
        const allProducts = [];
        let hasNextPage = true;
        let pageInfo = null;
        
        console.log(`Fetching products for season ${season} (tag: ${shopifyTag})...`);
        
        while (hasNextPage) {
            const url = new URL(`https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/products.json`);
            url.searchParams.append('limit', '250');
            url.searchParams.append('fields', 'id,title,tags,vendor');
            
            if (pageInfo) {
                url.searchParams.append('page_info', pageInfo);
            }
            
            const response = await fetch(url.toString(), {
                headers: {
                    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            allProducts.push(...data.products);
            
            // Check for pagination
            const linkHeader = response.headers.get('Link');
            if (linkHeader && linkHeader.includes('rel="next"')) {
                const matches = linkHeader.match(/<[^>]+page_info=([^>]+)>; rel="next"/);
                if (matches && matches[1]) {
                    pageInfo = matches[1];
                } else {
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }
        
        console.log(`Total products fetched: ${allProducts.length}`);
        
        // Filtra per stagione e brand
        const filteredProducts = allProducts.filter(product => {
            const hasTag = product.tags && product.tags.includes(shopifyTag);
            const isLoft73 = !product.vendor || product.vendor === 'LOFT.73' || product.vendor === 'Loft.73';
            return hasTag && isLoft73;
        });
        
        console.log(`Products with tag ${shopifyTag} and LOFT.73 brand: ${filteredProducts.length}`);
        
        // Estrai i nomi unici
        const uniqueNames = new Set();
        const nameDetails = [];
        
        filteredProducts.forEach(product => {
            const extractedName = extractProductName(product.title);
            if (extractedName) {
                const normalizedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
                if (!uniqueNames.has(normalizedName)) {
                    uniqueNames.add(normalizedName);
                    nameDetails.push({
                        name: normalizedName,
                        originalTitle: product.title,
                        id: product.id
                    });
                }
            }
        });
        
        // Analisi per brand
        const brandBreakdown = {};
        allProducts.forEach(product => {
            if (product.tags && product.tags.includes(shopifyTag)) {
                const brand = product.vendor || 'No Brand';
                brandBreakdown[brand] = (brandBreakdown[brand] || 0) + 1;
            }
        });
        
        console.log(`Unique names found: ${uniqueNames.size}`);
        console.log('Sample names:', Array.from(uniqueNames).slice(0, 10));
        
        res.json({
            success: true,
            names: Array.from(uniqueNames).sort(),
            count: uniqueNames.size,
            totalProducts: filteredProducts.length,
            allProductsCount: allProducts.length,
            shopify_tag: shopifyTag,
            brandBreakdown: brandBreakdown,
            debug: {
                sampleProducts: filteredProducts.slice(0, 5).map(p => ({
                    title: p.title,
                    extractedName: extractProductName(p.title)
                }))
            }
        });
        
    } catch (error) {
        console.error('Shopify API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Failed to fetch products from Shopify'
        });
    }
});

// Endpoint per generare nomi
app.post('/api/generate-names', async (req, res) => {
    const { count = 20, season, existingNames = [], mode = 'mixed' } = req.body;
    
    if (!season) {
        return res.status(400).json({ 
            success: false, 
            error: 'Season parameter is required' 
        });
    }
    
    const validModes = ['new', 'reused', 'mixed'];
    if (!validModes.includes(mode)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid mode. Valid modes: ' + validModes.join(', ')
        });
    }
    
    try {
        // Ottieni tutti i nomi disponibili
        const availableNames = getAllNames();
        
        console.log(`Nomi disponibili dopo filtro singola parola: ${availableNames.length}`);
        
        // Genera nomi in base alla modalità
        const result = await generateNamesByMode(
            availableNames,
            existingNames,
            count,
            mode
        );
        
        res.json({
            success: true,
            names: result.names,
            total: result.names.length,
            sources: result.sources,
            mode: mode,
            debug: {
                totalAvailable: availableNames.length
            }
        });
        
    } catch (error) {
        console.error('Generation Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint per vedere le categorie disponibili
app.get('/api/name-categories', (req, res) => {
    const categories = {};
    
    for (const [category, names] of Object.entries(namePool)) {
        // Filtra solo nomi singoli
        const singleWordNames = names.filter(name => !name.includes(' '));
        categories[category] = {
            count: singleWordNames.length,
            examples: singleWordNames.slice(0, 10)
        };
    }
    
    res.json({
        totalNames: getAllNames().length,
        categories: categories
    });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`✅ LOFT.73 Name Generator API v6.0`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Total names in pool: ${getAllNames().length}`);
    console.log(`🏪 Shopify Store: ${SHOPIFY_STORE_URL}`);
    console.log(`🔑 Access Token: ${SHOPIFY_ACCESS_TOKEN ? '✓ Configured' : '✗ Missing'}`);
});

// Gestione errori non catturati
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
