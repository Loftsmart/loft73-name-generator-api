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
        'Luna', 'Fobos', 'Deimos', 'Io', 'Europa', 'Ganimede', 'Callisto', 'Amaltea',
        'Himalia', 'Elara', 'Pasifae', 'Sinope', 'Lisitea', 'Carme', 'Ananke', 'Leda',
        'Tebe', 'Adrastea', 'Metis', 'Titano', 'Rea', 'Giapeto', 'Dione', 'Teti',
        'Encelado', 'Mimas', 'Iperione', 'Febe', 'Giano', 'Epimeteo', 'Elena', 'Pandora',
        'Prometeo', 'Atlante', 'Pan', 'Dafni', 'Miranda', 'Ariel', 'Umbriel', 'Titania',
        'Oberon', 'Cordelia', 'Ofelia', 'Bianca', 'Cressida', 'Desdemona', 'Giulietta',
        'Porzia', 'Rosalinda', 'Belinda', 'Puck', 'Tritone', 'Nereide', 'Naiade',
        'Talassa', 'Despina', 'Galatea', 'Larissa', 'Proteo', 'Caronte', 'Notte', 'Idra'
    ],
    
    // MUSICA E STRUMENTI (200+)
    music: [
        // Strumenti a corda
        'Arpa', 'Lira', 'Cetra', 'Salterio', 'Violino', 'Viola', 'Violoncello',
        'Contrabbasso', 'Chitarra', 'Liuto', 'Mandolino', 'Mandola', 'Banjo', 'Ukulele',
        'Balalaica', 'Bouzouki', 'Sitar', 'Sarod', 'Tambura', 'Koto', 'Guzheng', 'Pipa',
        'Clavicembalo', 'Spinetta', 'Virginale', 'Clavicordo', 'Pianoforte', 'Fortepiano',
        
        // Strumenti a fiato
        'Flauto', 'Ottavino', 'Piffero', 'Zufolo', 'Ocarina', 'Quena', 'Shakuhachi',
        'Oboe', 'Corno Inglese', 'Clarinetto', 'Clarone', 'Saxofono', 'Fagotto',
        'Controfagotto', 'Dulciana', 'Musette', 'Bombardino', 'Ciaramella', 'Launeddas',
        'Tromba', 'Trombone', 'Corno', 'Flicorno', 'Cornetta', 'Buccina', 'Tuba',
        'Helicon', 'Sousafono', 'Bombardino', 'Eufonio', 'Oficleide', 'Serpentone',
        'Organo', 'Armonium', 'Fisarmonica', 'Bandoneon', 'Concertina', 'Melodica',
        'Armonica', 'Kazoo', 'Didgeridoo', 'Alphorn', 'Shofar', 'Vuvuzela',
        
        // Strumenti a percussione
        'Tamburo', 'Grancassa', 'Rullante', 'Tom', 'Timpano', 'Bonghi', 'Congas',
        'Djembe', 'Darbuka', 'Tabla', 'Taiko', 'Cajón', 'Tamburello', 'Pandeiro',
        'Cembalo', 'Piatti', 'Gong', 'Tam-tam', 'Campane', 'Campanelli', 'Glockenspiel',
        'Vibrafono', 'Xilofono', 'Marimba', 'Celesta', 'Carillon', 'Triangolo',
        'Nacchere', 'Castagn
        // CONTINUA DA PARTE 1...
        'Nacchere', 'Castagnette', 'Maracas', 'Shaker', 'Guiro', 'Cabasa', 'Afuche',
        'Raganella', 'Frusta', 'Woodblock', 'Temple Block', 'Clave', 'Cowbell',
        'Agogo', 'Berimbau', 'Mbira', 'Kalimba', 'Hang', 'Tongue Drum', 'Steelpan',
        
        // Termini musicali
        'Melodia', 'Armonia', 'Ritmo', 'Cadenza', 'Accordo', 'Scala', 'Tonalità',
        'Modulazione', 'Trasposizione', 'Contrappunto', 'Fuga', 'Canone', 'Imitazione',
        'Ostinato', 'Pedale', 'Bordone', 'Glissando', 'Portamento', 'Vibrato', 'Tremolo',
        'Trillo', 'Mordente', 'Appoggiatura', 'Acciaccatura', 'Gruppetto', 'Arpeggio',
        'Staccato', 'Legato', 'Portato', 'Martellato', 'Pizzicato', 'Spiccato',
        'Crescendo', 'Diminuendo', 'Sforzando', 'Fortissimo', 'Pianissimo', 'Rubato',
        'Accelerando', 'Ritardando', 'Rallentando', 'Allargando', 'Stringendo',
        'Adagio', 'Andante', 'Moderato', 'Allegro', 'Presto', 'Vivace', 'Largo',
        'Sinfonia', 'Concerto', 'Sonata', 'Suite', 'Partita', 'Toccata', 'Preludio',
        'Fuga', 'Invenzione', 'Studio', 'Capriccio', 'Fantasia', 'Rapsodia', 'Ballata',
        'Notturno', 'Serenata', 'Divertimento', 'Cassazione', 'Quartetto', 'Quintetto',
        'Opera', 'Operetta', 'Cantata', 'Oratorio', 'Messa', 'Requiem', 'Stabat Mater',
        'Te Deum', 'Magnificat', 'Gloria', 'Kyrie', 'Sanctus', 'Agnus Dei', 'Alleluia'
    ],
    
    // SPEZIE E AROMI (150+)
    spices: [
        // Spezie comuni
        'Pepe', 'Peperoncino', 'Paprika', 'Cannella', 'Chiodi di Garofano', 'Noce Moscata',
        'Macis', 'Zenzero', 'Cardamomo', 'Vaniglia', 'Anice', 'Anice Stellato', 'Finocchio',
        'Cumino', 'Coriandolo', 'Carvi', 'Nigella', 'Sesamo', 'Papavero', 'Senape',
        'Rafano', 'Wasabi', 'Curcuma', 'Zafferano', 'Curry', 'Garam Masala', 'Tandoori',
        'Berbere', 'Harissa', 'Ras el Hanout', 'Zaatar', 'Sumac', 'Tamarindo',
        
        // Erbe aromatiche
        'Basilico', 'Prezzemolo', 'Rosmarino', 'Salvia', 'Timo', 'Origano', 'Maggiorana',
        'Menta', 'Mentuccia', 'Melissa', 'Dragoncello', 'Santoreggia', 'Issopo', 'Levistico',
        'Cerfoglio', 'Erba Cipollina', 'Aneto', 'Finocchietto', 'Alloro', 'Mirto',
        'Ginepro', 'Peperoncino', 'Aglio', 'Cipolla', 'Scalogno', 'Porro', 'Erba di San Pietro',
        'Borragine', 'Rucola', 'Crescione', 'Acetosa', 'Pimpinella', 'Achillea',
        'Artemisia', 'Assenzio', 'Ruta', 'Tanaceto', 'Calendula', 'Nasturzio', 'Viola',
        
        // Miscele e preparati
        'Pesto', 'Chimichurri', 'Chermoula', 'Dukkah', 'Panch Phoron', 'Chinese Five Spice',
        'Herbes de Provence', 'Fines Herbes', 'Bouquet Garni', 'Persillade', 'Gremolata',
        'Soffritto', 'Mirepoix', 'Battuto', 'Trito', 'Salamoia', 'Marinata', 'Rub',
        
        // Aromi esotici
        'Galanga', 'Citronella', 'Combava', 'Pandan', 'Shiso', 'Yuzu', 'Sansho',
        'Shichimi', 'Furikake', 'Gomashio', 'Umeboshi', 'Miso', 'Tahin', 'Harissa',
        'Baharat', 'Advieh', 'Berbere', 'Dukka', 'Hawaij', 'Khmeli Suneli', 'Shatta',
        'Zhug', 'Adjika', 'Tkemali', 'Svanuri Marili', 'Urfa Biber', 'Aleppo',
        'Mahleb', 'Mastic', 'Asafoetida', 'Amchur', 'Anardana', 'Kokum', 'Kala Namak',
        'Fenugreek', 'Ajwain', 'Kalonji', 'Mustard Oil', 'Ghee', 'Smen', 'Preserved Lemons'
    ],
    
    // TESSUTI E MATERIALI (200+)
    textiles: [
        // Fibre naturali animali
        'Seta', 'Lana', 'Cashmere', 'Mohair', 'Angora', 'Alpaca', 'Lama', 'Vigogna',
        'Cammello', 'Yak', 'Qiviut', 'Bisso', 'Crine', 'Pelo', 'Piuma', 'Piumino',
        
        // Fibre naturali vegetali
        'Cotone', 'Lino', 'Canapa', 'Juta', 'Ramie', 'Sisal', 'Cocco', 'Bambù',
        'Eucalipto', 'Kapok', 'Abaca', 'Kenaf', 'Ortica', 'Ginestra', 'Rafia', 'Paglia',
        
        // Tessuti pregiati
        'Velluto', 'Raso', 'Damasco', 'Broccato', 'Lampasso', 'Taffetà', 'Organza',
        'Tulle', 'Chiffon', 'Georgette', 'Crespo', 'Crêpe de Chine', 'Charmeuse',
        'Shantung', 'Dupioni', 'Twill', 'Gabardine', 'Serge', 'Flanella', 'Tweed',
        'Cheviot', 'Melton', 'Loden', 'Bouclé', 'Mohair', 'Velour', 'Alcantara',
        
        // Tessuti tecnici
        'Jersey', 'Interlock', 'Rib', 'Piqué', 'Terry', 'Fleece', 'Softshell',
        'Hardshell', 'Gore-Tex', 'Neoprene', 'Lycra', 'Spandex', 'Elastan', 'Kevlar',
        'Nomex', 'Dyneema', 'Cordura', 'Ripstop', 'Tyvek', 'Coolmax', 'Thermolite',
        
        // Tessuti tradizionali
        'Mussola', 'Batista', 'Voile', 'Lawn', 'Cambric', 'Nainsook', 'Madras',
        'Gingham', 'Chambray', 'Oxford', 'Popeline', 'Percalle', 'Calico', 'Chintz',
        'Toile de Jouy', 'Cretonne', 'Canvas', 'Duck', 'Sailcloth', 'Ticking',
        'Hessian', 'Burlap', 'Osnaburg', 'Monks Cloth', 'Homespun', 'Khadi',
        
        // Pizzi e merletti
        'Pizzo', 'Merletto', 'Valenciennes', 'Chantilly', 'Alençon', 'Guipure',
        'Macramé', 'Filet', 'Reticella', 'Punto in Aria', 'Burano', 'Pellestrina',
        'Cantù', 'Tombolo', 'Chiacchierino', 'Frivolité', 'Crochet', 'Bobbin Lace',
        'Needle Lace', 'Battenberg', 'Renaissance', 'Richelieu', 'Broderie Anglaise',
        
        // Ricami e decorazioni
        'Ricamo', 'Trapunto', 'Appliqué', 'Patchwork', 'Quilting', 'Smocking',
        'Fagoting', 'Drawn Thread', 'Hardanger', 'Blackwork', 'Redwork', 'Whitework',
        'Goldwork', 'Stumpwork', 'Crewel', 'Jacobean', 'Suzani', 'Kantha', 'Sashiko',
        'Kogin', 'Bargello', 'Needlepoint', 'Petit Point', 'Cross Stitch', 'Assisi',
        
        // Tecniche di stampa
        'Batik', 'Tie-Dye', 'Shibori', 'Ikat', 'Block Print', 'Screen Print',
        'Digital Print', 'Discharge', 'Resist', 'Devore', 'Flocking', 'Foiling',
        'Embossing', 'Burnout', 'Ombré', 'Dip Dye', 'Space Dye', 'Yarn Dye'
    ],
    
    // COLORI E SFUMATURE (250+)
    colors: [
        // Rossi
        'Rosso', 'Carminio', 'Vermiglio', 'Scarlatto', 'Cremisi', 'Rubino', 'Granata',
        'Borgogna', 'Amaranto', 'Magenta', 'Fucsia', 'Lampone', 'Fragola', 'Ciliegia',
        'Pomodoro', 'Papavero', 'Corallo', 'Salmone', 'Aragosta', 'Terracotta',
        'Mattone', 'Ruggine', 'Rame', 'Bordeaux', 'Vinaccia', 'Prugna', 'Melanzana',
        
        // Arancioni
        'Arancione', 'Mandarino', 'Arancio', 'Albicocca', 'Pesca', 'Melone', 'Papaya',
        'Zucca', 'Carota', 'Ambra', 'Ocra', 'Senape', 'Zafferano', 'Curcuma', 'Miele',
        
        // Gialli
        'Giallo', 'Limone', 'Canarino', 'Girasole', 'Mais', 'Grano', 'Paglia', 'Sabbia',
        'Crema', 'Vaniglia', 'Burro', 'Champagne', 'Oro', 'Ottone', 'Bronzo',
        
        // Verdi
        'Verde', 'Smeraldo', 'Giada', 'Malachite', 'Oliva', 'Muschio', 'Salvia', 'Menta',
        'Pistacchio', 'Lime', 'Chartreuse', 'Prato', 'Foglia', 'Foresta', 'Pino',
        'Abete', 'Cipresso', 'Eucalipto', 'Felce', 'Alga', 'Acquamarina', 'Turchese',
        
        // Blu
        'Blu', 'Azzurro', 'Celeste', 'Cielo', 'Mare', 'Oceano', 'Zaffiro', 'Cobalto',
        'Lapislazzuli', 'Indaco', 'Denim', 'Navy', 'Notte', 'Mezzanotte', 'Inchiostro',
        'Pavone', 'Petrolio', 'Ceruleo', 'Pervinca', 'Fiordaliso', 'Avio', 'Carta da Zucchero',
        
        // Viola
        'Viola', 'Porpora', 'Ametista', 'Lavanda', 'Lilla', 'Glicine', 'Malva', 'Melanzana',
        'Prugna', 'Uva', 'Mirtillo', 'More', 'Violetta', 'Orchidea', 'Magenta',
        
        // Rosa
        'Rosa', 'Rosa Antico', 'Rosa Pallido', 'Rosa Shocking', 'Fucsia', 'Confetto',
        'Cipria', 'Pesca', 'Salmone', 'Corallo', 'Geranio', 'Azalea', 'Peonia',
        
        // Marroni
        'Marrone', 'Cioccolato', 'Cacao', 'Caffè', 'Espresso', 'Cappuccino', 'Nocciola',
        'Castagna', 'Noce', 'Mogano', 'Ebano', 'Teak', 'Quercia', 'Faggio', 'Castagno',
        'Terra di Siena', 'Terra d\'Ombra', 'Seppia', 'Tortora', 'Talpa', 'Topo',
        
        // Grigi
        'Grigio', 'Argento', 'Platino', 'Titanio', 'Acciaio', 'Ferro', 'Piombo', 'Ardesia',
        'Antracite', 'Carbone', 'Cenere', 'Fumo', 'Nebbia', 'Perla', 'Ghiaccio',
        
        // Bianchi e neri
        'Bianco', 'Neve', 'Latte', 'Panna', 'Avorio', 'Osso', 'Gesso', 'Alabastro',
        'Nero', 'Ebano', 'Onice', 'Ossidiana', 'Catrame', 'Pece', 'Corvino',
        
        // Metallici e iridescenti
        'Oro', 'Argento', 'Bronzo', 'Rame', 'Ottone', 'Ferro', 'Acciaio', 'Titanio',
        'Platino', 'Palladio', 'Rodio', 'Iridio', 'Madreperla', 'Opale', 'Aurora'
    ]
};

