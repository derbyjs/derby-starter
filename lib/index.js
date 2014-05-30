var derby = require('derby');

exports.run = run;

function run(app, options, cb) {
  options || (options = {});
  var config = require('../config')(options);
  var port = config.get('port');
  var ip = config.get('ip');

  function listenCallback(err) {
    console.log('%d listening. Go to: http://localhost:%d/', process.pid, port);
    cb && cb(err);
  }
  function createServer() {
    if (typeof app === 'string') app = require(app);
    require('./server').setup(app, config, function(err, expressApp) {
      if (err) throw err;
      var server = require('http').createServer(expressApp);
      server.listen(port, ip, listenCallback);
    });
  }
  derby.run(createServer);
}
