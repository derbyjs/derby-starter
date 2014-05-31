var liveDbMongo = require('livedb-mongo');
var coffeeify = require('coffeeify');

module.exports = store;

function store(derby, config) {
  var mongo = config.get('mongo');

  // A real app should use redis to allow running multiple server processes.
  //
  // var db = liveDbMongo(mongo.url + '?auto_reconnect', mongo.opts);
  //
  // var oplogDb = db; // you can store the oplog in a different database
  // var redisClient = require('redis').createClient();
  // var redisObserver = require('redis').createClient();
  //
  // var driver = require('livedb').redisDriver(oplogDb, redisClient, redisObserver)
  //
  // var opts = {
  //   backend: {
  //     db: db,
  //     driver: driver
  //   }
  // };

  var opts = { db: liveDbMongo(mongo.url + '?auto_reconnect', mongo.opts) };
  var store = derby.createStore(opts);

  store.on('bundle', function(browserify) {
    // Add support for directly requiring coffeescript in browserify bundles
    browserify.transform({global: true}, coffeeify);

    // HACK: In order to use non-complied coffee node modules, we register it
    // as a global transform. However, the coffeeify transform needs to happen
    // before the include-globals transform that browserify hard adds as the
    // first trasform. This moves the first transform to the end as a total
    // hack to get around this
    var pack = browserify.pack;
    browserify.pack = function(opts) {
      var detectTransform = opts.globalTransform.shift();
      opts.globalTransform.push(detectTransform);
      return pack.apply(this, arguments);
    };
  });

  return store;
}
