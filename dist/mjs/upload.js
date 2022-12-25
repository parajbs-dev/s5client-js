import { Upload } from "tus-js-client";
import * as blake3 from "blake3-wasm";
import { Buffer } from "buffer";
import { getFileMimeType } from "./utils/file";
import { DEFAULT_BASE_OPTIONS } from "./utils/options";
import { buildRequestHeaders, buildRequestUrl } from "./request";
import { mhashBlake3Default, cidTypeRaw } from "./constants";
/**
 * The tus chunk size is (4MiB - encryptionOverhead) * dataPieces, set as default.
 */
export const TUS_CHUNK_SIZE = (1 << 22) * 8;
/**
 * The retry delays, in ms. Data is stored in skyd for up to 20 minutes, so the
 * total delays should not exceed that length of time.
 */
const DEFAULT_TUS_RETRY_DELAYS = [0, 5000, 15000, 60000, 300000, 600000];
/**
 * The portal file field name.
 */
const PORTAL_FILE_FIELD_NAME = "file";
export const DEFAULT_UPLOAD_OPTIONS = {
    ...DEFAULT_BASE_OPTIONS,
    endpointUpload: "/s5/upload",
    endpointDirectoryUpload: "/s5/upload/directory",
    endpointLargeUpload: "/s5/upload/tus",
    customFilename: "",
    errorPages: { 404: "/404.html" },
    tryFiles: ["index.html"],
    // Large files.
    largeFileSize: TUS_CHUNK_SIZE,
    retryDelays: DEFAULT_TUS_RETRY_DELAYS,
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
export async function uploadFile(file, customOptions) {
    const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    if (file.size < opts.largeFileSize) {
        return this.uploadSmallFile(file, opts);
    }
    else {
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
export async function uploadSmallFile(file, customOptions) {
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
export async function uploadSmallFileRequest(file, customOptions) {
    const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const formData = new FormData();
    file = ensureFileObjectConsistency(file);
    if (opts.customFilename) {
        formData.append(PORTAL_FILE_FIELD_NAME, file, opts.customFilename);
    }
    else {
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
export async function uploadLargeFile(file, customOptions) {
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
export async function uploadLargeFileRequest(file, customOptions) {
    const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    // Validation.
    const url = await buildRequestUrl(this, { endpointPath: opts.endpointLargeUpload });
    const headers = buildRequestHeaders(undefined, opts.customUserAgent, opts.customCookie, opts.s5ApiKey);
    file = ensureFileObjectConsistency(file);
    let filename = file.name;
    if (opts.customFilename) {
        filename = opts.customFilename;
    }
    const onProgress = opts.onUploadProgress &&
        function (bytesSent, bytesTotal) {
            const progress = bytesSent / bytesTotal;
            // @ts-expect-error TS complains.
            opts.onUploadProgress(progress, { loaded: bytesSent, total: bytesTotal });
        };
    await blake3.load();
    const hasher = blake3.createHash();
    const chunkSize = 1024 * 1024;
    let position = 0;
    while (position <= file.size) {
        const chunk = file.slice(position, position + chunkSize);
        hasher.update(await chunk.arrayBuffer());
        position += chunkSize;
    }
    const b3hash = hasher.digest();
    const hash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), Buffer.from(b3hash)]);
    const cid = Buffer.concat([Buffer.alloc(1, cidTypeRaw), hash, numberToBuffer(file.size)]);
    /**
     * convert a number to Buffer.
     *
     * @param value - File objects to upload, indexed by their path strings.
     * @returns - The returned cid.
     * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
     */
    function numberToBuffer(value) {
        const view = Buffer.alloc(16);
        let lastIndex = 15;
        for (let index = 0; index <= 15; ++index) {
            if (value % 256 !== 0) {
                lastIndex = index;
            }
            view[index] = value % 256;
            value = value >> 8;
        }
        return view.subarray(0, lastIndex + 1);
    }
    return new Promise((resolve, reject) => {
        const tusOpts = {
            endpoint: url,
            //      retryDelays: opts.retryDelays,
            metadata: {
                hash: hash.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace("=", ""),
                filename,
                filetype: file.type,
            },
            headers,
            onProgress,
            onBeforeRequest: function (req) {
                const xhr = req.getUnderlyingObject();
                xhr.withCredentials = true;
            },
            onError: (error) => {
                // Return error body rather than entire error.
                const res = error.originalResponse;
                const newError = res ? new Error(res.getBody().trim()) || error : error;
                reject(newError);
            },
            onSuccess: async () => {
                if (!upload.url) {
                    reject(new Error("'upload.url' was not set"));
                    return;
                }
                const resCid = "u" + cid.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace("=", "");
                const resolveData = { data: { cid: resCid } };
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
 * @param filename - The name of the directory.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath="/s5/upload/directory"] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
export async function uploadDirectory(directory, filename, customOptions) {
    const response = await this.uploadDirectoryRequest(directory, filename, customOptions);
    const responsedS5Cid = { cid: response.data.cid };
    return responsedS5Cid;
}
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
export async function uploadDirectoryRequest(directory, filename, customOptions) {
    const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const formData = new FormData();
    Object.entries(directory).forEach(([path, file]) => {
        file = ensureFileObjectConsistency(file);
        formData.append(path, file, path);
    });
    const query = { filename };
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
 * Sometimes file object might have had the type property defined manually with
 * Object.defineProperty and some browsers (namely firefox) can have problems
 * reading it after the file has been appended to form data. To overcome this,
 * we recreate the file object using native File constructor with a type defined
 * as a constructor argument.
 *
 * @param file - The input file.
 * @returns - The processed file.
 */
function ensureFileObjectConsistency(file) {
    return new File([file], file.name, { type: getFileMimeType(file) });
}
