
# metalsmith-collections

A Metalsmith plugin that groups files together into collections and adds them to the global metadata. This is helpful for things like blog posts, where you want to display an index of each.

## Features

  - can match files by `collection` metadata
  - can match files by pattern
  - adds collection to global metadata
  - adds `next` and `previous` references to each file

## Installation

    $ npm install metalsmith-collections

## Usage

There are two ways to create collections:

  - **by pattern** - this is just passing a globing pattern that will group any files that match into the same collection.
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