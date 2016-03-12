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
    port: 5432
});

var User = sequelize.define('User', {
    google_id: Sequelize.STRING,
    name: Sequelize.STRING,
    prof: Sequelize.BOOLEAN
});

var Session = sequelize.define('Session', {
    file: Sequelize.STRING,
    passcode: Sequelize.STRING
});

var Feedback = sequelize.define('Feedback', {
    vote: Sequelize.INTEGER,
    comment: Sequelize.STRING,
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: 'id',
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    },
    session_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Session,
            key: 'id',
            // This declares when to check the foreign key constraint. PostgreSQL only.
            deferrable: Sequelize.Deferrable.INITIALLY_IMMEDIATE
        }
    }
});

//User.create({
//    google_id: 'John',
//    name: 'Hancock',
//    prof: true
//});

//Session.create({
//    file: 'test.pdf',
//    passcode: '1'
//});

// JUST run this once to create the db tables
//sequelize
//    .sync({ force: true })
//    .then(function(err) {
//        console.log('It worked!');
//    }, function (err) {
//        console.log('An error occurred while creating the table:', err);
//    });



passport.use(new GoogleStrategy({
        clientID: "208268578819-cb8dh3s8kmbovano2mino11ecadtocgt.apps.googleusercontent.com",
        clientSecret: "SltsvprFHefAMuiJgjddUhxU",
        callbackURL: "http://localhost:6001/auth/google/callback"
    },
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);
        return cb(null, profile);
        //User
        //    .findOrCreate({where: {google_id: profile.id, name: profile.displayName, prof: false}, defaults: {}})
        //    .spread(function (user, created) {
        //        console.log(user.get({
        //            plain: true
        //        }));
        //        console.log(created);
        //        return cb(null, user);
        //    });
    }
));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
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
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
    function (req, res) {
        res.render('home', {user: req.user});
    });

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });
//
//app.get('/login',
//    function (req, res) {
//        res.render('login');
//    });

app.get('/auth/google', function (request, response, next) {
    passport.authenticate('google', {scope: ['profile', 'email']})(request, response, next);
});
//passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', {successRedirect: '/student', failureRedirect: '/login'})
    //function(req, res) {
    //  // Successful authentication, redirect home.
    //  res.redirect('/');
    //}
);


app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('profile', {user: req.user});
    });

app.get('/student',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('student', {user: req.user, slideNum: 2, session_id: 1});
    });


app.post('/send_feedback',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        var obj = {};
        //console.log(req.body);
        console.log('vote ' + req.body.vote + ' for slide ' + req.body.slide_num + ' on session ' + req.body.session_id);
        res.status(200).send({ success: true });
        //res.render('student', {user: req.user, slideNum: 2});
    });

app.get('/logout',
    function(req, res){
        req.logout();
        res.redirect('/');
    });

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function () {

    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
