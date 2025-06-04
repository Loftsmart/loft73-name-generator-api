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

// MEGA POOL DI NOMI REALI (5000+ nomi con significato)
const namePool = {
    // CITTÀ ITALIANE (200+)
    cities: [
        // Sicilia
        'Palermo', 'Catania', 'Messina', 'Siracusa', 'Trapani', 'Marsala', 'Gela', 'Ragusa', 
        'Modica', 'Vittoria', 'Caltanissetta', 'Agrigento', 'Enna', 'Taormina', 'Cefalù',
        'Noto', 'Sciacca', 'Mazara', 'Alcamo', 'Bagheria', 'Monreale', 'Avola', 'Augusta',
        'Milazzo', 'Barcellona', 'Licata', 'Favara', 'Acireale', 'Paternò', 'Misterbianco',
        'Caltagirone', 'Canicattì', 'Gela', 'Vittoria', 'Avola', 'Niscemi', 'Piazza Armerina',
        
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
        'Foligno', 'Città di Castello', 'Spoleto', 'Gubbio', 'Assisi', 'Orvieto', 'Narni',
        
        // Sud Italia
        'Napoli', 'Bari', 'Taranto', 'Foggia', 'Salerno', 'Lecce', 'Brindisi', 'Andria',
        'Barletta', 'Trani', 'Potenza', 'Matera', 'Cosenza', 'Reggio', 'Catanzaro',
        'Crotone', 'Vibo', 'Benevento', 'Avellino', 'Caserta', 'Sassari', 'Cagliari',
        'Nuoro', 'Oristano', 'Olbia', 'Alghero', 'Aosta', 'Trento', 'Bolzano', 'Udine',
        'Pordenone', 'Gorizia', 'Monfalcone', 'Muggia', 'Codroipo', 'Sacile', 'Spilimbergo',
        'Torre del Greco', 'Pozzuoli', 'Casoria', 'Afragola', 'Marano', 'Acerra', 'Giugliano',
        'Cava', 'Battipaglia', 'Nocera', 'Sarno', 'Angri', 'Scafati', 'Castellammare'
    ],
    
    // ANIMALI (300+)
    animals: [
        // Mammiferi terrestri
        'Leone', 'Tigre', 'Pantera', 'Leopardo', 'Ghepardo', 'Giaguaro', 'Puma', 'Lince',
        'Lupo', 'Volpe', 'Orso', 'Panda', 'Koala', 'Canguro', 'Elefante', 'Giraffa',
        'Zebra', 'Cavallo', 'Asino', 'Mulo', 'Cervo', 'Daino', 'Alce', 'Renna',
        'Gazzella', 'Antilope', 'Bufalo', 'Bisonte', 'Toro', 'Mucca', 'Pecora', 'Capra',
        'Maiale', 'Cinghiale', 'Coniglio', 'Lepre', 'Scoiattolo', 'Castoro', 'Lontra',
        'Procione', 'Tasso', 'Puzzola', 'Ermellino', 'Donnola', 'Furetto', 'Visone',
        'Riccio', 'Istrice', 'Armadillo', 'Bradipo', 'Formichiere', 'Pangolino', 'Ornitorinco',
        'Echidna', 'Cammello', 'Dromedario', 'Lama', 'Alpaca', 'Vigogna', 'Guanaco',
        'Ippopotamo', 'Rinoceronte', 'Tapiro', 'Okapi', 'Facocero', 'Babirussa', 'Pecari',
        
        // Mammiferi marini
        'Balena', 'Orca', 'Delfino', 'Focena', 'Beluga', 'Narvalo', 'Capodoglio', 'Megattera',
        'Foca', 'Otaria', 'Leone Marino', 'Tricheco', 'Lamantino', 'Dugongo',
        
        // Uccelli
        'Aquila', 'Falco', 'Poiana', 'Nibbio', 'Astore', 'Sparviero', 'Gheppio', 'Pellegrino',
        'Gufo', 'Civetta', 'Barbagianni', 'Allocco', 'Assiolo', 'Succiacapre', 'Upupa',
        'Martin Pescatore', 'Gruccione', 'Ghiandaia', 'Cornacchia', 'Corvo', 'Gazza', 'Taccola',
        'Picchio', 'Pettirosso', 'Rondine', 'Passero', 'Cardellino', 'Verdone', 'Fringuello',
        'Canarino', 'Usignolo', 'Merlo', 'Tordo', 'Allodola', 'Cappellaccia', 'Cutrettola',
        'Cinciallegra', 'Cinciarella', 'Cincia Mora', 'Codirosso', 'Pigliamosche', 'Beccafico',
        'Capinera', 'Sterpazzola', 'Occhiocotto', 'Storno', 'Rigogolo', 'Averla', 'Pendolino',
        'Colibrì', 'Pappagallo', 'Ara', 'Cacatua', 'Calopsitte', 'Inseparabile', 'Ondulato',
        'Pavone', 'Fagiano', 'Pernice', 'Starna', 'Quaglia', 'Francolino', 'Gallo Cedrone',
        'Colomba', 'Piccione', 'Tortora', 'Colombaccio', 'Cuculo', 'Cucù', 'Kookaburra',
        'Gabbiano', 'Albatro', 'Procellaria', 'Sula', 'Pellicano', 'Cormorano', 'Marangone',
        'Airone', 'Garzetta', 'Nitticora', 'Tarabuso', 'Cicogna', 'Ibis', 'Spatola',
        'Fenicottero', 'Cigno', 'Oca', 'Anatra', 'Germano', 'Marzaiola', 'Mestolone',
        'Folaga', 'Gallinella', 'Porciglione', 'Gru', 'Otarda', 'Gallina Prataiola',
        'Struzzo', 'Emù', 'Nandù', 'Casuario', 'Kiwi', 'Pinguino', 'Gazza Marina',
        
        // Rettili e anfibi
        'Serpente', 'Vipera', 'Biscia', 'Boa', 'Pitone', 'Anaconda', 'Cobra', 'Mamba',
        'Lucertola', 'Geco', 'Iguana', 'Camaleonte', 'Varano', 'Drago', 'Basilisco',
        'Coccodrillo', 'Alligatore', 'Caimano', 'Gaviale', 'Tartaruga', 'Testuggine',
        'Rana', 'Rospo', 'Raganella', 'Tritone', 'Salamandra', 'Axolotl', 'Proteo',
        
        // Pesci
        'Squalo', 'Razza', 'Manta', 'Murena', 'Anguilla', 'Cernia', 'Branzino', 'Orata',
        'Sogliola', 'Rombo', 'Merluzzo', 'Tonno', 'Pesce Spada', 'Marlin', 'Sgombro',
        'Acciuga', 'Sardina', 'Aringa', 'Salmone', 'Trota', 'Carpa', 'Luccio', 'Persico',
        'Pesce Rosso', 'Piranha', 'Barracuda', 'Pesce Palla', 'Pesce Leone', 'Pesce Pagliaccio',
        'Cavalluccio', 'Drago Marino', 'Pesce Ago', 'Pesce Farfalla', 'Pesce Angelo',
        
        // Insetti e artropodi
        'Farfalla', 'Monarca', 'Vanessa', 'Macaone', 'Podalirio', 'Aurora', 'Cedronella',
        'Falena', 'Sfinge', 'Saturnia', 'Bombice', 'Libellula', 'Damigella', 'Effimera',
        'Ape', 'Bombo', 'Vespa', 'Calabrone', 'Formica', 'Termite', 'Cicala', 'Grillo',
        'Cavalletta', 'Locusta', 'Mantide', 'Stecco', 'Foglia', 'Coleottero', 'Scarabeo',
        'Maggiolino', 'Cervo Volante', 'Coccinella', 'Lucciola', 'Cetonia', 'Carabo',
        'Ragno', 'Tarantola', 'Vedova Nera', 'Malmignatta', 'Scorpione', 'Millepiedi',
        'Centopiedi', 'Granchio', 'Aragosta', 'Gambero', 'Scampo', 'Astice', 'Paguro'
    ],
    
    // NATURA E GEOGRAFIA (400+)
    nature: [
        // Monti e cime
        'Etna', 'Vesuvio', 'Stromboli', 'Vulcano', 'Monviso', 'Cervino', 'Rosa',
        'Bianco', 'Adamello', 'Ortles', 'Bernina', 'Dolomiti', 'Marmolada', 'Pelmo',
        'Civetta', 'Antelao', 'Cristallo', 'Sorapis', 'Tofana', 'Lagazuoi', 'Averau',
        'Nuvolau', 'Cinque Torri', 'Croda', 'Piz Boè', 'Sassolungo', 'Catinaccio',
        'Latemar', 'Sciliar', 'Rosengarten', 'Majella', 'Velino', 'Sirente', 'Terminillo',
        'Vettore', 'Sibillini', 'Nerone', 'Catria', 'Fumaiolo', 'Falterona', 'Amiata',
        'Argentario', 'Conero', 'Gargano', 'Pollino', 'Sila', 'Aspromonte', 'Serre',
        'Nebrodi', 'Madonie', 'Peloritani', 'Erei', 'Iblei', 'Sicani', 'Gennargentu',
        'Limbara', 'Supramonte', 'Alpi Apuane', 'Prealpi', 'Appennini', 'Lessinii',
        
        // Vulcani
        'Marsili', 'Campi Flegrei', 'Colli Albani', 'Roccamonfina', 'Vulture', 'Pantelleria',
        'Linosa', 'Ischia', 'Lipari', 'Salina', 'Panarea', 'Alicudi', 'Filicudi',
        
        // Mari e oceani
        'Adriatico', 'Tirreno', 'Ionio', 'Ligure', 'Mediterraneo', 'Atlantico', 'Pacifico',
        'Indiano', 'Artico', 'Antartico', 'Baltico', 'Nero', 'Caspio', 'Arabico', 'Rosso',
        
        // Laghi
        'Garda', 'Como', 'Maggiore', 'Trasimeno', 'Bolsena', 'Bracciano', 'Iseo', 'Orta',
        'Lugano', 'Varese', 'Vico', 'Albano', 'Nemi', 'Averno', 'Fusaro', 'Lesina',
        'Varano', 'Massaciuccoli', 'Chiusi', 'Montepulciano', 'Corbara', 'Piediluco',
        'Scanno', 'Barrea', 'Campotosto', 'Bomba', 'Fiastra', 'Pilato', 'Cavedine',
        'Caldonazzo', 'Levico', 'Molveno', 'Tovel', 'Carezza', 'Braies', 'Dobbiaco',
        'Misurina', 'Alleghe', 'Fedaia', 'Santa Croce', 'Cadore', 'Sauris', 'Barcis',
        'Cavazzo', 'Ragogna', 'Cornino', 'Redona', 'Ledro', 'Idro', 'Valvestino',
        
        // Fiumi
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
        'Santo Stefano', 'Lipari', 'Salina', 'Panarea', 'Stromboli', 'Vulcano', 'Alicudi',
        'Filicudi', 'Ustica', 'Favignana', 'Levanzo', 'Marettimo', 'Pantelleria', 'Lampedusa',
        'Linosa', 'Lampione', 'Giglio', 'Giannutri', 'Montecristo', 'Pianosa', 'Gorgona',
        'Capraia', 'Palmaria', 'Tino', 'Tinetto', 'Gallinara', 'Bergeggi', 'Asinara',
        'San Pietro', 'Sant\'Antioco', 'Maddalena', 'Caprera', 'Santo Stefano', 'Spargi',
        'Budelli', 'Razzoli', 'Santa Maria', 'Tavolara', 'Molara', 'Mal di Ventre',
        
        // Venti
        'Maestrale', 'Tramontana', 'Grecale', 'Levante', 'Scirocco', 'Libeccio', 'Ponente',
        'Ostro', 'Bora', 'Föhn', 'Garbino', 'Zefiro', 'Austro', 'Borea', 'Euro', 'Noto',
        'Aliseo', 'Monsone', 'Brezza', 'Refolo', 'Folata', 'Raffica', 'Burrasca', 'Tifone',
        'Uragano', 'Ciclone', 'Tornado', 'Tromba', 'Mulinello', 'Turbine', 'Vortice',
        
        // Fenomeni naturali
        'Aurora', 'Alba', 'Tramonto', 'Crepuscolo', 'Eclissi', 'Cometa', 'Meteora',
        'Stella Cadente', 'Arcobaleno', 'Alone', 'Miraggio', 'Fata Morgana', 'Raggio Verde',
        'Fuoco di Sant\'Elmo', 'Nebbia', 'Foschia', 'Caligine', 'Brina', 'Rugiada', 'Galaverna',
        'Neve', 'Grandine', 'Pioggia', 'Temporale', 'Fulmine', 'Tuono', 'Lampo', 'Saetta',
        'Nevischio', 'Tormenta', 'Bufera', 'Valanga', 'Slavina', 'Frana', 'Terremoto',
        'Maremoto', 'Tsunami', 'Eruzione', 'Geyser', 'Fumarola', 'Soffione', 'Bradisismo',
        'Marea', 'Corrente', 'Risacca', 'Maestrale', 'Bonaccia', 'Calma', 'Tempesta'
    ],
    
    // PIETRE E MINERALI (200+)
    stones: [
        // Pietre preziose
        'Diamante', 'Rubino', 'Zaffiro', 'Smeraldo', 'Topazio', 'Ametista', 'Acquamarina',
        'Berillo', 'Crisoberillo', 'Alessandrite', 'Opale', 'Turchese', 'Perla', 'Ambra',
        'Corallo', 'Giada', 'Lapislazzuli', 'Malachite', 'Tormalina', 'Granato', 'Peridoto',
        'Tanzanite', 'Zircone', 'Spinello', 'Crisolito', 'Eliodoro', 'Morganite', 'Kunzite',
        'Indicolite', 'Rubellite', 'Verdelite', 'Paraiba', 'Padparadscha', 'Tsavorite',
        
        // Pietre semipreziose
        'Agata', 'Onice', 'Corniola', 'Calcedonio', 'Quarzo', 'Cristallo', 'Citrino',
        'Ametrina', 'Prasio', 'Avventurina', 'Occhio di Tigre', 'Occhio di Falco', 'Occhio di Bue',
        'Quarzo Rosa', 'Quarzo Fumé', 'Diaspro', 'Eliotropio', 'Ossidiana', 'Rodonite',
        'Rodocrosite', 'Unakite', 'Sodalite', 'Labradorite', 'Pietra Luna', 'Pietra Sole',
        'Fluorite', 'Celestina', 'Angelite', 'Selenite', 'Moldavite', 'Tectite', 'Sugilite',
        'Charoite', 'Larimar', 'Crisocolla', 'Crisoprasio', 'Amazzonite', 'Smithsonite',
        'Prehnite', 'Apofillite', 'Stilbite', 'Lepidolite', 'Iolite', 'Bronzite', 'Iperstene',
        
        // Minerali e rocce
        'Pirite', 'Galena', 'Blenda', 'Cinabro', 'Realgar', 'Orpimento', 'Antimonite',
        'Arsenopirite', 'Calcopirite', 'Bornite', 'Covellina', 'Cuprite', 'Azzurrite',
        'Crisocolla', 'Dioptasio', 'Atacamite', 'Olivina', 'Epidoto', 'Vesuvianite',
        'Granato', 'Andalusite', 'Cianite', 'Sillimanite', 'Staurolite', 'Titanite',
        'Zoisite', 'Clinozoisite', 'Actinolite', 'Tremolite', 'Orneblenda', 'Glaucofane',
        'Diopside', 'Augite', 'Enstatite', 'Wollastonite', 'Pectolite', 'Natrolite',
        'Analcime', 'Chabazite', 'Ematite', 'Magnetite', 'Limonite', 'Goethite',
        'Barite', 'Celestite', 'Gesso', 'Anidrite', 'Salgemma', 'Silvite', 'Carnallite',
        
        // Rocce ornamentali
        'Marmo', 'Granito', 'Porfido', 'Travertino', 'Ardesia', 'Basalto', 'Diorite',
        'Sienite', 'Gabbro', 'Peridotite', 'Serpentino', 'Gneiss', 'Scisto', 'Fillade',
        'Quarzite', 'Arenaria', 'Calcare', 'Dolomia', 'Alabastro', 'Steatite', 'Pomice',
        'Tufo', 'Pozzolana', 'Peperino', 'Pietra Serena', 'Pietra Forte', 'Pietra Leccese',
        'Pietra di Trani', 'Pietra di Billiemi', 'Pietra di Custonaci', 'Pietra d\'Istria'
    ],
    
    // FIORI E PIANTE (400+)
    flowers: [
        // Fiori comuni
        'Rosa', 'Giglio', 'Tulipano', 'Orchidea', 'Iris', 'Dalia', 'Peonia', 'Camelia',
        'Gardenia', 'Magnolia', 'Gelsomino', 'Lavanda', 'Lillà', 'Glicine', 'Mimosa',
        'Ginestra', 'Oleandro', 'Azalea', 'Rododendro', 'Ortensia', 'Margherita', 'Girasole',
        'Papavero', 'Fiordaliso', 'Ranuncolo', 'Anemone', 'Garofano', 'Viola', 'Primula',
        'Giacinto', 'Narciso', 'Fresia', 'Calla', 'Gerbera', 'Zinnia', 'Calendula',
        'Tagete', 'Verbena', 'Petunia', 'Begonia', 'Ciclamino', 'Geranio', 'Pelargonio',
        'Surfinia', 'Impatiens', 'Pervinca', 'Bocca di Leone', 'Digitale', 'Delphinium',
        'Aquilegia', 'Campanula', 'Malva', 'Altea', 'Ibisco', 'Buganvillea', 'Fucsia',
        'Lantana', 'Plumbago', 'Passiflora', 'Clematide', 'Caprifoglio', 'Gelsomino',
        'Stephanotis', 'Mandevilla', 'Dipladenia', 'Allamanda', 'Bignonia', 'Cobea',
        'Ipomea', 'Convolvolo', 'Nasturzio', 'Pisello Odoroso', 'Elicriso', 'Statice',
        'Gypsophila', 'Aster', 'Crisantemo', 'Rudbeckia', 'Echinacea', 'Cosmea', 'Dalia',
        'Astilbe', 'Hosta', 'Hemerocallis', 'Agapanto', 'Alstroemeria', 'Amaryllis',
        'Clivia', 'Nerine', 'Croco', 'Bucaneve', 'Mughetto', 'Anemone', 'Elleboro',
        'Bergenia', 'Sedum', 'Sempervivum', 'Saxifraga', 'Aubretia', 'Arabis', 'Alyssum',
        'Phlox', 'Dianthus', 'Armeria', 'Cerastium', 'Gypsophila', 'Saponaria', 'Silene',
        
        // Fiori selvatici
        'Papavero', 'Fiordaliso', 'Margherita', 'Tarassaco', 'Trifoglio', 'Veccia', 'Lupinella',
        'Sulla', 'Ginestrino', 'Meliloto', 'Erba Medica', 'Cicoria', 'Radicchio', 'Cardo',
        'Centaurea', 'Achillea', 'Tanaceto', 'Artemisia', 'Camomilla', 'Matricaria',
        'Bellis', 'Pratolina', 'Ranuncolo', 'Botton d\'Oro', 'Speronella', 'Viola del Pensiero',
        'Violetta', 'Mammola', 'Nontiscordardime', 'Veronica', 'Salvia', 'Ajuga', 'Bugola',
        'Prunella', 'Betonica', 'Stachys', 'Lamio', 'Ortica Bianca', 'Ballota', 'Nepitella',
        'Mentuccia', 'Nepeta', 'Melissa', 'Clinopodio', 'Issopo', 'Santoreggia', 'Serpillo',
        
        // Alberi e arbusti
        'Quercia', 'Rovere', 'Farnia', 'Cerro', 'Leccio', 'Sughera', 'Roverella', 'Faggio',
        'Castagno', 'Noce', 'Nocciolo', 'Betulla', 'Pioppo', 'Salice', 'Ontano', 'Olmo',
        'Bagolaro', 'Platano', 'Tiglio', 'Acero', 'Frassino', 'Orniello', 'Carpino',
        'Robinia', 'Ippocastano', 'Catalpa', 'Paulonia', 'Sofora', 'Albizzia', 'Cercis',
        'Maggiociondolo', 'Laburno', 'Sorbo', 'Biancospino', 'Prugnolo', 'Ciliegio',
        'Pesco', 'Albicocco', 'Susino', 'Mandorlo', 'Melo', 'Pero', 'Cotogno', 'Nespolo',
        'Giuggiolo', 'Azzeruolo', 'Melograno', 'Fico', 'Gelso', 'Kaki', 'Corbezzolo',
        'Mirto', 'Alloro', 'Lentisco', 'Terebinto', 'Carrubo', 'Olivastro', 'Fillirea',
        'Alaterno', 'Ilatro', 'Bosso', 'Ligustro', 'Evonimo', 'Viburno', 'Sambuco',
        'Caprifoglio', 'Lonicera', 'Weigela', 'Deutzia', 'Filadelfo', 'Spirea', 'Kerria',
        'Cotoneaster', 'Piracanta', 'Fotinia', 'Nandina', 'Aucuba', 'Skimmia', 'Pieris',
        'Corniolo', 'Cornus', 'Forsizia', 'Calicanto', 'Amamelide', 'Edgeworthia',
        
        // Conifere
        'Pino', 'Abete', 'Larice', 'Cedro', 'Cipresso', 'Tasso', 'Ginepro', 'Tuia',
        'Sequoia', 'Metasequoia', 'Ginkgo', 'Araucaria', 'Criptomeria', 'Cunninghamia',
        'Torreya', 'Cephalotaxus', 'Podocarpus', 'Tsuga', 'Pseudotsuga', 'Picea',
        
        // Piante aromatiche
        'Basilico', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana', 'Menta',
        'Mentuccia', 'Melissa', 'Cedrina', 'Verbena', 'Citronella', 'Lavanda', 'Santolina',
        'Elicriso', 'Prezzemolo', 'Coriandolo', 'Aneto', 'Finocchio', 'Anice', 'Cumino',
        'Dragoncello', 'Cerfoglio', 'Levistico', 'Sedano', 'Erba Cipollina', 'Aglio',
        'Scalogno', 'Porro', 'Zafferano', 'Zenzero', 'Curcuma', 'Cardamomo', 'Pepe',
        'Peperoncino', 'Paprika', 'Rafano', 'Senape', 'Cappero', 'Alloro', 'Ginepro'
    ],
    
    // CONCETTI ASTRATTI E POETICI (300+)
    concepts: [
        // Emozioni e sentimenti
        'Gioia', 'Letizia', 'Allegria', 'Felicità', 'Contentezza', 'Esultanza', 'Tripudio',
        'Amore', 'Affetto', 'Tenerezza', 'Dolcezza', 'Passione', 'Ardore', 'Trasporto',
        'Estasi', 'Incanto', 'Fascino', 'Magia', 'Stupore', 'Meraviglia', 'Ammirazione',
        'Grazia', 'Eleganza', 'Raffinatezza', 'Finezza', 'Delicatezza', 'Soavità', 'Leggiadria',
        'Serenità', 'Pace', 'Calma', 'Quiete', 'Tranquillità', 'Placidità', 'Mitezza',
        'Armonia', 'Equilibrio', 'Concordia', 'Sintonia', 'Accordo', 'Intesa', 'Unione',
        'Speranza', 'Fiducia', 'Fede', 'Certezza', 'Sicurezza', 'Fermezza', 'Costanza',
        'Mistero', 'Enigma', 'Arcano', 'Segreto', 'Mistero', 'Ignoto', 'Occulto',
        'Sogno', 'Fantasia', 'Immaginazione', 'Visione', 'Illusione', 'Chimera', 'Utopia',
        'Desiderio', 'Brama', 'Anelito', 'Aspirazione', 'Ambizione', 'Voglia', 'Cupidigia',
        'Nostalgia', 'Rimpianto', 'Melanconia', 'Malinconia', 'Tristezza', 'Mestizia',
        'Coraggio', 'Ardimento', 'Audacia', 'Temerarietà', 'Intrepidezza', 'Valore', 'Eroismo',
        
        // Qualità e virtù
        'Bellezza', 'Splendore', 'Magnificenza', 'Grandezza', 'Maestosità', 'Sublimità',
        'Nobiltà', 'Dignità', 'Decoro', 'Onore', 'Gloria', 'Fama', 'Rinomanza',
        'Purezza', 'Innocenza', 'Candore', 'Castità', 'Pudore', 'Modestia', 'Umiltà',
        'Semplicità', 'Sobrietà', 'Frugalità', 'Parsimonia', 'Temperanza', 'Continenza',
        'Gentilezza', 'Cortesia', 'Garbo', 'Creanza', 'Civiltà', 'Urbanità', 'Affabilità',
        'Bontà', 'Benevolenza', 'Benignità', 'Clemenza', 'Pietà', 'Compassione', 'Misericordia',
        'Generosità', 'Liberalità', 'Munificenza', 'Magnanimità', 'Altruismo', 'Abnegazione',
        'Giustizia', 'Equità', 'Rettitudine', 'Probità', 'Integrità', 'Onestà', 'Sincerità',
        'Lealtà', 'Fedeltà', 'Devozione', 'Dedizione', 'Abnegazione', 'Sacrificio',
        'Saggezza', 'Sapienza', 'Prudenza', 'Avvedutezza', 'Accortezza', 'Assennatezza',
        'Intelligenza', 'Ingegno', 'Acume', 'Perspicacia', 'Arguzia', 'Sottigliezza',
        'Pazienza', 'Tolleranza', 'Sopportazione', 'Rassegnazione', 'Perseveranza', 'Tenacia',
        'Fortezza', 'Forza', 'Vigore', 'Robustezza', 'Gagliarda', 'Possanza', 'Potenza',
        
        // Arte e cultura
        'Arte', 'Creatività', 'Estro', 'Genio', 'Talento', 'Ispirazione', 'Afflato',
        'Poesia', 'Lirica', 'Epica', 'Elegia', 'Idillio', 'Egloga', 'Satira',
        'Prosa', 'Narrativa', 'Romanzo', 'Novella', 'Racconto', 'Fiaba', 'Favola',
        'Musica', 'Melodia', 'Armonia', 'Sinfonia', 'Concerto', 'Sonata', 'Cantata',
        'Opera', 'Aria', 'Romanza', 'Canzone', 'Ballata', 'Madrigale', 'Mottetto',
        'Danza', 'Ballo', 'Balletto', 'Coreografia', 'Pantomima', 'Mimo', 'Gesto',
        'Teatro', 'Dramma', 'Commedia', 'Tragedia', 'Farsa', 'Sketch', 'Monologo',
        'Cinema', 'Film', 'Pellicola', 'Lungometraggio', 'Cortometraggio', 'Documentario',
        'Pittura', 'Disegno', 'Affresco', 'Acquarello', 'Tempera', 'Olio', 'Pastello',
        'Scultura', 'Statua', 'Busto', 'Bassorilievo', 'Altorilievo', 'Tuttotondo',
        'Architettura', 'Costruzione', 'Edificio', 'Monumento', 'Palazzo', 'Tempio',
        'Fotografia', 'Ritratto', 'Paesaggio', 'Natura Morta', 'Reportage', 'Still Life',
        
        // Tempo e momenti
        'Alba', 'Aurora', 'Mattino', 'Mattutino', 'Antimeridiano', 'Mezzogiorno', 'Meriggio',
        'Pomeriggio', 'Vespro', 'Sera', 'Imbrunire', 'Crepuscolo', 'Tramonto', 'Occaso',
        'Notte', 'Notturno', 'Mezzanotte', 'Ore Piccole', 'Antelucano', 'Dilucolo',
        'Primavera', 'Estate', 'Autunno', 'Inverno', 'Stagione', 'Mese', 'Settimana',
        'Giorno', 'Ora', 'Minuto', 'Secondo', 'Istante', 'Attimo', 'Momento',
        'Eternità', 'Infinito', 'Perpetuo', 'Perenne', 'Sempiterno', 'Immortale', 'Eterno',
        'Passato', 'Presente', 'Futuro', 'Ieri', 'Oggi', 'Domani', 'Sempre'
    ],
    
    // NOMI FEMMINILI CLASSICI E MODERNI (500+)
    femaleNames: [
        // Italiani tradizionali
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
        
        // Nomi italiani meno comuni
        'Adalgisa', 'Adelaide', 'Adele', 'Adriana', 'Agata', 'Alberta', 'Albina', 'Alda',
        'Allegra', 'Alma', 'Amalia', 'Amanda', 'Ambra', 'Amina', 'Anastasia', 'Andrea',
        'Angela', 'Angelica', 'Angelina', 'Anita', 'Annalisa', 'Annamaria', 'Annunziata',
        'Antonia', 'Apollonia', 'Arabella', 'Armida', 'Artemisia', 'Assunta', 'Astrid',
        'Augusta', 'Aurelia', 'Azzurra', 'Bambina', 'Bice', 'Brigida', 'Bruna', 'Brunella',
        'Camelia', 'Candida', 'Carmela', 'Carmen', 'Carola', 'Carolina', 'Cassandra',
        'Catia', 'Celeste', 'Cesira', 'Cinzia', 'Clara', 'Clarissa', 'Clelia', 'Clementina',
        'Cleopatra', 'Colomba', 'Concetta', 'Consolata', 'Corinna', 'Cornelia', 'Cosima',
        'Costanza', 'Cristiana', 'Dalila', 'Dafne', 'Dalia', 'Damiana', 'Danila', 'Delia',
        'Desdemona', 'Diamante', 'Diletta', 'Dina', 'Dionisia', 'Dora', 'Doris', 'Doriana',
        'Edda', 'Edmea', 'Edvige', 'Elda', 'Elettra', 'Eliana', 'Elide', 'Elma', 'Eloisa',
        'Elvira', 'Emilia', 'Enrichetta', 'Enrica', 'Erminia', 'Ernesta', 'Ersilia',
        'Ester', 'Eugenia', 'Eulalia', 'Eva', 'Evelina', 'Fabiana', 'Fabiola', 'Fausta',
        'Felicia', 'Felicita', 'Fiamma', 'Fides', 'Filomena', 'Fiorella', 'Fiorenza',
        'Flora', 'Floriana', 'Fortunata', 'Fosca', 'Franca', 'Fulvia', 'Gabriela',
        'Gaetana', 'Gelsomina', 'Geltrude', 'Generosa', 'Genoveffa', 'Germana', 'Giacinta',
        'Gianna', 'Gigliola', 'Gilda', 'Gioconda', 'Gioia', 'Giordana', 'Gisella',
        'Giuditta', 'Giuliana', 'Giuseppa', 'Giuseppina', 'Glenda', 'Godiva', 'Greca',
        'Gregoria', 'Guendalina', 'Guia', 'Ida', 'Igea', 'Ilda', 'Ileana', 'Ilenia',
        'Immacolata', 'Ines', 'Innocenza', 'Iolanda', 'Iole', 'Iona', 'Iride', 'Iris',
        'Isa', 'Isotta', 'Italia', 'Ivana', 'Ivonne', 'Katia', 'Lara', 'Lea', 'Leda',
        'Leila', 'Lelia', 'Lena', 'Leonia', 'Leonilda', 'Leonora', 'Letizia', 'Lia',
        'Liana', 'Libera', 'Licia', 'Lidia', 'Lilia', 'Liliana', 'Lina', 'Linda',
        'Lionella', 'Livia', 'Liviana', 'Loredana', 'Lorella', 'Lorenza', 'Loreta',
        'Luce', 'Lucetta', 'Lucilla', 'Lucrezia', 'Ludmilla', 'Luigia', 'Luisella',
        'Lumina', 'Maddalena', 'Mafalda', 'Magda', 'Malvina', 'Manuela', 'Marcellina',
        'Marella', 'Mareta', 'Margot', 'Mariangela', 'Mariapia', 'Mariella', 'Marilena',
        'Marilisa', 'Maristella', 'Marzia', 'Massima', 'Matilda', 'Maura', 'Maurizia',
        'Melina', 'Mercedes', 'Micaela', 'Milva', 'Mina', 'Minerva', 'Miranda', 'Mirella',
        'Miriana', 'Mirta', 'Moira', 'Morena', 'Morgana', 'Myriam', 'Nanda', 'Narcisa',
        'Natalina', 'Nausica', 'Nazarena', 'Neera', 'Nella', 'Nerina', 'Nevina', 'Nicla',
        'Nicoletta', 'Nilde', 'Nina', 'Ninfa', 'Nives', 'Nora', 'Norma', 'Novella',
        'Nuccia', 'Nunzia', 'Odetta', 'Ofelia', 'Olinda', 'Olivia', 'Ombretta', 'Ondina',
        'Onorata', 'Onoria', 'Orazia', 'Oriana', 'Orietta', 'Ornella', 'Orsola', 'Ortensia',
        'Osanna', 'Ottavia', 'Palma', 'Palmira', 'Pamela', 'Paolina', 'Pasqua', 'Pasqualina',
        'Patria', 'Pelagia', 'Perla', 'Perpetua', 'Petronilla', 'Pia', 'Piera', 'Pierina',
        'Pietrina', 'Placida', 'Polissena', 'Porzia', 'Prisca', 'Priscilla', 'Prospera',
        'Provvidenza', 'Prudenzia', 'Quintilia', 'Quirina', 'Raffaella', 'Raimonda',
        'Ramona', 'Rea', 'Reginella', 'Remigia', 'Renata', 'Rina', 'Rinascita', 'Roberta',
        'Romana', 'Romilda', 'Romina', 'Romola', 'Rosalia', 'Rosalinda', 'Rosaria',
        'Rosella', 'Rosetta', 'Rosina', 'Rosita', 'Rosmunda', 'Rossana', 'Rufina',
        'Sabina', 'Salomè', 'Salvina', 'Santina', 'Saveria', 'Savina', 'Sebastiana',
        'Seconda', 'Secondina', 'Selvaggia', 'Serafina', 'Sergia', 'Severina', 'Sibilla',
        'Sidonia', 'Silvana', 'Silveria', 'Silvestrina', 'Simoncina', 'Simonetta', 'Siria',
        'Smeralda', 'Soave', 'Socorro', 'Sofronia', 'Solange', 'Sole', 'Soledad', 'Speranza',
        'Stefanella', 'Stellina', 'Sveva', 'Tabita', 'Taide', 'Tamara', 'Tarcisia',
        'Tatiana', 'Tea', 'Tecla', 'Teodolinda', 'Teodora', 'Teodosia', 'Teofila',
        'Tersilia', 'Tessa', 'Tilde', 'Tina', 'Tiziana', 'Tosca', 'Trasea', 'Tullia',
        'Uberta', 'Ugolina', 'Uliana', 'Uliva', 'Umberta', 'Urbana', 'Ursula', 'Vala',
        'Valchiria', 'Valdrada', 'Vanda', 'Vanna', 'Venera', 'Veneranda', 'Venusta',
        'Verdiana', 'Verena', 'Veridiana', 'Vermiglia', 'Vincenza', 'Violante', 'Virgilia',
        'Virna', 'Vissia', 'Vita', 'Vitalba', 'Vitaliana', 'Vittorina', 'Vivetta',
        'Wanda', 'Yara', 'Yasmine', 'Yolanda', 'Yvette', 'Yvonne', 'Zelda', 'Zelinda',
        'Zelmira', 'Zenaide', 'Zenobia', 'Zita', 'Zoe', 'Zora', 'Zoraide', 'Zuleica'
    ],
    
    // MITOLOGIA E LEGGENDE (300+)
    mythology: [
        // Mitologia greca
        'Zeus', 'Era', 'Poseidone', 'Demetra', 'Atena', 'Apollo', 'Artemide', 'Ares',
        'Afrodite', 'Efesto', 'Ermes', 'Estia', 'Dioniso', 'Ade', 'Persefone', 'Ecate',
        'Selene', 'Eos', 'Elio', 'Nyx', 'Hemera', 'Eris', 'Nike', 'Tyche', 'Nemesi',
        'Themis', 'Dike', 'Moire', 'Cloto', 'Lachesi', 'Atropo', 'Grazie', 'Aglaia',
        'Eufrosine', 'Talia', 'Muse', 'Calliope', 'Clio', 'Erato', 'Euterpe', 'Melpomene',
        'Polimnia', 'Tersicore', 'Urania', 'Mnemosine', 'Metis', 'Oceano', 'Teti',
        'Iperione', 'Teia', 'Crono', 'Rea', 'Febe', 'Ceo', 'Mnemosine', 'Iapeto',
        'Prometeo', 'Epimeteo', 'Atlante', 'Menezio', 'Leto', 'Asteria', 'Perse',
        'Eolo', 'Borea', 'Noto', 'Euro', 'Zefiro', 'Iris', 'Aura', 'Anfitrite',
        'Tritone', 'Nereo', 'Doride', 'Nereidi', 'Thetis', 'Anfitrite', 'Galatea',
        'Cirene', 'Aretusa', 'Dafne', 'Siringa', 'Io', 'Europa', 'Leda', 'Danae',
        'Semele', 'Alcmena', 'Antiope', 'Niobe', 'Tantalo', 'Sisifo', 'Orfeo', 'Euridice',
        'Pandora', 'Prometeo', 'Achille', 'Ettore', 'Paride', 'Elena', 'Menelao',
        'Agamennone', 'Clitemnestra', 'Oreste', 'Elettra', 'Ifigenia', 'Cassandra',
        'Andromaca', 'Ecuba', 'Priamo', 'Enea', 'Didone', 'Ulisse', 'Penelope',
        'Telemaco', 'Circe', 'Calipso', 'Nausicaa', 'Polifemo', 'Scilla', 'Cariddi',
        'Atalanta', 'Meleagro', 'Giasone', 'Medea', 'Teseo', 'Arianna', 'Fedra',
        'Minotauro', 'Dedalo', 'Icaro', 'Perseo', 'Andromeda', 'Pegaso', 'Bellerofonte',
        'Chimera', 'Sfinge', 'Cerbero', 'Idra', 'Centauri', 'Chirone', 'Amazzoni',
        
        // Mitologia romana
        'Giove', 'Giunone', 'Nettuno', 'Cerere', 'Minerva', 'Febo', 'Diana', 'Marte',
        'Venere', 'Vulcano', 'Mercurio', 'Vesta', 'Bacco', 'Plutone', 'Proserpina',
        'Saturno', 'Opi', 'Giano', 'Terminus', 'Lari', 'Penati', 'Mani', 'Lemuri',
        'Fortuna', 'Vittoria', 'Concordia', 'Pax', 'Salus', 'Spes', 'Fides', 'Honos',
        'Virtus', 'Pietas', 'Clementia', 'Iustitia', 'Libertas', 'Abundantia', 'Moneta',
        'Flora', 'Pomona', 'Vertumno', 'Silvano', 'Fauno', 'Pale', 'Terminus', 'Lupercus',
        
        // Mitologia nordica
        'Odino', 'Thor', 'Loki', 'Balder', 'Frigg', 'Freya', 'Freyr', 'Heimdall',
        'Tyr', 'Bragi', 'Idunn', 'Njord', 'Skadi', 'Hel', 'Fenrir', 'Jormungandr',
        'Sleipnir', 'Huginn', 'Muninn', 'Valchirie', 'Brunilde', 'Sigfrido', 'Gudrun',
        'Kriemhilde', 'Hagen', 'Gunther', 'Gernot', 'Giselher', 'Etzel', 'Dietrich',
        
        // Mitologia egizia
        'Ra', 'Osiride', 'Iside', 'Horus', 'Seth', 'Nefti', 'Anubi', 'Thoth', 'Maat',
        'Bastet', 'Sekhmet', 'Hathor', 'Ptah', 'Amon', 'Mut', 'Khonsu', 'Aton',
        'Nut', 'Geb', 'Shu', 'Tefnut', 'Sobek', 'Khepri', 'Khnum', 'Apis', 'Bennu',
        
        // Mitologia celtica
        'Cernunnos', 'Epona', 'Taranis', 'Belenos', 'Brigida', 'Morrigan', 'Dagda',
        'Lugh', 'Manannan', 'Arawn', 'Rhiannon', 'Bran', 'Branwen', 'Blodeuwedd',
        'Ceridwen', 'Taliesin', 'Merlin', 'Morgana', 'Artù', 'Ginevra', 'Lancillotto',
        'Gawain', 'Parsifal', 'Tristano', 'Isotta', 'Viviana', 'Nimue', 'Mordred'
    ],
    
    // ASTRONOMIA E COSTELLAZIONI (200+)
    astronomy: [
        // Costellazioni dello zodiaco
        'Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione',
        'Sagittario', 'Capricorno', 'Acquario', 'Pesci',
        
        // Costellazioni boreali
        'Orsa Maggiore', 'Orsa Minore', 'Drago', 'Cefeo', 'Cassiopea', 'Andromeda',
        'Perseo', 'Auriga', 'Lince', 'Camelopardo', 'Giraffa', 'Cani da Caccia',
        'Boote', 'Corona Boreale', 'Ercole', 'Lira', 'Cigno', 'Aquila', 'Delfino',
        'Cavallino', 'Pegaso', 'Lacerta', 'Triangolo', 'Freccia', 'Volpetta',
        
        // Costellazioni australi
        'Orione', 'Cane Maggiore', 'Cane Minore', 'Idra', 'Cratere', 'Corvo', 'Centauro',
        'Lupo', 'Altare', 'Corona Australe', 'Sagittario', 'Capricorno', 'Acquario',
        'Pesce Australe', 'Balena', 'Eridano', 'Fenice', 'Fornace', 'Orologio',
        'Reticolo', 'Bulino', 'Pittore', 'Colomba', 'Lepre', 'Cane Maggiore', 'Poppa',
        'Vela', 'Carena', 'Bussola', 'Macchina Pneumatica', 'Sestante', 'Tazza',
        'Corvo', 'Croce del Sud', 'Mosca', 'Camaleonte', 'Uccello del Paradiso',
        'Ottante', 'Pavone', 'Indiano', 'Tucano', 'Gru', 'Microscopio', 'Scultore',
        
        // Stelle principali
        'Sirio', 'Canopo', 'Arturo', 'Vega', 'Capella', 'Rigel', 'Procione', 'Achernar',
        'Betelgeuse', 'Hadar', 'Altair', 'Acrux', 'Aldebaran', 'Spica', 'Antares',
        'Polluce', 'Fomalhaut', 'Deneb', 'Mimosa', 'Regolo', 'Adhara', 'Shaula',
        'Gacrux', 'Bellatrix', 'Elnath', 'Miaplacidus', 'Alioth', 'Alnilam', 'Alnair',
        'Alnitak', 'Dubhe', 'Mirfak', 'Wezen', 'Sargas', 'Kaus Australis', 'Avior',
        'Alkaid', 'Menkalinan', 'Alphard', 'Hamal', 'Diphda', 'Nunki', 'Menkent',
        'Alpheratz', 'Mirach', 'Saiph', 'Kochab', 'Rasalhague', 'Algol', 'Almach',
        'Denebola', 'Alphecca', 'Mintaka', 'Sadr', 'Schedar', 'Caph', 'Izar',
        'Menkab', 'Zosma', 'Acrab', 'Tarazed', 'Zubenelgenubi', 'Zubeneschamali',
        
        // Pianeti e satelliti
        'Mercurio', 'Venere', 'Terra', 'Marte', 'Giove', 'Saturno', 'Urano', 'Nettuno',
        'Plutone', 'Cerere', 'Eris', 'Makemake', 'Haumea', 'Sedna', 'Quaoar', 'Orcus',
        'Luna', 'Fobos', 'Deimos', 'Io', 'Europa', 'Ganimede', 'Callisto', 'Titano',
        'Encelado', 'Mimas', 'Rea', 'Giapeto', 'Dione', 'Teti', 'Miranda', 'Ariel',
        'Umbriel', 'Oberon', 'Titania', 'Tritone', 'Nereide', 'Caronte', 'Notte', 'Idra'
    ],
    
    // MUSICA E STRUMENTI (200+)
    music: [
        // Strumenti a corda
        'Arpa', 'Lira', 'Cetra', 'Chitarra', 'Liuto', 'Mandolino', 'Banjo', 'Ukulele',
        'Violino', 'Viola', 'Violoncello', 'Contrabbasso', 'Clavicembalo', 'Pianoforte',
        'Spinetta', 'Virginale', 'Salterio', 'Dulcimer', 'Sitar', 'Balalaika', 'Bouzouki',
        
        // Strumenti a fiato
        'Flauto', 'Ottavino', 'Oboe', 'Clarinetto', 'Fagotto', 'Sassofono', 'Tromba',
        'Trombone', 'Corno', 'Tuba', 'Eufonio', 'Buccina', 'Cornetta', 'Flicorno',
        'Ocarina', 'Zampogna', 'Cornamusa', 'Piffero', 'Bombarda', 'Dulciana', 'Musette',
        
        // Strumenti a percussione
        'Tamburo', 'Timpano', 'Grancassa', 'Rullante', 'Tom', 'Bongo', 'Conga', 'Djembe',
        'Xilofono', 'Marimba', 'Vibrafono', 'Glockenspiel', 'Campane', 'Campanelli',
        'Piatti', 'Gong', 'Triangolo', 'Nacchere', 'Maracas', 'Sonagli', 'Tamburello',
        
        // Termini musicali
        'Melodia', 'Armonia', 'Sinfonia', 'Concerto', 'Sonata', 'Cantata', 'Serenata',
        'Notturno', 'Preludio', 'Fuga', 'Toccata', 'Fantasia', 'Rapsodia', 'Ballata',
        'Romanza', 'Barcarola', 'Berceuse', 'Capriccio', 'Divertimento', 'Intermezzo',
        'Minuetto', 'Gavotta', 'Sarabanda', 'Giga', 'Allemanda', 'Corrente', 'Bourrée',
        'Pavana', 'Gagliarda', 'Tarantella', 'Mazurka', 'Polka', 'Valzer', 'Tango',
        'Bolero', 'Habanera', 'Seguidilla', 'Fandango', 'Pasodoble', 'Flamenco',
        
        // Voci e registri
        'Soprano', 'Mezzosoprano', 'Contralto', 'Tenore', 'Baritono', 'Basso', 'Falsetto',
        'Castrato', 'Controtenore', 'Coloratura', 'Belcanto', 'Spinto', 'Lirico', 'Drammatico',
        
        // Generi musicali
        'Opera', 'Operetta', 'Musical', 'Oratorio', 'Messa', 'Requiem', 'Madrigale',
        'Mottetto', 'Canzone', 'Chanson', 'Lied', 'Aria', 'Cavatina', 'Recitativo',
        'Blues', 'Jazz', 'Swing', 'Bebop', 'Rock', 'Pop', 'Soul', 'Funk', 'Reggae',
        
        // Compositori come nomi
        'Vivaldi', 'Allegro', 'Andante', 'Adagio', 'Presto', 'Largo', 'Moderato',
        'Vivace', 'Maestoso', 'Dolce', 'Forte', 'Piano', 'Crescendo', 'Diminuendo',
        'Staccato', 'Legato', 'Rubato', 'Tremolo', 'Vibrato', 'Glissando', 'Portamento'
    ],
    
    // SPEZIE E AROMI (150+)
    spices: [
        // Spezie comuni
        'Pepe', 'Peperoncino', 'Paprika', 'Cannella', 'Chiodi di Garofano', 'Noce Moscata',
        'Zenzero', 'Curcuma', 'Zafferano', 'Cardamomo', 'Coriandolo', 'Cumino', 'Anice',
        'Finocchio', 'Aneto', 'Senape', 'Vaniglia', 'Macis', 'Carvi', 'Nigella', 'Sommacco',
        
        // Erbe aromatiche
        'Basilico', 'Origano', 'Timo', 'Rosmarino', 'Salvia', 'Maggiorana', 'Menta',
        'Prezzemolo', 'Erba Cipollina', 'Dragoncello', 'Santoreggia', 'Levistico',
        'Melissa', 'Mentuccia', 'Nepitella', 'Issopo', 'Ruta', 'Tanaceto', 'Assenzio',
        
        // Miscele di spezie
        'Curry', 'Garam Masala', 'Ras el Hanout', 'Berbere', 'Harissa', 'Zaatar',
        'Baharat', 'Dukkah', 'Shichimi', 'Furikake', 'Herbes de Provence', 'Bouquet Garni',
        
        // Aromi e essenze
        'Ambra', 'Muschio', 'Incenso', 'Mirra', 'Benzoino', 'Storace', 'Labdano',
        'Patchouli', 'Vetiver', 'Sandalo', 'Cedro', 'Oud', 'Neroli', 'Bergamotto',
        'Gelsomino', 'Rosa', 'Lavanda', 'Geranio', 'Ylang Ylang', 'Tuberosa', 'Frangipani',
        
        // Resine e balsami
        'Copale', 'Elemi', 'Mastice', 'Opoponaco', 'Galbano', 'Asafetida', 'Canfora',
        'Eucalipto', 'Tea Tree', 'Cajeput', 'Nardo', 'Spiganardo', 'Calamo', 'Acoro',
        
        // Frutti aromatici
        'Limone', 'Arancia', 'Mandarino', 'Pompelmo', 'Lime', 'Cedro', 'Chinotto',
        'Kumquat', 'Yuzu', 'Combava', 'Citronella', 'Lemongrass', 'Galanga', 'Kaffir',
        
        // Radici e cortecce
        'Liquirizia', 'Sassofrasso', 'Cassia', 'Rabarbaro', 'Ginseng', 'Angelica',
        'Valeriana', 'Iris', 'Vetiver', 'Zedoaria', 'Galanga', 'Alpinia', 'Curcuma'
    ],
    
    // TESSUTI E MATERIALI (200+)
    fabrics: [
        // Tessuti naturali
        'Seta', 'Cotone', 'Lino', 'Lana', 'Cashmere', 'Mohair', 'Alpaca', 'Angora',
        'Vicuña', 'Cammello', 'Canapa', 'Juta', 'Ramie', 'Bambù', 'Tencel', 'Modal',
        
        // Tessuti pregiati
        'Broccato', 'Damasco', 'Velluto', 'Raso', 'Taffetà', 'Organza', 'Tulle',
        'Chiffon', 'Georgette', 'Crêpe', 'Charmeuse', 'Dupioni', 'Shantung', 'Jacquard',
        
        // Tessuti tecnici
        'Denim', 'Canvas', 'Twill', 'Gabardine', 'Popeline', 'Oxford', 'Chambray',
        'Percalle', 'Flanella', 'Tweed', 'Tartan', 'Principe di Galles', 'Pied de Poule',
        
        // Pizzi e ricami
        'Pizzo', 'Valenciennes', 'Chantilly', 'Alençon', 'Macramè', 'Sangallo',
        'Ricamo', 'Appliqué', 'Paillettes', 'Perline', 'Strass', 'Borchie', 'Frange',
        
        // Tessuti moderni
        'Lycra', 'Spandex', 'Nylon', 'Poliestere', 'Acrilico', 'Viscosa', 'Rayon',
        'Acetato', 'Triacetato', 'Lurex', 'Lamé', 'Neoprene', 'Alcantara', 'Microfibra',
        
        // Pelli e pellicce
        'Pelle', 'Camoscio', 'Nabuk', 'Vernice', 'Coccodrillo', 'Pitone', 'Struzzo',
        'Cavallino', 'Vitello', 'Agnello', 'Montone', 'Renna', 'Cinghiale', 'Peccari',
        
        // Tessuti etnici
        'Batik', 'Ikat', 'Shibori', 'Kilim', 'Paisley', 'Madras', 'Gingham', 'Vichy',
        'Liberty', 'Toile de Jouy', 'Chintz', 'Calicò', 'Mussola', 'Voile', 'Batista',
        
        // Lavorazioni
        'Plissé', 'Smock', 'Trapunto', 'Matelassé', 'Cloqué', 'Seersucker', 'Dobby',
        'Fil Coupé', 'Dévoré', 'Floccato', 'Goffrato', 'Mercerizzato', 'Sanforizzato',
        
        // Finissaggi
        'Lamé', 'Metallizzato', 'Iridescente', 'Cangiante', 'Opaco', 'Lucido', 'Satinato',
        'Felpato', 'Spazzolato', 'Fiammato', 'Froissé', 'Stropicciato', 'Vintage', 'Slavato'
    ],
    
    // COLORI E SFUMATURE (250+)
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
        'Basilico', 'Lime', 'Pistacchio', 'Avocado', 'Kiwi', 'Mela', 'Chartreuse',
        'Celadon', 'Veronese', 'Bottiglia', 'Petrolio', 'Acqua', 'Tiffany', 'Turchese',
        
        // Blu
        'Blu', 'Azzurro', 'Celeste', 'Cielo', 'Mare', 'Oceano', 'Cobalto', 'Zaffiro',
        'Navy', 'Notte', 'Indaco', 'Denim', 'Jeans', 'Petrolio', 'Pavone', 'Pervinca',
        'Fiordaliso', 'Lavanda', 'Avio', 'Polvere', 'Acciaio', 'Ardesia', 'Grigio Blu',
        'Ciano', 'Acquamarina', 'Turchese', 'Carta da Zucchero', 'Klein', 'Elettrico',
        
        // Viola
        'Viola', 'Violetto', 'Lilla', 'Glicine', 'Lavanda', 'Malva', 'Orchidea', 'Iris',
        'Ametista', 'Prugna', 'Melanzana', 'Vinaccia', 'Borgogna', 'Magenta', 'Ciclamino',
        'Erica', 'Pervinca', 'Indaco', 'Porpora', 'Cardinale', 'Vescovo', 'Regale',
        
        // Rosa
        'Rosa', 'Rosa Antico', 'Rosa Cipria', 'Rosa Confetto', 'Rosa Pallido', 'Shocking',
        'Fucsia', 'Magenta', 'Corallo', 'Salmone', 'Pesca', 'Carne', 'Nudo', 'Blush',
        'Malva', 'Orchidea', 'Ciclamino', 'Azalea', 'Peonia', 'Camelia', 'Ortensia',
        
        // Marroni
        'Marrone', 'Cioccolato', 'Cacao', 'Caffè', 'Espresso', 'Cappuccino', 'Nocciola',
        'Castagna', 'Mogano', 'Ebano', 'Noce', 'Teak', 'Quercia', 'Faggio', 'Betulla',
        'Terra', 'Siena', 'Ombra', 'Seppia', 'Tabacco', 'Cuoio', 'Cognac', 'Caramello',
        'Cannella', 'Ruggine', 'Rame', 'Bronzo', 'Ottone', 'Ambra', 'Miele', 'Biscotto',
        
        // Grigi
        'Grigio', 'Argento', 'Perla', 'Cenere', 'Fumo', 'Grafite', 'Antracite', 'Carbone',
        'Piombo', 'Acciaio', 'Ferro', 'Cemento', 'Asfalto', 'Ardesia', 'Pietra', 'Roccia',
        'Nebbia', 'Foschia', 'Bruma', 'Tempesta', 'Nuvola', 'Ombra', 'Penombra', 'Crepuscolo',
        'Tortora', 'Talpa', 'Topo', 'Elefante', 'Colomba', 'Piccione', 'Ghiaccio', 'Opalino',
        
        // Bianchi e neri
        'Bianco', 'Neve', 'Latte', 'Panna', 'Avorio', 'Crema', 'Gesso', 'Calce', 'Perla',
        'Madreperla', 'Opalino', 'Alabastro', 'Magnolia', 'Giglio', 'Candido', 'Puro',
        'Nero', 'Ebano', 'Carbone', 'Inchiostro', 'Catrame', 'Pece', 'Ossidiana', 'Onice',
        'Corvino', 'Notte', 'Mezzanotte', 'Abisso', 'Vuoto', 'Cosmo', 'Infinito', 'Mistero'
    ]
};

