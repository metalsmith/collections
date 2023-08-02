import get from 'lodash.get'
import { relative, resolve } from 'path'

function sortBy(key, order) {
  order = order === 'asc' ? -1 : 1
  let getKey = (x) => x[key]
  if (key.includes('.')) {
    getKey = (x) => get(x, key)
  }
  return function defaultSort(a, b) {
    a = getKey(a)
    b = getKey(b)
    let ret
    if (!a && !b) ret = 0
    else if (!a) ret = 1 * order
    else if (!b) ret = -1 * order
    else if (b > a) ret = 1 * order
    else if (a > b) ret = -1 * order
    else ret = 0

    return ret
  }
}

// for backwards-compatibility only, date makes as little sense as "pubdate" or any custom key
const defaultSort = sortBy('date', 'desc')
const defaultFilter = () => true

/**
 * @typedef {Object} CollectionConfig
 * @property {string|string[]} [pattern] - One or more glob patterns to match files to a collection
 * @property {string|(a,b) => 0|1|-1} [sort] - a sort string of the format `'<key_or_keypath>:<asc|desc>'`, followed by the sort order, or a custom sort function
 * @property {number} [limit] - Limit the amount of items in a collection to `limit`
 * @property {boolean} [refer] - Adds `next` and `previous` keys to file metadata of matched files
 * @property {Function} [filter] - A function that gets a `Metalsmith.File` as first argument and returns `true` for every file to include in the collection
 * @property {Object|string} [metadata] - An object with metadata to attach to the collection, or a `json`/`yaml`filepath string to load data from (relative to `Metalsmith.directory`)
 */

/** @type {CollectionConfig} */
const defaultOptions = {
  pattern: null,
  metadata: null,
  limit: Infinity,
  refer: true,
  sort: defaultSort,
  filter: defaultFilter
}

/**
 * Normalize options
 * @param {Object.<string,CollectionConfig>} options
 * @param {import('metalsmith').Files} files
 * @param {import('metalsmith')} metalsmith
 * @throws {}
 */
function normalizeOptions(options, files, metalsmith) {
  options = options || {}
  const matter = metalsmith.matter

  for (const config in options) {
    let normalized = options[config]
    if (typeof normalized === 'string' || Array.isArray(normalized)) {
      normalized = { pattern: normalized }
    }
    normalized = Object.assign({}, defaultOptions, normalized)
    if (typeof normalized.metadata === 'string') {
      const absPath = resolve(metalsmith.source(), normalized.metadata)
      const inSourcePath = relative(metalsmith.source(), absPath)
      const metadataFile = files[inSourcePath]
      if (!metadataFile) {
        const err = new Error(`No collection metadata file at "${absPath}"`)
        err.name = '@metalsmith/collections'
        throw err
      }
      normalized.metadata = matter.parse(matter.wrap(metadataFile.contents.toString()))
    }

    // remap sort option
    let sort = normalized.sort
    if (typeof sort === 'string') {
      if (!sort.includes(':')) sort += ':desc'
      const [key, order] = sort.split(':')
      sort = sortBy(key, order)
    }
    normalized.sort = sort

    options[config] = normalized
  }

  return options
}

/**
 * Add `collections` of files to the global metadata as a sorted array.
 * @example
 * metalsmith.use(collections({
 *   posts: 'posts/*.md',
 *   portfolio: {
 *     pattern: 'portfolio/*.md',
 *     metadata: { title: 'My portfolio' },
 *     sort: 'date:desc'
 *   }
 * }))
 *
 * @param {Object.<string,CollectionConfig|string>} options
 * @return {import('metalsmith').Plugin}
 */
function collections(options) {
  return function collections(files, metalsmith, done) {
    try {
      options = normalizeOptions(options, files, metalsmith)
    } catch (err) {
      done(err)
    }
    const collectionNames = Object.keys(options)
    const mappedCollections = collectionNames.map((name) => {
      return Object.assign({ name: name }, options[name])
    })

    const fileNames = Object.keys(files)
    const debug = metalsmith.debug('@metalsmith/collections')

    metalsmith.metadata({ collections: {} })
    const metadata = metalsmith.metadata()

    fileNames.forEach((filePath) => {
      const file = files[filePath]

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
      const { pattern, filter, sort, refer, limit } = collection
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
      // apply sort, filter, limit options in this order
      let currentCollection = (metadata.collections[name] = matches.sort(sort))

      currentCollection = metadata.collections[name] = currentCollection.filter(filter).slice(0, limit)

      if (collection.metadata) {
        currentCollection.metadata = collection.metadata
      }
      if (refer) {
        const lastIndex = currentCollection.length - 1
        currentCollection.forEach((file, i) => {
          Object.assign(file, {
            previous: i > 0 ? currentCollection[i - 1] : null,
            next: i < lastIndex ? currentCollection[i + 1] : null,
            first: currentCollection[0],
            last: currentCollection[lastIndex]
          })
        })
      }

      debug('Added %s files to collection %s', currentCollection.length, name)
    })
    done()
  }
}

collections.defaults = defaultOptions

export default collections
