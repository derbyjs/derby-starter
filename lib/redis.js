module.exports = redis

function redis(config) {
  var r = config.get('redis');
  var client = require('redis').createClient(r.port, r.host, r.options);

  if (r.password) client.auth(r.password);
  if (r.db) client.select(r.db);

  return client;
}
