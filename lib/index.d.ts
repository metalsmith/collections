import Metalsmith from "metalsmith";

export default collections;
export type CollectionConfig = {
    /**
     * - One or more glob patterns to match files to a collection
     */
    pattern?: string | string[] | null;
    /**
     * - a sort string of the format `'<key_or_keypath>:<asc|desc>'`, followed by the sort order, or a custom sort function
     * @default 'path:asc'
     * @example
     * 'date'
     * 'pubdate:desc'
     * 'order:asc'
     */
    sort?: string | ((a: any, b: any) => 0 | 1 | -1);
    /**
     * - Limit the amount of items in a collection to `limit`
     */
    limit?: number;
    /**
     * - Adds `next`, `previous`, `first` and `last` keys to file metadata of matched files
     * @default true
     */
    refer?: boolean;
    /**
     * - A function that gets a `Metalsmith.File` as first argument and returns `true` for every file to include in the collection
     * @default () => true
     */
    filter?: Function;
    /**
     * - An object with metadata to attach to the collection, or a `json`/`yaml`filepath string to load data from (relative to `Metalsmith.directory`)
     */
    metadata?: any | string | null;
};
/**
 * Add `collections` of files to the global metadata as a sorted array.
 * @example
 * metalsmith.use(collections({
 *   posts: 'posts/*.md',
 *   portfolio: {
 *     pattern: 'portfolio/*.md',
 *     metadata: { title: 'My portfolio' },
 *     sort: 'order:asc'
 *   }
 * }))
 *
 * @param {Object.<string,CollectionConfig|string>} options
 */
declare function collections(options: {
    [x: string]: CollectionConfig | string;
}): Metalsmith.Plugin;
declare namespace collections {
    export { defaultOptions as defaults };
}

declare const defaultOptions: CollectionConfig;
