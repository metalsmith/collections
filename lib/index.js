
var debug = require('debug')('metalsmith-collections');
var extend = require('extend');
var Matcher = require('minimatch').Minimatch;
var unique = require('uniq');
var read = require('fs').readFileSync;
var loadMetadata = require('read-metadata').sync;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Metalsmith plugin that adds `collections` of files to the global
 * metadata as a sorted array.
 *
 * @param {Object} collections (optional)
 * @return {Function}
 */

function plugin(opts){
  opts = normalize(opts);
  var keys = Object.keys(opts);
  var match = matcher(opts);

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();

    var _forEachCollection = function(keys, metadata, opts, cb) {
      keys.forEach(function(key){
        var col = metadata[key] || [];
        var settings = opts[key] || opts;

        if (!Array.isArray(col) && 'string' !== typeof col) {
          _forEachCollection(Object.keys(col), col, settings, cb);
        } else if ('object' === typeof col) {
          cb(col, metadata, key, settings);
        }
      });
    };

    var forEachCollection = function(cb) {
      _forEachCollection(keys, metadata, opts, cb);
    };

    /**
     * Find the files in each collection.
     */

    Object.keys(files).forEach(function(file){
      debug('checking file: %s', file);
      var data = files[file];
      match(file, data).forEach(function(key){
        var meta = metadata;
        var segments = key.split('.');
        var symbols = data._symbols;

        key = segments.shift();

        if (key && keys.indexOf(key) < 0){
          opts[key] = {};
          keys.push(key);
        }

        // Dynamic collections
        if (segments.length) {
          meta = meta[key] = meta[key] || {};

          // Set references as we step through the meta
          for (var i = 0, penult = segments.length - 1; i < penult; i++) {
            var seg = segments[i];
            var sym = symbols[i];

            meta = meta[seg] = meta[seg] || {};
            meta[sym] = seg;
            data[sym] = seg;
          }

          // Bottom of meta
          key = segments[i];
          meta[key] = meta[key] || [];
          meta[key][symbols[i]] = segments[i];
          data[symbols[i]] = segments[i];
        }

        meta[key] = meta[key] || [];
        meta[key].push(data);
      });

      delete data._symbols;
    });

    /**
     * Ensure that a default empty collection exists.
     */

    forEachCollection(function(col, metadata, key, settings) {
      metadata[key] = col || [];
    });

    /**
     * Sort the collections.
     */

    forEachCollection(function(col, metadata, key, settings) {
      debug('sorting collection: %s', key);

      var sort = settings.sortBy || 'date';

      if ('function' == typeof sort) {
        col.sort(sort);
      } else {
        col.sort(function(a, b){
          a = a[sort];
          b = b[sort];
          if (!a && !b) return 0;
          if (!a) return -1;
          if (!b) return 1;
          if (b > a) return -1;
          if (a > b) return 1;
          return 0;
        });
      }

      if (settings.reverse) col.reverse();
    });

    /**
     * Add `next` and `previous` references and apply the `limit` option
     */

    forEachCollection(function(col, metadata, key, settings) {
      debug('referencing collection: %s', key);

      var last = col.length - 1;

      if (settings.limit && settings.limit < col.length) {
        col = metadata[key] = col.slice(0, settings.limit);
        last = settings.limit - 1;
      }
      if (settings.refer === false) return;
      col.forEach(function(file, i){
        if (0 != i) file.previous = col[i-1];
        if (last != i) file.next = col[i+1];
      });
    });

    /**
     * Add collection metadata
     */

    forEachCollection(function(col, metadata, key, settings) {
      debug('adding metadata: %s', key);

      col.metadata = (typeof settings.metadata === 'string') ?
        loadMetadata(settings.metadata) :
        settings.metadata;
    });

    /**
     * Convert dynamic collection objects to arrays
     */
    var convert = function(keys, metadata) {
      keys.forEach(function(key){
        if (!Array.isArray(metadata[key]) && 'string' !== typeof metadata[key]) {
          var names = Object.keys(metadata[key]).sort();

          convert(names, metadata[key]);

          var meta = metadata[key];
          metadata[key] = [];

          names.forEach(function(name) {
            if ('string' !== typeof meta[name]) {
              metadata[key].push(meta[name]);
            }

            metadata[key][name] = meta[name];
          });
        }
      });
    };

    convert(keys, metadata);

    /**
     * Add them grouped together to the global metadata.
     */

    metadata.collections = {};
    keys.forEach(function(key){
      return metadata.collections[key] = metadata[key];
    });

    done();
  };
}

/**
 * Normalize an `options` dictionary.
 *
 * @param {Object} options
 */

function normalize(options){
  options = options || {};

  for (var key in options) {
    var val = options[key];
    if ('string' == typeof val) options[key] = { pattern: val };
  }

  return options;
}

/**
 * Generate a matching function for a given set of `collections`.
 *
 * @param {Object} collections
 * @return {Function}
 */

function matcher(cols){
  var keys = Object.keys(cols);
  var matchers = {};
  var symbols = {};

  keys.forEach(function(key){
    var opts = cols[key];
    if (!opts.pattern) return;

    // Replace dynamic collection :symbols with capture groups.
    var reStr = new Matcher(opts.pattern).makeRe().source;

    symbols[key] = [];
    var symbolRe = /(?:^|\/|\\):([^\/\\]+)/g;
    var symbol = symbolRe.exec(opts.pattern);

    while (symbol) {
      symbols[key].push(symbol[1]);
      var re = new RegExp(':' + symbol[1] + '(?=\\/|\\\\|$)');
      reStr = reStr.replace(re, '([^\\/\\\\]+)');
      symbol = symbolRe.exec(opts.pattern);
    }

    matchers[key] = new RegExp(reStr);
  });

  return function(file, data){
    var matches = [];

    if (data.collection) {
      var collection = data.collection;
      if (!Array.isArray(collection)) collection = [collection];
      collection.forEach(function(key){
        var segments = key.split('.');

        if (segments.length > 1) {
          data._symbols = symbols[segments[0]];
        }

        matches.push(key);

        if (key && keys.indexOf(key) < 0)
          debug('adding new collection through metadata: %s', key);
      });
    }

    for (var key in matchers){
      var m = matchers[key];
      var matched = m.exec(file);

      if (!matched) {
        continue;
      }

      if (matched[1]) {
        data._symbols = symbols[key];
        key = [key].concat(matched.slice(1)).join('.');
      }

      matches.push(key);
      debug('matched[%s]: %s with %s', key, file, m);
    }

    data.collection = unique(matches);
    return data.collection;
  };
}