// Funzione per ottenere tutti i nomi disponibili
function getAllNames() {
    const allNames = [];
    for (const category in namePool) {
        allNames.push(...namePool[category]);
    }
    return [...new Set(allNames)]; // Rimuovi duplicati
}

// Cache per i nomi già utilizzati nelle diverse stagioni
let seasonNamesCache = {};

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

// Endpoint per verificare lo stato del servizio
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'LOFT.73 Name Generator API',
        version: '5.0.0',
        endpoints: {
            'GET /': 'Stato del servizio',
            'POST /api/shopify/products': 'Recupera prodotti esistenti per stagione',
            'POST /api/generate-names': 'Genera nuovi nomi con filtro intelligente',
            'GET /api/name-categories': 'Mostra categorie disponibili',
            'POST /api/test-prompt-filter': 'Testa il filtro prompt'
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
        
        // Salva nella cache
        seasonNamesCache[season] = Array.from(uniqueNames);
        
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

// Funzione per estrarre regole dal prompt
function extractPromptRules(prompt) {
    const rules = {
        exclude: [],
        include: [],
        excludeWords: [],
        preferences: {}
    };
    
    const promptLower = prompt.toLowerCase();
    
    // Pattern per esclusioni
    const excludePatterns = [
        /non usare? (\w+)/gi,
        /evita (\w+)/gi,
        /senza (\w+)/gi,
        /no (\w+)/gi,
        /esclud\w* (\w+)/gi,
        /evitando (\w+)/gi
    ];
    
    // Pattern per inclusioni esclusive
    const includeOnlyPatterns = [
        /solo (\w+)/gi,
        /soltanto (\w+)/gi,
        /esclusivamente (\w+)/gi,
        /unicamente (\w+)/gi
    ];
    
    // Mappa categorie
    const categoryMap = {
        'colori': 'colors',
        'colore': 'colors',
        'animali': 'animals',
        'animale': 'animals',
        'città': 'cities',
        'citta': 'cities',
        'fiori': 'flowers',
        'fiore': 'flowers',
        'piante': 'flowers',
        'pietre': 'stones',
        'pietra': 'stones',
        'minerali': 'stones',
        'natura': 'nature',
        'naturali': 'nature',
        'geografia': 'nature',
        'concetti': 'concepts',
        'astratti': 'concepts',
        'femminili': 'femaleNames',
        'mitologia': 'mythology',
        'mitologici': 'mythology',
        'astronomia': 'astronomy',
        'stelle': 'astronomy',
        'costellazioni': 'astronomy',
        'musica': 'music',
        'musicali': 'music',
        'strumenti': 'music',
        'spezie': 'spices',
        'aromi': 'spices',
        'tessuti': 'fabrics',
        'tessuto': 'fabrics',
        'materiali': 'fabrics'
    };
    
    // Estrai esclusioni
    excludePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(prompt)) !== null) {
            const word = match[1].toLowerCase();
            if (categoryMap[word]) {
                rules.exclude.push(categoryMap[word]);
            }
        }
    });
    
    // Estrai inclusioni esclusive
    includeOnlyPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(prompt)) !== null) {
            const word = match[1].toLowerCase();
            if (categoryMap[word]) {
                rules.include.push(categoryMap[word]);
            }
        }
    });
    
    // Estrai parole specifiche da escludere
    const excludeWordsPattern = /evita ([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/g;
    let match;
    while ((match = excludeWordsPattern.exec(prompt)) !== null) {
        const words = match[1].split(',').map(w => w.trim().toLowerCase());
        rules.excludeWords.push(...words);
    }
    
    // Preferenze stilistiche
    if (promptLower.includes('corti') || promptLower.includes('brevi')) {
        rules.preferences.maxLength = 6;
    }
    if (promptLower.includes('lunghi')) {
        rules.preferences.minLength = 8;
    }
    if (promptLower.includes('femminili') || promptLower.includes('eleganti')) {
        rules.preferences.feminine = true;
    }
    
    return rules;
}

// Funzione per filtrare i nomi basandosi sulle regole
function filterNamesByRules(names, rules) {
    let filteredNames = [...names];
    
    // Se ci sono categorie da includere esclusivamente
    if (rules.include.length > 0) {
        filteredNames = filteredNames.filter(name => {
            for (const category of rules.include) {
                if (namePool[category] && namePool[category].includes(name)) {
                    return true;
                }
            }
            return false;
        });
    }
    
    // Escludi categorie
    if (rules.exclude.length > 0) {
        filteredNames = filteredNames.filter(name => {
            for (const category of rules.exclude) {
                if (namePool[category] && namePool[category].includes(name)) {
                    return false;
                }
            }
            return true;
        });
    }
    
    // Escludi parole specifiche
    if (rules.excludeWords.length > 0) {
        filteredNames = filteredNames.filter(name => 
            !rules.excludeWords.includes(name.toLowerCase())
        );
    }
    
    // Applica preferenze
    if (rules.preferences.maxLength) {
        filteredNames = filteredNames.filter(name => name.length <= rules.preferences.maxLength);
    }
    if (rules.preferences.minLength) {
        filteredNames = filteredNames.filter(name => name.length >= rules.preferences.minLength);
    }
    if (rules.preferences.feminine) {
        filteredNames = filteredNames.filter(name => 
            name.endsWith('a') || name.endsWith('e') || name.endsWith('i')
        );
    }
    
    return filteredNames;
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

// Funzione per generare mix intelligente di nomi
function intelligentNameMixer(availableNames, existingNamesAllSeasons, currentSeasonNames, count) {
    // Costanti per il mix
    const NEW_NAMES_PERCENTAGE = 0.6; // 60% nuovi
    const REUSED_NAMES_PERCENTAGE = 0.4; // 40% riutilizzati
    
    // Calcola quanti nomi per ogni categoria
    const newNamesCount = Math.ceil(count * NEW_NAMES_PERCENTAGE);
    const reusedNamesCount = count - newNamesCount;
    
    // 1. Trova nomi MAI usati in nessuna stagione
    const neverUsedNames = availableNames.filter(name => 
        !existingNamesAllSeasons.includes(name)
    );
    
    // 2. Trova nomi usati in altre stagioni ma NON in questa
    const reusableNames = existingNamesAllSeasons.filter(name => 
        !currentSeasonNames.includes(name) && availableNames.includes(name)
    );
    
    console.log(`Mix intelligente: ${newNamesCount} nuovi + ${reusedNamesCount} riutilizzati`);
    console.log(`Nomi mai usati disponibili: ${neverUsedNames.length}`);
    console.log(`Nomi riutilizzabili: ${reusableNames.length}`);
    
    const result = [];
    const sources = {
        pool: 0,
        otherSeasons: 0
    };
    
    // Prendi prima i nomi nuovi
    const shuffledNew = shuffleArray(neverUsedNames);
    const selectedNew = shuffledNew.slice(0, Math.min(newNamesCount, shuffledNew.length));
    selectedNew.forEach(name => {
        result.push({
            id: Date.now() + Math.random(),
            name: name,
            source: 'pool'
        });
        sources.pool++;
    });
    
    // Se non ci sono abbastanza nomi nuovi, compensa con i riutilizzabili
    const remainingSlots = count - result.length;
    
    if (remainingSlots > 0 && reusableNames.length > 0) {
        const shuffledReused = shuffleArray(reusableNames);
        const selectedReused = shuffledReused.slice(0, Math.min(remainingSlots, shuffledReused.length));
        selectedReused.forEach(name => {
            result.push({
                id: Date.now() + Math.random(),
                name: name,
                source: 'other-seasons'
            });
            sources.otherSeasons++;
        });
    }
    
    // Se ancora non bastano, usa qualsiasi nome disponibile non in stagione corrente
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
                source: existingNamesAllSeasons.includes(name) ? 'other-seasons' : 'pool'
            });
            if (existingNamesAllSeasons.includes(name)) {
                sources.otherSeasons++;
            } else {
                sources.pool++;
            }
        });
    }
    
    // Mescola il risultato finale per mixare nuovi e riutilizzati
    return {
        names: shuffleArray(result),
        sources: sources
    };
}

