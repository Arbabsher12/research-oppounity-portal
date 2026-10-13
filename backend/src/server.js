require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    response.status(500).json({ status: 'error', database: 'unavailable' });
  }
});

app.listen(port, () => {
  console.log(`Research Opportunity Portal running at http://localhost:${port}`);
});
