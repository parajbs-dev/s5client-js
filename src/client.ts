import axios, { AxiosError } from "axios";
import type { AxiosResponse } from "axios";

import { CustomClientOptions, RequestConfig } from "./defaults";
import { buildRequestHeaders, buildRequestUrl, ExecuteRequestError } from "./request";

import {
  getAllInfosFromCid,
  convertDownloadDirectoryInputCid,
  convertB58btcToB32rfcCid,
  convertS5CidToMHashB64url,
  convertS5CidToB3hashHex,
  defaultPortalUrl,
  addUrlSubdomain,
  ensureUrl,
} from "s5-utils-js";

import { deleteCid } from "./delete";
import { pinCid } from "./pin";

import {
  downloadData,
  downloadFile,
  downloadDirectory,
  getCidUrl,
  getMetadata,
  getStorageLocations,
  getDownloadUrls,
} from "./download";

import {
  uploadFromUrl,
  uploadData,
  uploadFile,
  uploadLargeFile,
  uploadDirectory,
  uploadDirectoryRequest,
  uploadWebapp,
  uploadWebappRequest,
  uploadSmallFile,
  uploadSmallFileRequest,
  uploadLargeFileRequest,
} from "./upload";

// Add a response interceptor so that we always return an error of type
// `ExecuteResponseError`.
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger.
    // Do something with response data.
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error.
    return Promise.reject(ExecuteRequestError.From(error as AxiosError));
  }
);

/**
 * The S5 Client which can be used to access S5-net.
 */
export class S5Client {
  customOptions: CustomClientOptions;

  // The initial portal URL, the value of `defaultPortalUrl()` if `new
  // S5Client` is called without a given portal. This initial URL is used to
  // resolve the final portal URL.
  protected initialPortalUrl: string;
  // The resolved API portal URL. The request won't be made until needed, or
  // `initPortalUrl()` is called. The request is only made once, for all S5
  // Clients.
  protected static resolvedPortalUrl?: Promise<string>;
  // The custom portal URL, if one was passed in to `new S5Client()`.
  protected customPortalUrl?: string;

  // Set methods (defined in other files).

  // Upload
  uploadFromUrl = uploadFromUrl;
  uploadData = uploadData;
  uploadFile = uploadFile;
  protected uploadSmallFile = uploadSmallFile;
  protected uploadSmallFileRequest = uploadSmallFileRequest;
  protected uploadLargeFile = uploadLargeFile;
  protected uploadLargeFileRequest = uploadLargeFileRequest;
  uploadDirectory = uploadDirectory;
  protected uploadDirectoryRequest = uploadDirectoryRequest;
  uploadWebapp = uploadWebapp;
  protected uploadWebappRequest = uploadWebappRequest;

  // Delete
  deleteCid = deleteCid;

  // Pin
  pinCid = pinCid;

  // Download
  downloadData = downloadData;
  downloadFile = downloadFile;
  downloadDirectory = downloadDirectory;
  getCidUrl = getCidUrl;
  getMetadata = getMetadata;
  getStorageLocations = getStorageLocations;
  getDownloadUrls = getDownloadUrls;

  // Tools
  tools = {
    convertB58btcToB32rfcCid: convertB58btcToB32rfcCid.bind(this),
    addUrlSubdomain: addUrlSubdomain.bind(this),
    convertS5CidToMHashB64url: convertS5CidToMHashB64url.bind(this),
    convertDownloadDirectoryInputCid: convertDownloadDirectoryInputCid.bind(this),
    getAllInfosFromCid: getAllInfosFromCid.bind(this),
    convertS5CidToB3hashHex: convertS5CidToB3hashHex.bind(this),
  };

  /**
   * The S5 Client which can be used to access S5-net.
   *
   * @class
   * @param [initialPortalUrl] The initial portal URL to use to access S5, if specified. A request will be made to this URL to get the actual portal URL. To use the default portal while passing custom options, pass "".
   * @param [customOptions] Configuration for the client.
   */
  constructor(initialPortalUrl = "", customOptions: CustomClientOptions = {}) {
    if (initialPortalUrl === "") {
      // Portal was not given, use the default portal URL. We'll still make a request for the resolved portal URL.
      initialPortalUrl = defaultPortalUrl();
    } else {
      // Portal was given, don't make the request for the resolved portal URL.
      this.customPortalUrl = ensureUrl(initialPortalUrl);
    }
    this.initialPortalUrl = initialPortalUrl;
    this.customOptions = customOptions;
  }

  /* istanbul ignore next */
  /**
   * Make the request for the API portal URL.
   *
   * @returns - A promise that resolves when the request is complete.
   */
  async initPortalUrl(): Promise<void> {
    if (this.customPortalUrl) {
      // Tried to make a request for the API portal URL when a custom URL was already provided.
      return;
    }

    // Try to resolve the portal URL again if it's never been called or if it
    // previously failed.
    if (!S5Client.resolvedPortalUrl) {
      S5Client.resolvedPortalUrl = this.resolvePortalUrl();
    } else {
      try {
        await S5Client.resolvedPortalUrl;
      } catch (e) {
        S5Client.resolvedPortalUrl = this.resolvePortalUrl();
      }
    }

    // Wait on the promise and throw if it fails.
    await S5Client.resolvedPortalUrl;
    return;
  }

