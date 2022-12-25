import urljoin from "url-join";
import parse from "url-parse";
import { trimSuffix } from "./string";
import { throwValidationError } from "./validation";
export const DEFAULT_S5_PORTAL_URL = "https://localhost:5522";
/**
 * @deprecated please use DEFAULT_S5_PORTAL_URL.
 */
export const defaultS5PortalUrl = DEFAULT_S5_PORTAL_URL;
export const URI_S5_PREFIX = "s5://";
/**
 * @deprecated please use URI_S5_PREFIX.
 */
export const uriS5Prefix = URI_S5_PREFIX;
/**
 * Returns the default portal URL.
 *
 * @returns - The portal URL.
 */
export function defaultPortalUrl() {
    /* istanbul ignore next */
    if (typeof window === "undefined")
        return "/"; // default to path root on ssr
    return window.location.origin;
}
/**
 * Adds a subdomain to the given URL.
 *
 * @param url - The URL.
 * @param subdomain - The subdomain to add.
 * @returns - The final URL.
 */
export function addUrlSubdomain(url, subdomain) {
    const urlObj = new URL(url);
    urlObj.hostname = `${subdomain}.${urlObj.hostname}`;
    const str = urlObj.toString();
    return trimSuffix(str, "/");
}
/**
 * Adds a query to the given URL.
 *
 * @param url - The URL.
 * @param query - The query parameters.
 * @returns - The final URL.
 */
export function addUrlQuery(url, query) {
    const parsed = parse(url, true);
    // Combine the desired query params with the already existing ones.
    query = { ...parsed.query, ...query };
    parsed.set("query", query);
    return parsed.toString();
}
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
 * Ensures that the given string is a URL.
 *
 * @param url - The given string.
 * @returns - The URL.
 */
export function ensureUrl(url) {
    if (url.startsWith("http://")) {
        return url;
    }
    return ensurePrefix(url, "https://");
}
/**
 * Ensures that the given string is a URL with a protocol prefix.
 *
 * @param url - The given string.
 * @returns - The URL.
 */
export function ensureUrlPrefix(url) {
    if (url === "localhost") {
        return "http://localhost/";
    }
    if (!/^https?:(\/\/)?/i.test(url)) {
        return `https://${url}`;
    }
    return url;
}
/**
 * Properly joins paths together to create a URL. Takes a variable number of
 * arguments.
 *
 * @param args - Array of URL parts to join.
 * @returns - Final URL constructed from the input parts.
 */
export function makeUrl(...args) {
    if (args.length === 0) {
        throwValidationError("args", args, "parameter", "non-empty");
    }
    return ensureUrl(args.reduce((acc, cur) => urljoin(acc, cur)));
}
