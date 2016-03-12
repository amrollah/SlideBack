/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;

var Sequelize = require('sequelize')
    , sequelize = new Sequelize('postgres', 'postgres', '1234', {
    hostname: "us-cdbr-iron-east-03.cleardb.net",
    dialect: "postgres",
    port:    5432
});

var User = sequelize.define('User', {
    //id: Sequelize.INTEGER,
    google_id: Sequelize.STRING,
    name: Sequelize.STRING,
    prof: Sequelize.BOOLEAN
});

//User.create({
//    google_id: 'John',
//    name: 'Hancock',
//    prof: true
//});

//User.sync({force: true}).then(function () {
//    // Table created
//    return User.create({
//        google_id: 'John',
//        name: 'Hancock'
//    });
//});

//sequelize
//    .sync({ force: true })
//    .then(function(err) {
//        console.log('It worked!');
//    }, function (err) {
//        console.log('An error occurred while creating the table:', err);
//    });
//
//
//sequelize.sync().then(function() {
//    User.create({
//        google_id: 'sdepold',
//        name: 'Amrollah'
//    }, function(err) {
//        console.log("DB error")
//    })
//});


passport.use(new GoogleStrategy({
        clientID: "208268578819-cb8dh3s8kmbovano2mino11ecadtocgt.apps.googleusercontent.com",
        clientSecret: "SltsvprFHefAMuiJgjddUhxU",
        callbackURL: "https://starthack.eu-gb.mybluemix.net/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, cb) {
        //console.log(cb);
        //return cb(null, profile);
        User.findOrCreate({ google_id: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

//var pg = require('pg');
//var connectionString = "db2://user05463:iPUlY1Ac5OAl@5.10.125.192:50000/SQLDB";
//
//var client = new pg.Client(connectionString);
//client.connect();
//var query = client.query('CREATE TABLE sessions(id SERIAL PRIMARY KEY, file VARCHAR(400) not null, active BOOLEAN)');
//query.on('end', function() { client.end(); });


//{
//    "credentials": {
//    "hostname": "5.10.125.192",
//        "password": "iPUlY1Ac5OAl",
//        "port": 50000,
//        "host": "5.10.125.192",
//        "jdbcurl": "jdbc:db2://5.10.125.192:50000/SQLDB",
//        "uri": "db2://user05463:iPUlY1Ac5OAl@5.10.125.192:50000/SQLDB",
//        "db": "SQLDB",
//        "username": "user05463"
//}
//}

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use('/static', express.static('public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
    function(req, res) {
        res.render('home', { user: req.user });
    });

app.get('/login',
    function(req, res){
        res.render('login');
    });

app.get('/auth/google', function(request, response, next) {
    passport.authenticate('google', {scope: ['profile', 'email']})(request, response, next);
});
//passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', {successRedirect: '/profile', failureRedirect: '/login' })
    //function(req, res) {
    //  // Successful authentication, redirect home.
    //  res.redirect('/');
    //}
);


app.get('/professor',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res){
        res.render('professor', { user: req.user });
    });


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
