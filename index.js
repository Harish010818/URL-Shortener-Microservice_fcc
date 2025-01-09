require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// create a url schema
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true }
});

const Url = mongoose.model('Url', urlSchema);

// Your first API endpoint
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Handling wrong input URL
  const hostname= new URL(url).hostname;
  
  dns.lookup(hostname, (err, address) => {
      if(err) return res.json({ error: 'Invalid URL' });
  })
  
  try {
      const count = await Url.countDocuments({});
      const newUrl = new Url({ original_url: url, short_url: count + 1 });
      const data = await newUrl.save();
      res.json({ original_url: data.original_url, short_url: data.short_url });
  } catch (err) {
      res.json({ error: 'Something went wrong...' });
  }
});


app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;

  try {
      const data = await Url.findOne({ short_url: shortUrl });
      if (!data) return res.json({ error: 'No short URL found' });
      res.redirect(data.original_url);
  } catch (err) {
      res.json({ error: 'Something went wrong...' });
  }
});



app.listen(port, function() {
   console.log(`Listening on port ${port}`);
});


