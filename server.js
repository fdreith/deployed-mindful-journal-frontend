//Server example from https://medium.com/jondengdevelops/deploy-your-front-end-app-in-20-lines-of-code-24be44f8b51

// Declaring Dependencies for the Server
var express = require('express');
var app = express();
var path = require('path');

// Configure this project
app.use(express.static(path.join(__dirname)));
app.use("/styles", express.static(__dirname));
app.use("/images", express.static(__dirname + '/images'));
app.use("/scripts", express.static(__dirname + '/scripts'));
// app.use("/javascripts", express.static(__dirname + '/javascripts'));
// app.use("/javascripts/models", express.static(__dirname + '/javascripts/models'));

// viewed at based directory http://localhost:8080/
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + 'index.html'));
});

// add other routes below
// app.get('/about', function (req, res) {
//   res.sendFile(path.join(__dirname + 'views/about.html'));
// });

app.listen(process.env.PORT || 8888);