"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S5Client = void 0;
const axios_1 = __importDefault(require("axios"));
const upload_1 = require("./upload");
const download_1 = require("./download");
const url_1 = require("./utils/url");
const request_1 = require("./request");
// Add a response interceptor so that we always return an error of type
// `ExecuteResponseError`.
axios_1.default.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger.
    // Do something with response data.
    return response;
}, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error.
    return Promise.reject(request_1.ExecuteRequestError.From(error));
});
/**
 * The S5 Client which can be used to access S5-net.
 */
class S5Client {
    /**
     * The S5 Client which can be used to access S5-net.
     *
     * @class
     * @param [initialPortalUrl] The initial portal URL to use to access S5, if specified. A request will be made to this URL to get the actual portal URL. To use the default portal while passing custom options, pass "".
     * @param [customOptions] Configuration for the client.
     */
    constructor(initialPortalUrl = "", customOptions = {}) {
        // Set methods (defined in other files).
        // Upload
        this.uploadFile = upload_1.uploadFile;
        this.uploadSmallFile = upload_1.uploadSmallFile;
        this.uploadSmallFileRequest = upload_1.uploadSmallFileRequest;
        this.uploadLargeFile = upload_1.uploadLargeFile;
        this.uploadLargeFileRequest = upload_1.uploadLargeFileRequest;
        this.uploadDirectory = upload_1.uploadDirectory;
        this.uploadDirectoryRequest = upload_1.uploadDirectoryRequest;
        // Download
        this.downloadFile = download_1.downloadFile;
        this.getCidUrl = download_1.getCidUrl;
        this.getMetadata = download_1.getMetadata;
        if (initialPortalUrl === "") {
            // Portal was not given, use the default portal URL. We'll still make a request for the resolved portal URL.
            initialPortalUrl = (0, url_1.defaultPortalUrl)();
        }
        else {
            // Portal was given, don't make the request for the resolved portal URL.
            this.customPortalUrl = (0, url_1.ensureUrl)(initialPortalUrl);
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
    async initPortalUrl() {
        if (this.customPortalUrl) {
            // Tried to make a request for the API portal URL when a custom URL was already provided.
            return;
        }
        // Try to resolve the portal URL again if it's never been called or if it
        // previously failed.
        if (!S5Client.resolvedPortalUrl) {
            S5Client.resolvedPortalUrl = this.resolvePortalUrl();
        }
        else {
            try {
                await S5Client.resolvedPortalUrl;
            }
            catch (e) {
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
    async portalUrl() {
        if (this.customPortalUrl) {
            return this.customPortalUrl;
        }
        // Make the request if needed and not done so.
        await this.initPortalUrl();
        return await S5Client.resolvedPortalUrl; // eslint-disable-line
    }
    /**
     * Creates and executes a request.
     *
     * @param config - Configuration for the request.
     * @returns - The response from axios.
     * @throws - Will throw `ExecuteRequestError` if the request fails. This error contains the original Axios error.
     */
    async executeRequest(config) {
        const url = await (0, request_1.buildRequestUrl)(this, {
            baseUrl: config.url,
            endpointPath: config.endpointPath,
            subdomain: config.subdomain,
            extraPath: config.extraPath,
            query: config.query,
        });
        // Build headers.
        const headers = (0, request_1.buildRequestHeaders)(config.headers, config.customUserAgent, config.customCookie, config.s5ApiKey);
        const auth = config.APIKey ? { username: "", password: config.APIKey } : undefined;
        let onDownloadProgress = undefined;
        if (config.onDownloadProgress) {
            onDownloadProgress = function (event) {
                // Avoid NaN for 0-byte file.
                /* istanbul ignore next: Empty file test doesn't work yet. */
                const progress = event.total ? event.loaded / event.total : 1;
                // @ts-expect-error TS complains even though we've ensured this is defined.
                config.onDownloadProgress(progress, event);
            };
        }
        let onUploadProgress = undefined;
        if (config.onUploadProgress) {
            onUploadProgress = function (event) {
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
            return await (0, axios_1.default)({
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
        }
        catch (e) {
            // If `loginFn` is set and we get an Unauthorized response...
            if (config.loginFn && e.responseStatus === 401) {
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
    async resolvePortalServerUrl() {
        const response = await this.executeRequest({
            ...this.customOptions,
            method: "head",
            url: this.initialPortalUrl,
        });
        if (!response.headers) {
            throw new Error("Did not get 'headers' in response despite a successful request. Please try again and report this issue to the devs if it persists.");
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
    async resolvePortalUrl() {
        const response = await this.executeRequest({
            ...this.customOptions,
            method: "head",
            url: this.initialPortalUrl,
        });
        if (!response.headers) {
            throw new Error("Did not get 'headers' in response despite a successful request. Please try again and report this issue to the devs if it persists.");
        }
        const portalUrl = response.headers["s5-portal-api"];
        if (!portalUrl) {
            throw new Error("Could not get portal URL for the given portal");
        }
        return portalUrl;
    }
}
exports.S5Client = S5Client;