// Endpoint per generare nomi
app.post('/api/generate-names', async (req, res) => {
    const { prompt, count = 20, season, existingNames = [] } = req.body;
    
    if (!season) {
        return res.status(400).json({ 
            success: false, 
            error: 'Season parameter is required' 
        });
    }
    
    try {
        // Ottieni tutti i nomi disponibili
        let availableNames = getAllNames();
        
        // Estrai regole dal prompt
        const rules = extractPromptRules(prompt || '');
        
        // Applica filtri basati sul prompt
        availableNames = filterNamesByRules(availableNames, rules);
        
        console.log(`Nomi dopo filtri: ${availableNames.length}`);
        
        // Raccogli tutti i nomi esistenti da tutte le stagioni nella cache
        const allExistingNames = [];
        Object.values(seasonNamesCache).forEach(names => {
            allExistingNames.push(...names);
        });
        
        // Genera mix intelligente
        const result = intelligentNameMixer(
            availableNames,
            allExistingNames,
            existingNames,
            count
        );
        
        res.json({
            success: true,
            names: result.names,
            total: result.names.length,
            sources: result.sources,
            debug: {
                totalAvailable: availableNames.length,
                rules: rules,
                cachedSeasons: Object.keys(seasonNamesCache).length
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
        categories[category] = {
            count: names.length,
            examples: names.slice(0, 10)
        };
    }
    
    res.json({
        totalNames: getAllNames().length,
        categories: categories
    });
});

// Endpoint per testare il filtro prompt
app.post('/api/test-prompt-filter', (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            error: 'Prompt parameter is required' 
        });
    }
    
    const rules = extractPromptRules(prompt);
    const allNames = getAllNames();
    const filteredNames = filterNamesByRules(allNames, rules);
    
    // Trova quali categorie sono state escluse
    const categoriesExcluded = [];
    const categoriesIncluded = [];
    
    rules.exclude.forEach(cat => {
        if (namePool[cat]) {
            categoriesExcluded.push(cat);
        }
    });
    
    rules.include.forEach(cat => {
        if (namePool[cat]) {
            categoriesIncluded.push(cat);
        }
    });
    
    res.json({
        prompt: prompt,
        rules: rules,
        sample_size: 100,
        filtered_size: filteredNames.length,
        filtered_names: filteredNames.slice(0, 100),
        categories_excluded: categoriesExcluded,
        categories_included: categoriesIncluded,
        words_excluded: rules.excludeWords
    });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`✅ LOFT.73 Name Generator API v5.0`);
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
