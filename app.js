/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var passport = require('passport');
//var GoogleStrategy = require('passport-google-oauth20').Strategy;
var Strategy = require('passport-local').Strategy;

var Sequelize = require('sequelize')
    , sequelize = new Sequelize('hack', 'postgres', '1111', {
    hostname: "localhost",
    dialect: "postgres",
    port:    5432
});

var User = sequelize.define('User', {
    //id: Sequelize.INTEGER,
    google_id: Sequelize.STRING,
    username: Sequelize.STRING,
    prof: Sequelize.BOOLEAN
});

var Session = sequelize.define('Session', {
    file: Sequelize.STRING,
    passcode: Sequelize.STRING
});

var Feedback = sequelize.define('Feedback', {
    vote: Sequelize.INTEGER,
    comment: Sequelize.STRING,
    page: Sequelize.INTEGER,
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
//    username: 'prof',
//    prof: true
//});
//Session.create({
//    file: 'test.pdf',
//    passcode: '1'
//});

//User.sync({force: true}).then(function () {
//    // Table created
//    return User.create({
//        google_id: 'John',
//        name: 'Hancock'
//    });
//});

// JUST run this once to create the db tables
//sequelize
//    .sync({ force: true })
//    .then(function(err) {
//        console.log('jhjh');
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

passport.use(new Strategy(
    function(username, password, cb) {
        User.findOrCreate({where: {username: username, prof:false}, defaults: {}})
            .spread(function (user, created) {
                console.log(user.get({
                    plain: true
                }));
                console.log(created);
                return cb(null, user);
            });
    }));


//passport.use(new GoogleStrategy({
//        clientID: "208268578819-cb8dh3s8kmbovano2mino11ecadtocgt.apps.googleusercontent.com",
//        clientSecret: "SltsvprFHefAMuiJgjddUhxU",
//        callbackURL: "http://localhost:6001/auth/google/callback"
//    },
//    function (accessToken, refreshToken, profile, cb) {
//        //console.log(profile);
//        return cb(null, profile);
//        //User
//        //    .findOrCreate({where: {google_id: profile.id, name: profile.displayName, prof: false}, defaults: {}})
//        //    .spread(function (user, created) {
//        //        console.log(user.get({
//        //            plain: true
//        //        }));
//        //        console.log(created);
//        //        return cb(null, user);
//        //    });
//    }
//));

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
    cb(null, user.id);
});

//passport.deserializeUser(function(id, cb) {
//    User.findById(id, function (err, user) {
//        if (err) { return cb(err); }
//        cb(null, user);
//    });
//});

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
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
    function(req, res) {
        res.render('home', { user: req.user });
    });

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        //console.log(req.user);
        if (!req.user.prof)
            res.redirect('/student');
        else
            res.redirect('/professor');
    });
//
//app.get('/login',
//    function (req, res) {
//        res.render('login');
//    });

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

app.get('/student',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        console.log(req.user);
        res.render('student', {user: req.user, slideNum: 2, session_id: 1});
    });


app.post('/send_feedback',
    //require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        var obj = {};
        Feedback.create({
            vote: req.body.vote,
            comment: req.body.comment,
            page: req.body.slide_num,
            user_id: req.body.slide_num,
            session_id: req.body.session_id
        });
        console.log('vote ' + req.body.vote + ' for slide ' + req.body.slide_num + ' on session ' + req.body.session_id);
        res.status(200).send({ success: true });
    });

app.get('/logout',
    function(req, res){
        req.logout();
        res.redirect('/');
    });

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
