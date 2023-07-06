"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadWebappRequest = exports.uploadWebapp = exports.uploadDirectoryRequest = exports.uploadDirectory = exports.uploadLargeFileRequest = exports.uploadLargeFile = exports.uploadSmallFileRequest = exports.uploadSmallFile = exports.uploadFile = exports.createFileFromData = exports.uploadData = exports.uploadFromUrl = void 0;
const tus_js_client_1 = require("tus-js-client");
const buffer_1 = require("buffer");
const defaults_1 = require("./defaults");
const request_1 = require("./request");
const s5_utils_js_1 = require("s5-utils-js");
const s5_encryptWasm_1 = require("s5-encryptWasm");
/**
 * Uploads a file from a URL.
 * @param this - The instance of the S5Client class.
 * @param dataurl - The URL of the file to be uploaded.
 * @param customOptions - Optional custom upload options.
 * @returns A promise that resolves to the AxiosResponse object representing the upload response.
 */
async function uploadFromUrl(dataurl, customOptions) {
    // Merge the default upload options, custom options from the instance, and any provided custom options
    const opts = { ...defaults_1.DEFAULT_UPLOAD_FROM_URL_OPTIONS, ...this.customOptions, ...customOptions };
    const query = { url: dataurl };
    // Execute the request to upload from the URL
    const response = await this.executeRequest({
        ...opts,
        endpointPath: opts.endpointUploadFromUrl,
        method: "post",
        query,
    });
    return response.data;
}
exports.uploadFromUrl = uploadFromUrl;
/**
 * Uploads data to S5-net.
 * @param this - S5Client
 * @param data - The data to upload.
 * @param filename - The name of uploaded Data file.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
async function uploadData(data, filename, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    let sizeInBytes;
    let arrayBuffer;
    if (typeof data === "string") {
        arrayBuffer = new TextEncoder().encode(data).buffer;
        sizeInBytes = arrayBuffer.byteLength;
    }
    else if (ArrayBuffer.isView(data)) {
        arrayBuffer = data.buffer;
        sizeInBytes = data.byteLength;
    }
    else if (data instanceof ArrayBuffer) {
        arrayBuffer = data;
        sizeInBytes = arrayBuffer.byteLength;
    }
    else {
        throw new Error(`Unsupported data type: ${typeof data}`);
    }
    const fileType = "text/plain";
    const file = createFileFromData(data, filename, fileType);
    if (sizeInBytes < opts.largeFileSize) {
        return await this.uploadSmallFile(file, opts);
    }
    return await this.uploadLargeFile(file, opts);
}
exports.uploadData = uploadData;
/**
 * Creates a File object from the provided data, file name, and file type.
 * @param data - The data of the file, which can be a string, an ArrayBuffer, or a Uint8Array.
 * @param fileName - The name of the file.
 * @param fileType - The type (MIME type) of the file.
 * @returns A File object representing the file.
 */
function createFileFromData(data, fileName, fileType) {
    let file;
    const blobData = [data];
    const options = { type: fileType };
    const blob = new Blob(blobData, options);
    if (typeof data === "string") {
        file = new File([blob], fileName);
    }
    else {
        file = new File([blob], fileName, { type: fileType });
    }
    return file;
}
exports.createFileFromData = createFileFromData;
/**
 * Uploads a file to S5-net.
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointUpload] - The relative URL path of the portal endpoint to contact for small uploads.
 * @param [customOptions.endpointDirectoryUpload] - The relative URL path of the portal endpoint to contact for Directory uploads.
 * @param [customOptions.endpointLargeUpload] - The relative URL path of the portal endpoint to contact for large uploads.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
async function uploadFile(file, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
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
    if (customOptions?.encrypt) {
        responsedS5Cid = { cid: response.data.cid, key: response.data.key, cidWithoutKey: response.data.cidWithoutKey };
    }
    else {
        responsedS5Cid = { cid: response.data.cid };
    }
    return responsedS5Cid;
}
exports.uploadSmallFile = uploadSmallFile;
/**
 * Makes a request to upload a small file to S5-net.
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
async function uploadSmallFileRequest(file, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
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
            formData.append(defaults_1.PORTAL_FILE_FIELD_NAME, encryptedFile, opts.customFilename);
        }
        else {
            formData.append(defaults_1.PORTAL_FILE_FIELD_NAME, encryptedFile);
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
        file = ensureFileObjectConsistency(file);
        if (opts.customFilename) {
            formData.append(defaults_1.PORTAL_FILE_FIELD_NAME, file, opts.customFilename);
        }
        else {
            formData.append(defaults_1.PORTAL_FILE_FIELD_NAME, file);
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
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointLargeUpload] - The relative URL path of the portal endpoint to contact.
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
 * @param this - S5Client
 * @param file - The file to upload.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointLargeUpload] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 */
