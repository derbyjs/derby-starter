var derby = require('derby');
var spawn = require('child_process').spawn;

exports.run = run;

function run(app, options, cb) {
  options || (options = {});
  var port = options.port || process.env.PORT || 3000;

  function listenCallback(err) {
    if(!options.open) {
      console.log('%d listening. Go to: http://localhost:%d/', process.pid, port);
    } else {
      console.log('%d listening. Opening http://localhost:%d/', process.pid, port);
      spawn('open', ['http://localhost:' + port + '/']);
    }
    cb && cb(err);
  }
  function createServer() {
    if (typeof app === 'string') app = require(app);
    require('./server').setup(app, options, function(err, expressApp, upgrade) {
      if (err) throw err;
      var server = require('http').createServer(expressApp);
      server.on('upgrade', upgrade);
      server.listen(port, listenCallback);
    });
  }
  derby.run(createServer);
}
