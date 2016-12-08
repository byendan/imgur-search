var express = require('express')
var externalRequest = require('request')
var mongodb = require('mongodb');

var app = express()

var MongoClient = mongodb.MongoClient;
var dburl = process.env.MONGOLAB_URI;   

// Verify the basics are working
app.get('/', function (req, res) {
    // Use connect method to connect to the Server
  MongoClient.connect(dburl, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
        console.log('Connection established successfully');
    

        res.send("successfully got to the app, db is up!")
        db.close();
      }
  })
})

app.get('/api/imagesearch/:userQuery', function(req, res) {
    //first save the search
    saveSearch(req.params.userQuery, Date.now())
    // use imgur api to get results

    var searchQuery = ""
    // Check for the offset val for getting page numbers
    if(req.query.offset) {
        searchQuery += "page=" + req.query.offset + "&"
    }
    searchQuery += "q=" + req.params.userQuery
    
    var apiEndpoint = "https://api.imgur.com/3/gallery/search?" + searchQuery
    var imgurClientId = process.env.IMGUR_CLIENT_ID;
    externalRequest(apiEndpoint, {
        headers: {
            "Authorization": "Client-ID " + imgurClientId
        }
    },  function (error, response, body) {
        if (error) throw error 
        
        var jsonData = JSON.parse(body).data 
    
        var dataInfo = parseResults(jsonData)
     
        res.send(dataInfo)
        

    })
    
})

app.get('/api/latest/imagesearch', function(req, res) {

    
      MongoClient.connect(dburl, function (err, db) {
      if (err) {
        throw err 
      } else {
        var searches = db.collection('searches')
        db.collection('searches').find().toArray(function(err, data) {
            if(err) throw err 
            var cleanedUpData = []
            for(var i = 0; i < data.length; i++) {
                var cur = {
                    "what": data[i].what,
                    "when": data[i].when
                }
                cleanedUpData.push(cur)
            }
            res.send(cleanedUpData)
            db.close()
        })
      }
  })
})



app.listen((process.env.PORT || 8080), function () {
  console.log('Server is up and running!')
})

function saveSearch(what, when) {
    // If there is a pagination param don't use it
    if(what.indexOf('?') > -1) {
        what = what.split("?")[0]
    }
    when = new Date(when)
    var saveInfo = {
        "what": what,
        "when": when
    }
    
    // Save to db
    MongoClient.connect(dburl, function(err, db) {
        if(err) throw err 
        var collection = db.collection('searches')
        collection.insertOne(saveInfo, function(err, result) {
            if(err) throw err 
            console.log("The search info has been save, see: " + JSON.stringify(saveInfo))
            db.close()
        })
    })
}

function parseResults(imgurPics) {
    // if image has cover it will be at http://i.imgur.com/<cover>.jpg, its page will be at the link
    // if its annimated it will at the link, and its page will be at http://imgur.com/gallery/<id>
    var picsMeta = []
    for(var i = 0; i < imgurPics.length; i++) {
        
        var currentPic = imgurPics[i]
        var imgTitle = currentPic.title
        var imgUrl = ""
        var imgPage = ""
        
        if(currentPic.animated) {
            imgUrl = currentPic.link
            imgPage = 'http://imgur.com/gallery/' + currentPic.id
        } else if(currentPic.cover) {
            imgUrl = 'http://i.imgur.com/' + currentPic.cover
            imgPage = currentPic.link
        } else {
            imgUrl = currentPic.link
            imgPage = 'https://imgur.com/gallery/' + currentPic.id
        }
        
        var imgMeta = {
            url: imgUrl,
            page: imgPage,
            alt: imgTitle 
        }
        picsMeta.push(imgMeta)
        
    }
    
    
    return picsMeta
} 