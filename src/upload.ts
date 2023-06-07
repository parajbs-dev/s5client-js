import { AxiosResponse } from "axios";
import { DetailedError, HttpRequest, Upload } from "tus-js-client";

import { S5Client } from "./client";

import {
  PORTAL_FILE_FIELD_NAME,
  DEFAULT_DIRECTORY_NAME,
  CustomUploadOptions,
  UploadRequestResponse,
  UploadTusRequestResponse,
  DEFAULT_UPLOAD_OPTIONS,
  DEFAULT_UPLOAD_FROM_URL_OPTIONS,
  CustomUploadFromUrlOptions,
  UploadFromUrlResponse,
} from "./defaults";
import { buildRequestHeaders, buildRequestUrl } from "./request";

import {
  generateCIDFromMHash,
  encodeCIDWithPrefixZ,
  calculateB3hashFromFile,
  getFileMimeType,
  generateMHashFromB3hash,
  convertMHashToB64url,
} from "s5-utils-js";

/**
 * Uploads a file from a URL.
 *
 * @param this - The instance of the S5Client class.
 * @param dataurl - The URL of the file to be uploaded.
 * @param customOptions - Optional custom upload options.
 * @returns A promise that resolves to the AxiosResponse object representing the upload response.
 */
export async function uploadFromUrl(
  this: S5Client,
  dataurl: string,
  customOptions?: CustomUploadFromUrlOptions
): Promise<UploadFromUrlResponse> {
  // Merge the default upload options, custom options from the instance, and any provided custom options
  const opts = { ...DEFAULT_UPLOAD_FROM_URL_OPTIONS, ...this.customOptions, ...customOptions };

  const query: { [key: string]: string | undefined } = { url: dataurl };

  // Execute the request to upload from the URL
  const response = await this.executeRequest({
    ...opts,
    endpointPath: opts.endpointUploadFromUrl,
    method: "post",
    query,
  });

  return response.data;
}

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
export async function uploadData(
  this: S5Client,
  data: Uint8Array | ArrayBuffer,
  filename: string,
  customOptions?: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };

  let sizeInBytes: number;
  let arrayBuffer: ArrayBuffer | undefined;

  if (typeof data === "string") {
    arrayBuffer = new TextEncoder().encode(data).buffer;
    sizeInBytes = arrayBuffer.byteLength;
  } else if (ArrayBuffer.isView(data)) {
    arrayBuffer = data.buffer;
    sizeInBytes = data.byteLength;
  } else if (data instanceof ArrayBuffer) {
    arrayBuffer = data;
    sizeInBytes = arrayBuffer.byteLength;
  } else {
    throw new Error(`Unsupported data type: ${typeof data}`);
  }

  const fileType = "text/plain";

  const file = createFileFromData(data, filename, fileType);

  if (sizeInBytes < opts.largeFileSize) {
    return await this.uploadSmallFile(file, opts);
  }
  return await this.uploadLargeFile(file, opts);
}

/**
 * Creates a File object from the provided data, file name, and file type.
 *
 * @param data - The data of the file, which can be a string, an ArrayBuffer, or a Uint8Array.
 * @param fileName - The name of the file.
 * @param fileType - The type (MIME type) of the file.
 * @returns A File object representing the file.
 */
export function createFileFromData(data: string | ArrayBuffer | Uint8Array, fileName: string, fileType: string): File {
  let file: File;
  const blobData: BlobPart[] = [data];
  const options: BlobPropertyBag = { type: fileType };
  const blob = new Blob(blobData, options);

  if (typeof data === "string") {
    file = new File([blob], fileName);
  } else {
    file = new File([blob], fileName, { type: fileType });
  }

  return file;
}

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
export async function uploadFile(
  this: S5Client,
  file: File,
  customOptions?: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };

  if (file.size < opts.largeFileSize) {
    return this.uploadSmallFile(file, opts);
  } else {
    return this.uploadLargeFile(file, opts);
  }
}

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
export async function uploadSmallFile(
  this: S5Client,
  file: File,
  customOptions: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const response = await this.uploadSmallFileRequest(file, customOptions);

  const responsedS5Cid = { cid: response.data.cid };
  return responsedS5Cid;
}

/**
 * Makes a request to upload a small file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
export async function uploadSmallFileRequest(
  this: S5Client,
  file: File,
  customOptions?: CustomUploadOptions
): Promise<AxiosResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
  const formData = new FormData();

  file = ensureFileObjectConsistency(file);
  if (opts.customFilename) {
    formData.append(PORTAL_FILE_FIELD_NAME, file, opts.customFilename);
  } else {
    formData.append(PORTAL_FILE_FIELD_NAME, file);
  }

  const response = await this.executeRequest({
    ...opts,
    endpointPath: opts.endpointUpload,
    method: "post",
    data: formData,
  });

  return response;
}

/* istanbul ignore next */
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
export async function uploadLargeFile(
  this: S5Client,
  file: File,
  customOptions?: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const response = await this.uploadLargeFileRequest(file, customOptions);

  const responsedS5Cid = response.data;
  return responsedS5Cid;
}

