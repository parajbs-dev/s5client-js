import { AxiosResponse } from "axios";
import {
  DetailedError,
  HttpRequest,
  Upload,
  FileSource,
  SliceResult,
  FileReader as TusFileReader,
} from "tus-js-client";

import { S5Client } from "./client";
import { Buffer } from "buffer";

import * as blake3 from "blake3-wasm";

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
  encodeCIDWithPrefixZ,
  calculateB3hashFromFile,
  getFileMimeType,
  generateCIDFromMHash,
  generateMHashFromB3hash,
  convertMHashToB64url,
  cidTypeEncrypted,
  mhashBlake3Default,
  encryptionAlgorithmXChaCha20Poly1305,
} from "s5-utils-js";

import __wbg_init, { encrypt_file_xchacha20, generate_key } from "../encrypt_file/pkg/encrypt_file";

// Might want to add this for export from s5-utils-js
const chunkSizeAsPowerOf2 = 18;

export async function calculateB3hashFromFileEncrypt(
  file: File,
  encryptedKey: Uint8Array
): Promise<{ b3hash: Buffer; encryptedFileSize: number }> {
  // Load the BLAKE3 library asynchronously
  await blake3.load();

  // Create a hash object
  const hasher = blake3.createHash();

  // Define the chunk size (1 MB)
  const chunkSize = 262144; // 1024 * 1024;
  // Initialize the position to 0
  let position = 0;
  let encryptedFileSize = 0;

  // Process the file in chunks
  while (position <= file.size) {
    // Slice the file to extract a chunk
    const chunk = file.slice(position, position + chunkSize);

    // Convert chunk's ArrayBuffer to hex string and log it
    const chunkArrayBuffer = await chunk.arrayBuffer();
    const chunkUint8Array = new Uint8Array(chunkArrayBuffer);
    const encryptedChunkUint8Array = encrypt_file_xchacha20(chunkUint8Array, encryptedKey, 0x0);
    encryptedFileSize += encryptedChunkUint8Array.length;

    // Update the hash with the chunk's data
    hasher.update(encryptedChunkUint8Array);

    // Move to the next position
    position += chunkSize;
  }

  // Obtain the final hash value
  const b3hash = hasher.digest();
  // Return the hash value as a Promise resolved to a Buffer
  return { b3hash: b3hash, encryptedFileSize };
}

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

function removeKeyFromEncryptedCid(encryptedCid: string): string {
  return encryptedCid.slice(0, -96) + encryptedCid.slice(-53);
}

export function combineKeytoEncryptedCid(key: string, encryptedCidWithoutKey: string): string {
  return encryptedCidWithoutKey.slice(0, -54) + key + encryptedCidWithoutKey.slice(-53);
}

/**
 * Creates an encrypted Content Identifier (CID) from the provided parameters.
 *
 * @param cidTypeEncrypted - The encrypted type of the CID.
 * @param encryptionAlgorithm - The encryption algorithm used.
 * @param chunkSizeAsPowerOf2 - The chunk size as a power of 2.
 * @param encryptedBlobHash - The encrypted hash of the blob.
 * @param encryptionKey - The encryption key used.
 * @param padding - Additional padding to be used.
 * @param originalCid - The original CID before encryption.
 * @returns A Uint8Array representing the encrypted CID.
 */
function createEncryptedCid(
  cidTypeEncrypted: number,
  encryptionAlgorithm: number,
  chunkSizeAsPowerOf2: number,
  encryptedBlobHash: Uint8Array,
  encryptionKey: Uint8Array,
  padding: number,
  originalCid: Uint8Array
): Uint8Array {
  let result: number[] = [];
  result.push(cidTypeEncrypted);
  result.push(encryptionAlgorithm);
  result.push(chunkSizeAsPowerOf2);
  result.push(...Array.from(encryptedBlobHash));
  result.push(...Array.from(encryptionKey));
  result.push(...Array.from(new Uint8Array(new Uint32Array([padding]).buffer))); // convert padding to big-endian
  result.push(...Array.from(originalCid));

  return new Uint8Array(result);
}

