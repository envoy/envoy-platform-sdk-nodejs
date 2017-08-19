var fs = require('fs');

module.exports = {
  loadHandlers: function(path, cb) {
    if(!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
      return;
    }
    let files = fs.readdirSync(path);
    files.forEach(function(fileName) {
      if(fileName.slice(-3) !== '.js') return;
      cb(fileName.slice(0, -3), require(path + '/' + fileName));
    })
  }
}
