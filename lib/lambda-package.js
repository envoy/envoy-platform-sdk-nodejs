'use strict';

// Adapted to be a programmatic API from the node-lambda cli tool at: 
// https://github.com/motdotla/node-lambda
// 
// ORIGINAL COPYRIGHT:
// Copyright (c) 2016, Scott Motte
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:

// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.

// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



var aws = require('aws-sdk');
var exec = require('child_process').exec;
var fs = require('fs');
var os = require('os');
var packageJson = require('./../package.json');
var path = require('path');
var async = require('async');
var zip = new require('node-zip')();
var wrench = require('wrench');
var dotenv = require('dotenv');

var Lambda = function () {
  this.version = packageJson.version;

  return this;
};

// needed
Lambda.prototype._createSampleFile = function (file, newFileName) {
  var exampleFile = process.cwd() + '/' + (file || newFileName);
  var boilerplateFile = __dirname + '/' + file + '.example';

  if (!fs.existsSync(exampleFile)) {
    fs.writeFileSync(exampleFile, fs.readFileSync(boilerplateFile));
    console.log(exampleFile + ' file successfully created');
  }
};

// @todo: probably not needed
Lambda.prototype.setup = function () {
  console.log('Running setup.');
  this._createSampleFile('.env');
  this._createSampleFile('event.json');
  this._createSampleFile('deploy.env');
  this._createSampleFile('context.json');
  console.log('Setup done. Edit the .env, deploy.env, context.json and event.json files as needed.');
};

// @todo: convert to runnable script
Lambda.prototype.run = function (program) {
  this._createSampleFile('event.json', program.eventFile);
  var splitHandler = program.handler.split('.');
  var filename = splitHandler[0] + '.js';
  var handlername = splitHandler[1];

  var handler = require(process.cwd() + '/' + filename)[handlername];
  var event = require(process.cwd() + '/' + program.eventFile);
  var context = require(process.cwd() + '/' + program.contextFile);

  this._runHandler(handler, event, program.runtime, context);
};

// @needed
Lambda.prototype._runHandler = function (handler, event, runtime, context) {

  var callback = function (err, result) {
    if (err) {
      console.log('Error: ' + err);
      process.exit(-1);
    }
    else {
      console.log('Success:');
      if (result) {
        console.log(JSON.stringify(result));
      }
      process.exit(0);
    }
  };

  var isNode43 = (runtime === "nodejs4.3");
  context.succeed = function (result) {
    if (isNode43) {
      console.log('context.succeed() is deprecated with Node.js 4.3 runtime');
    }
    callback(null, result);
  };
  context.fail = function (error) {
    if (isNode43) {
      console.log('context.fail() is deprecated with Node.js 4.3 runtime');
    }
    callback(error);
  };
  context.done = function () {
    if (isNode43) {
      console.log('context.done() is deprecated with Node.js 4.3 runtime');
    }
    callback();
  };

  switch(runtime) {
    case "nodejs":
      handler(event, context);
      break;
    case "nodejs4.3":
      handler(event, context, callback);
      break;
    default:
      console.error("Runtime [" + runtime + "] is not supported.");
  }

};

/**
 * @deprecated
 */
Lambda.prototype._zipfileTmpPath = function (program) {
  var ms_since_epoch = +new Date();
  var filename = program.functionName + '-' + ms_since_epoch + '.zip';
  var zipfile = path.join(os.tmpDir(), filename);

  return zipfile;
};

Lambda.prototype._rsync = function (program, codeDirectory, callback) {
  var excludes = ['.git*', '*.swp', '.editorconfig', 'deploy.env', '*.log', 'build/', 'node_modules'],
      excludeGlobs = [];
  if (program.excludeGlobs) {
    excludeGlobs = program.excludeGlobs.split(' ');
  }
  var excludeArgs = excludeGlobs.concat(excludes).map(function(exclude) {
    return '--exclude=' + exclude;
  }).join(' ');

  exec('mkdir -p ' + codeDirectory, function(err) {
    if (err) {
      return callback(err);
    }

    exec('rsync -r ' + excludeArgs + ' . ' + codeDirectory, function (err) {
      if (err) {
        return callback(err);
      }

      return callback(null, true);
    });
  });
};

Lambda.prototype._npmInstall = function (program, codeDirectory, callback) {
  exec('npm install --production --prefix ' + codeDirectory, function (err) {
    if (err) {
      return callback(err);
    }

    return callback(null, true);
  });
};

// @todo remove dependency
Lambda.prototype._postInstallScript = function (codeDirectory, callback) {
  var script_filename = 'post_install.sh';
  var cmd = './'+script_filename;

  var filePath = [codeDirectory, script_filename].join('/');

  fs.exists(filePath, function(exists) {
    if (exists) {
      console.log('=> Running post install script '+script_filename);
      exec(cmd, { cwd: codeDirectory,maxBuffer: 50 * 1024 * 1024 }, function(error, stdout, stderr){

        if (error) callback(error +" stdout: " + stdout + "stderr"+stderr);
        else {
          console.log("\t\t"+stdout);
          callback(null);
        }
      });


    } else {
      callback(null);
    }
  });

};