/**
Encrypts a file using a specified encryption key and CID. This function
first reads the input file and converts it into a Uint8Array format.
It then initializes a WebAssembly (WASM) module and calls an encryption
function to encrypt the file content. The encrypted file content is then
converted back into a Blob and then into a File object.
It also computes the encrypted blob hash, constructs the encrypted CID,
and returns the encrypted file along with the encrypted CID.
@param file - The file to be encrypted.
@param filename - The name of the file.
@param encryptedKey - The encryption key to be used.
@param cid - The Content Identifier of the file.
@returns A promise that resolves with an object containing the encrypted file
and the encrypted CID.
*/
async function encryptFile(
  file: File,
  filename: string,
  encryptedKey: Uint8Array,
  cid: Buffer
): Promise<{
  encryptedFile: File;
  encryptedCid: string;
  //  encryptedBlobMHashBase64url: string;
}> {
  // Convert the File object to a Uint8Array
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  await new Promise((resolve) => {
    reader.onload = (event) => {
      resolve(event);
    };
  });
  const fileContents = new Uint8Array(reader.result as ArrayBuffer);

  // Call the function to encrypt the file
  const encryptedFileBytes = encrypt_file_xchacha20(fileContents, encryptedKey, 0x0);

  // Convert Uint8Array to Blob
  const blob = new Blob([encryptedFileBytes], { type: "application/octet-stream" });

  // Convert Blob to File
  const encryptedFile = new File([blob], filename, { type: "application/octet-stream", lastModified: Date.now() });

  const { b3hash } = await calculateB3hashFromFileEncrypt(file, encryptedKey);

  const encryptedBlobHash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), Buffer.from(b3hash)]);

  const padding: number = 0;

  const encryptedCidBytes = createEncryptedCid(
    cidTypeEncrypted,
    encryptionAlgorithmXChaCha20Poly1305,
    chunkSizeAsPowerOf2,
    encryptedBlobHash,
    encryptedKey,
    padding,
    cid
  );

  const encryptedCid = "u" + convertMHashToB64url(Buffer.from(encryptedCidBytes));

  return {
    encryptedFile,
    encryptedCid,
  };
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

  let responsedS5Cid;
  if (customOptions?.encrypt) {
    responsedS5Cid = { cid: response.data.cid, key: response.data.key, cidWithoutKey: response.data.cidWithKey };
  } else {
    responsedS5Cid = { cid: response.data.cid };
  }
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

  const b3hash = await calculateB3hashFromFile(file);
  const mhash = generateMHashFromB3hash(b3hash);
  const cid = generateCIDFromMHash(mhash, file);

  // If customOptions.encrypt is true, encrypt the file before uploading.
  let encryptedFile: File;
  let encryptedCid: string;

  // Initialize the WASM module
  await __wbg_init();

  const encryptedKey = generate_key();

  let response: AxiosResponse;
  if (opts.encrypt) {
    ({ encryptedFile, encryptedCid } = await encryptFile(file, file.name, encryptedKey, cid));
    encryptedFile = ensureFileObjectConsistency(encryptedFile);

    if (opts.customFilename) {
      formData.append(PORTAL_FILE_FIELD_NAME, encryptedFile, opts.customFilename);
    } else {
      formData.append(PORTAL_FILE_FIELD_NAME, encryptedFile);
    }

    response = await this.executeRequest({
      ...opts,
      endpointPath: opts.endpointUpload,
      method: "post",
      data: formData,
    });

    response.data.cid = encryptedCid;
    response.data["key"] = encryptedKey;
    response.data["cidWithoutKey"] = removeKeyFromEncryptedCid(encryptedCid);
  } else {
    file = ensureFileObjectConsistency(file);
    if (opts.customFilename) {
      formData.append(PORTAL_FILE_FIELD_NAME, file, opts.customFilename);
    } else {
      formData.append(PORTAL_FILE_FIELD_NAME, file);
    }

    response = await this.executeRequest({
      ...opts,
      endpointPath: opts.endpointUpload,
      method: "post",
      data: formData,
    });
  }

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

function getReaderFromFile(file: File): ReadableStreamDefaultReader<Uint8Array> {
  if (!file) {
    throw new Error("No file chosen");
  }

  const reader = file.stream().getReader();
  const stream = new ReadableStream({
    start(controller) {
      // The following function handles each data chunk
      function push() {
        // "done" is a Boolean and value a "Uint8Array"
        reader.read().then(({ done, value }) => {
          // Is there no more data to read?
          if (done) {
            // Tell the browser that we have finished sending data
            controller.close();
            return;
          }

          // Get the data and send it to the browser via the controller
          controller.enqueue(value);
          push();
        });
      }

      push();
    },
  });

  // Now you can use the stream as you see fit
  // Here's an example of creating a new Response from the stream
  new Response(stream, { headers: { "Content-Type": file.type } });

  return reader;
}