// Mapping stagioni UI -> Shopify tags
const SEASON_MAPPING = {
    'PE 24': '24E',
    'AI 24': '24I',
    'PE 25': '25E',
    'AI 25': '25I',
    'PE 26': '26E',
    'AI 26': '26I',
    'PE 27': '27E',
    'AI 27': '27I',
    'PE 28': '28E',
    'AI 28': '28I'
};

// Funzione per appiattire tutti i pool in un unico array
function getAllPoolNames() {
    const allNames = [];
    
    // Aggiungi tutti i nomi da ogni categoria
    Object.values(namePool).forEach(category => {
        if (Array.isArray(category)) {
            allNames.push(...category);
        }
    });
    
    // Rimuovi duplicati
    return [...new Set(allNames)];
}

// Funzione SEMPLIFICATA per estrarre il nome
function extractProductName(product) {
    if (!product.title) return null;
    
    const titleUpper = product.title.toUpperCase();
    const allNames = getAllPoolNames();
    
    // Cerca ogni nome possibile nel titolo
    for (const possibleName of allNames) {
        // Usa word boundary per evitare match parziali
        const regex = new RegExp(`\\b${possibleName.toUpperCase()}\\b`, 'i');
        if (regex.test(titleUpper)) {
            // Mantieni la capitalizzazione originale del nome
            return possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
        }
    }
    
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
                
                const lastId = Math.max(...data.products.map(p => p.id));
                sinceId = lastId;
                
                console.log(`📦 Recuperati ${data.products.length} prodotti (totale: ${allProducts.length})`);
                
                if (data.products.length < 250) {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
            
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

// NUOVA FUNZIONE: Recupera nomi da altre stagioni
async function fetchNamesFromOtherSeasons(currentSeason) {
    console.log(`🔄 Recupero nomi da altre stagioni per riutilizzo...`);
    
    const allOtherNames = new Set();
    const otherSeasons = Object.keys(SEASON_MAPPING).filter(s => s !== currentSeason);
    
    for (const season of otherSeasons) {
        try {
            const shopifyTag = SEASON_MAPPING[season];
            const products = await fetchAllShopifyProducts(shopifyTag);
            
            products.forEach(product => {
                const extractedName = extractProductName(product);
                if (extractedName && extractedName.length > 1) {
                    allOtherNames.add(extractedName);
                }
            });
            
            console.log(`   ✓ ${season}: ${products.length} prodotti analizzati`);
            
        } catch (error) {
            console.error(`   ❌ Errore recupero ${season}:`, error.message);
        }
    }
    
    const namesArray = Array.from(allOtherNames);
    console.log(`✅ Totale nomi da altre stagioni: ${namesArray.length}`);
    
    return namesArray;
}

// NUOVA FUNZIONE: Parser per analizzare il prompt e estrarre regole
function parsePromptRules(prompt) {
    const rules = {
        exclude: [],      // Categorie da escludere
        include: [],      // Categorie da includere (se specificate, usa SOLO queste)
        excludeWords: [], // Parole specifiche da escludere
        includeWords: [], // Parole specifiche da includere
        preferences: {}   // Altre preferenze
    };
    
    const promptLower = prompt.toLowerCase();
    
    // REGOLE DI ESCLUSIONE
    // Colori
    if (promptLower.includes('non') && promptLower.includes('color') ||
        promptLower.includes('no color') ||
        promptLower.includes('senza color') ||
        promptLower.includes('evita color')) {
        rules.exclude.push('colors');
        console.log('📌 Regola trovata: Escludere colori');
    }
    
    // Animali
    if (promptLower.includes('evita') && promptLower.includes('animal') ||
        promptLower.includes('no animal') ||
        promptLower.includes('senza animal')) {
        rules.exclude.push('animals');
        console.log('📌 Regola trovata: Escludere animali');
    }
    
    // Città
    if (promptLower.includes('evita') && promptLower.includes('citt') ||
        promptLower.includes('no citt') ||
        promptLower.includes('senza citt')) {
        rules.exclude.push('cities');
        console.log('📌 Regola trovata: Escludere città');
    }
    
    // Pietre
    if (promptLower.includes('evita') && promptLower.includes('pietr') ||
        promptLower.includes('no pietr') ||
        promptLower.includes('senza pietr')) {
        rules.exclude.push('stones');
        console.log('📌 Regola trovata: Escludere pietre');
    }
    
    // Mitologia
    if (promptLower.includes('evita') && promptLower.includes('mitolog') ||
        promptLower.includes('no mitolog') ||
        promptLower.includes('senza mitolog')) {
        rules.exclude.push('mythology');
        console.log('📌 Regola trovata: Escludere mitologia');
    }
    
    // REGOLE DI INCLUSIONE ESCLUSIVA
    // Solo animali
    if (promptLower.includes('solo animal') || 
        promptLower.includes('soltanto animal') ||
        promptLower.includes('unicamente animal')) {
        rules.include = ['animals'];
        console.log('📌 Regola trovata: SOLO animali');
    }
    
    // Solo città
    if (promptLower.includes('solo citt') || 
        promptLower.includes('soltanto citt') ||
        promptLower.includes('unicamente citt')) {
        rules.include = ['cities'];
        console.log('📌 Regola trovata: SOLO città');
    }
    
    // Solo fiori
    if (promptLower.includes('solo fior') || 
        promptLower.includes('soltanto fior') ||
        promptLower.includes('unicamente fior')) {
        rules.include = ['flowers'];
        console.log('📌 Regola trovata: SOLO fiori');
    }
    
    // Solo natura
    if (promptLower.includes('solo natur') || 
        promptLower.includes('soltanto natur') ||
        promptLower.includes('elementi natural')) {
        rules.include = ['nature'];
        console.log('📌 Regola trovata: SOLO natura');
    }
    
    // Solo nomi femminili
    if (promptLower.includes('solo nomi femminil') || 
        promptLower.includes('solo nomi di donna') ||
        promptLower.includes('solo nomi propri')) {
        rules.include = ['femaleNames'];
        console.log('📌 Regola trovata: SOLO nomi femminili');
    }
    
    // PAROLE SPECIFICHE DA ESCLUDERE
    // Cerca pattern tipo "evita Rosa, Viola, Giallo"
    const evitaMatch = promptLower.match(/evita[re]?\s+([^.]+)/);
    if (evitaMatch) {
        const words = evitaMatch[1].split(/[,;]/)
            .map(w => w.trim())
            .filter(w => w.length > 0);
        rules.excludeWords.push(...words);
        console.log('📌 Parole da evitare:', words);
    }
    
    // Pattern "non usare X, Y, Z"
    const nonUsareMatch = promptLower.match(/non\s+usar[e]?\s+([^.]+)/);
    if (nonUsareMatch) {
        const words = nonUsareMatch[1].split(/[,;]/)
            .map(w => w.trim())
            .filter(w => w.length > 0);
        rules.excludeWords.push(...words);
        console.log('📌 Non usare:', words);
    }
    
    // PREFERENZE STILISTICHE
    // Nomi corti
    if (promptLower.includes('nomi corti') || 
        promptLower.includes('nomi brevi') ||
        promptLower.includes('massimo 6 lettere') ||
        promptLower.includes('max 6 lettere')) {
        rules.preferences.maxLength = 6;
        console.log('📌 Preferenza: Nomi corti (max 6 lettere)');
    }
    
    // Nomi lunghi
    if (promptLower.includes('nomi lunghi') || 
        promptLower.includes('almeno 8 lettere') ||
        promptLower.includes('minimo 8 lettere')) {
        rules.preferences.minLength = 8;
        console.log('📌 Preferenza: Nomi lunghi (min 8 lettere)');
    }
    
    // Nomi femminili/eleganti
    if (promptLower.includes('femminil') || 
        promptLower.includes('elegant') ||
        promptLower.includes('raffina') ||
        promptLower.includes('delica')) {
        rules.preferences.feminine = true;
        console.log('📌 Preferenza: Nomi femminili/eleganti');
    }
    
    // Nomi forti/decisi
    if (promptLower.includes('fort') || 
        promptLower.includes('decis') ||
        promptLower.includes('potent') ||
        promptLower.includes('energic')) {
        rules.preferences.strong = true;
        console.log('📌 Preferenza: Nomi forti/decisi');
    }
    
    // Nomi moderni
    if (promptLower.includes('modern') || 
        promptLower.includes('contemporane') ||
        promptLower.includes('attual') ||
        promptLower.includes('trend')) {
        rules.preferences.modern = true;
        console.log('📌 Preferenza: Nomi moderni');
    }
    
    // Nomi classici
    if (promptLower.includes('classic') || 
        promptLower.includes('tradizional') ||
        promptLower.includes('vintage') ||
        promptLower.includes('retrò')) {
        rules.preferences.classic = true;
        console.log('📌 Preferenza: Nomi classici');
    }
    
    return rules;
}

// NUOVA FUNZIONE: Filtra i nomi in base alle regole estratte dal prompt
function filterNamesByRules(availableNames, rules, namePoolCategories) {
    let filtered = [...availableNames];
    
    // Se ci sono categorie da includere ESCLUSIVAMENTE
    if (rules.include.length > 0) {
        console.log(`🎯 Filtrando SOLO categorie: ${rules.include.join(', ')}`);
        filtered = filtered.filter(name => {
            // Trova in quale categoria appartiene il nome
            for (const [category, names] of Object.entries(namePoolCategories)) {
                if (names.includes(name) && rules.include.includes(category)) {
                    return true;
                }
            }
            return false;
        });
    }
    
    // Escludi categorie
    if (rules.exclude.length > 0) {
        console.log(`❌ Escludendo categorie: ${rules.exclude.join(', ')}`);
        filtered = filtered.filter(name => {
            // Trova in quale categoria appartiene il nome
            for (const [category, names] of Object.entries(namePoolCategories)) {
                if (names.includes(name) && rules.exclude.includes(category)) {
                    return false;
                }
            }
            return true;
        });
    }
    
    // Escludi parole specifiche
    if (rules.excludeWords.length > 0) {
        console.log(`❌ Escludendo parole specifiche: ${rules.excludeWords.join(', ')}`);
        filtered = filtered.filter(name => {
            const nameLower = name.toLowerCase();
            return !rules.excludeWords.some(word => 
                nameLower === word.toLowerCase() || 
                nameLower.includes(word.toLowerCase())
            );
        });
    }
    
    // Applica preferenze di lunghezza
    if (rules.preferences.maxLength) {
        filtered = filtered.filter(name => name.length <= rules.preferences.maxLength);
        console.log(`📏 Filtrando nomi max ${rules.preferences.maxLength} lettere`);
    }
    
    if (rules.preferences.minLength) {
        filtered = filtered.filter(name => name.length >= rules.preferences.minLength);
        console.log(`📏 Filtrando nomi min ${rules.preferences.minLength} lettere`);
    }
    
    // Applica preferenze stilistiche
    if (rules.preferences.feminine) {
        // Priorità a nomi che finiscono in 'a', 'ella', 'ina', etc.
        filtered = filtered.filter(name => 
            /[aei]$|ella$|ina$|etta$|issa$|essa$/.test(name.toLowerCase())
        );
        console.log(`💃 Filtrando nomi femminili`);
    }
    
    if (rules.preferences.strong) {
        // Priorità a nomi che NON finiscono in 'a', 'ina', etc.
        filtered = filtered.filter(name => 
            !/[a]$|ina$|ella$|etta$|uccia$/.test(name.toLowerCase())
        );
        console.log(`💪 Filtrando nomi forti/decisi`);
    }
    
    console.log(`✅ Nomi dopo filtro: ${filtered.length}`);
    
    return filtered;
}

// NUOVA FUNZIONE: Mixer intelligente di nomi CON FILTRO PROMPT
function intelligentNameMixer(count, existingLower, otherSeasonsNames, prompt) {
    const generatedNames = [];
    const usedNames = new Set(existingLower);
    
    // NUOVO: Analizza il prompt per estrarre regole
    const rules = parsePromptRules(prompt);
    
    // Ottieni tutti i nomi dal pool
    const allPoolNames = getAllPoolNames();
    
    // NUOVO: Filtra i nomi in base alle regole del prompt
    let availableFromPool = allPoolNames.filter(name => 
        !usedNames.has(name.toLowerCase())
    );
    
    let availableFromOtherSeasons = otherSeasonsNames.filter(name => 
        !usedNames.has(name.toLowerCase())
    );
    
    // Applica i filtri basati sul prompt
    availableFromPool = filterNamesByRules(availableFromPool, rules, namePool);
    availableFromOtherSeasons = filterNamesByRules(availableFromOtherSeasons, rules, namePool);
    
    console.log(`📊 Nomi disponibili DOPO FILTRI:`);
    console.log(`   - Dal pool nuovo: ${availableFromPool.length}`);
    console.log(`   - Da altre stagioni: ${availableFromOtherSeasons.length}`);
    
    // Se dopo i filtri non ci sono abbastanza nomi, avvisa
    const totalAvailable = availableFromPool.length + availableFromOtherSeasons.length;
    if (totalAvailable < count) {
        console.log(`⚠️ ATTENZIONE: Solo ${totalAvailable} nomi disponibili dopo i filtri!`);
        console.log(`   Richiesti: ${count}`);
        console.log(`   Verranno generati: ${totalAvailable}`);
    }
    
    // STRATEGIA DI MIX:
    // 60% dal pool nuovo (per freschezza)
    // 40% da altre stagioni (per riutilizzo testato)
    const newNamesTarget = Math.ceil(count * 0.6);
    const reusedNamesTarget = count - newNamesTarget;
    
    // Mescola gli array per randomizzare
    const shuffledPool = [...availableFromPool].sort(() => Math.random() - 0.5);
    const shuffledReused = [...availableFromOtherSeasons].sort(() => Math.random() - 0.5);
    
    // Prendi nomi dal pool nuovo
    let addedFromPool = 0;
    for (const name of shuffledPool) {
        if (generatedNames.length >= count) break;
        if (addedFromPool >= newNamesTarget) break;
        
        generatedNames.push({
            id: Date.now() + generatedNames.length,
            name: name,
            source: 'pool'
        });
        usedNames.add(name.toLowerCase());
        addedFromPool++;
    }
    
    // Prendi nomi da altre stagioni
    let addedFromSeasons = 0;
    for (const name of shuffledReused) {
        if (generatedNames.length >= count) break;
        if (addedFromSeasons >= reusedNamesTarget) break;
        
        generatedNames.push({
            id: Date.now() + generatedNames.length,
            name: name,
            source: 'other-seasons'
        });
        usedNames.add(name.toLowerCase());
        addedFromSeasons++;
    }
    
    // Se servono ancora nomi, prendi dal pool rimanente
    if (generatedNames.length < count) {
        // Combina tutti i nomi rimanenti
        const allRemaining = [
            ...shuffledPool.slice(addedFromPool),
            ...shuffledReused.slice(addedFromSeasons)
        ].filter(name => !usedNames.has(name.toLowerCase()));
        
        // Mescola e prendi quelli che servono
        const shuffledRemaining = allRemaining.sort(() => Math.random() - 0.5);
        
        for (const name of shuffledRemaining) {
            if (generatedNames.length >= count) break;
            
            generatedNames.push({
                id: Date.now() + generatedNames.length,
                name: name,
                source: allRemaining.indexOf(name) < shuffledPool.length - addedFromPool ? 'pool' : 'other-seasons'
            });
        }
    }
    
    // Mescola il risultato finale per un mix omogeneo
    return generatedNames.sort(() => Math.random() - 0.5);
}

// Routes
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'LOFT.73 Name Generator API',
        version: '5.0.0',
        shopify_connected: true,
        features: [
            'intelligent-mixing',
            'prompt-based-filtering',
            'real-names-only',
            'season-reuse',
            '5000+ names pool'
        ],
        total_names_available: getAllPoolNames().length
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
        },
        pool_size: getAllPoolNames().length
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
    
    const shopifyTag = SEASON_MAPPING[season];
    if (!shopifyTag) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid season' 
        });
    }
    
    try {
        const products = await fetchAllShopifyProducts(shopifyTag);
        
        const names = new Set();
        const brandCount = {};
        const debugExamples = [];
        
        products.forEach(product => {
            const extractedName = extractProductName(product);
            if (extractedName && extractedName.length > 1) {
                names.add(extractedName);
                
                if (debugExamples.length < 50) {
                    debugExamples.push({
                        title: product.title,
                        extracted: extractedName,
                        brand: product.vendor
                    });
                }
                
                const brand = product.vendor || 'Unknown';
                brandCount[brand] = (brandCount[brand] || 0) + 1;
            }
        });
        
        const uniqueNames = Array.from(names).sort();
        
        console.log(`\n📊 REPORT ESTRAZIONE NOMI:`);
        console.log(`   Totale prodotti analizzati: ${products.length}`);
        console.log(`   Nomi unici estratti: ${uniqueNames.length}`);
        console.log(`   Prodotti per brand:`, brandCount);
        
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

// Endpoint per generare nomi - VERSIONE INTELLIGENTE CON FILTRO PROMPT
app.post('/api/generate-names', async (req, res) => {
    const { prompt, count, season, existingNames = [] } = req.body;
    
    if (!count || count < 1) {
        return res.status(400).json({ 
            success: false, 
            error: 'Count must be greater than 0' 
        });
    }
    
    console.log(`\n🎯 Richiesta generazione: ${count} nomi per stagione ${season}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 200)}...`);
    console.log(`🚫 Nomi esistenti da escludere: ${existingNames.length}`);
    
    try {
        const existingLower = existingNames.map(n => n.toLowerCase().trim());
        
        // Recupera nomi da altre stagioni
        const otherSeasonsNames = await fetchNamesFromOtherSeasons(season);
        
        // Genera mix intelligente CON FILTRO PROMPT
        const generatedNames = intelligentNameMixer(count, existingLower, otherSeasonsNames, prompt);
        
        console.log(`\n📊 RIEPILOGO GENERAZIONE:`);
        console.log(`   Richiesti: ${count}`);
        console.log(`   Generati: ${generatedNames.length}`);
        console.log(`   - Dal pool nuovo: ${generatedNames.filter(n => n.source === 'pool').length}`);
        console.log(`   - Da altre stagioni: ${generatedNames.filter(n => n.source === 'other-seasons').length}`);
        
        res.json({
            success: true,
            names: generatedNames,
            total: generatedNames.length,
            sources: {
                pool: generatedNames.filter(n => n.source === 'pool').length,
                otherSeasons: generatedNames.filter(n => n.source === 'other-seasons').length
            }
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
        const testTitles = [
            'LOFT.73 - COMPLETO VENERE',
            'PANTALONE RAGUSA',
            'ABITO ETNA LOFT73',
            'BORSA FARFALLA',
            'MAGLIA LEONE',
            'GONNA PALERMO',
            'GIACCA MILANO',
            'VESTITO AQUILA',
            'CAPPOTTO ROSA',
            'SCIARPA VIOLA'
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
            test: 'Extraction Test',
            totalTested: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint per vedere le categorie di nomi disponibili
app.get('/api/name-categories', (req, res) => {
    const categories = {};
    
    Object.entries(namePool).forEach(([category, names]) => {
        categories[category] = {
            count: names.length,
            examples: names.slice(0, 20)
        };
    });
    
    res.json({
        totalNames: getAllPoolNames().length,
        categories: categories
    });
});

// Endpoint per testare il filtro prompt
app.post('/api/test-prompt-filter', (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            error: 'Prompt required' 
        });
    }
    
    // Analizza il prompt
    const rules = parsePromptRules(prompt);
    
    // Prendi un campione di nomi
    const allNames = getAllPoolNames();
    const sample = allNames.slice(0, 100);
    
    // Applica i filtri
    const filtered = filterNamesByRules(sample, rules, namePool);
    
    res.json({
        prompt: prompt,
        rules: rules,
        sample_size: sample.length,
        filtered_size: filtered.length,
        filtered_names: filtered.slice(0, 20),
        categories_excluded: rules.exclude,
        categories_included: rules.include,
        words_excluded: rules.excludeWords,
        preferences: rules.preferences
    });
});

// Avvia server
app.listen(PORT, () => {
    console.log(`
🚀 LOFT.73 Name Generator API v5.0
📍 Running on port ${PORT}
🔗 Shopify Store: ${SHOPIFY_STORE_URL}
📅 ${new Date().toLocaleString()}
✨ Features: 
   - Mix intelligente 60/40
   - Filtro basato su prompt
   - ${getAllPoolNames().length}+ nomi con significato
   - Categorie: Città, Animali, Natura, Pietre, Fiori, 
     Concetti, Mitologia, Astronomia, Musica, Spezie,
     Tessuti, Colori, Nomi Femminili
   - Supporto stagioni fino al 2028
    `);
});
