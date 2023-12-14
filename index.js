// Import the modules we need
var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
const mysql = require('mysql');
var session = require('express-session');

var validator = require ('express-validator');

const expressSanitizer = require('express-sanitizer');

// Create the express application object
const app = express();
const port = 8000;

// Body parser middleware (if you haven't already included it)
app.use(bodyParser.urlencoded({ extended: true }));

// Express sanitizer middleware
app.use(expressSanitizer());

// Configure session middleware
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// Other middlewares and configurations
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Define the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'appuser2',
    password: 'app2025',
    database: 'RecipeSite'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

global.db = db;

// Set the directory where Express will pick up HTML files
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
app.engine('html', ejs.renderFile);

// Define our data
var recipeData = { siteName: "Master Recipes" };

// Require the main.js file inside the routes folder
require("./routes/main")(app, recipeData);

// Start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
