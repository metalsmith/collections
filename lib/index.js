const debug = require('debug')('@metalsmith/collections')
const loadMetadata = require('read-metadata').sync
const get = require('lodash.get')
// for backwards-compatibility only, date makes as little sense as "pubdate" or any custom key
const defaultSort = sortBy('date')
const defaultFilter = () => true

/**
 * @typedef {Object} CollectionConfig
 * @property {string|string[]} pattern - One or more glob patterns to match files to a collection
 * @property {string|(a,b) => 0|1|-1} sortBy - A key to sort by (e.g. `date`,`title`, ..) or a custom sort function
 * @property {number} limit - Limit the amount of items in a collection to `limit`
 * @property {boolean} refer - Adds `next` and `previous` keys to file metadata of matched files
 * @property {boolean} reverse - Whether to invert the sorting function results (asc/descending)
 * @property {Function} filterBy - A function that gets a `Metalsmith.File` as first argument and returns `true` for every file to include in the collection
 * @property {Object|string} metadata - An object with metadata to attach to the collection, or a `json`/`yaml`filepath string to load data from (relative to `Metalsmith.directory`)
 */

/** @type {CollectionConfig} */
const defaultOptions = {
  pattern: null,
  reverse: false,
  metadata: null,
  limit: Infinity,
  refer: true,
  sortBy: defaultSort,
  filterBy: defaultFilter
}

function sortBy(key) {
  let getKey = (x) => x[key]
  if (key.includes('.')) {
    getKey = (x) => get(x, key)
  }
  return function defaultSort(a, b) {
    a = getKey(a)
    b = getKey(b)
    if (!a && !b) return 0
    if (!a) return -1
    if (!b) return 1
    if (b > a) return -1
    if (a > b) return 1
    return 0
  }
}

/**
 * Normalize options
 * @param {Object.<string,CollectionConfig>} options
 */
function normalizeOptions(options) {
  options = options || {}

  for (const config in options) {
    let normalized = options[config]
    if (typeof normalized === 'string' || Array.isArray(normalized)) {
      normalized = { pattern: normalized }
    }
    normalized = Object.assign({}, defaultOptions, normalized)
    if (typeof normalized.metadata === 'string') {
      normalized.metadata = loadMetadata(normalized.metadata)
    }
    if (typeof normalized.sortBy === 'string') {
      normalized.sortBy = sortBy(normalized.sortBy)
    }
    options[config] = normalized
  }

  return options
}

/**
 * Metalsmith plugin that adds `collections` of files to the global
 * metadata as a sorted array.
 *
 * @param {Object.<string,CollectionConfig|string>} options
 * @return {import('metalsmith').Plugin}
 */
function initializeCollections(options) {
  options = normalizeOptions(options)
  const collectionNames = Object.keys(options)
  const mappedCollections = collectionNames.map((name) => {
    return Object.assign({ name: name }, options[name])
  })

  return function collections(files, metalsmith, done) {
    const metadata = metalsmith.metadata()
    const fileNames = Object.keys(files)

    metadata.collections = {}

    fileNames.forEach((filePath) => {
      // add path property to file metadata for convenience
      // this is for backward-compatibility only and is pretty useless
      const file = files[filePath]
      file.path = file.path || filePath

      // dynamically add collections with default options when encountered in file metadata,
      // and not explicitly defined in plugin options
      if (file.collection) {
        ;(Array.isArray(file.collection) ? file.collection : [file.collection]).forEach((name) => {
          if (!collectionNames.includes(name)) {
            collectionNames.push(name)
            const normalized = Object.assign({}, defaultOptions)
            mappedCollections.push(Object.assign({ name }, normalized))
          }
        })
      }
    })

    debug('Identified %s collections: %s', mappedCollections.length, collectionNames.join())

    mappedCollections.forEach((collection) => {
      const { pattern, filterBy, sortBy, reverse, refer, limit } = collection
      const name = collection.name
      const matches = []
      debug('Processing collection %s with options %s:', name, collection)

      // first match by pattern if provided
      if (pattern) {
        matches.push.apply(
          matches,
          metalsmith.match(pattern, fileNames).map((filepath) => {
            const data = files[filepath]
            // pattern-matched files might or might not have a "collection" property defined in front-matter
            // and might also be included in multiple collections
            if (!data.collection) {
              data.collection = []
            } else if (typeof data.collection === 'string') {
              data.collection = [data.collection]
            }
            if (!data.collection.includes(collection.name)) {
              data.collection = [...data.collection, collection.name]
            }
            return data
          })
        )
      }

      // next match by "collection" key, but only push if the files haven't been added through pattern matching first
      matches.push.apply(
        matches,
        Object.values(files).filter((file) => {
          const patternMatched = matches.includes(file)
          const isInCollection = Array.isArray(file.collection)
            ? file.collection.includes(collection.name)
            : file.collection === collection.name
          return !patternMatched && isInCollection
        })
      )

      if (Object.prototype.hasOwnProperty.call(metadata, name)) {
        debug('Warning: overwriting previously set metadata property %s', name)
      }
      // apply sort, reverse, filter, limit options in this order
      metadata[name] = matches.sort(sortBy)

      if (reverse) {
        metadata[name].reverse()
      }

      metadata[name] = metadata[name].filter(filterBy).slice(0, limit)

      if (collection.metadata) {
        metadata[name].metadata = collection.metadata
      }
      if (refer) {
        if (reverse) {
          metadata[name].forEach((file, i) => {
            Object.assign(file, {
              next: i > 0 ? metadata[name][i - 1] : null,
              previous: i < metadata[name].length - 1 ? metadata[name][i + 1] : null
            })
          })
        } else {
          metadata[name].forEach((file, i) => {
            Object.assign(file, {
              previous: i > 0 ? metadata[name][i - 1] : null,
              next: i < metadata[name].length - 1 ? metadata[name][i + 1] : null
            })
          })
        }
      }

      metadata.collections[name] = metadata[name]
      debug('Added %s files to collection %s', metadata[name].length, name)
    })
    done()
  }
}

initializeCollections.defaults = defaultOptions

module.exports = initializeCollections
