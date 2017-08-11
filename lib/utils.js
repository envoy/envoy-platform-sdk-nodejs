var fs = require('fs');

module.exports = {
  loadHandlers: function(path, cb) {
    files = fs.readdirSync(path);
    files.forEach(function(file) {
      if(file.slice(-3) !== '.js') return;
      cb(file.slice(0, -3), require(path + '/' + file));
    })
  },
  renderEnvironmentVariablesToConfig: function(config, maxDepth = 10) {
    for (let k in config) {
      if (config[k] && typeof config[k] === 'object') {
        config[k] = this._renderEnvironmentVariablesToConfig(config[k], maxDepth-1)
      }
      if (config[k] && typeof config[k] === 'string') {
        let matchEnv = config[k].match(/^%(.*)%$/)
        if (matchEnv && process.env.hasOwnProperty(matchEnv[1])) {
          config[k] = process.env[matchEnv[1]]
        }
      }
    }
    return config
  }
}
