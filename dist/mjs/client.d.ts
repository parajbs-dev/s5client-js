import type { AxiosResponse } from "axios";
import { CustomClientOptions, RequestConfig } from "./defaults";
import { getAllInfosFromCid, convertDownloadDirectoryInputCid, convertB58btcToB32rfcCid, convertS5CidToMHashB64url, convertS5CidToB3hashHex, addUrlSubdomain } from "s5-utils-js";
import { deleteCid } from "./delete";
import { pinCid } from "./pin";
import { downloadData, downloadFile, downloadDirectory, getCidUrl, getMetadata, getStorageLocations, getDownloadUrls } from "./download";
import { uploadFromUrl, uploadData, uploadFile, uploadLargeFile, uploadDirectory, uploadDirectoryRequest, uploadWebapp, uploadWebappRequest, uploadSmallFile, uploadSmallFileRequest, uploadLargeFileRequest } from "./upload";
/**
 * The S5 Client which can be used to access S5-net.
 */
export declare class S5Client {
    customOptions: CustomClientOptions;
    protected initialPortalUrl: string;
    protected static resolvedPortalUrl?: Promise<string>;
    protected customPortalUrl?: string;
    uploadFromUrl: typeof uploadFromUrl;
    uploadData: typeof uploadData;
    uploadFile: typeof uploadFile;
    protected uploadSmallFile: typeof uploadSmallFile;
    protected uploadSmallFileRequest: typeof uploadSmallFileRequest;
    protected uploadLargeFile: typeof uploadLargeFile;
    protected uploadLargeFileRequest: typeof uploadLargeFileRequest;
    uploadDirectory: typeof uploadDirectory;
    protected uploadDirectoryRequest: typeof uploadDirectoryRequest;
    uploadWebapp: typeof uploadWebapp;
    protected uploadWebappRequest: typeof uploadWebappRequest;
    deleteCid: typeof deleteCid;
    pinCid: typeof pinCid;
    downloadData: typeof downloadData;
    downloadFile: typeof downloadFile;
    downloadDirectory: typeof downloadDirectory;
    getCidUrl: typeof getCidUrl;
    getMetadata: typeof getMetadata;
    getStorageLocations: typeof getStorageLocations;
    getDownloadUrls: typeof getDownloadUrls;
    tools: {
        convertB58btcToB32rfcCid: typeof convertB58btcToB32rfcCid;
        addUrlSubdomain: typeof addUrlSubdomain;
        convertS5CidToMHashB64url: typeof convertS5CidToMHashB64url;
        convertDownloadDirectoryInputCid: typeof convertDownloadDirectoryInputCid;
        getAllInfosFromCid: typeof getAllInfosFromCid;
        convertS5CidToB3hashHex: typeof convertS5CidToB3hashHex;
    };
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