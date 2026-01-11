# @metalsmith/collections

A Metalsmith plugin that lets you group files together into ordered collections, like blog posts. That way you can loop over them to generate index pages, add 'next' and 'previous' links between them, and more

[![metalsmith: core plugin][metalsmith-badge]][metalsmith-url]
[![npm version][npm-badge]][npm-url]
[![ci: build][ci-badge]][ci-url]
[![code coverage][codecov-badge]][codecov-url]
[![license: MIT][license-badge]][license-url]

## Features

- can match files by `collection` file metadata or pattern
- can limit the number of files in a collection
- can filter files in a collection based on file metadata
- adds collections to global metadata under the `collections` key.
- adds `next`, `previous`, `first` and `last` references to each file's collection references

## Installation

NPM:

```bash
npm install @metalsmith/collections
```

Yarn:

```bash
yarn add @metalsmith/collections
```

## Usage

Pass options to `@metalsmith/collections` in the plugin chain:

```js
import Metalsmith from 'metalsmith'
import markdown from '@metalsmith/markdown'
import collections from '@metalsmith/collections'
import { dirname } from 'path'

const __dirname = dirname(new URL(import.meta.url).pathname)

// defaults, only create collections based on file metadata
Metalsmith(__dirname).use(markdown()).use(collections())

// defaults for a "news" collection, except pattern option
Metalsmith(__dirname)
  .use(markdown())
  .use(
    collections({
      news: { pattern: 'news/**/*.html' }
    })
  )

// explicit defaults for a "news" collection, except pattern option
Metalsmith(__dirname)
  .use(markdown())
  .use(
    collections({
      pattern: { pattern: 'news/**/*.html' },
      metadata: null,
      filter: () => true,
      sort: 'date:desc',
      limit: Infinity,
      refer: true
    })
  )
```

With the example above, the file `src/news/world/something.html`'s `collection` property will become `['news']` but with extra properties attached, so that `file.collection.news.previous.title` resolves, as well as `file.collection.news.previous[0].title`

