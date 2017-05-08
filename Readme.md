# metalsmith-collections

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

  - **by pattern** - this is just passing a globing pattern that will group any files that match into the same collection. The passed pattern can be a single pattern (as a string) or an array of globing patterns. For more information read the [multimatch patterns documentation](https://www.npmjs.com/package/multimatch#how-multiple-patterns-work).
  - **by metadata** - this is adding a specific `collection` metadata field to each item that you want to add to a collection.

The simplest way to create a collection is to use a pattern to match the files you want to group together:

```js
var collections = require('metalsmith-collections');

metalsmith.use(collections({
  articles: '*.md'
}));
```

Which is just a shorthand. You could also add additional options:

```js
metalsmith.use(collections({
  articles: {
    pattern: '*.md',
    sortBy: 'date',
    reverse: true
  }
}));
```

But you can also match based on a `collection` property in each file's metadata by omitting a pattern, and adding the property to your files:

```js
metalsmith.use(collections({
  articles: {
    sortBy: 'date',
    reverse: true
  }
}));
```
```markdown
---
title: My Article
collection: articles
date: 2013-02-21
---

My article contents...
```

All of the files with a matching `collection` will be added to an array that is exposed as a key of the same name on the global Metalsmith `metadata`.
You can omit passing any options to the plugin when matching based on a `collection` property.

Adds a `path` property to the collection item's data which contains the file path of the generated file. For example, this can be used in mustache templates to create links:

```html
<h1><a href="/{{ path }}">{{ title }}</a></h1>
```

If you need even more granular control over which files are added to your collection, you can pass a filter function to the `filterBy` option. This option allows you to filter out files based on their metadata.

For example, to only add articles published after 2002 to the collection:

```js
metalsmith.use(collections({
  articles: {
    pattern: '*.md',
    sortBy: 'date',
    reverse: true,
    filterBy: function(articleMeta) {
      var articleDate = new Date(articleMeta.date);
      return (articleDate.getFullYear() > 2002);
    },
  }
}));
```

The `filterBy` function is passed a single argument which corresponds to each file's metadata. You can use the metadata to perform comparisons or carry out other decision-making logic. If the function you supply evaluates to `true`, the file will be added to the collection. If it evaluates to `false`, the file will not be added.

### Collection Metadata

Additional metadata can be added to the collection object.

```js
metalsmith.use(collections({
  articles: {
    sortBy: 'date',
    reverse: true,
    metadata: {
        name: 'Articles',
        description: 'The Articles listed here...'
    }
  }
}));
```

Collection metadata can also be assigned from a `json` or `yaml` file.

```js
metalsmith.use(collections({
  articles: {
    sortBy: 'date',
    reverse: true,
    metadata: 'path/to/file.json'
  }
}));
```

On each collection definition, it's possible to add a `limit` option so that the
collection length is not higher than the given limit:

```js
metalsmith.use(collections({
  lastArticles: {
    sortBy: 'date',
    limit: 10
  }
}));
```

By adding `refer: false` to your options, it will skip adding the "next" and
"previous" links to your articles.

```js
metalsmith.use(collections({
  articles: {
    refer: false
  }
}));
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
