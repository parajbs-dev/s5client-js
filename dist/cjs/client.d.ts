import type { AxiosResponse, ResponseType, Method } from "axios";
import { uploadFile, uploadLargeFile, uploadDirectory, uploadDirectoryRequest, uploadSmallFile, uploadSmallFileRequest, uploadLargeFileRequest } from "./upload";
import { downloadFile, getCidUrl, getMetadata } from "./download";
import { Headers } from "./request";
/**
 * Custom client options.
 *
 * @property [APIKey] - Authentication password to use for a single S5 node.
 * @property [s5ApiKey] - Authentication API key to use for a S5 portal (sets the "S5-Api-Key" header).
 * @property [customUserAgent] - Custom user agent header to set.
 * @property [customCookie] - Custom cookie header to set. WARNING: the Cookie header cannot be set in browsers. This is meant for usage in server contexts.
 * @property [onDownloadProgress] - Optional callback to track download progress.
 * @property [onUploadProgress] - Optional callback to track upload progress.
 * @property [loginFn] - A function that, if set, is called when a 401 is returned from the request before re-trying the request.
 */
export type CustomClientOptions = {
    APIKey?: string;
    s5ApiKey?: string;
    customUserAgent?: string;
    customCookie?: string;
    onDownloadProgress?: (progress: number, event: ProgressEvent) => void;
    onUploadProgress?: (progress: number, event: ProgressEvent) => void;
    loginFn?: (config?: RequestConfig) => Promise<void>;
};
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
    data?: FormData | Record<string, unknown>;
    url?: string;
    method?: Method;
    headers?: Headers;
    subdomain?: string;
    query?: {
        [key: string]: string | undefined;
    };
    extraPath?: string;
    responseType?: ResponseType;
    transformRequest?: (data: unknown) => string;
    transformResponse?: (data: string) => Record<string, unknown>;
};
/**
 * The S5 Client which can be used to access S5-net.
 */
export declare class S5Client {
    customOptions: CustomClientOptions;
    protected initialPortalUrl: string;
    protected static resolvedPortalUrl?: Promise<string>;
    protected customPortalUrl?: string;
    uploadFile: typeof uploadFile;
    protected uploadSmallFile: typeof uploadSmallFile;
    protected uploadSmallFileRequest: typeof uploadSmallFileRequest;
    protected uploadLargeFile: typeof uploadLargeFile;
    protected uploadLargeFileRequest: typeof uploadLargeFileRequest;
    uploadDirectory: typeof uploadDirectory;
    protected uploadDirectoryRequest: typeof uploadDirectoryRequest;
    downloadFile: typeof downloadFile;
    getCidUrl: typeof getCidUrl;
    getMetadata: typeof getMetadata;
    /**
     * The S5 Client which can be used to access S5-net.
     *
     * @class
     * @param [initialPortalUrl] The initial portal URL to use to access S5, if specified. A request will be made to this URL to get the actual portal URL. To use the default portal while passing custom options, pass "".
     * @param [customOptions] Configuration for the client.
     */
    constructor(initialPortalUrl?: string, customOptions?: CustomClientOptions);
    /**
     * Make the request for the API portal URL.
     *
     * @returns - A promise that resolves when the request is complete.
     */
    initPortalUrl(): Promise<void>;
    /**
     * Returns the API portal URL. Makes the request to get it if not done so already.
     *
     * @returns - the portal URL.
     */
    portalUrl(): Promise<string>;
    /**
     * Creates and executes a request.
     *
     * @param config - Configuration for the request.
     * @returns - The response from axios.
     * @throws - Will throw `ExecuteRequestError` if the request fails. This error contains the original Axios error.
     */
    executeRequest(config: RequestConfig): Promise<AxiosResponse>;
    /**
     * Gets the current server URL for the portal. You should generally use
     * `portalUrl` instead - this method can be used for detecting whether the
     * current URL is a server URL.
     *
     * @returns - The portal server URL.
     */
    protected resolvePortalServerUrl(): Promise<string>;
    /**
     * Make a request to resolve the provided `initialPortalUrl`.
     *
     * @returns - The portal URL.
     */
    protected resolvePortalUrl(): Promise<string>;
}
//# sourceMappingURL=client.d.ts.map