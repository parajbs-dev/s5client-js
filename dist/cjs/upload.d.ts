import { AxiosResponse } from "axios";
import { BaseCustomOptions } from "./utils/options";
import { S5Client } from "./client";
import { JsonData } from "./utils/types";
/**
 * The tus chunk size is (4MiB - encryptionOverhead) * dataPieces, set as default.
 */
export declare const TUS_CHUNK_SIZE: number;
/**
 * Custom upload options.
 *
 * @property [endpointUpload] - The relative URL path of the portal endpoint to contact.
 * @property [endpointDirectoryUpload] - The relative URL path of the portal endpoint to contact for Directorys.
 * @property [endpointLargeUpload] - The relative URL path of the portal endpoint to contact for large uploads.
 * @property [customFilename] - The custom filename to use when uploading files.
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
    errorPages?: JsonData;
    tryFiles?: string[];
    largeFileSize?: number;
    retryDelays?: number[];
};
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
    data: {
        cid: string;
    };
};
export declare const DEFAULT_UPLOAD_OPTIONS: {
    endpointUpload: string;
    endpointDirectoryUpload: string;
    endpointLargeUpload: string;
    customFilename: string;
    errorPages: {
        404: string;
    };
    tryFiles: string[];
    largeFileSize: number;
    retryDelays: number[];
    APIKey: string;
    s5ApiKey: string;
    customUserAgent: string;
    customCookie: string;
    onDownloadProgress: undefined;
    onUploadProgress: undefined;
    loginFn: undefined;
};
/**
 * Uploads a file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointUpload="/s5/upload"] - The relative URL path of the portal endpoint to contact for small uploads.
 * @param [customOptions.endpointDirectoryUpload="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact for Directory uploads.
 * @param [customOptions.endpointLargeUpload="/s5/upload/tus"] - The relative URL path of the portal endpoint to contact for large uploads.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadFile(this: S5Client, file: File, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Uploads a small file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointUpload="/s5/upload"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadSmallFile(this: S5Client, file: File, customOptions: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Makes a request to upload a small file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
export declare function uploadSmallFileRequest(this: S5Client, file: File, customOptions?: CustomUploadOptions): Promise<AxiosResponse>;
/**
 * Uploads a large file to S5-net using tus.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointLargeUpload="/s5/upload/tus"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadLargeFile(this: S5Client, file: File, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Makes a request to upload a file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointLargeUpload="/s5/upload/tus"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
export declare function uploadLargeFileRequest(this: S5Client, file: File, customOptions?: CustomUploadOptions): Promise<UploadTusRequestResponse>;
/**
 * Uploads a directory to S5-net.
 *
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param filename - The name of the directory.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadDirectory(this: S5Client, directory: Record<string, File>, filename: string, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Makes a request to upload a directory to S5-net.
 *
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param filename - The name of the directory.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 * @throws - Will throw if the input filename is not a string.
 */
export declare function uploadDirectoryRequest(this: S5Client, directory: Record<string, File>, filename: string, customOptions?: CustomUploadOptions): Promise<AxiosResponse>;
//# sourceMappingURL=upload.d.ts.map