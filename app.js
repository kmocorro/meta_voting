let express = require('express');
let app = express();
let cookieParser = require('cookie-parser');

let apiController = require('./controllers/apiController');
let verifyLDAP = require('./controllers/verifyLDAP');

let port = process.env.PORT || 5050;

app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(cookieParser());

apiController(app);
verifyLDAP(app);

app.listen(port);
console.log('Server is running at ' + port + '...');
