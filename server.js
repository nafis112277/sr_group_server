const express = require('express');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());
app.use('/', apiRoutes);

app.get('/', (req, res) => {
  res.send('SR Group API is running!');
});

app.listen(port, () => {
  console.log('Server running on port ' + port);
});