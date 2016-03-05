var express = require('express');
var apiKeys = require ('./keys');
var TwitPackage = require('twit');
var WatsonPackage = require('watson-developer-cloud');
var unirest = require('unirest');

var OxfordPackage = require('project-oxford'),
    emotionAPI = new OxfordPackage.Client(apiKeys.projectOxford.emotionAPI.primaryKey),
    faceAPI = new OxfordPackage.Client(apiKeys.projectOxford.faceAPI.primaryKey);

var twitter = new TwitPackage ({
    consumer_key: apiKeys.twitter.consumerKey,
    consumer_secret: apiKeys.twitter.consumerSecret,
    access_token: apiKeys.twitter.accessToken,
    access_token_secret: apiKeys.twitter.accessTokenSecret
})

var watson = WatsonPackage.authorization ({
    username: apiKeys.watsonToneAnalyzer.username,
    password: apiKeys.watsonToneAnalyzer.password,
    version: 'v1'
})

var app = express();
app.use('/', express.static(__dirname + '/public'));

app.get('/go', function (req, res) {
  console.log(req.query.un);
  var twitterUsername = req.query.un;
  var responseJSON = {};
  var faceIdToImage = {};

/* DO SHIT */
  twitter.get('statuses/user_timeline', { screen_name: twitterUsername, count: 200 }, function(err, data, response) {
    if(err){
      res.send(err);
      return;
    }

    Promise.all(data.map(function(tweet){
      return new Promise(function(resolve, reject){
        resolve(tweet);
      });
    })).then(function(tweets){
      res.send(tweets);
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

app.get('/identify', function(req, res){
  var url = req.query.url;
  var rec = req.query.rec;
  var images = (typeof req.query.images == "string") ? JSON.parse(req.query.images) : req.query.images;

  var targetFaceId = "";
  var faceIDs = [];
  var faceRects = {};
  var faceIdToImage = {};

  faceAPI.face.detect({
    url: url,
    analyzesAge: true,
    analyzesGender: true,
    returnFaceId: true
  }).then(function (response) {
    for (var i = 0; i < response.length; i++) {
      if(overlap(response[i].faceRectangle, rec) > 90){
        targetFaceId = response[i].faceId;
        console.log(targetFaceId);
        break;
      }
    }

    return Promise.all(images.map(function(imageObj){
      return faceAPI.face.detect({
        url: imageObj.url,
        analyzesAge: true,
        analyzesGender: true,
        returnFaceId: true
      }).then(function(res){
        console.log(res);
        console.log(Array.isArray(res));
        res.forEach(function(face){
          faceIDs.push(face.faceId);
          faceRects[face.faceId] = face.faceRectangle;
          faceIdToImage[face.faceId] = imageObj;
        });
      });
    })).then(function(){
      console.log("hi")
      return faceAPI.face.similar(
        targetFaceId, {
          candidateFaces: faceIDs
        });
    }).then(function(res){
      console.log(res);
      return Promise.all(res.map(function(face){
        var str = faceRects[face.faceId].left + ", " + faceRects[face.faceId].top + ", " + faceRects[face.faceId].width + ", " + faceRects[face.faceId].height;

        return new Promise(function(resolve,reject){
          unirest.post('https://api.projectoxford.ai/emotion/v1.0/recognize?faceRectangles=' + str)
          .header('Ocp-Apim-Subscription-Key', apiKeys.projectOxford.emotionAPI.primaryKey)
          .header('Content-Type', 'application/json')
          .send({ "url": faceIdToImage[face.faceId].url })
          .end(function(response){
            response.body[0].time = faceIdToImage[face.faceId].time;
            resolve(response.body[0]);
          });
        });
      }));
    }).then(function(result){
        console.log("DID" + JSON.stringify(result));
        res.send(result);

    }).catch(function(err){
      console.log(err);
    });
  });
});

function overlap(rec1, rec2){
  return 91;
}
