
var debug = require('debug')('metalsmith-collections');
var extend = require('extend');

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
  opts = opts || {};
  var keys = Object.keys(opts);

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();

    /**
     * Get the files in each collection.
     */

    Object.keys(files).forEach(function(file){
      debug('checking file: %s', file);
      var data = files[file];
      var key = data.collection;
      if (!opts[key]) return;
      metadata[key] = metadata[key] || [];
      metadata[key].push(data);
    });

    /**
     * Sort the collection.
     */

    keys.forEach(function(key){
      debug('sorting collection: %s', key);
      var settings = opts[key];
      var sort = settings.sortBy || 'date';
      var col = metadata[key];
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
      if (settings.reverse) col.reverse();
    });

    /**
     * Add `next` and `previous` references.
     */

    keys.forEach(function(key){
      debug('referencing collection: %s', key);
      var col = metadata[key];
      var last = col.length - 1;
      col.forEach(function(file, i){
        if (0 != i) file.previous = col[i-1];
        if (last != i) file.next = col[i+1];
      });
    });

    done();
  };
}