/* eslint-env node, mocha */
const assert = require('assert')
const Metalsmith = require('metalsmith')

/* eslint-disable-next-line node/no-missing-require */
const collections = require('..')
const { name } = require('../package.json')

describe('@metalsmith/collections', function () {
  it('should export a named plugin function matching package.json name', function () {
    const namechars = name.split('/')[1]
    const camelCased = namechars.split('').reduce((str, char, i) => {
      str += namechars[i - 1] === '-' ? char.toUpperCase() : char === '-' ? '' : char
      return str
    }, '')
    assert.strictEqual(collections().name, camelCased)
  })
  it('should not crash the metalsmith build when using default options', function (done) {
    const metalsmith = Metalsmith('test/fixtures/noconfig')
    metalsmith.use(collections()).build((err) => {
      const m = metalsmith.metadata()
      assert.strictEqual(err, null)
      assert.strictEqual(2, m.collections.books.length)
      assert.strictEqual(1, m.collections.movies.length)
      done()
    })
  })
  it('should add collections to metadata', function (done) {
    const metalsmith = Metalsmith('test/fixtures/basic')
    metalsmith.use(collections({ articles: {} })).build(function (err) {
      if (err) return done(err)
      const m = metalsmith.metadata()
      assert.strictEqual(2, m.collections.articles.length)
      assert.strictEqual(m.collections.articles, m.collections.articles)
      done()
    })
  })

  it('should match collections by pattern', function (done) {
    const metalsmith = Metalsmith('test/fixtures/pattern')
    metalsmith
      .use(
        collections({
          articles: {
            pattern: '*.md'
          }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        assert.strictEqual(4, metalsmith.metadata().collections.articles.length)
        done()
      })
  })

  it('should take a pattern shorthand string', function (done) {
    const metalsmith = Metalsmith('test/fixtures/pattern')
    metalsmith
      .use(
        collections({
          articles: '*.md'
        })
      )
      .build(function (err) {
        if (err) return done(err)
        assert.strictEqual(4, metalsmith.metadata().collections.articles.length)
        done()
      })
  })

  it('should take an array of patterns', function (done) {
    const metalsmith = Metalsmith('test/fixtures/pattern')
    metalsmith
      .use(
        collections({
          blogs: ['*.md', '!one.md', '!two.md', '!four.md'],
          pages: { pattern: ['four.md'] }
        })
      )
      .build(function (err, files) {
        if (err) return done(err)
        assert.strictEqual(1, metalsmith.metadata().collections.blogs.length, 'length blogs')
        assert.strictEqual(1, metalsmith.metadata().collections.pages.length, 'length page')
        assert.deepStrictEqual(files['three.md'].collection, ['blogs'], 'collection blogs')
        assert.deepStrictEqual(files['four.md'].collection, ['pages'], 'collection page')
        done()
      })
  })

  it('should add the collection property to a file', function (done) {
    const metalsmith = Metalsmith('test/fixtures/pattern')
    metalsmith
      .use(
        collections({
          articles: '*.md'
        })
      )
      .build(function (err, files) {
        if (err) return done(err)
        assert.deepStrictEqual(files['three.md'].collection, ['articles'])
        done()
      })
  })

  it('should "sort" on path by default', function (done) {
    const metalsmith = Metalsmith('test/fixtures/basic')
    metalsmith.use(collections({ articles: { pattern: '*.md' }})).build(function (err) {
        try {
          assert(!(err instanceof Error))
          const articles = metalsmith.metadata().collections.articles
          assert.deepStrictEqual(articles.map(a => a.contents.toString().trim()), ['one','three','two'])
          done()
        } catch (err) {
          done(err)
        }
    })
  })

  it('should accept a "sort" option', function (done) {
    const metalsmith = Metalsmith('test/fixtures/sort')
    metalsmith.use(collections({ articles: { sort: 'title' } })).build(function (err) {
        try {
          assert(!(err instanceof Error))
          const articles = metalsmith.metadata().collections.articles
          assert.deepStrictEqual(articles.map(a => a.title), ['Gamma', 'Beta', 'Alpha'])
          done()
        } catch (err) {
          done(err)
        }
    })
  })

  it('should accept a "sort" function', function (done) {
    function sort(a, b) {
      a = a.title.slice(1)
      b = b.title.slice(1)
      return a > b ? 1 : -1
    }

    const metalsmith = Metalsmith('test/fixtures/sort')

    metalsmith.use(collections({ articles: { sort } })).build(function (err) {
      if (err) return done(err)
      const articles = metalsmith.metadata().collections.articles
      assert.strictEqual('Gamma', articles[0].title)
      assert.strictEqual('Beta', articles[1].title)
      assert.strictEqual('Alpha', articles[2].title)
      done()
    })
  })

  it('should accept an asc sort order', function (done) {
    const metalsmith = Metalsmith('test/fixtures/sort')
    metalsmith
      .use(
        collections({
          articles: {
            sort: 'title:asc'
          }
        })
      )
      .build(function (err) {
        try {
          assert(!(err instanceof Error))
          const articles = metalsmith.metadata().collections.articles
          assert.deepStrictEqual(articles.map(a => a.title), ['Alpha', 'Beta', 'Gamma'])
          done()
        } catch (err) {
          done(err)
        }
      })
  })

  it('should accept a "limit" option', function () {
    const metalsmith = Metalsmith('test/fixtures/limit'),
      limit = 2
    return metalsmith
      .use(
        collections({
          articles: {
            limit,
            sort: 'title:asc'
          }
        })
      )
      .build()
      .then(function () {
        const articles = metalsmith.metadata().collections.articles
        assert.strictEqual(limit, articles.length)
        assert.deepStrictEqual(articles.map(a => a.title), ['Alpha','Beta'])
      })
  })

  it('should accept a "limit" higher than the collection length', function () {
    const metalsmith = Metalsmith('test/fixtures/limit')
    return metalsmith
      .use(
        collections({
          articles: {
            sort: 'title:asc',
            limit: 25
          }
        })
      )
      .build()
      .then(function () {
        const articles = metalsmith.metadata().collections.articles
        assert.deepStrictEqual(articles.map(a => a.title), ['Alpha','Beta','Gamma'])
      })
  })

  it('should add next, previous, first and last references', function (done) {
    const metalsmith = Metalsmith('test/fixtures/references')
    metalsmith.use(collections({ articles: {} })).build(function (err) {
      if (err) return done(err)
      const articles = metalsmith.metadata().collections.articles
      assert(!articles[0].previous)
      assert.strictEqual(articles[0].next, articles[1])
      assert.strictEqual(articles[1].previous, articles[0])
      assert.strictEqual(articles[1].next, articles[2])
      assert.strictEqual(articles[2].previous, articles[1])
      assert.strictEqual(articles.some(a => a.last !== articles[2]), false)
      assert.strictEqual(articles.some(a => a.first !== articles[0]), false)
      assert(!articles[2].next)
      done()
    })
  })

  it('should not add references if opts[key].refer === false', function (done) {
    const metalsmith = Metalsmith('test/fixtures/references-off')
    metalsmith.use(collections({ articles: { refer: false } })).build(function (err) {
      if (err) return done(err)
      const articles = metalsmith.metadata().collections.articles
      assert(!articles[0].previous)
      assert(!articles[0].next)
      assert(!articles[1].previous)
      assert(!articles[1].next)
      assert(!articles[2].previous)
      assert(!articles[2].next)
      done()
    })
  })

  it('should logically map references with other options', function () {
    const metalsmith = Metalsmith('test/fixtures/references-pointers')

    return metalsmith
      .use(collections({ articles: { sort: 'date' } }))
      .process()
      .then(() => {
        const articles = metalsmith.metadata().collections.articles
        assert.deepStrictEqual(
          articles.map((a) => a.date),
          [new Date('2022-01-03'), new Date('2022-01-02'), new Date('2022-01-01')]
        )
        assert.deepStrictEqual(
          articles.map((a) => a.next && a.next.date),
          [new Date('2022-01-02'), new Date('2022-01-01'), null]
        )
      })
      .then(() => {
        return metalsmith
          .use(collections({ articles: { sort: 'title:desc', limit: 2 } }))
          .process()
          .then(() => {
            const articles = metalsmith.metadata().collections.articles
            assert.deepStrictEqual(
              articles.map((a) => a.title),
              [3, 2]
            )
            assert.deepStrictEqual(
              articles.map((a) => a.previous && a.previous.title),
              [null, 3]
            )
          })
      })
  })

  it('should not fail with empty collections', function (done) {
    const metalsmith = Metalsmith('test/fixtures/empty')
    metalsmith
      .use(
        collections({
          articles: { sort: 'date' }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        const articles = metalsmith.metadata().collections.articles
        assert.strictEqual(articles.length, 0)
        done()
      })
  })

  it('should add metadata objects to collections', function (done) {
    const metalsmith = Metalsmith('test/fixtures/basic')
    metalsmith
      .use(
        collections({
          articles: {
            metadata: { name: 'Batman' }
          }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        const m = metalsmith.metadata()
        assert.strictEqual('Batman', m.collections.articles.metadata.name)
        done()
      })
  })

  it('should load collection metadata from a JSON file', function (done) {
    const metalsmith = Metalsmith('test/fixtures/metadata')
    metalsmith
      .use(
        collections({
          articles: {
            metadata: 'metadata.json'
          }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        const m = metalsmith.metadata()
        assert.strictEqual('Batman', m.collections.articles.metadata.name)
        done()
      })
  })

  it('should load collection metadata from a YAML file', function (done) {
    const metalsmith = Metalsmith('test/fixtures/metadata')
    metalsmith
      .use(
        collections({
          articles: {
            metadata: 'metadata.yaml'
          }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        const m = metalsmith.metadata()
        assert.strictEqual('Batman', m.collections.articles.metadata.name)
        done()
      })
  })

  it('should error when loading collection metadata from a file not found', function (done) {
    const metalsmith = Metalsmith('test/fixtures/metadata')
    const expectedMsg = 'No collection metadata file at'
    metalsmith
      .use(
        collections({
          articles: {
            metadata: 'not_there_metadata.yaml'
          }
        })
      )
      .build(function (err) {
        try {
          assert(err instanceof Error)
          assert.strictEqual(err.message.slice(0, expectedMsg.length), expectedMsg)
          done()
        } catch (err) {
          done(err)
        }
      })
  })

  it('should error when loading collection metadata from an invalid file', function (done) {
    const metalsmith = Metalsmith('test/fixtures/metadata')
    const expectedMsg = 'end of the stream or a document separator is expected'
    metalsmith
      .use(
        collections({
          articles: {
            metadata: 'invalid_metadata.json'
          }
        })
      )
      .build(function (err) {
        try {
          assert(err instanceof Error)
          assert.strictEqual(err.message.slice(0, expectedMsg.length), expectedMsg)
          done()
        } catch (err) {
          done(err)
        }
      })
  })

  it('should allow multiple collections', function (done) {
    const metalsmith = Metalsmith('test/fixtures/multi')
    metalsmith.use(collections({ articles: {}, posts: {}, drafts: {} })).build(function (err) {
      if (err) return done(err)
      const m = metalsmith.metadata()
      assert.strictEqual(2, m.collections.articles.length)
      assert.strictEqual(1, m.collections.drafts.length)
      assert.strictEqual(1, m.collections.posts.length)
      done()
    })
  })

  it('should allow collections through metadata alone', function (done) {
    const metalsmith = Metalsmith('test/fixtures/noconfig')
    metalsmith.use(collections({ movies: {} })).build(function (err) {
      if (err) return done(err)
      const m = metalsmith.metadata()
      assert.strictEqual(2, m.collections.books.length)
      assert.strictEqual(1, m.collections.movies.length)
      done()
    })
  })

  it('should allow collections by pattern and front matter', function (done) {
    const metalsmith = Metalsmith('test/fixtures/multi')
    metalsmith.use(collections({ articles: {}, posts: {}, drafts: {}, blog: '*.md' })).build(function (err) {
      if (err) return done(err)
      const m = metalsmith.metadata()
      assert.strictEqual(3, m.collections.blog.length)
      assert.strictEqual(2, m.collections.articles.length)
      assert.strictEqual(1, m.collections.drafts.length)
      assert.strictEqual(1, m.collections.posts.length)
      done()
    })
  })

  // collections explicitly defined in front-matter should take precedence
  it('should add collection property', function (done) {
    const metalsmith = Metalsmith('test/fixtures/complex')
    metalsmith
      .use(
        collections({
          patternMatched: { pattern: '{onlyByPattern,merged}.md' },
          patternMatched2: { pattern: '{onlyByPattern,merged,orderTest}.md' },
          duplicateMatch: 'duplicateMatch.md',
          eight: 'orderTest.md'
        })
      )
      .build(function (err, files) {
        if (err) return done(err)
        // front-matter dynamically defined collections should respect order in front-matter
        assert.deepStrictEqual(files['dynamicallyDefined.md'].collection, ['dynamic2', 'dynamic1'])
        // front-matter dynamically defined collections should respect order of collection definition
        assert.deepStrictEqual(files['onlyByPattern.md'].collection, ['patternMatched', 'patternMatched2'])
        // pattern-matched collections should be added after front-matter collections
        assert.deepStrictEqual(files['merged.md'].collection, ['news', 'patternMatched', 'patternMatched2'])
        // mixed pattern & front-matter collections should respect mixed order
        assert.deepStrictEqual(files['orderTest.md'].collection, ['fourth', 'fifth', 'patternMatched2', 'eight'])
        // should not add a collection matched twice as duplicate
        assert.deepStrictEqual(files['duplicateMatch.md'].collection, ['duplicateMatch', 'news'])
        done()
      })
  })

  it('should accept a "filter" function', function (done) {
    const metalsmith = Metalsmith('test/fixtures/filter')
    metalsmith
      .use(
        collections({
          articles: {
            filter(articleMeta) {
              if (articleMeta.date) {
                const articleDate = new Date(articleMeta.date)
                return articleDate.getFullYear() > 2011
              }
              return false
            }
          }
        })
      )
      .build(function (err) {
        if (err) return done(err)
        const articles = metalsmith.metadata().collections.articles
        assert.strictEqual(1, articles.length)
        const articleDate = new Date(articles[0].date)
        assert.strictEqual(true, articleDate instanceof Date)
        assert.strictEqual(2014, articleDate.getFullYear())
        done()
      })
  })

  it('should not add duplicates on repeat builds', function (done) {
    const metalsmith = Metalsmith('test/fixtures/noconfig').use(collections())
    function remap(collections) {
      return Object.values(collections).map((coll) => coll.map(({ path, collection }) => ({ path, collection })))
    }

    new Promise((resolve, reject) => {
      metalsmith.process((err) => {
        if (err) reject(err)
        resolve(metalsmith.metadata().collections)
      })
    }).then((first) => {
      metalsmith.process((err) => {
        if (err) done(err)
        assert.deepStrictEqual(remap(first), remap(metalsmith.metadata().collections))
        done()
      })
    })
  })
})
