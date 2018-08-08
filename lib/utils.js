var fs = require('fs')

module.exports = {
  loadHandlers: function (path, cb) {
    if (!fs.existsSync(path)) return
    var files = fs.readdirSync(path)
    files.forEach(function (file) {
      if (file.slice(-3) !== '.js') return
      cb(file.slice(0, -3), require(path + '/' + file))
    })
  }
}
