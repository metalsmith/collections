/**
 * Metalsmith plugin that adds `collections` of files to the global
 * metadata as a sorted array.
 */

var debug = require('debug')('metalsmith-collections');
var Minimatch = require('minimatch').Minimatch;
var path = require('path');
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
      if (!x && !y) {
        return 0;
      }
      if (!x) {
        return -1;
      }
      if (!y) {
        return 1;
      }
      if (y > x) {
        return -1;
      }
      if (x > y) {
        return 1;
      }
      return 0;
    };
  };

  var sortCollection = function (collection) {
    debug('sorting collection: %s', collection.name);
    var sortDefinition = collection.options.sortBy || 'date';

    if ('function' === typeof sortDefinition) {
      collection.content.sort(sortDefinition);
    } else if ('string' === typeof sortDefinition) {
      collection.content.sort(defaultCompareFunction(sortDefinition));
    } else {
      throw new Error('Invalid type of "sortBy" parameter for "' + collection.name + '"');
    }

    if (collection.options.reverse) {
      collection.content.reverse();
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
    var fileNameMatcher = filePattern && new Minimatch(filePattern);
    return function (file) {
      if (_.isString(file.data.collection) && file.data.collection.indexOf(collectionName) === 0) {
        return true;
      }
      return fileNameMatcher && fileNameMatcher.match(file.name);
    };
  };

  var findMatchingFiles = function (collection, files) {
    var fileMatcher = matchingFunctionFactory(collection.name, collection.options.pattern);
    return _.filter(files, fileMatcher);
  };

  var findSubCollectionByName = function (collection, subName) {
    return _.find(collection.content, function (c) {
      return c.name === subName;
    });
  };

  var createEmptySubCollection = function (parentCollection, subCollectionName) {
    var empty = {name: subCollectionName, parent: parentCollection, content: [], isSubCollection: true};
    parentCollection.content.push(empty);
    return empty;
  };

  var collections = processOptions(options);

  function addFileAsSubCollection(file, parent) {
    var subName = file.data.collection.substring((parent.name + '/').length);
    var subCollection = findSubCollectionByName(parent, subName) || createEmptySubCollection(parent, subName);
    if (path.basename(file.name) === '_meta.md') {
      _.extend(subCollection, file.data.subCollection, {text: file.data.contents});
    } else {
      subCollection.content.push(file.data);
    }
  }

  return function (filesAsDictionary, metalsmith, done) {
    var files = processFiles(filesAsDictionary);
    var metadata = metalsmith.metadata();
    metadata.collections = {};

    collections.forEach(function (collection) {
      collection.content = [];
      var matchingFiles = findMatchingFiles(collection, files);
      matchingFiles.forEach(function (file) {
        if (_.isString(file.data.collection) && file.data.collection.indexOf(collection.name + '/') === 0) {
          addFileAsSubCollection(file, collection);
        } else {
          collection.content.push(file.data);
        }
        file.data.collection = collection.name;
      });

      sortCollection(collection);
      _.each(collection.content, function (c) {
        if (c.isSubCollection === true) {
          sortCollection(c);
        }
      });

      addNextAndPreviousReferences(collection.content);
      _.each(collection.content, function (c) {
        if (c.isSubCollection === true) {
          addNextAndPreviousReferences(c.content);
        }
      });

      var result = _.map(collection.content, function asd(c) {
        if (c.type === 'collection') {
          return _.map(c.content, asd);
        }
        return c;
      });
      metadata.collections[collection.name] = metadata[collection.name] = result;
    });

    done();
  };
};
