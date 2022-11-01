require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bardyParser = require('body-parser');
const mongoose = require('mongoose');
// Basic Configuration
const port = process.env.PORT || 3000;

function isValidUrl(urlString) {
  console.log(urlString);
  /*
  try { 
    return Boolean(new URL(urlString)); 
  }
  catch(e){ 
    return false; 
  }*/
  const pattern = new RegExp('^(https?:\\/\\/)?'+
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
    '((\\d{1,3}\\.){3}\\d{1,3}))'+
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
    '(\\?[;&a-z\\d%_.~+=-]*)?'+
    '(\\#[-a-z\\d_]*)?$','i');
  return !!pattern.test(urlString);
}
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bardyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//mongoose applications
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true });

const Schema=mongoose.Schema;
const urlSchema = new Schema ({
  original_url: {type: String,
         required: true},
  short_url:{type: Number,
         required: true}
});
let urlModel=mongoose.model("Url",urlSchema);

// Your first API endpoint
app.get('/api/shorturl/:short_url', async (req, res)=>{
  try {
    const findOneResult = await urlModel.findOne({short_url:req.params.short_url});
    if (findOneResult) {
      res.redirect(findOneResult.original_url);
    }
    else {
      res.json({error:'invalid url'});
    }
  }
  catch (err) {
    console.error(err);
  }
});

app.post('/api/shorturl',async (req,res)=>{
  console.log("new request");
  if (isValidUrl(req.body.url)) {
    try {
      const findOneResult = await urlModel.findOne({original_url:req.body.url});
      if (findOneResult) {
        res.json({original_url:findOneResult.original_url, short_url: findOneResult.short_url});
      }
      else {
        const findAllResult = await urlModel.find();
        const listOFShortUrl=findAllResult.map(eachresult=>eachresult.short_url);
        const rndInt = Math.floor(Math.random() * 300) + 1;
        while (listOFShortUrl.includes(rndInt)) {
         rndInt = Math.floor(Math.random() * 300) + 1;
        } 
        const newUrl = new urlModel({original_url: req.body.url,short_url: rndInt});  
        await newUrl.save()
          .then(urlSaved=>{console.log("urlSaved");},err=>{console.error(err);});
        res.json({original_url:req.body.url, short_url: rndInt});
      }
    }
    catch (err) {
      console.error(err);
    }
  }
  else {
    console.log(req.body.url);
    res.json({error:'invalid url'});
  }  
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