/* istanbul ignore next */
/**
 * Makes a request to upload a file to S5-net.
 *
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointLargeUpload="/s5/upload/tus"] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
export async function uploadLargeFileRequest(
  this: S5Client,
  file: File,
  customOptions?: CustomUploadOptions
): Promise<UploadTusRequestResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };

  // Validation.
  const urlReq = await buildRequestUrl(this, { endpointPath: opts.endpointLargeUpload });
  const url = `${urlReq}${opts.authToken ? `?auth_token=${opts.authToken}` : ""}`;
  const headers = buildRequestHeaders(undefined, opts.customUserAgent, opts.customCookie, opts.s5ApiKey);

  file = ensureFileObjectConsistency(file);
  let filename = file.name;
  if (opts.customFilename) {
    filename = opts.customFilename;
  }

  const onProgress =
    opts.onUploadProgress &&
    function (bytesSent: number, bytesTotal: number) {
      const progress = bytesSent / bytesTotal;

      // @ts-expect-error TS complains.
      opts.onUploadProgress(progress, { loaded: bytesSent, total: bytesTotal });
    };

  const b3hash = await calculateB3hashFromFile(file);
  const mhash = generateMHashFromB3hash(b3hash);
  const cid = generateCIDFromMHash(mhash, file);

  const mHashBase64url = convertMHashToB64url(mhash);
  const zCid = encodeCIDWithPrefixZ(cid);

  return new Promise((resolve, reject) => {
    const tusOpts = {
      endpoint: url,
      metadata: {
        hash: mHashBase64url,
        filename,
        filetype: file.type,
      },
      headers,
      onProgress,
      onBeforeRequest: function (req: HttpRequest) {
        const xhr = req.getUnderlyingObject();
        xhr.withCredentials = true;
      },
      onError: (error: Error | DetailedError) => {
        // Return error body rather than entire error.
        const res = (error as DetailedError).originalResponse;
        const newError = res ? new Error(res.getBody().trim()) || error : error;
        reject(newError);
      },
      onSuccess: async () => {
        if (!upload.url) {
          reject(new Error("'upload.url' was not set"));
          return;
        }

        const resolveData = { data: { cid: zCid } };
        resolve(resolveData);
      },
    };

    const upload = new Upload(file, tusOpts);
    upload.start();
  });
}

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
export async function uploadDirectory(
  this: S5Client,
  directory: Record<string, File>,
  customOptions?: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const response = await this.uploadDirectoryRequest(directory, customOptions);

  const responsedS5Cid = { cid: response.data.cid };
  return responsedS5Cid;
}

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
export async function uploadDirectoryRequest(
  this: S5Client,
  directory: Record<string, File>,
  customOptions?: CustomUploadOptions
): Promise<AxiosResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };

  const formData = new FormData();
  Object.entries(directory).forEach(([path, file]) => {
    file = ensureFileObjectConsistency(file as File);
    formData.append(path, file as File, path);
  });

  let dirname;
  if (opts.customDirname != null) {
    dirname = DEFAULT_DIRECTORY_NAME;
  }
  const dirName = opts.customDirname || dirname;

  const query: { [key: string]: string | undefined } = { name: dirName };
  if (opts.tryFiles) {
    query.tryfiles = JSON.stringify(opts.tryFiles);
  }
  if (opts.errorPages) {
    query.errorpages = JSON.stringify(opts.errorPages);
  }

  const response = await this.executeRequest({
    ...opts,
    endpointPath: opts.endpointDirectoryUpload,
    method: "post",
    data: formData,
    query,
  });

  return response;
}

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
export async function uploadWebapp(
  this: S5Client,
  directory: Record<string, File>,
  customOptions?: CustomUploadOptions
): Promise<UploadRequestResponse> {
  const response = await this.uploadWebappRequest(directory, customOptions);

  const responsedS5Cid = { cid: response.data.cid };
  return responsedS5Cid;
}

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
export async function uploadWebappRequest(
  this: S5Client,
  directory: Record<string, File>,
  customOptions?: CustomUploadOptions
): Promise<AxiosResponse> {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };

  const formData = new FormData();
  Object.entries(directory).forEach(([path, file]) => {
    file = ensureFileObjectConsistency(file as File);
    formData.append(path, file as File, path);
  });

  let dirname;
  if (opts.customDirname != null) {
    dirname = DEFAULT_DIRECTORY_NAME;
  }
  const dirName = opts.customDirname || dirname;

  const query: { [key: string]: string | undefined } = { name: dirName };
  if (opts.tryFiles) {
    query.tryfiles = JSON.stringify(opts.tryFiles);
  } else {
    query.tryfiles = JSON.stringify(["index.html"]);
  }

  if (opts.errorPages) {
    query.errorpages = JSON.stringify(opts.errorPages);
  } else {
    query.errorpages = JSON.stringify({ 404: "/404.html" });
  }

  const response = await this.executeRequest({
    ...opts,
    endpointPath: opts.endpointDirectoryUpload,
    method: "post",
    data: formData,
    query,
  });

  return response;
}

/**
 * Sometimes file object might have had the type property defined manually with
 * Object.defineProperty and some browsers (namely firefox) can have problems
 * reading it after the file has been appended to form data. To overcome this,
 * we recreate the file object using native File constructor with a type defined
 * as a constructor argument.
 *
 * @param file - The input file.
 * @returns - The processed file.
 */
function ensureFileObjectConsistency(file: File): File {
  return new File([file], file.name, { type: getFileMimeType(file) });
}