  /* istanbul ignore next */
  /**
   * Returns the API portal URL. Makes the request to get it if not done so already.
   *
   * @returns - the portal URL.
   */
  async portalUrl(): Promise<string> {
    if (this.customPortalUrl) {
      return this.customPortalUrl;
    }

    // Make the request if needed and not done so.
    await this.initPortalUrl();

    return await S5Client.resolvedPortalUrl!; // eslint-disable-line
  }

  /**
   * Creates and executes a request.
   *
   * @param config - Configuration for the request.
   * @returns - The response from axios.
   * @throws - Will throw `ExecuteRequestError` if the request fails. This error contains the original Axios error.
   */
  async executeRequest(config: RequestConfig): Promise<AxiosResponse> {
    const urlReq = await buildRequestUrl(this, {
      baseUrl: config.url,
      endpointPath: config.endpointPath,
      endpointGetMetadata: config.endpointGetMetadata,
      endpointGetStorageLocations: config.endpointGetStorageLocations,
      endpointGetDownloadUrls: config.endpointGetDownloadUrls,
      endpointDelete: config.endpointDelete,
      endpointPin: config.endpointPin,
      subdomain: config.subdomain,
      extraPath: config.extraPath,
      query: config.query,
    });

    const separator = config.query ? "&" : "?";
    const url = `${urlReq}${config.authToken ? `${separator}auth_token=${config.authToken}` : ""}`;

    // Build headers.
    const headers = buildRequestHeaders(config.headers, config.customUserAgent, config.customCookie, config.s5ApiKey);

    const auth = config.APIKey ? { username: "", password: config.APIKey } : undefined;

    let onDownloadProgress = undefined;
    if (config.onDownloadProgress) {
      onDownloadProgress = function (event: ProgressEvent) {
        // Avoid NaN for 0-byte file.
        /* istanbul ignore next: Empty file test doesn't work yet. */
        const progress = event.total ? event.loaded / event.total : 1;
        // @ts-expect-error TS complains even though we've ensured this is defined.
        config.onDownloadProgress(progress, event);
      };
    }
    let onUploadProgress = undefined;
    if (config.onUploadProgress) {
      onUploadProgress = function (event: ProgressEvent) {
        // Avoid NaN for 0-byte file.
        /* istanbul ignore next: event.total is always 0 in Node. */
        const progress = event.total ? event.loaded / event.total : 1;
        // @ts-expect-error TS complains even though we've ensured this is defined.
        config.onUploadProgress(progress, event);
      };
    }

    // NOTE: The error type is `ExecuteRequestError`. We set up a response
    // interceptor above that does the conversion from `AxiosError`.
    try {
      return await axios({
        url,
        method: config.method,
        data: config.data,
        headers,
        auth,
        onDownloadProgress,
        onUploadProgress,
        responseType: config.responseType,
        transformRequest: config.transformRequest,
        transformResponse: config.transformResponse,

        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Allow cross-site cookies.
        withCredentials: true,
      });
    } catch (e) {
      // If `loginFn` is set and we get an Unauthorized response...
      if (config.loginFn && (e as ExecuteRequestError).responseStatus === 401) {
        // Try logging in again.
        await config.loginFn(config);
        // Unset the login function on the recursive call so that we don't try
        // to login again, avoiding infinite loops.
        return await this.executeRequest({ ...config, loginFn: undefined });
      }
      throw e;
    }
  }

  // ===============
  // Private Methods
  // ===============

  /**
   * Gets the current server URL for the portal. You should generally use
   * `portalUrl` instead - this method can be used for detecting whether the
   * current URL is a server URL.
   *
   * @returns - The portal server URL.
   */
  protected async resolvePortalServerUrl(): Promise<string> {
    const response = await this.executeRequest({
      ...this.customOptions,
      method: "head",
      url: this.initialPortalUrl,
    });

    if (!response.headers) {
      throw new Error(
        "Did not get 'headers' in response despite a successful request. Please try again and report this issue to the devs if it persists."
      );
    }
    const portalUrl = response.headers["s5-server-api"];
    if (!portalUrl) {
      throw new Error("Could not get server portal URL for the given portal");
    }
    return portalUrl;
  }

  /**
   * Make a request to resolve the provided `initialPortalUrl`.
   *
   * @returns - The portal URL.
   */
  protected async resolvePortalUrl(): Promise<string> {
    const response = await this.executeRequest({
      ...this.customOptions,
      method: "head",
      url: this.initialPortalUrl,
    });

    if (!response.headers) {
      throw new Error(
        "Did not get 'headers' in response despite a successful request. Please try again and report this issue to the devs if it persists."
      );
    }
    const portalUrl = response.headers["s5-portal-api"];
    if (!portalUrl) {
      throw new Error("Could not get portal URL for the given portal");
    }
    return portalUrl;
  }
}
