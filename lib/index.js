/**
 * Metalsmith plugin that adds `collections` of files to the global
 * metadata as a sorted array.
 */

var debug = require('debug')('metalsmith-collections');
var MiniMatch = require('minimatch').Minimatch;
var unique = require('uniq');

var normalizeOptions = function (options) {
  options = options || {};

  for (var collectionName in options) {
    var val = options[collectionName];
    if ('string' === typeof val) {
      options[collectionName] = { pattern: val };
    }
  }

  return options;
};


var matcherFactory = function (collectionsOptions) {
  var collectionNames = Object.keys(collectionsOptions);
  var matchers = {};

  collectionNames.forEach(function (key) {
    var opts = collectionsOptions[key];
    if (opts.pattern) {
      matchers[key] = new MiniMatch(opts.pattern);
    }
  });

  return function (file, data) {
    var matches = [];
    var key = data.collection;
    if (key && ~collectionNames.indexOf(key)) matches.push(key);
    for (key in matchers) {
      var m = matchers[key];
      if (m && m.match(file)) matches.push(key);
    }
    return unique(matches);
  };
};

var defaultSortOrdering = function (sortFieldName) {
  return function (a, b) {
    a = a[sortFieldName];
    b = b[sortFieldName];
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    if (b > a) return -1;
    if (a > b) return 1;
    return 0;
  };
};

var sortCollection = function (collection, name, collectionOptions) {
  debug('sorting collection: %s', name);
  var sortDefinition = collectionOptions.sortBy || 'date';

  if ('function' === typeof sortDefinition) {
    collection.sort(sortDefinition);
  } else if ('string' === typeof sortDefinition) {
    collection.sort(defaultSortOrdering(sortDefinition));
  } else {
    throw new Error('Invalid type of "sortBy" parameter for "' + name + '"');
  }

  if (collectionOptions.reverse) {
    collection.reverse();
  }
};

var addNextAndPreviousReferences = function (collection) {
  var last = collection.length - 1;
  collection.forEach(function (file, i) {
    if (0 !== i) {
      file.previous = collection[i - 1];
    }
    if (last !== i) {
      file.next = collection[i + 1];
    }
  });
};

module.exports = function plugin(options) {
  options = normalizeOptions(options);
  var collectionNames = Object.keys(options),
    matcher = matcherFactory(options);

  return function (files, metalsmith, done) {
    var metadata = metalsmith.metadata();
    collectionNames.forEach(function (name) {
      metadata[name] = [];
    });

    /**
     * Find the files in each collection.
     */

    Object.keys(files).forEach(function (file) {
      debug('checking file: %s', file);
      var data = files[file];
      matcher(file, data).forEach(function (collectionName) {
        metadata[collectionName].push(data);
        data.collection = collectionName;
      });
    });

    collectionNames.forEach(function (name) {
      sortCollection(metadata[name], name, options[name]);
      addNextAndPreviousReferences(metadata[name]);
    });

    /**
     * Add them grouped together to the global metadata.
     */
    metadata.collections = {};
    collectionNames.forEach(function (key) {
      metadata.collections[key] = metadata[key];
    });

    done();
  };
};