/**
Creates a ReadableStreamDefaultReader from an encrypted file. This function
first gets a reader from the input file's stream. It then creates a new
readable stream where the encryption is applied to each chunk of data read
from the original reader. The function uses the WASM module and the
encryption function to encrypt the chunks. Encrypted chunks are then
enqueued in the new stream's controller. When the original reader is done,
any remaining data in the buffer is also encrypted and enqueued. Finally,
the function returns a reader from the new stream.
@param file - The file to be encrypted.
@param key - The encryption key to be used.
@returns A ReadableStreamDefaultReader of the encrypted file chunks.
*/
function getReaderFromFileEncrypt(file: File, key: Uint8Array): ReadableStreamDefaultReader<Uint8Array> {
  const originalReader = file.stream().getReader();
  const chunkSize = 262144; // Chunk size in bytes

  const modifiedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = new Uint8Array(0);

      while (true) {
        const { done, value } = await originalReader.read();

        // Check if done, if so process remaining buffer and break
        if (done) {
          if (buffer.length > 0) {
            const encryptedChunkUint8Array = encrypt_file_xchacha20(buffer, key, 0x0);
            controller.enqueue(encryptedChunkUint8Array);
          }
          controller.close();
          return;
        }

        // If value is not undefined, append the new data to the buffer
        if (value) {
          let newBuffer = new Uint8Array(buffer.length + value.length);
          newBuffer.set(buffer);
          newBuffer.set(value, buffer.length);
          buffer = newBuffer;
        }

        while (buffer.length >= chunkSize) {
          // If the buffer is large enough, encrypt and enqueue the data
          const chunk = buffer.slice(0, chunkSize);
          const encryptedChunkUint8Array = encrypt_file_xchacha20(chunk, key, 0x0);
          controller.enqueue(encryptedChunkUint8Array);

          // Create a new buffer with any remaining data
          buffer = buffer.slice(chunkSize);
        }
      }
    },
  });

  return modifiedStream.getReader();
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

  let mHashBase64url: string;
  let zCid: string;
  let encryptedBlobMHashBase64url: string;
  let encryptedCid: string;
  let encryptedKey: Uint8Array;

  let fileEncryptSize: number;
  if (opts.encrypt) {
    // Initialize the WASM module
    await __wbg_init();

    encryptedKey = generate_key();

    const { b3hash: b3hashEncrypt, encryptedFileSize } = await calculateB3hashFromFileEncrypt(file, encryptedKey);

    fileEncryptSize = encryptedFileSize;

    const encryptedBlobHash = generateMHashFromB3hash(b3hashEncrypt);
    encryptedBlobMHashBase64url = convertMHashToB64url(encryptedBlobHash);

    const padding: number = 0;

    const cid = generateCIDFromMHash(mhash, file);

    const encryptedCidBytes = createEncryptedCid(
      cidTypeEncrypted,
      encryptionAlgorithmXChaCha20Poly1305,
      chunkSizeAsPowerOf2,
      encryptedBlobHash,
      encryptedKey,
      padding,
      cid
    );

    encryptedCid = "u" + convertMHashToB64url(Buffer.from(encryptedCidBytes));
  } else {
    const cid = generateCIDFromMHash(mhash, file);
    mHashBase64url = convertMHashToB64url(mhash);
    zCid = encodeCIDWithPrefixZ(cid);
  }

  return new Promise(async (resolve, reject) => {
    const tusOpts = {
      endpoint: url,
      metadata: opts.encrypt
        ? {
            hash: encryptedBlobMHashBase64url,
            filename,
            filetype: `application/octet-stream`,
          }
        : {
            hash: mHashBase64url,
            filename,
            filetype: file.type,
          },
      //      fileReader: myFileReader,
      headers,
      chunkSize: 262144,
      uploadSize: fileEncryptSize,
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

        let resCid: string;

        if (opts.encrypt) resCid = encryptedCid;
        else resCid = zCid;

        const encryptedCidWithoutKey = opts.encrypt ? removeKeyFromEncryptedCid(encryptedCid) : "";
        const encryptedKey64 = opts.encrypt ? convertMHashToB64url(Buffer.from(encryptedKey)) : "";

        const resolveData = { data: { cid: resCid, key: encryptedKey64, cidWithoutKey: encryptedCidWithoutKey } };
        resolve(resolveData);
      },
    };

    const reader = getReaderFromFileEncrypt(file, encryptedKey);

    let upload: Upload;
    if (opts.encrypt) upload = new Upload(reader, tusOpts);
    else upload = new Upload(file, tusOpts);

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