Lambda.prototype._zip = function (program, codeDirectory, callback) {

  var options = {
    type: 'nodebuffer',
    compression: 'DEFLATE'
  };

  console.log('=> Zipping repo. This might take up to 30 seconds');
  var files = wrench.readdirSyncRecursive(codeDirectory);
  files.forEach(function (file) {
    var filePath = [codeDirectory, file].join('/');
    var isFile = fs.lstatSync(filePath).isFile();
    if (isFile) {
      var content = fs.readFileSync(filePath);
      zip.file(file, content);
    }
  });

  var data = zip.generate(options);

  return callback(null, data);
};

Lambda.prototype._nativeZip = function (program, codeDirectory, callback) {
  var zipfile = this._zipfileTmpPath(program),
    cmd = 'zip -r ' + zipfile + ' .';

  exec(cmd, {
    cwd: codeDirectory,
    maxBuffer: 50 * 1024 * 1024
  }, function (err) {
    if (err !== null) {
      return callback(err, null);
    }

    var data = fs.readFileSync(zipfile);
    callback(null, data);
  });
};

Lambda.prototype._codeDirectory = function (program) {
  var epoch_time = +new Date();

  return os.tmpDir() + '/' + program.functionName + '-' + epoch_time;
};

Lambda.prototype._cleanDirectory = function (codeDirectory, callback) {
  exec('rm -rf ' + codeDirectory, function (err) {
    if (err) {
      throw err;
    }

    fs.mkdir(codeDirectory, function(err) {
      if (err) {
        throw err;
      }

      return callback(null, true);
    });
  });
};

Lambda.prototype._setEnvironmentVars = function (program, codeDirectory) {
  console.log('=> Setting "environment variables" for Lambda from %s', program.configFile);
  // Which file is the handler?
  var handlerFileName = codeDirectory + '/' + program.handler.split('.').shift() + '.js';
  var contents = fs.readFileSync(handlerFileName);

  var configValues = fs.readFileSync(program.configFile);
  var prefix = '////////////////////////////////////\n// "Environment Variables"\n';
  var config = dotenv.parse(configValues);
  var contentStr = contents.toString();

  for (var k in config) {
    if (!config.hasOwnProperty(k)) {
      continue;
    }

    // Use JSON.stringify to ensure that it's valid code.
    prefix += 'process.env["' + k + '"]=' + JSON.stringify(config[k]) + ';\n';
  }
  prefix += '////////////////////////////////////\n\n';

  // If the first line of the file is 'use strict', append after
  if (contentStr.trim().indexOf('use strict') === 1) {
    contentStr = contentStr.replace(/([`'"]use strict[`'"][;]?)/, '$1\n' + prefix);
  } else {
    contentStr = prefix + contentStr;
  }

  fs.writeFileSync(handlerFileName, contentStr);
};


Lambda.prototype._archive = function (program, archive_callback) {
  this._createSampleFile('.env');

  // Warn if not building on 64-bit linux
  var arch = process.platform + '.' + process.arch;
  if (arch !== 'linux.x64') {
    console.warn('Warning!!! You are building on a platform that is not 64-bit Linux (%s). ' +
      'If any of your Node dependencies include C-extensions, they may not work as expected in the ' +
      'Lambda environment.\n\n', arch);
  }

  var _this = this;
  var codeDirectory = _this._codeDirectory(program);

  _this._cleanDirectory(codeDirectory, function(err) {
    if (err) {
      return archive_callback(err);
    }
    console.log('=> Moving files to temporary directory');
    // Move files to tmp folder
    _this._rsync(program, codeDirectory, function (err) {
      if (err) {
        return archive_callback(err);
      }
      console.log('=> Running npm install --production');
      _this._npmInstall(program, codeDirectory, function (err) {
        if (err) {
          return archive_callback(err);
        }

        _this._postInstallScript(codeDirectory, function (err) {
          if (err) {
            return archive_callback(err);
          }

          // Add custom environment variables if program.configFile is defined
          if (program.configFile) {
            _this._setEnvironmentVars(program, codeDirectory);
          }
          console.log('=> Zipping deployment package');

          var archive = process.platform !== 'win32' ? _this._nativeZip : _this._zip;
          archive = archive.bind(_this);

          archive(program, codeDirectory, archive_callback);
        });
      });
    });
  });
};

Lambda.prototype.package = function (program) {
  var _this = this;
  if (!program.packageDirectory) {
    throw 'packageDirectory not specified!';
  } else {
    try {
      var isDir = fs.lstatSync(program.packageDirectory).isDirectory();

      if (!isDir) {
        throw program.packageDirectory + ' is not a directory!';
      }
    } catch(err) {
      if (err.code === 'ENOENT') {
        console.log('=> Creating package directory');
        fs.mkdirSync(program.packageDirectory);
      } else {
        throw err;
      }
    }
  }

  _this._archive(program, function (err, buffer) {
    if (err) {
      throw err;
    }
    var basename = program.functionName + (program.environment ? '-' + program.environment : '');
    var zipfile = path.join(program.packageDirectory, basename + '.zip');
    console.log('=> Writing packaged zip');
    fs.writeFile(zipfile, buffer, function(err) {
      if (err) {
        throw err;
      }
      console.log('Packaged zip created: ' + zipfile);
    });
  });
};



module.exports = new Lambda();