### Changelog
#### [v1.2.1](https://github.com/metalsmith/collections/compare/v1.2.1...v1.2.0) / 2022-02-03

- Fixes [`#99`](https://github.com/metalsmith/collections/issues/99): collection key on file metadata - no dupes, no nested arrays
- Fixes regression: incorrect previous & next refs when reverse: true
- Fixes typo's in README
#### [v1.2.0](https://github.com/metalsmith/collections/compare/v1.2.0...v1.1.0) / 2022-01-29

- Feature: sortBy now also understands nested metadata properties, e.g. `sortBy: 'meta.display.order'`
- Fixed JSDoc typo that made type hints unavailable
- Documented limit & refer options
- Improved README.md with more elaborate examples
- Refactored to cleaner code
- Removed dependencies: `extend`,`uniq`
- Added dependency `lodash.get`
- Added core-plugin tests
- Updated devDependencies release-it, prettier, eslint

#### [v1.1.0](https://github.com/metalsmith/collections/compare/v1.0.0...v1.1.0) / 2021-15-12

- Added standardised code formatting and QA [`#86`](https://github.com/metalsmith/collections/pull/86)
- Updated History with v1 PRs [`#85`](https://github.com/metalsmith/collections/pull/85)
- Added better JSDoc types, return named plugin function [`3aa3443`](https://github.com/metalsmith/collections/commit/3aa3443802c2f814c90cf39c7b43de8fc3d3ff13)
- Updated multimatch to 4.0.0, debug to 4.3.3 [`71d6f65`](https://github.com/metalsmith/collections/commit/71d6f65b9ec5572196e17dfebf5cff2361853f9d)

# [1.0.0][] / 2018-10-17

- Fixed API and merged many PRs
- Allow metadata-based filtering with `filterBy` option
- removed unused module
- Add documentation: `sortBy` can be a function
- display only matching files when debugging
- assign data.path where undefined
- Clear collections
- Added multiple collections syntax to Readme.md

#### [0.7.0][] / 2015-02-07

- Allow front matter and pattern collections.
- Added the ability to limit the size of a collection
- Allow collections through metadata alone
- add ability to disable next/previous references

#### [0.6.0][] / 2014-08-12

- Added the ability to set multiple collections

#### [0.5.1][] / 2014-08-05

- Fixed bug with require statement

#### [0.5.0][] / 2014-08-04

- Added the ability to add metadata to collections

#### [0.4.1][] - May 4, 2014

- fix empty collections

#### [0.4.0][] - March 25, 2014

- add option for `sortBy` to be a sorting function

#### [0.3.0][] - March 24, 2014

- add `collection` property to each file for pattern matches

#### [0.2.0][] - March 20, 2014

- add collections dictionary to global metadata

#### [0.1.0][] - March 6, 2014

- add matching by pattern
- add shorthand for pattern matching
- add previous and next references

#### [0.0.3][] - February 6, 2014

- add debug statements
- swap to `extend` from `defaults` to avoid cloning

#### [0.0.2][] - February 6, 2014

- swap to `merge` to not act on clones

#### [0.0.1][] - February 5, 2014

:sparkles:
