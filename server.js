var express = require('express')
var app = express()

//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

// My database url
var dburl = process.env.MONGOLAB_URI;   


app.get('/', function (req, res) {
    // Use connect method to connect to the Server
  MongoClient.connect(dburl, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        console.log('Connection established successfully');
    
        // do some work here with the database.
    
        //Close connection
        res.send("successfully got to the app, db is up!")
        db.close();
      }
  })
})



app.listen((process.env.PORT || 8080), function () {
  console.log('Server is up and running!')
})