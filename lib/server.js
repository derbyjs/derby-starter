var derby = require('derby');
var express = require('express');
var racerBrowserChannel = require('racer-browserchannel');
var parseUrl = require('url').parse;
var MongoStore = require('connect-mongo')(express);
derby.use(require('racer-bundle'));

exports.setup = setup;

function setup(app, config, cb) {

  // The store creates models and syncs data
  var store = require('./store')(derby, config);

  var publicDir = __dirname + '/../public';

  var expressApp = express()
    .use(express.favicon())
    // Gzip dynamically rendered content
    .use(express.compress())
    .use(express.static(publicDir))

  expressApp
    // Add browserchannel client-side scripts to model bundles created by store,
    // and return middleware for responding to remote client messages
    .use(racerBrowserChannel(store))
    // Adds req.getModel method
    .use(store.modelMiddleware())

    .use(express.cookieParser())
    .use(express.session({
      secret: config.get('session.secret'),
      store: new MongoStore({url: config.get('mongo.url')})
    }))
    .use(createUserId)

  var staticPaths = config.get('static')
  if (staticPaths) {
    for(var i = 0; i < staticPaths.length; i++) {
      var o = staticPaths[i];
      expressApp.use(o.route, express.static(o.dir));
    }
  }

  expressApp
    // Creates an express middleware from the app's routes
    .use(app.router())
    .use(expressApp.router)
    .use(errorMiddleware)


  expressApp.all('*', function(req, res, next) {
    next('404: ' + req.url);
  });

  app.writeScripts(store, publicDir, {extensions: ['.coffee']}, function(err) {
    cb(err, expressApp);
  });
}

function createUserId(req, res, next) {
  var model = req.getModel();
  var userId = req.session.userId;
  if (!userId) userId = req.session.userId = model.id();
  model.set('_session.userId', userId);
  next();
}

var errorApp = derby.createApp();
errorApp.loadViews(__dirname + '/../views/error');
errorApp.loadStyles(__dirname + '/../styles/reset');
errorApp.loadStyles(__dirname + '/../styles/error');

function errorMiddleware(err, req, res, next) {
  if (!err) return next();

  var message = err.message || err.toString();
  var status = parseInt(message);
  status = ((status >= 400) && (status < 600)) ? status : 500;

  if (status < 500) {
    console.log(err.message || err);
  } else {
    console.log(err.stack || err);
  }

  var page = errorApp.createPage(req, res, next);
  page.renderStatic(status, status.toString());
}
