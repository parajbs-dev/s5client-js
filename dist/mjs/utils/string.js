/**
 * Prepends the prefix to the given string only if the string does not already start with the prefix.
 *
 * @param str - The string.
 * @param prefix - The prefix.
 * @returns - The prefixed string.
 */
export function ensurePrefix(str, prefix) {
    if (!str.startsWith(prefix)) {
        str = `${prefix}${str}`;
    }
    return str;
}
/**
 * Removes a prefix from the beginning of the string.
 *
 * @param str - The string to process.
 * @param prefix - The prefix to remove.
 * @param [limit] - Maximum amount of times to trim. No limit by default.
 * @returns - The processed string.
 */
export function trimPrefix(str, prefix, limit) {
    while (str.startsWith(prefix)) {
        if (limit !== undefined && limit <= 0) {
            break;
        }
        str = str.slice(prefix.length);
        if (limit) {
            limit -= 1;
        }
    }
    return str;
}
/**
 * Removes a suffix from the end of the string.
 *
 * @param str - The string to process.
 * @param suffix - The suffix to remove.
 * @param [limit] - Maximum amount of times to trim. No limit by default.
 * @returns - The processed string.
 */
export function trimSuffix(str, suffix, limit) {
    while (str.endsWith(suffix)) {
        if (limit !== undefined && limit <= 0) {
            break;
        }
        str = str.substring(0, str.length - suffix.length);
        if (limit) {
            limit -= 1;
        }
    }
    return str;
}
