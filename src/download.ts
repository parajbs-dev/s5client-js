import { ResponseType } from "axios";

import { S5Client } from "./client";
import { BaseCustomOptions, DEFAULT_BASE_OPTIONS } from "./utils/options";

/**
 * Custom download options.
 *
 * @property [endpointDownload] - The relative URL path of the portal endpoint to contact.
 * @property [download=false] - Indicates to `getCidUrl` whether the file should be downloaded (true) or opened in the browser (false). `downloadFile` and `openFile` override this value.
 * @property [path] - A path to append to the cid, e.g. `dir1/dir2/file`. A Unix-style path is expected. Each path component will be URL-encoded.
 * @property [range] - The Range request header to set for the download. Not applicable for in-borwser downloads.
 * @property [responseType] - The response type.
 * @property [subdomain=false] - Whether to return the final cid in subdomain format.
 */
export type CustomDownloadOptions = BaseCustomOptions & {
  endpointDownload?: string;
  download?: boolean;
  path?: string;
  range?: string;
  responseType?: ResponseType;
  subdomain?: boolean;
};

export type CustomGetMetadataOptions = BaseCustomOptions & {
  endpointGetMetadata?: string;
};

/**
 * The response for a get metadata request.
 *
 * @property metadata - The metadata in JSON format.
 * @property portalUrl - The URL of the portal.
 * @property cid - 46-character cid.
 */
export type GetMetadataResponse = {
  metadata: Record<string, unknown>;
};

export const DEFAULT_DOWNLOAD_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointDownload: "/",
  download: false,
  path: undefined,
  range: undefined,
  responseType: undefined,
  subdomain: false,
};

const DEFAULT_GET_METADATA_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointGetMetadata: "/s5/metadata",
};

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
export async function downloadFile(
  this: S5Client,
  cid: string,
  customOptions?: CustomDownloadOptions
): Promise<string> {
  const opts = { ...DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions, download: true };

  const url = await this.getCidUrl(cid, opts);

  // Download the url.
  window.location.assign(url);

  return url;
}

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
export async function getCidUrl(this: S5Client, cid: string, customOptions?: CustomDownloadOptions): Promise<string> {
  const opts = { ...DEFAULT_DOWNLOAD_OPTIONS, ...this.customOptions, ...customOptions };
  console.log(opts);

  const portalUrl = await this.portalUrl();

  const resolveUrl = portalUrl + "/" + cid;
  return resolveUrl;
}

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
export async function getMetadata(
  this: S5Client,
  cid: string,
  customOptions?: CustomGetMetadataOptions
): Promise<GetMetadataResponse> {
  const opts = { ...DEFAULT_GET_METADATA_OPTIONS, ...this.customOptions, ...customOptions };

  const response = await this.executeRequest({
    ...opts,
    method: "get",
    extraPath: cid,
  });

  return response.data;
}
