module.exports = function(grunt) {
  var serve = require('../src/js/bedrock/server/serve');
  var cloptions = require('../src/js/bedrock/cli/cloptions');
  var extraction = require('../src/js/bedrock/cli/extraction');
  var attempt = require('../src/js/bedrock/core/attempt');

  var path = require('path');
  var fs = require('fs');

  var bucketize = function(array, bucket, buckets) {
    return array.filter(function(x, i) {
      return i % buckets === (bucket - 1);
    })
  };

  var enrichSettings = function (settings) {
    var newSettings = { };

    for (var j in cloptions) {
      var clo = cloptions[j];
      var outputKey = clo.output !== undefined ? clo.output : clo.name;
      if (clo.defaultValue !== undefined) newSettings[outputKey] = clo.defaultValue;
    }

    for (var k in settings) {
      newSettings[k] = settings[k];
    }

    if (newSettings.bucket > newSettings.buckets) {
      // TODO: does this validation belong elsewhere?
      throw new Error("Bucket number too high. Can't run bucket " + settings.bucket + " of " + settings.buckets + ". Note: bucket numbers are 1-based.");
    }

    if (newSettings.bucket <= 0) {
      // TODO: does this validation belong elsewhere?
      throw new Error("Bucket number too low. Note: bucket numbers are 1-based.");
    }

    console.log("Running bucket " + newSettings.bucket + " of " + newSettings.buckets);

    var testfiles = getFiles(settings.testfiles, newSettings.bucket, newSettings.buckets);

    newSettings.testfiles = testfiles;

    newSettings.projectdir = settings.projectdir !== undefined ? settings.projectdir : process.cwd();
    newSettings.basedir = path.dirname(__dirname);

    return newSettings;
  };

  var getFiles = function (testfiles, bucket, buckets) {
    const all = grunt.file.expand(testfiles);
    return bucketize(all, bucket, buckets);
  };

  grunt.registerMultiTask('bedrock-manual', 'Bedrock manual test runner', function () {
    var settings = grunt.config([this.name, this.target]);
    
    // We don't keep a reference because we never call done on purpose. 
    // This is a never ending task
    this.async(); 

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);

    var bedrockManual = require('../src/js/bedrock-manual');
    var manualSettings = enrichSettings(settings);

    try {
      bedrockManual.go(manualSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock manual', err);
    }
  });

  grunt.registerMultiTask('bedrock-auto', 'Bedrock auto test runner', function () {
    var settings = grunt.config([this.name, this.target]);

    var done = this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);
    this.requiresConfig([this.name, this.target, 'browser']);

    var options = this.options({
      stopOnFailure: false
    });

    var autoSettings = enrichSettings(settings);
    autoSettings.gruntDone = function (passed) {
      done(passed);
    };
    autoSettings.stopOnFailure = options.stopOnFailure;

    var bedrockAuto = require('../src/js/bedrock-auto');

    try {
      bedrockAuto.go(autoSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock-auto', err);
    }
  });
};