const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser=require('body-parser');
const mongoose=require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//mongoose applications
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true,useUnifiedTopology:true});

//Define Schema
const Schema=mongoose.Schema;
const exerciseSchema = new Schema({
  description:String,
  duration:Number,
  date:Date
});
const userSchema=new Schema({
  username:String,
  log:[exerciseSchema]
});

const userModel=mongoose.model('User',userSchema);

//Create new user via post or Get a list of users via get
app.route('/api/users')
  .get(async (req,res)=>{
    const findAllUsersResult= await userModel.find({},{username:1,_id:1});
    res.send(findAllUsersResult);
  })
  .post(async (req,res)=>{
    if (req.body.username) {
      try {
      //search database see if you can find username
        const findUserResult= await userModel.findOne({username:req.body.username})
      // if yes return username and id
        if (findUserResult) {
         res.json({username:findUserResult.username,_id:findUserResult._id});
        }
        //if not create a new useername and id
        else {
          try {
            const newUser= new userModel({username:req.body.username,log:[]});
            const saveUserResult = await newUser.save();
            const findUserResult= await userModel.findOne({username:req.body.username})
            res.json({username:findUserResult.username,_id:findUserResult._id});
          } catch (error) {
            console.error(error);
          }
        }
  
      } catch (error) {
        console.error(error);
      }
  
    }
  });

//Create exercise records via post
app.post('/api/users/:_id/exercises',async (req,res)=>{
  const durationInNumber=Number(req.body.duration);
  let dateInDate
  if (req.body.date) {
    dateInDate=new Date(req.body.date);
  }
  else {
    dateInDate = new Date();
  }
  try {
    //find the person record by id   
    const findAndModifyResult= await userModel.findOneAndUpdate(
      {_id:req.params._id},
      {$push:
        {log:
          {description:req.body.description,
           duration:durationInNumber,
           date:dateInDate}
        }
      },
      {new:true}
    );
    res.json({
      _id:findAndModifyResult._id,
      username:findAndModifyResult.username,
      date:dateInDate.toDateString(),
      duration:durationInNumber,
      description:req.body.description});
    //if not found do nothing
  } catch (error) {
    console.error(error);
  }
});

//Get a list of users via get
app.get('/api/users/:_id/logs',async (req,res)=>{
  let idObject = mongoose.Types.ObjectId(req.params._id);
  const matchQuery={$match: {_id:idObject }}
  const addCountQuery={$addFields:{count:{$size: "$log"}}}
  const showQuery={$project: {__v:0,
                              "log._id":0
                              }
                  }
  const fromQuery=req.query.from==null?null:{$gte:["$$eachLog.date",new Date(req.query.from)]}
  const toQuery=req.query.to==null?null:{$lte:["$$eachLog.date",new Date(req.query.to)]}
  const fromToQueries=[fromQuery,toQuery].filter(eachQuery=>eachQuery);
  const timeFilterQuery=!fromToQueries.length?null:{$addFields: {
                                                      log:{
                                                        $filter:{
                                                          input:"$log",
                                                          as:"eachLog",
                                                          cond:{ $and:fromToQueries}
                                                        }}
                          }};
  const limitQuery=req.query.limit==null?null:{$project: {
                                                log:{$slice:["$log",parseInt(req.query.limit)]}
                                                        }          
                                              }
    
  const aggregateQueries=[
        matchQuery,
        addCountQuery,
        timeFilterQuery,
        limitQuery,
        showQuery
      ].filter(eachQuery=>eachQuery);

  try {
    const findUserResult=await userModel.aggregate(aggregateQueries);
    const result={
        ...findUserResult[0],
        log:findUserResult[0].log.map(eachLog=>{
          return {
                ...eachLog,
                date:eachLog.date.toDateString()
                  }
                                      })
                };
    res.json(result);
  } catch (error) {
    console.error(error);
  }
});

app.get('/api/users/:_id/logs/:from-:to',async (req,res)=>{
  console.log(req.params);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
