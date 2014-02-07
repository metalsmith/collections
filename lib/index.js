
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

function plugin(collections){
  var cols = collections || {};
  var arrs = {};

  return function(files, metalsmith, done){
    setImmediate(done);

    Object.keys(files).forEach(function(file){
      debug('checking file: %s', file);
      var data = files[file];
      var col = data.collection;
      if (!cols[col]) return;
      arrs[col] = arrs[col] || [];
      arrs[col].push(data);
    });

    Object.keys(arrs).forEach(function(name){
      debug('sorting collection: %s', name);
      var arr = arrs[name];
      var opts = cols[name];
      var key = opts.sortBy || 'date';
      arr.sort(function(a, b){
        a = a[key];
        b = b[key];
        if (!a && !b) return 0;
        if (!a) return -1;
        if (!b) return 1;
        if (b > a) return -1;
        if (a > b) return 1;
        return 0;
      });
      if (opts.reverse) arr.reverse();
    });

    var data = metalsmith.metadata();
    metalsmith.metadata(extend(data, arrs));
  };
}