"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadUrls = exports.getStorageLocations = exports.getMetadata = exports.getCidUrl = exports.downloadDirectory = exports.downloadFile = exports.downloadData = void 0;
const defaults_1 = require("./defaults");
const file_saver_1 = require("file-saver");
const jszip_1 = __importDefault(require("jszip"));
const s5_utils_js_1 = require("s5-utils-js");
/**
 * Downloads in-memory data from a S5 cid.
 *
 * @param this - S5Client
 * @param cid - 46-character cid, or a valid cid URL. Can be followed by a path. Note that the cid will not be encoded, so if your path might contain special characters, consider using `customOptions.path`.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns - The data
 */
async function downloadData(cid, customOptions) {
    const opts = { ...defaults_1.DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions, download: true };
    const response = await this.executeRequest({
        ...opts,
        method: "get",
        extraPath: cid,
        responseType: "arraybuffer",
    });
    return response.data;
}
exports.downloadData = downloadData;
/**
 * Initiates a download of the content of the cid within the browser.
 *
 * @param this - S5Client
 * @param cid - 46-character cid, or a valid cid URL. Can be followed by a path. Note that the cid will not be encoded, so if your path might contain special characters, consider using `customOptions.path`.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointDownload="/"] - The relative URL path of the portal endpoint to contact.
 * @returns - The full URL that was used.
 * @throws - Will throw if the cid does not contain a cid or if the path option is not a string.
 */
async function downloadFile(cid, customOptions) {
    const opts = { ...defaults_1.DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions, download: true };
    const url = await this.getCidUrl(cid, opts);
    // Download the url.
    window.location.assign(url);
    return url;
}
exports.downloadFile = downloadFile;
/**
 * Initiates a downloads from the directory all contents of the cid to a zip file within the browser.
 *
 * @param this - S5Client
 * @param cid - 46-character cid, or a valid cid URL.
 * @param filename - The filename of the downloaded zip file.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns - The zip file from the downloaded files.
 * @throws - Will throw if the cid does not contain a cid or if the path option is not a string.
 */
async function downloadDirectory(cid, filename, customOptions) {
    const opts = { ...defaults_1.DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    try {
        const zipFile = new jszip_1.default();
        const saveZip = async function (name, url, filename) {
            if (!url)
                return;
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const folder = zipFile.folder(filename);
            const blobPromise = fetch(url).then((r) => {
                if (r.status === 200)
                    return r.blob();
                return Promise.reject(new Error(r.statusText));
            });
            const blob = await await blobPromise;
            return folder.file(name, blob);
        };
        // eslint-disable-next-line  @typescript-eslint/no-this-alias
        const s5client = this;
        const responseMeta = await s5client.getMetadata(cid);
        const obj = responseMeta.paths;
        const objLenght = Object.keys(obj).length;
        const zipDownloadLength = objLenght - 1;
        await Object.keys(obj).forEach(async function (key, i) {
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const url = await s5client.getCidUrl(obj[key].cid, opts);
            await saveZip(key, url, filename);
            if (i === zipDownloadLength) {
                setTimeout(async () => {
                    await zipFile.generateAsync({ type: "blob" }).then((blob) => (0, file_saver_1.saveAs)(blob, filename + ".zip"));
                }, 3000);
            }
        });
    }
    catch (error) {
        console.log("ERROR: " + error);
    }
}
exports.downloadDirectory = downloadDirectory;
/**
 * Constructs the full URL for the given cid.
 *
 * @param this - S5Client
 * @param cid - Base64 cid, or a valid URL that contains a cid. See `downloadFile`.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointDownload="/"] - The relative URL path of the portal endpoint to contact.
 * @returns - The full URL for the cid.
 * @throws - Will throw if the cid does not contain a cid or if the path option is not a string.
 */
async function getCidUrl(cid, customOptions) {
    const opts = { ...defaults_1.DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const portalUrl = await this.portalUrl();
    const resolveUrl = portalUrl + "/" + cid + (opts.authToken ? `?auth_token=${opts.authToken}` : "");
    return resolveUrl;
}
exports.getCidUrl = getCidUrl;
/**
 * Gets only the metadata for the given cid without the contents.
 *
 * @param this - S5Client
 * @param cid - Base64 cid.
 * @param [customOptions] - Additional settings that can optionally be set. See `downloadFile` for the full list.
 * @param [customOptions.endpointGetMetadata="/"] - The relative URL path of the portal endpoint to contact.
 * @returns - The metadata in JSON format. Empty if no metadata was found.
 * @throws - Will throw if the cid does not contain a cid .
 */
async function getMetadata(cid, customOptions) {
    const opts = { ...defaults_1.DEFAULT_GET_METADATA_OPTIONS, ...this.customOptions, ...customOptions };
    const response = await this.executeRequest({
        ...opts,
        method: "get",
        extraPath: cid,
    });
    return response.data;
}
exports.getMetadata = getMetadata;
/**
 * Retrieves storage locations for a given CID.
 *
 * @param this - S5Client
 * @param cid - The CID value for which storage locations are to be retrieved.
 * @param customOptions - Custom options to be passed for the request (optional).
 * @returns A Promise that resolves to the response data containing storage locations.
 */
async function getStorageLocations(cid, customOptions) {
    // Merge default options, this.customOptions, and customOptions
    const opts = { ...defaults_1.DEFAULT_GET_STORAGE_LOCATIONS_OPTIONS, ...this.customOptions, ...customOptions };
    // Convert CID to mHashB64url
    const mHashB64url = (0, s5_utils_js_1.convertS5CidToMHashB64url)(cid);
    // Execute GET request with merged options and mHashB64url as extraPath
    const response = await this.executeRequest({
        ...opts,
        method: "get",
        extraPath: mHashB64url,
    });
    // Return the response data
    return response.data;
}
exports.getStorageLocations = getStorageLocations;
/**
 * Retrieves the download URLs for a given CID (Content Identifier).
 *
 * @param this - S5Client
 * @param cid - The CID (Content Identifier) for which to retrieve the download URLs.
 * @param customOptions - Optional custom options for the request.
 * @returns A promise that resolves to the response containing the download URLs.
 */
async function getDownloadUrls(cid, customOptions) {
    // Merge default options, instance custom options, and provided custom options
    const opts = { ...defaults_1.DEFAULT_GET_DOWNLOAD_URLS_OPTIONS, ...this.customOptions, ...customOptions };
    // Execute the request to retrieve the download URLs
    const response = await this.executeRequest({
        ...opts,
        method: "get",
        extraPath: cid,
    });
    // Return the response data
    return response.data;
}
exports.getDownloadUrls = getDownloadUrls;
