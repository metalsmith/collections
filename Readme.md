# metalsmith-collections

[![npm version][npm-badge]][npm-url]
[![code style: prettier][prettier-badge]][prettier-url]
[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]

[![Build Status][travis-badge]][travis-url]

A [Metalsmith](https://github.com/segmentio/metalsmith) plugin that lets you group files together into an ordered collection, like blog posts. That way you can loop over them to generate an index, or add 'next' and 'previous' links between them.

## Features

- can match files by `collection` metadata
- can match files by pattern
- can limit the number of files in a collection
- can filter files in a collection based on metadata
- adds collections to global metadata
- adds `next` and `previous` references to each file in the collection

## Installation

    $ npm install metalsmith-collections

## Usage

There are two ways to create collections:

- **by pattern** - this is just passing a globbing pattern that will group any files that match into the same collection. The passed pattern can be a single pattern (as a string) or an array of globing patterns. For more information read the [multimatch patterns documentation](https://www.npmjs.com/package/multimatch#how-multiple-patterns-work).
- **by metadata** - this is adding a specific `collection` metadata field to each item that you want to add to a collection.

The simplest way to create a collection is to use a pattern to match the files you want to group together:

```js
var collections = require('metalsmith-collections');

metalsmith.use(
  collections({
    articles: '*.md'
  })
);
```

Which is just a shorthand. You could also add additional options:

```js
metalsmith.use(
  collections({
    articles: {
      pattern: '*.md',
      sortBy: 'date',
      reverse: true
    }
  })
);
```

But you can also match based on a `collection` property in each file's metadata by omitting a pattern, and adding the property to your files:

```js
metalsmith.use(
  collections({
    articles: {
      sortBy: 'date',
      reverse: true
    }
  })
);
```

```markdown
---
title: My Article
collection: articles
date: 2013-02-21
---

My article contents...
```

Multiple collections can also be assigned per file:

```markdown
---

title: My Article
collection: - articles - news
date: 2016-02-11

My article contents...
```

All of the files with a matching `collection` will be added to an array that is exposed as a key of the same name on the global Metalsmith `metadata`.
You can omit passing any options to the plugin when matching based on a `collection` property.

Adds a `path` property to the collection item's data which contains the file path of the generated file. For example, this can be used in mustache templates to create links:

```html
<h1><a href="/{{ path }}">{{ title }}</a></h1>
```

The sorting method can be overridden with a custom function in order to sort the files in any order you prefer. For instance, this function sorts the "subpages" collection by a numerical "index" property but places unindexed items last.

```js
metalsmith.use(
  collections({
    subpages: {
      sortBy: function(a, b) {
        var aNum, bNum;

        aNum = +a.index;
        bNum = +b.index;

        // Test for NaN
        if (aNum != aNum && bNum != bNum) return 0;
        if (aNum != aNum) return 1;
        if (bNum != bNum) return -1;

        // Normal comparison, want lower numbers first
        if (aNum > bNum) return 1;
        if (bNum > aNum) return -1;
        return 0;
      }
    }
  })
);
```

The `filterBy` function is passed a single argument which corresponds to each file's metadata. You can use the metadata to perform comparisons or carry out other decision-making logic. If the function you supply evaluates to `true`, the file will be added to the collection. If it evaluates to `false`, the file will not be added.

### Collection Metadata

Additional metadata can be added to the collection object.

```js
metalsmith.use(
  collections({
    articles: {
      sortBy: 'date',
      reverse: true,
      metadata: {
        name: 'Articles',
        description: 'The Articles listed here...'
      }
    }
  })
);
```

Collection metadata can also be assigned from a `json` or `yaml` file.

```js
metalsmith.use(
  collections({
    articles: {
      sortBy: 'date',
      reverse: true,
      metadata: 'path/to/file.json'
    }
  })
);
```

On each collection definition, it's possible to add a `limit` option so that the
collection length is not higher than the given limit:

```js
metalsmith.use(
  collections({
    lastArticles: {
      sortBy: 'date',
      limit: 10
    }
  })
);
```

By adding `refer: false` to your options, it will skip adding the "next" and
"previous" links to your articles.

```js
metalsmith.use(
  collections({
    articles: {
      refer: false
    }
  })
);
```

## CLI Usage

All of the same options apply, just add them to the `"plugins"` key in your `metalsmith.json` configuration:

```json
{
  "plugins": {
    "metalsmith-collections": {
      "articles": {
        "sortBy": "date",
        "reverse": true
      }
    }
  }
}
```

## License

MIT

[npm-badge]: https://img.shields.io/npm/v/metalsmith-collections.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-collections
[travis-badge]: https://travis-ci.org/segmentio/metalsmith-collections.svg?branch=master
[travis-url]: https://travis-ci.org/segmentio/metalsmith-collections
[prettier-badge]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[prettier-url]: https://github.com/prettier/prettier
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: http://metalsmith.io
