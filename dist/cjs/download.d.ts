import { S5Client } from "./client";
import { CustomDownloadOptions, CustomGetMetadataOptions, GetMetadataResponse, GetStorageLocationsResponse, CustomGetStorageLocationsOptions, CustomGetDownloadUrlsOptions, GetDownloadUrlsResponse } from "./defaults";
/**
 * Downloads in-memory data from a S5 cid.
 *
 * @param this - S5Client
 * @param cid - 46-character cid, or a valid cid URL. Can be followed by a path. Note that the cid will not be encoded, so if your path might contain special characters, consider using `customOptions.path`.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns - The data
 */
export declare function downloadData(this: S5Client, cid: string, customOptions?: CustomDownloadOptions): Promise<ArrayBuffer>;
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
export declare function downloadFile(this: S5Client, cid: string, customOptions?: CustomDownloadOptions): Promise<string>;
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
export declare function downloadDirectory(this: S5Client, cid: string, filename: string, customOptions?: CustomDownloadOptions): Promise<void>;
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
export declare function getCidUrl(this: S5Client, cid: string, customOptions?: CustomDownloadOptions): Promise<string>;
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
export declare function getMetadata(this: S5Client, cid: string, customOptions?: CustomGetMetadataOptions): Promise<GetMetadataResponse>;
/**
 * Retrieves storage locations for a given CID.
 *
 * @param this - S5Client
 * @param cid - The CID value for which storage locations are to be retrieved.
 * @param customOptions - Custom options to be passed for the request (optional).
 * @returns A Promise that resolves to the response data containing storage locations.
 */
export declare function getStorageLocations(this: S5Client, cid: string, customOptions?: CustomGetStorageLocationsOptions): Promise<GetStorageLocationsResponse>;
/**
 * Retrieves the download URLs for a given CID (Content Identifier).
 *
 * @param this - S5Client
 * @param cid - The CID (Content Identifier) for which to retrieve the download URLs.
 * @param customOptions - Optional custom options for the request.
 * @returns A promise that resolves to the response containing the download URLs.
 */
export declare function getDownloadUrls(this: S5Client, cid: string, customOptions?: CustomGetDownloadUrlsOptions): Promise<GetDownloadUrlsResponse>;
//# sourceMappingURL=download.d.ts.map