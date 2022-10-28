// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api", function (req, res) {
  let dateResult=new Date();
    res.json({unix:dateResult.getTime(),
             utc:dateResult.toGMTString()
             });
});

app.get('/api/:dateinput', (req, res) => {
  let dateResult
  if (/^\d+$/.test(req.params.dateinput)) {
    dateResult= new Date(parseInt(req.params.dateinput));
  }
  else {
    dateResult= new Date(req.params.dateinput);
  }

  if (dateResult instanceof Date && !isNaN(dateResult.valueOf())) {
    let dateResultUnix=dateResult.getTime();
    res.json({unix:dateResultUnix,
             utc:dateResult.toGMTString()
             });
  }
  else {
    res.json({ error : "Invalid Date" })
  }
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
