"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeUrl = exports.ensureUrlPrefix = exports.ensureUrl = exports.ensurePrefix = exports.addUrlQuery = exports.addUrlSubdomain = exports.defaultPortalUrl = exports.uriS5Prefix = exports.URI_S5_PREFIX = exports.defaultS5PortalUrl = exports.DEFAULT_S5_PORTAL_URL = void 0;
const url_join_1 = __importDefault(require("url-join"));
const url_parse_1 = __importDefault(require("url-parse"));
const string_1 = require("./string");
const validation_1 = require("./validation");
exports.DEFAULT_S5_PORTAL_URL = "https://localhost:5522";
/**
 * @deprecated please use DEFAULT_S5_PORTAL_URL.
 */
exports.defaultS5PortalUrl = exports.DEFAULT_S5_PORTAL_URL;
exports.URI_S5_PREFIX = "s5://";
/**
 * @deprecated please use URI_S5_PREFIX.
 */
exports.uriS5Prefix = exports.URI_S5_PREFIX;
/**
 * Returns the default portal URL.
 *
 * @returns - The portal URL.
 */
function defaultPortalUrl() {
    /* istanbul ignore next */
    if (typeof window === "undefined")
        return "/"; // default to path root on ssr
    return window.location.origin;
}
exports.defaultPortalUrl = defaultPortalUrl;
/**
 * Adds a subdomain to the given URL.
 *
 * @param url - The URL.
 * @param subdomain - The subdomain to add.
 * @returns - The final URL.
 */
function addUrlSubdomain(url, subdomain) {
    const urlObj = new URL(url);
    urlObj.hostname = `${subdomain}.${urlObj.hostname}`;
    const str = urlObj.toString();
    return (0, string_1.trimSuffix)(str, "/");
}
exports.addUrlSubdomain = addUrlSubdomain;
/**
 * Adds a query to the given URL.
 *
 * @param url - The URL.
 * @param query - The query parameters.
 * @returns - The final URL.
 */
function addUrlQuery(url, query) {
    const parsed = (0, url_parse_1.default)(url, true);
    // Combine the desired query params with the already existing ones.
    query = { ...parsed.query, ...query };
    parsed.set("query", query);
    return parsed.toString();
}
exports.addUrlQuery = addUrlQuery;
/**
 * Prepends the prefix to the given string only if the string does not already start with the prefix.
 *
 * @param str - The string.
 * @param prefix - The prefix.
 * @returns - The prefixed string.
 */
function ensurePrefix(str, prefix) {
    if (!str.startsWith(prefix)) {
        str = `${prefix}${str}`;
    }
    return str;
}
exports.ensurePrefix = ensurePrefix;
/**
 * Ensures that the given string is a URL.
 *
 * @param url - The given string.
 * @returns - The URL.
 */
function ensureUrl(url) {
    if (url.startsWith("http://")) {
        return url;
    }
    return ensurePrefix(url, "https://");
}
exports.ensureUrl = ensureUrl;
/**
 * Ensures that the given string is a URL with a protocol prefix.
 *
 * @param url - The given string.
 * @returns - The URL.
 */
function ensureUrlPrefix(url) {
    if (url === "localhost") {
        return "http://localhost/";
    }
    if (!/^https?:(\/\/)?/i.test(url)) {
        return `https://${url}`;
    }
    return url;
}
exports.ensureUrlPrefix = ensureUrlPrefix;
/**
 * Properly joins paths together to create a URL. Takes a variable number of
 * arguments.
 *
 * @param args - Array of URL parts to join.
 * @returns - Final URL constructed from the input parts.
 */
function makeUrl(...args) {
    if (args.length === 0) {
        (0, validation_1.throwValidationError)("args", args, "parameter", "non-empty");
    }
    return ensureUrl(args.reduce((acc, cur) => (0, url_join_1.default)(acc, cur)));
}
exports.makeUrl = makeUrl;
