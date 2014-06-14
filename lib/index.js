/**
 * Metalsmith plugin that adds `collections` of files to the global
 * metadata as a sorted array.
 */

var debug = require('debug')('metalsmith-collections');
var MiniMatch = require('minimatch').Minimatch;
var _ = require('underscore');

module.exports = function plugin(options) {
  var processOptions = function (allOptions) {
    var pairs = _.pairs(allOptions || {});
    return _.map(pairs, function (pair) {
      var name = pair[0], config = pair[1];
      if ('string' === typeof config) {
        config = { pattern: config };
      }
      return {name: name, options: config};
    });
  };

  var processFiles = function (filesAsDictionary) {
    return _.map(_.pairs(filesAsDictionary), function (pair) {
      return {name: pair[0], data: pair[1]};
    });
  };

  var defaultCompareFunction = function (sortFieldName) {
    return function (a, b) {
      var x = a[sortFieldName];
      var y = b[sortFieldName];
      if (!x && !y) { return 0; }
      if (!x) { return -1; }
      if (!y) { return 1; }
      if (y > x) { return -1; }
      if (x > y) { return 1; }
      return 0;
    };
  };

  var sortCollection = function (collection) {
    debug('sorting collection: %s', collection.name);
    var sortDefinition = collection.options.sortBy || 'date';

    if ('function' === typeof sortDefinition) {
      collection.files.sort(sortDefinition);
    } else if ('string' === typeof sortDefinition) {
      collection.files.sort(defaultCompareFunction(sortDefinition));
    } else {
      throw new Error('Invalid type of "sortBy" parameter for "' + collection.name + '"');
    }

    if (collection.options.reverse) {
      collection.files.reverse();
    }
  };

  var addNextAndPreviousReferences = function (collectionFiles) {
    var lastIndex = collectionFiles.length - 1;
    collectionFiles.forEach(function (file, index) {
      if (0 !== index) {
        file.previous = collectionFiles[index - 1];
      }
      if (lastIndex !== index) {
        file.next = collectionFiles[index + 1];
      }
    });
  };

  var matchingFunctionFactory = function (collectionName, filePattern) {
    var fileNameMatcher = filePattern && new MiniMatch(filePattern);
    return function (file) {
      if (file.data.collection === collectionName) {
        return true;
      }
      return fileNameMatcher && fileNameMatcher.match(file.name);
    };
  };

  var findMatchingFiles = function (collection, files) {
    var fileMatcher = matchingFunctionFactory(collection.name, collection.options.pattern);
    return _.filter(files, fileMatcher);
  };

  var collections = processOptions(options);

  return function (filesAsDictionary, metalsmith, done) {
    var files = processFiles(filesAsDictionary);
    var metadata = metalsmith.metadata();
    metadata.collections = {};

    collections.forEach(function (collection) {
      collection.files = [];
      var matchingFiles = findMatchingFiles(collection, files);
      matchingFiles.forEach(function (file) {
        file.data.collection = collection.name;
        collection.files.push(file.data);
      });
      sortCollection(collection);
      addNextAndPreviousReferences(collection.files);

      metadata[collection.name] = collection.files;
      metadata.collections[collection.name] = collection.files;
    });

    done();
  };
};
