import type { ResponseType, Method } from "axios";

import { Headers } from "./request";
import { JsonData } from "s5-utils-js";

/**
 * Custom client options.
 *
 * @property [APIKey] - Authentication password to use for a single S5 node.
 * @property [s5ApiKey] - Authentication API key to use for a S5 portal (sets the "S5-Api-Key" header).
 * @property [authToken] - Account Authentication token to use for a S5 portal (sets the "S5-Api-Key" header).
 * @property [customUserAgent] - Custom user agent header to set.
 * @property [customCookie] - Custom cookie header to set. WARNING: the Cookie header cannot be set in browsers. This is meant for usage in server contexts.
 * @property [onDownloadProgress] - Optional callback to track download progress.
 * @property [onUploadProgress] - Optional callback to track upload progress.
 * @property [loginFn] - A function that, if set, is called when a 401 is returned from the request before re-trying the request.
 */
export type CustomClientOptions = {
  APIKey?: string;
  s5ApiKey?: string;
  authToken?: string;
  customUserAgent?: string;
  customCookie?: string;
  onDownloadProgress?: (progress: number, event: ProgressEvent) => void;
  onUploadProgress?: (progress: number, event: ProgressEvent) => void;
  loginFn?: (config?: RequestConfig) => Promise<void>;
};

/**
 * Base custom options for methods hitting the API.
 */
export type BaseCustomOptions = CustomClientOptions;

/**
 * Config options for a single request.
 *
 * @property endpointPath - The endpoint to contact.
 * @property [data] - The data for a POST request.
 * @property [url] - The full url to contact. Will be computed from the portalUrl and endpointPath if not provided.
 * @property [method] - The request method.
 * @property [headers] - Any request headers to set.
 * @property [subdomain] - An optional subdomain to add to the URL.
 * @property [query] - Query parameters.
 * @property [extraPath] - An additional path to append to the URL, e.g. a 46-character cid.
 * @property [responseType] - The response type.
 * @property [transformRequest] - A function that allows manually transforming the request.
 * @property [transformResponse] - A function that allows manually transforming the response.
 */
export type RequestConfig = CustomClientOptions & {
  endpointPath?: string;
  endpointUploadFromUrl?: string;
  endpointGetMetadata?: string;
  endpointGetStorageLocations?: string;
  endpointGetDownloadUrls?: string;
  endpointDelete?: string;
  endpointPin?: string;
  data?: FormData | Record<string, unknown>;
  url?: string;
  method?: Method;
  headers?: Headers;
  subdomain?: string;
  query?: { [key: string]: string | undefined };
  extraPath?: string;
  responseType?: ResponseType;
  transformRequest?: (data: unknown) => string;
  transformResponse?: (data: string) => Record<string, unknown>;
};

/**
 * The default base custom options.
 */
export const DEFAULT_BASE_OPTIONS = {
  APIKey: "",
  s5ApiKey: "",
  authToken: "",
  customUserAgent: "",
  customCookie: "",
  onDownloadProgress: undefined,
  onUploadProgress: undefined,
  loginFn: undefined,
};

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
  paths: Record<string, unknown>;
};

export type CustomGetStorageLocationsOptions = BaseCustomOptions & {
  endpointGetStorageLocations?: string;
};

/**
 * The response for a get metadata request.
 *
 * @property metadata - The metadata in JSON format.
 * @property portalUrl - The URL of the portal.
 * @property cid - 46-character cid.
 */
export type GetStorageLocationsResponse = {
  locations: Record<string, unknown>;
};

export const DEFAULT_GET_STORAGE_LOCATIONS_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointGetStorageLocations: "/s5/debug/storage_locations",
};

export type CustomGetDownloadUrlsOptions = BaseCustomOptions & {
  endpointGetDownloadUrls?: string;
};

/**
 * The response for a get metadata request.
 *
 * @property metadata - The metadata in JSON format.
 * @property portalUrl - The URL of the portal.
 * @property cid - 46-character cid.
 */
export type GetDownloadUrlsResponse = {
  urls: Record<string, unknown>;
};

export const DEFAULT_GET_DOWNLOAD_URLS_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointGetDownloadUrls: "/s5/debug/download_urls",
};

export const DEFAULT_DOWNLOAD_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointDownload: "/",
  download: false,
  path: undefined,
  range: undefined,
  responseType: undefined,
};

