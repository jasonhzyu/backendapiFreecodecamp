var express = require('express');
var cors = require('cors');
require('dotenv').config()

var app = express();
const bodyParser=require('body-parser');
const fileUpload = require('express-fileupload');
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.use(fileUpload({createParentPath: true}));
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse',async(req,res)=>{
 
  res.json({
    name:req.files.upfile.name,
    type:req.files.upfile.mimetype,
    size:req.files.upfile.size
  });
})


const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
