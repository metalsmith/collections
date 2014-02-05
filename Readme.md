
# metalsmith-collections

  A Metalsmith plugin that adds collections of files to the global metadata.

## Installation

    $ npm install metalsmith-collections

## CLI Usage

  Install via npm and then add the `metalsmith-collections` key to your `metalsmith.json` plugins, like so:

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

metalsmith.use(collections());
```

## License

  MIT