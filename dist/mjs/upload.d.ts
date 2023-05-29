import { AxiosResponse } from "axios";
import { S5Client } from "./client";
import { CustomUploadOptions, UploadRequestResponse, UploadTusRequestResponse, CustomUploadFromUrlOptions, UploadFromUrlResponse } from "./defaults";
/**
 * Uploads a file from a URL.
 *
 * @param this - The instance of the S5Client class.
 * @param dataurl - The URL of the file to be uploaded.
 * @param customOptions - Optional custom upload options.
 * @returns A promise that resolves to the AxiosResponse object representing the upload response.
 */
export declare function uploadFromUrl(this: S5Client, dataurl: string, customOptions?: CustomUploadFromUrlOptions): Promise<UploadFromUrlResponse>;
/**
 * Uploads data to S5-net.
 *
 * @param this - S5Client
 * @param data - The data to upload.
 * @param filename - The name of uploaded Data file.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadData(this: S5Client, data: Uint8Array | ArrayBuffer, filename: string, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Creates a File object from the provided data, file name, and file type.
 *
 * @param data - The data of the file, which can be a string, an ArrayBuffer, or a Uint8Array.
 * @param fileName - The name of the file.
 * @param fileType - The type (MIME type) of the file.
 * @returns A File object representing the file.
 */
export declare function createFileFromData(data: string | ArrayBuffer | Uint8Array, fileName: string, fileType: string): File;
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
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadDirectory(this: S5Client, directory: Record<string, File>, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Makes a request to upload a directory to S5-net.
 *
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 * @throws - Will throw if the input filename is not a string.
 */
export declare function uploadDirectoryRequest(this: S5Client, directory: Record<string, File>, customOptions?: CustomUploadOptions): Promise<AxiosResponse>;
/**
 * Uploads a directory to S5-net.
 *
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export declare function uploadWebapp(this: S5Client, directory: Record<string, File>, customOptions?: CustomUploadOptions): Promise<UploadRequestResponse>;
/**
 * Makes a request to upload a directory to S5-net.
 *
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 * @throws - Will throw if the input filename is not a string.
 */
export declare function uploadWebappRequest(this: S5Client, directory: Record<string, File>, customOptions?: CustomUploadOptions): Promise<AxiosResponse>;
//# sourceMappingURL=upload.d.ts.map