async function uploadLargeFileRequest(file, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
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
    const b3hash = await (0, s5_utils_js_1.calculateB3hashFromFile)(file);
    const mhash = (0, s5_utils_js_1.generateMHashFromB3hash)(b3hash);
    const cid = (0, s5_utils_js_1.generateCIDFromMHash)(mhash, file);
    let mHashBase64url;
    let uCid;
    let encryptedBlobMHashBase64url;
    let encryptedCid;
    let encryptedKey;
    let fileEncryptSize;
    if (opts.encrypt) {
        // Initialize the WASM module
        await (0, s5_encryptWasm_1.__wbg_init)();
        encryptedKey = (0, s5_encryptWasm_1.generate_key)();
        const { b3hash: b3hashEncrypt, encryptedFileSize } = await (0, s5_encryptWasm_1.calculateB3hashFromFileEncrypt)(file, encryptedKey);
        fileEncryptSize = encryptedFileSize;
        const encryptedBlobHash = (0, s5_utils_js_1.generateMHashFromB3hash)(b3hashEncrypt);
        encryptedBlobMHashBase64url = (0, s5_utils_js_1.convertMHashToB64url)(encryptedBlobHash);
        const padding = 0;
        const encryptedCidBytes = (0, s5_encryptWasm_1.createEncryptedCid)(s5_utils_js_1.cidTypeEncrypted, s5_utils_js_1.encryptionAlgorithmXChaCha20Poly1305, s5_encryptWasm_1.chunkSizeAsPowerOf2, encryptedBlobHash, encryptedKey, padding, cid);
        encryptedCid = (0, s5_utils_js_1.encodeCIDWithPrefixU)(buffer_1.Buffer.from(encryptedCidBytes));
    }
    else {
        mHashBase64url = (0, s5_utils_js_1.convertMHashToB64url)(mhash);
        uCid = (0, s5_utils_js_1.encodeCIDWithPrefixU)(cid);
    }
    return new Promise((resolve, reject) => {
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
            headers,
            chunkSize: opts.encrypt ? 262160 : 262144,
            uploadSize: fileEncryptSize,
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
                let resCid;
                if (opts.encrypt)
                    resCid = encryptedCid;
                else
                    resCid = uCid;
                const encryptedCidWithoutKey = opts.encrypt ? (0, s5_encryptWasm_1.removeKeyFromEncryptedCid)(encryptedCid) : "";
                const encryptedKey64 = opts.encrypt ? (0, s5_utils_js_1.convertMHashToB64url)(buffer_1.Buffer.from(encryptedKey)) : "";
                const resolveData = { data: { cid: resCid, key: encryptedKey64, cidWithoutKey: encryptedCidWithoutKey } };
                resolve(resolveData);
            },
        };
        // Creates a ReadableStream from a File object, encrypts the stream using a transformer,
        // and returns a ReadableStreamDefaultReader for the encrypted stream.
        const reader = (0, s5_encryptWasm_1.getEncryptedStreamReader)(file, encryptedKey);
        let upload;
        if (opts.encrypt)
            upload = new tus_js_client_1.Upload(reader, tusOpts);
        else
            upload = new tus_js_client_1.Upload(file, tusOpts);
        upload.start();
    });
}
exports.uploadLargeFileRequest = uploadLargeFileRequest;
/**
 * Uploads a directory to S5-net.
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
async function uploadDirectory(directory, customOptions) {
    const response = await this.uploadDirectoryRequest(directory, customOptions);
    const responsedS5Cid = { cid: response.data.cid };
    return responsedS5Cid;
}
exports.uploadDirectory = uploadDirectory;
/**
 * Makes a request to upload a directory to S5-net.
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 * @throws - Will throw if the input filename is not a string.
 */
async function uploadDirectoryRequest(directory, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const formData = new FormData();
    Object.entries(directory).forEach(([path, file]) => {
        file = ensureFileObjectConsistency(file);
        formData.append(path, file, path);
    });
    let dirname;
    if (opts.customDirname != null) {
        dirname = defaults_1.DEFAULT_DIRECTORY_NAME;
    }
    const dirName = opts.customDirname || dirname;
    const query = { name: dirName };
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
 * Uploads a directory to S5-net.
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The returned cid.
 * @throws - Will throw if the request is successful but the upload response does not contain a complete response.
 */
async function uploadWebapp(directory, customOptions) {
    const response = await this.uploadWebappRequest(directory, customOptions);
    const responsedS5Cid = { cid: response.data.cid };
    return responsedS5Cid;
}
exports.uploadWebapp = uploadWebapp;
/**
 * Makes a request to upload a directory to S5-net.
 * @param this - S5Client
 * @param directory - File objects to upload, indexed by their path strings.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @param [customOptions.endpointPath] - The relative URL path of the portal endpoint to contact.
 * @returns - The upload response.
 * @throws - Will throw if the input filename is not a string.
 */
async function uploadWebappRequest(directory, customOptions) {
    const opts = { ...defaults_1.DEFAULT_UPLOAD_OPTIONS, ...this.customOptions, ...customOptions };
    const formData = new FormData();
    Object.entries(directory).forEach(([path, file]) => {
        file = ensureFileObjectConsistency(file);
        formData.append(path, file, path);
    });
    let dirname;
    if (opts.customDirname != null) {
        dirname = defaults_1.DEFAULT_DIRECTORY_NAME;
    }
    const dirName = opts.customDirname || dirname;
    const query = { name: dirName };
    if (opts.tryFiles) {
        query.tryfiles = JSON.stringify(opts.tryFiles);
    }
    else {
        query.tryfiles = JSON.stringify(["index.html"]);
    }
    if (opts.errorPages) {
        query.errorpages = JSON.stringify(opts.errorPages);
    }
    else {
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
exports.uploadWebappRequest = uploadWebappRequest;
/**
 * Sometimes file object might have had the type property defined manually with
 * Object.defineProperty and some browsers (namely firefox) can have problems
 * reading it after the file has been appended to form data. To overcome this,
 * we recreate the file object using native File constructor with a type defined
 * as a constructor argument.
 * @param file - The input file.
 * @returns - The processed file.
 */
function ensureFileObjectConsistency(file) {
    return new File([file], file.name, { type: (0, s5_utils_js_1.getFileMimeType)(file) });
}
