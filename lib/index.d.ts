import Metalsmith from "metalsmith";

export default collections;
export type CollectionConfig = {
    /**
     * - One or more glob patterns to match files to a collection
     */
    pattern?: string | string[] | null;
    /**
     * - A key to sort by (e.g. `date`,`title`, ..) or a custom sort function
     */
    sortBy?: string | ((a: any, b: any) => 0 | 1 | -1);
    /**
     * - Limit the amount of items in a collection to `limit`
     */
    limit?: number;
    /**
     * - Adds `next` and `previous` keys to file metadata of matched files
     */
    refer?: boolean;
    /**
     * - Whether to invert the sorting function results (asc/descending)
     */
    reverse?: boolean;
    /**
     * - A function that gets a `Metalsmith.File` as first argument and returns `true` for every file to include in the collection
     */
    filterBy?: Function;
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
 *     sortBy: 'order'
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
