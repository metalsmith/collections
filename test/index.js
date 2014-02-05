
var assert = require('assert');
var Metalsmith = require('metalsmith');
var collections = require('..');

describe('metalsmith-collections', function(){
  it('should add collections to metadata', function(done){
    var metalsmith = Metalsmith('test/fixtures/basic');
    metalsmith
      .use(collections({ articles: {}}))
      .build(function(err){
        if (err) return done(err);
        assert.equal(2, metalsmith.metadata().articles.length);
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
});