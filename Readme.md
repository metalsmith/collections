
# metalsmith-collections

  A Metalsmith plugin that groups files together into collections and adds them to the global metadata. This is helpful for things like blog posts, where you want to display an index of each.

## Features

  - can match files by `collection` metadata
  - can match files by pattern
  - adds collection to global metadata
  - adds `next` and `previous` references to each file

## Installation

    $ npm install metalsmith-collections

## CLI Usage


  Install via npm and then add the `metalsmith-collections` key to your `metalsmith.json` plugins. 

  There are two ways to create collections:

  - **by pattern** - this is just passing a globing pattern that will group any files that match into the same collection.
  - **by metadata** - this is adding a specific `collection` metadata field to each item that you want to add to a collection.

  The simplest way to create a collection is to use a pattern to match the files you want to group together:

```json
{
  "plugins": {
    "metalsmith-collections": {
      "articles": "*.md"
    }
  }
}
```

  Which is just a shorthand. You could also add additional options:

```json
{
  "plugins": {
    "metalsmith-collections": {
      "articles": {
        "pattern": "*.md",
        "sortBy": "date",
        "reverse": true
      }
    }
  }
}
```

  But you can also match based on a `collection` property in each file's metadata by omitting a pattern:

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

  And then in your files themselves, add a `collection` and the optional field you want to sort by:

```markdown
---
title: My Article
collection: articles
date: 2013-02-21
---

My article contents...
```

  All of the files with a matching `collection` will be added to an array that is exposed as a key of the same name on the global Metalsmith `metadata`.

## Javascript Usage

  Pass the plugin to `Metalsmith#use`:

```js
var collections = require('metalsmith-collections');

metalsmith.use(collections('*.md'));
```

## License

  MIT