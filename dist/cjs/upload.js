"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDirectoryRequest = exports.uploadDirectory = exports.uploadLargeFileRequest = exports.uploadLargeFile = exports.uploadSmallFileRequest = exports.uploadSmallFile = exports.uploadFile = exports.DEFAULT_UPLOAD_OPTIONS = exports.TUS_CHUNK_SIZE = void 0;
const tus_js_client_1 = require("tus-js-client");
const blake3 = __importStar(require("blake3-wasm"));
const buffer_1 = require("buffer");
const file_1 = require("./utils/file");
const options_1 = require("./utils/options");
const request_1 = require("./request");
const constants_1 = require("./constants");
const s5_utils_js_1 = require("s5-utils-js");
const s5_encryptWasm_1 = require("s5-encryptWasm");
/**
 * The tus chunk size is (4MiB - encryptionOverhead) * dataPieces, set as default.
 */
exports.TUS_CHUNK_SIZE = (1 << 22) * 8;
/**
 * The retry delays, in ms. Data is stored in skyd for up to 20 minutes, so the
 * total delays should not exceed that length of time.
 */
const DEFAULT_TUS_RETRY_DELAYS = [0, 5000, 15000, 60000, 300000, 600000];
/**
 * The portal file field name.
 */
const PORTAL_FILE_FIELD_NAME = "file";
exports.DEFAULT_UPLOAD_OPTIONS = {
    ...options_1.DEFAULT_BASE_OPTIONS,
    endpointUpload: "/s5/upload",
    endpointDirectoryUpload: "/s5/upload/directory",
    endpointLargeUpload: "/s5/upload/tus",
    customFilename: "",
    errorPages: { 404: "/404.html" },
    tryFiles: ["index.html"],
    // Large files.
    largeFileSize: exports.TUS_CHUNK_SIZE,
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
async function uploadFile(file, customOptions) {
    const opts = { ...exports.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    if (file.size < opts.largeFileSize) {
        return this.uploadSmallFile(file, opts);
    }
    else {
        return this.uploadLargeFile(file, opts);
    }
}
exports.uploadFile = uploadFile;
/**
 * Uploads a small file to S5-net.
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointUpload] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
async function uploadSmallFile(file, customOptions) {
    const response = await this.uploadSmallFileRequest(file, customOptions);
    let responsedS5Cid;
    if (customOptions === null || customOptions === void 0 ? void 0 : customOptions.encrypt) {
        responsedS5Cid = { cid: response.data.cid, key: response.data.key, cidWithoutKey: response.data.cidWithoutKey };
    }
    else {
        responsedS5Cid = { cid: response.data.cid };
    }
    return responsedS5Cid;
}
exports.uploadSmallFile = uploadSmallFile;
/**
 * Makes a request to upload a small file to S5-net with proper encoding support.
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
async function uploadSmallFileRequest(file, customOptions) {
    const opts = { ...exports.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const formData = new FormData();
    const b3hash = await (0, s5_utils_js_1.calculateB3hashFromFile)(file);
    const mhash = (0, s5_utils_js_1.generateMHashFromB3hash)(b3hash);
    const cid = (0, s5_utils_js_1.generateCIDFromMHash)(mhash, file);
    let response;
    // If customOptions.encrypt is true, encrypt the file before uploading.
    if (opts.encrypt) {
        // Initialize the WASM module
        await (0, s5_encryptWasm_1.__wbg_init)();
        const encryptedKey = (0, s5_encryptWasm_1.generate_key)();
        // eslint-disable-next-line
        let { encryptedFile, encryptedCid } = await (0, s5_encryptWasm_1.encryptFile)(file, file.name, encryptedKey, cid);
        encryptedFile = ensureFileObjectConsistency(encryptedFile);
        if (opts.customFilename) {
            formData.append(PORTAL_FILE_FIELD_NAME, encryptedFile, opts.customFilename);
        }
        else {
            formData.append(PORTAL_FILE_FIELD_NAME, encryptedFile);
        }
        response = await this.executeRequest({
            ...opts,
            endpointPath: opts.endpointUpload,
            method: "post",
            data: formData,
        });
        response.data.cid = encryptedCid;
        response.data["key"] = (0, s5_utils_js_1.convertMHashToB64url)(buffer_1.Buffer.from(encryptedKey));
        response.data["cidWithoutKey"] = (0, s5_encryptWasm_1.removeKeyFromEncryptedCid)(encryptedCid);
    }
    else {
        // Fix for text files with foreign characters - convert to Blob with UTF-8 encoding
        let fileToUpload;
        // Check if it's a text file
        if (file.type.includes("text") || (0, file_1.getFileMimeType)(file).includes("text")) {
            // Read file as text and create a new Blob with explicit UTF-8 encoding
            const text = await file.text(); // Read file as text
            const blob = new Blob([text], { type: `${file.type}; charset=utf-8` });
            fileToUpload = new File([blob], file.name, { type: `${file.type}; charset=utf-8` });
        }
        else {
            fileToUpload = ensureFileObjectConsistency(file);
        }
        if (opts.customFilename) {
            formData.append(PORTAL_FILE_FIELD_NAME, fileToUpload, opts.customFilename);
        }
        else {
            formData.append(PORTAL_FILE_FIELD_NAME, fileToUpload);
        }
        response = await this.executeRequest({
            ...opts,
            endpointPath: opts.endpointUpload,
            method: "post",
            data: formData,
        });
        const uCid = (0, s5_utils_js_1.encodeCIDWithPrefixU)(cid);
        response.data["cid"] = uCid;
    }
    return response;
}
exports.uploadSmallFileRequest = uploadSmallFileRequest;
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
async function uploadLargeFile(file, customOptions) {
    const response = await this.uploadLargeFileRequest(file, customOptions);
    const responsedS5Cid = response.data;
    return responsedS5Cid;
}
exports.uploadLargeFile = uploadLargeFile;
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
async function uploadLargeFileRequest(file, customOptions) {
    const opts = { ...exports.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    // Validation.
    const urlReq = await (0, request_1.buildRequestUrl)(this, { endpointPath: opts.endpointLargeUpload });
    const url = `${urlReq}${opts.authToken ? `?auth_token=${opts.authToken}` : ""}`;
    const headers = (0, request_1.buildRequestHeaders)(undefined, opts.customUserAgent, opts.customCookie, opts.s5ApiKey);
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
    const hash = buffer_1.Buffer.concat([buffer_1.Buffer.alloc(1, constants_1.mhashBlake3Default), buffer_1.Buffer.from(b3hash)]);
    const cid = buffer_1.Buffer.concat([buffer_1.Buffer.alloc(1, constants_1.cidTypeRaw), hash, numberToBuffer(file.size)]);
    /**
     * convert a number to Buffer.
     *
     * @param value - File objects to upload, indexed by their path strings.
     * @returns - The returned cid.
     * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
     */
    function numberToBuffer(value) {
        const view = buffer_1.Buffer.alloc(16);
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
        const upload = new tus_js_client_1.Upload(file, tusOpts);
        upload.start();
    });
}
exports.uploadLargeFileRequest = uploadLargeFileRequest;
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
async function uploadDirectory(directory, filename, customOptions) {
    const response = await this.uploadDirectoryRequest(directory, filename, customOptions);
    const responsedS5Cid = { cid: response.data.cid };
    return responsedS5Cid;
}
exports.uploadDirectory = uploadDirectory;
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
async function uploadDirectoryRequest(directory, filename, customOptions) {
    const opts = { ...exports.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
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
exports.uploadDirectoryRequest = uploadDirectoryRequest;
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
    return new File([file], file.name, { type: (0, file_1.getFileMimeType)(file) });
}
