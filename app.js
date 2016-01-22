var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var index = require('./routes/index');
var semesters = require('./routes/semesters');
var userRoute = require('./routes/user');
var login = require('./routes/login');
var api = require('./routes/api');
var library = require('./routes/library');
var settings = require('./routes/settings');
var logs = require('./routes/logs');
var fClass = require('./routes/class');
var admin = require('./routes/admin');
var join = require('./routes/join');
var organization = require('./routes/organization');

var prefs = require('./helpers/prefs');

var engine = require('ejs-locals');

var app = express();

var User = require('./models/user');

var passport = require('passport');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var GoogleStrategy = require('passport-google-oauth2').Strategy;

var GOOGLE_CLIENT_ID = prefs.getGoogleClientID(), GOOGLE_CLIENT_SECRET  = prefs.getGoogleClientSecret();

var mongoURI = prefs.getDatabaseURI();
var MongoDB = mongoose.connect(mongoURI).connection;

MongoDB.on('error', function(err) {
  console.log(err.message);
});

MongoDB.once('open', function() {
  console.log('Connected to Mongodb');
});

mongoose.connect(mongoURI);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({
    googleID: id
  }).exec( function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: prefs.getWebURL() + '/auth/google/callback',
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.findOne({
        email: profile.email
      }).exec(function(err, user) {
        if (!user) {
          user = new User({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            displayName: profile.displayName,
            email: profile.email,
            googleID: profile.id
          });
          user.save();
        }
      });
      return done(null, profile);
    });
  }
));

app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'session_secret_token_1234'
}));
app.use( passport.initialize());
app.use( passport.session());

app.get('/', index.get).listen(app.get('port'), function() {
  console.log('App is running and server is listening on port ', app.get('port'));
});

app.get('/user/*', ensureAuthenticated, userRoute.getById);
app.get('/user', ensureAuthenticated, userRoute.get);

app.get('/semesters/*', ensureAuthenticated, semesters.getById);
app.get('/semesters', ensureAuthenticated, semesters.get);

app.get('/logs', ensureAuthenticated, logs.get);

app.get('/admin', ensureAdmin, admin.get);

app.get('/join', ensureAuthenticated, join.get);

app.get('/settings', ensureAuthenticated, settings.get);

app.get('/library', ensureAuthenticated, library.get);

app.post('/api/newClassInstance', ensureAuthenticated, api.postNewClassInstance);
app.put('/api/updateClassInstance', ensureAuthenticated, api.updateClassInstance);

app.post('/api/postNewHelpInstance', ensureAuthenticated, api.postNewHelpInstance);

app.post('/api/postNewOrganization', ensureAuthenticatedAndUser, api.postNewOrganization);
app.post('/api/joinOrganization', ensureAuthenticatedAndUser, api.joinOrganization);

app.post('/api/postNewSemester', ensureAuthenticatedAndUser, api.postNewSemester);

app.put('/api/updateSettings', ensureAdmin, api.updateSettings);

app.get('/api/getClassHelp', ensureAuthenticatedAndUser, api.getClassHelp);

app.get('/api/getInvitedUsers', ensureAuthenticatedAndUserAndAdmin, api.getInvitedUsers);

app.post('/api/inviteUsers', ensureAuthenticatedAndUserAndAdmin, api.inviteUsers);

app.post('/api/sendTestMail', ensureAuthenticatedAndUserAndAdmin, api.sendTestMail);

app.get('/api/getActiveUsers', ensureAuthenticatedAndUserAndAdmin, api.getActiveUsers);

app.get('/api/getSemester', ensureAuthenticated, api.getSemester);

app.get('/api/getSemesters', ensureAuthenticatedAndUser, api.getSemesters);

app.get('/api/getLogs', ensureAuthenticated, api.getLogs);

app.post('/api/dropClassInstance', ensureAuthenticated, api.dropClassInstance);

app.get('/class/new', ensureAuthenticated, fClass.new);

//app.put('/class/*', ensureAuthenticated, fClass.update);

// app.get('/class/remove/*', ensureAuthenticated, fClass.remove);

app.get('/login', login.get);

app.get('/organization', organization.get);

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate( 'google', {
  successRedirect: '/user',
  failureRedirect: '/login'
}));

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function ensureAuthenticatedAndUser(req, res, next) {
  if (req.isAuthenticated() && (req.query.user == req.user.id || req.body.user == req.user.id)) {
    return next();
  }
  res.redirect('/login');
}

function ensureAuthenticatedAndUserAndAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin && (req.query.user == req.user.id || req.body.user == req.user.id)) {
    return next();
  }
  res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      return next();
    } else {
      res.redirect('/user');
    }
  }
  res.redirect('/login');
}

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
