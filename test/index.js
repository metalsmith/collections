
var assert = require('assert');
var Metalsmith = require('metalsmith');
var _ = require('underscore');
var collections = require('..');

describe('metalsmith-collections', function(){
  it('should add collections to metadata', function(done){
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(collections({ articles: {}}))
      .build(function(err){
        if (err) return done(err);
        var m = metalsmith.metadata();
        assert.equal(2, m.articles.length);
        assert.equal(m.collections.articles, m.articles);
        done();
      });
  });

  it('should match collections by pattern', function(done){
    var metalsmith = Metalsmith('test/fixtures/pattern');
    metalsmith
      .use(collections({
        articles: {
          pattern: '*.md'
        }
      }))
      .build(function(err){
        if (err) return done(err);
        assert.equal(3, metalsmith.metadata().articles.length);
        done();
      });
  });

  it('should take a pattern shorthand string', function(done){
    var metalsmith = Metalsmith('test/fixtures/pattern');
    metalsmith
      .use(collections({
        articles: '*.md'
      }))
      .build(function(err){
        if (err) return done(err);
        assert.equal(3, metalsmith.metadata().articles.length);
        done();
      });
  });

  it('should add the collection property to a file', function(done){
    var metalsmith = Metalsmith('test/fixtures/pattern');
    metalsmith
      .use(collections({
        articles: '*.md'
      }))
      .build(function(err, files){
        if (err) return done(err);
        assert.equal(files['three.md'].collection, 'articles');
        done();
      });
  });

  it('should accept a "sortBy" option', function(done){
    var metalsmith = Metalsmith('test/fixtures/sort');
    metalsmith
      .use(collections({ articles: { sortBy: 'title' }}))
      .build(function(err){
        if (err) return done(err);
        var articles = metalsmith.metadata().articles;
        assert.equal('Alpha', articles[0].title);
        assert.equal('Beta', articles[1].title);
        assert.equal('Gamma', articles[2].title);
        done();
      });
  });

  it('should accept a "sortBy" function', function(done){
    var metalsmith = Metalsmith('test/fixtures/sort');
    metalsmith
      .use(collections({ articles: { sortBy: sort }}))
      .build(function(err){
        if (err) return done(err);
        var articles = metalsmith.metadata().articles;
        assert.equal('Gamma', articles[0].title);
        assert.equal('Beta', articles[1].title);
        assert.equal('Alpha', articles[2].title);
        done();
      });

    function sort(a, b){
      a = a.title.slice(1);
      b = b.title.slice(1);
      return a > b ? 1 : -1;
    }
  });

  it('should accept a "reverse" option', function(done){
    var metalsmith = Metalsmith('test/fixtures/sort');
    metalsmith
      .use(collections({
        articles: {
          sortBy: 'title',
          reverse: true
        }
      }))
      .build(function(err){
        if (err) return done(err);
        var articles = metalsmith.metadata().articles;
        assert.equal('Alpha', articles[2].title);
        assert.equal('Beta', articles[1].title);
        assert.equal('Gamma', articles[0].title);
        done();
      });
  });

  it('should add next and previous references', function(done){
    var metalsmith = Metalsmith('test/fixtures/references');
    metalsmith
      .use(collections({ articles: {}}))
      .build(function(err){
        if (err) return done(err);
        var articles = metalsmith.metadata().articles;
        assert(!articles[0].previous);
        assert.equal(articles[0].next, articles[1]);
        assert.equal(articles[1].previous, articles[0]);
        assert.equal(articles[1].next, articles[2]);
        debugger;
        assert.equal(articles[2].previous, articles[1]);
        assert(!articles[2].next);
        done();
      });
  });

  it('should not fail with empty collections', function(done) {
    var metalsmith = Metalsmith('test/fixtures/empty');
    metalsmith
      .use(collections({
        articles: {
          sortBy: 'date',
          reverse: true
        }
      }))
      .build(function(err) {
        if (err) return done(err);
        var articles = metalsmith.metadata().articles;
        assert.equal(articles.length, 0);
        done();
      });
  });

  it('should create nested collections', function(done){
    var getTitles = function(collection) {
      return _.map(collection, function(e){return e.title;});
    };
    var metalsmith = Metalsmith('test/fixtures/nested');
    metalsmith
      .use(collections({
        articles: {
          pattern: '*.md',
          sortBy: 'title'
        }
      }))
      .build(function(err){
        if (err) return done(err);
        var m = metalsmith.metadata();
        assert.equal(3, m.collections.articles.length);
        assert.equal('a', getTitles(m.collections.articles)[0]);
        assert.equal('b', getTitles(m.collections.articles)[1]);
        assert.equal('c', getTitles(m.collections.articles)[2]);
        assert.equal(true, _.isArray(m.collections.articles[1].content));
        assert.equal(2, m.collections.articles[1].content.length);
        assert.equal('bb', getTitles(m.collections.articles[1].content)[0]);
        assert.equal('aa', getTitles(m.collections.articles[1].content)[1]);
        done();
      });
  });
});