_Note: all subsequent examples in the readme use the same collections definitions under [Defining collections](#defining-collections)_

### Options

All options are _optional_

- **pattern** `string|string[]` - one or more glob patterns to group files into a collection
- **filter** `Function` - a function that returns `false` for files that should be filtered _out_ of the collection
- **limit** `number` - restrict the number of files in a collection to at most `limit`
- **sort** `string|Function` - a sort string of the format `'<key_or_keypath>:<asc|desc>'`, followed by the sort order, for example: `date` or `pubdate:desc` or `order:asc`, or a custom sort function. Defaults to `path:asc` which is filesystem alphabetical order.
- **metadata** `Object|string` - metadata to attach to the collection. Will be available as `metalsmith.metadata().collections.<name>.metadata`. This can be used for example to attach metadata for index pages. _If a string is passed, it will be interpreted as a file path to an external `JSON` or `YAML` metadata file_
- **refer** `boolean` - will add `next`, `previous`, `first` and `last` keys to each file in a collection. `true` by default

### Defining collections

There are 2 ways to create collections & they can be used together:

- **by pattern** - for example, this is how you would create multiple pattern-based collections, based on the folders `photos`, `news`, and `services`:

  ```js
  metalsmith.use(
    collections({
      gallery: 'photos/**/*.{jpg,png}',
      news: {
        metadata: {
          title: 'Latest news',
          description: 'All the latest in politics & world news',
          permalink: 'news'
        },
        pattern: 'news/**/*.html',
        sort: 'pubdate:desc'
      },
      services: 'services/**/*.html'
    })
  )
  ```

- **by file metadata** - add a `collection` property to the front-matter of each file that you want to add to a collection. The markdown file below will be included in the `news` collection even if it's not in the `news` folder (see previous example)

  `something-happened.md`

  ```md
  ---
  title: Something happened
  collection: news
  pubdate: 2021-12-01
  layout: news.hbs
  ---

  ...contents
  ```

  Note that you can also add the same file to multiple collections, which is useful for example if you want to use `@metalsmith/collections` as a _category_ system:

  `something-happened.md`

  ```md
  title: Something happened
  collection:

  - news
  - category_politics
  - category_world
    pubdate: 2021-12-01
    layout: news.hbs

  ---

  ...contents
  ```

#### Sorting

By default sorting is done on `path:asc`, which is alphabetical filepath order.
When `@metalsmith/collections` runs, it temporarily adds the file `path` to the sorting context.

When the sorting order (_asc_-ending or _desc_-ending) is omitted, _desc_ ending is implied.

So `prop:asc` for the following file metadata would be ordered as:

- `pubdate:asc`: `[Date(2023-01-01), Date(2023-01-05), Date(2023-01-03)]` -> `[Date(2023-01-01), Date(2023-01-03), Date(2023-01-05)]`
- `path:asc`: `['news/one.md', 'news/two.md', 'news/three.md']` -> `['news/one.md', 'news/three.md', 'news/two.md']`
- `order:asc`: `[5,2,6]` -> `[2,5,6]`

These examples show how date-ordered collections like posts, news, feeds are sorted in _descending_ order (most recent first) and a timeline would be in _ascending_ order.

### Rendering collection items

> [!IMPORTANT]
> Mind the difference between **collection** and **collections**: the _collections_ object is stored on `metalsmith.metadata()` and accessible to all files when using @metalsmith/layouts or in-place. Matched files each get an own _collection_ property, - an array of collection names -, with each collection also accessible by name (file.collection\[name]).

Here is an example of using [@metalsmith/permalinks](https://github.com/metalsmith/permalinks), followed by [@metalsmith/layouts](https://github.com/metalsmith/layouts) with [jstransformer-nunjucks](https://github.com/jstransformers/jstransformer-nunjucks) to render the `something-happened.md` news item, with links to the next and previous news items (using `refer: true` options):

`layouts/news.njk`

```nunjucks
<h1>{{ title }}</h1>

{# permalink is expected to be set from collection metadata here #}
<a href="{{ baseurl }}/{{ collections.news.permalink }}">See all {{ collections.news.title }}</a>
{% endfor %}
{{ contents | safe }}
<hr>
{{#if collection.news.previous.length }}
Read the previous news:
<a href="/{{ collection.news.next.permalink }}">{{ collection.news.next.title }}</a>
{{/if}}
{{#if collection.news.next.length }}
Read the next news:
<a href="/{{ collection.news.previous.permalink }}">{{ collection.news.previous.title }}</a>
{{/if}}
```

The previous example shows how to get the "first" previous/ next references, the next example show how you can iterate over each collection and render the full list of next/ previous items.

```nunjucks
<h1>{{ title }}</h1>

Part of: {% for name in collection -%}
<a href="{{ baseurl }}/{{ collections[name].permalink }}">{{ collections[name].title }}</a>{% if not loop.last %}, {% endif%}
{%- endfor %}
{% for name in collection %}
  {% if collection[name].previous.length %}
  {% for prev in collection[name].previous %}
  <a href="{{ prev.permalink }}"><-- {{ name }} / {{ prev.title }}</p>
  {% endfor %}
  {% endif %}
  {% for next in collection[name].next %}
  <a href="{{ next.permalink }}"> {{ name }} / {{ next.title }} --></p>
  {% endfor %}
  {% endif %}
{% endfor %}
```

The example above supposes an ordering of `pubdate:desc` (newest to oldest) or similar, which is why the "next news" corresponds to the `previous` property.
If one would map the news dates they would be like: `['2023-01-20', 2023-01-10', '2023-01-01']`.

_Note: If you don't need the `next`, `previous`, `first` or `last` references, you can pass the option `refer: false`_

### Rendering collection index

All matched files are added to an array that is exposed as a key of metalsmith global metadata, for example the `news` collection would be accessible at `Metalsmith.metadata().collections.news `. Below is a handlebarsexample of how you could render an index page for the `news` collection:

`layouts/news-index.hbs`

```handlebars
<h1>{{ title }}</h1> {{!-- news collection metadata.title --}}
<p>{{ description }}</p> {{!-- news collection metadata.description --}}
<hr>
{{#if collections.news.length }}
  <ul>
  {{#each collections.news}}
    <li>
      <h3><a href="{{ baseurl }}/{{ permalink }}">{{ title }}</a></h3>
      <p>{{ excerpt }}</p>
    </li>
  {{/each}}
  </ul>
{{/each}}
{{else}}
No news at the moment...
{{/if}}
```

### Custom sorting, filtering and limiting

You could define an `order` property on a set of files and pass `sort: 'order:asc'` to `@metalsmith/collections` for example, or you could override the sort with a custom function (for example to do multi-level sorting). The function below function sorts the "subpages" collection by a numerical "index" property but places unindexed items last.

```js
metalsmith.use(
  collections({
    subpages: {
      sort(a, b) {
        let aNum, bNum

        aNum = +a.index
        bNum = +b.index

        // Test for NaN
        if (aNum != aNum && bNum != bNum) return 0
        if (aNum != aNum) return 1
        if (bNum != bNum) return -1

        // Normal comparison, want lower numbers first
        if (aNum > bNum) return 1
        if (bNum > aNum) return -1
        return 0
      }
    }
  })
)
```

_Note: the `sort` option also understands nested keypaths, e.g. `display.order:asc`_

The `filter` function is passed a single argument which corresponds to each file's metadata. You can use the metadata to perform comparisons or carry out other decision-making logic. If the function you supply evaluates to `true`, the file will be added to the collection. If it evaluates to `false`, the file will not be added. The filter function below could work for a collection named `thisYearsNews` as it would filter out all the items that are older than this year:

```js
function filterBy(file) {
  const today = new Date()
  const pubdate = new Date(file.pubdate)
  return pubdate.getFullYear() === today.getFullYear()
}
```

Add a `limit` option to a collection config, for example to separate recent articles from archives:

```js
metalsmith.use(
  collections({
    recentArticles: {
      pattern: 'articles/**/*.html',
      sort: 'date',
      limit: 10
    },
    archives: {
      pattern: 'archives/**/*.html',
      sort: 'date'
    }
  })
)
```

_Note: the collection is first sorted, filtered, and then limited, if applicable._

### Collection Metadata

Additional metadata can be added to the collection object:

```js
metalsmith.use(
  collections({
    news: {
      metadata: {
        title: 'Latest news',
        description: 'All the latest in politics & world news',
        slug: 'news'
      }
    }
  })
)
```

Collection metadata can be loaded from a `json` or `yaml` file (path relative to `Metalsmith.source()`):

```js
metalsmith.use(
  collections({
    articles: {
      sort: 'date:asc',
      metadata: 'path/to/file.json'
    }
  })
)
```

### Debug

To log debug output, set the `DEBUG` environment variable to `@metalsmith/collections`:

Linux/Mac:

```sh
DEBUG=@metalsmith/collections
```

Windows:

```cmd
set "DEBUG=@metalsmith/collections"
```

## CLI Usage

Add the `@metalsmith/collections` key to your `metalsmith.json` `plugins` key:

```json
{
  "plugins": [
    {
      "@metalsmith/collections": {
        "articles": {
          "sort": "date:asc"
        }
      }
    }
  ]
}
```

## License

[MIT](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/@metalsmith/collections.svg
[npm-url]: https://www.npmjs.com/package/@metalsmith/collections
[ci-badge]: https://github.com/metalsmith/collections/actions/workflows/test.yml/badge.svg
[ci-url]: https://github.com/metalsmith/collections/actions/workflows/test.yml
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: http://metalsmith.io
[codecov-badge]: https://img.shields.io/coveralls/github/metalsmith/collections
[codecov-url]: https://coveralls.io/github/metalsmith/collections
[license-badge]: https://img.shields.io/github/license/metalsmith/collections
[license-url]: LICENSE
