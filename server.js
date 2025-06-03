const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'LOFT.73 Name Generator API'
  });
});

app.post('/api/shopify/products', (req, res) => {
  const { season } = req.body;
  res.json({ 
    success: true, 
    season,
    names: ['Aurora', 'Luna', 'Stella']
  });
});

app.post('/api/generate-names', (req, res) => {
  res.json({ 
    success: true, 
    names: [
      { id: 1, name: 'Marina' },
      { id: 2, name: 'Viola' },
      { id: 3, name: 'Rosa' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