export const DEFAULT_GET_METADATA_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointGetMetadata: "/s5/metadata",
};

/**
 * Custom upload options.
 *
 * @property [endpointUpload] - The relative URL path of the portal endpoint to contact.
 * @property [endpointDirectoryUpload] - The relative URL path of the portal endpoint to contact for Directorys.
 * @property [endpointLargeUpload] - The relative URL path of the portal endpoint to contact for large uploads.
 * @property [customFilename] - The custom filename to use when uploading files.
 * @property [customDirname] - The custom dirname to use when uploading directorys.
 * @property [largeFileSize=32943040] - The size at which files are considered "large" and will be uploaded using the tus resumable upload protocol. This is the size of one chunk by default (32 mib). Note that this does not affect the actual size of chunks used by the protocol.
 * @property [errorPages] - Defines a mapping of error codes and subfiles which are to be served in case we are serving the respective error code. All subfiles referred like this must be defined with absolute paths and must exist.
 * @property [retryDelays=[0, 5_000, 15_000, 60_000, 300_000, 600_000]] - An array or undefined, indicating how many milliseconds should pass before the next attempt to uploading will be started after the transfer has been interrupted. The array's length indicates the maximum number of attempts.
 * @property [tryFiles] - Allows us to set a list of potential subfiles to return in case the requested one does not exist or is a directory. Those subfiles might be listed with relative or absolute paths. If the path is absolute the file must exist.
 */
export type CustomUploadOptions = BaseCustomOptions & {
  endpointUpload?: string;
  endpointDirectoryUpload: string;
  endpointLargeUpload?: string;

  customFilename?: string;
  customDirname?: string;
  errorPages?: JsonData;
  tryFiles?: string[];

  // Large files.
  largeFileSize?: number;
  retryDelays?: number[];
};

/**
 * The tus chunk size is (32MiB - encryptionOverhead) * dataPieces, set.
 */
export const TUS_CHUNK_SIZE: number = (1 << 22) * 8;

/**
 * The retry delays, in ms. Data is stored for up to 20 minutes, so the
 * total delays should not exceed that length of time.
 */
export const DEFAULT_TUS_RETRY_DELAYS: number[] = [0, 5000, 15000, 60000, 300000, 600000];

/**
 * The portal file field name.
 */
export const PORTAL_FILE_FIELD_NAME = "file";

/**
 * The portal directory file field name.
 */
export const PORTAL_DIRECTORY_FILE_FIELD_NAME = "files[]";

/**
 * The default directory name.
 */
export const DEFAULT_DIRECTORY_NAME = "dist";

/**
 * The response to an upload request.
 *
 * @property cid - 46-character cid.
 */
export type UploadRequestResponse = {
  cid: string;
};

/**
 * The response to an upload request.
 *
 * @property cid - 46-character cid.
 */
export type UploadTusRequestResponse = {
  data: { cid: string };
};

export const DEFAULT_UPLOAD_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,

  endpointUpload: "/s5/upload",
  endpointDirectoryUpload: "/s5/upload/directory",
  endpointLargeUpload: "/s5/upload/tus",

  customFilename: "",
  customDirname: "",
  errorPages: undefined,
  tryFiles: undefined,

  // Large files.
  largeFileSize: TUS_CHUNK_SIZE,
  retryDelays: DEFAULT_TUS_RETRY_DELAYS,
};

export type CustomUploadFromUrlOptions = BaseCustomOptions & {
  endpointUploadFromUrl?: string;
};

/**
 * The response for a get metadata request.
 *
 * @property metadata - The metadata in JSON format.
 * @property portalUrl - The URL of the portal.
 * @property cid - 46-character cid.
 */
export type UploadFromUrlResponse = {
  cid: Record<string, unknown>;
};

export const DEFAULT_UPLOAD_FROM_URL_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointUploadFromUrl: "/s5/import/http",
};

export type CustomDeleteOptions = BaseCustomOptions & {
  endpointDelete?: string;
};

export const DEFAULT_DELETE_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointDelete: "/s5/delete",
};

export type CustomPinOptions = BaseCustomOptions & {
  endpointPin?: string;
};

export const DEFAULT_PIN_OPTIONS = {
  ...DEFAULT_BASE_OPTIONS,
  endpointPin: "/s5/pin",
};
