import { Buffer } from "buffer";

import * as blake3 from "blake3-wasm";

import {
  convertMHashToB64url,
  calculateB3hashFromFile,
  cidTypeEncrypted,
  mhashBlake3Default,
  encryptionAlgorithmXChaCha20Poly1305,
} from "s5-utils-js";

import __wbg_init, { encrypt_file_xchacha20 } from "../encrypt_file/pkg/encrypt_file";

// Might want to add this for export from s5-utils-js
export const chunkSizeAsPowerOf2 = 18;

/**
 * Calculates the BLAKE3 hash of a file after encrypting it with a given key.
 * @param {File} file - The file to hash.
 * @param {Uint8Array} encryptedKey - The key to use for encryption.
 * @returns {Promise<{ b3hash: Buffer; encryptedFileSize: number }>} A Promise that resolves to an object containing the hash value and the size of the encrypted file.
 */
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
  let chunkIndex = 0;

  // Process the file in chunks
  while (position <= file.size) {
    // Slice the file to extract a chunk
    const chunk = file.slice(position, position + chunkSize);

    // Convert chunk's ArrayBuffer to hex string and log it
    const chunkArrayBuffer = await chunk.arrayBuffer();
    const chunkUint8Array = new Uint8Array(chunkArrayBuffer);
    const encryptedChunkUint8Array = encrypt_file_xchacha20(chunkUint8Array, encryptedKey, 0x0, chunkIndex);
    encryptedFileSize += encryptedChunkUint8Array.length;

    // Update the hash with the chunk's data
    hasher.update(encryptedChunkUint8Array);

    // Move to the next position
    position += chunkSize;
    chunkIndex++;
  }

  // Obtain the final hash value
  const b3hash = hasher.digest();
  // Return the hash value as a Promise resolved to a Buffer
  return { b3hash: b3hash, encryptedFileSize };
}

/**
 * Removes the encryption key from an encrypted CID.
 * @param {string} encryptedCid - The encrypted CID to remove the key from.
 * @returns {string} The CID with the encryption key removed.
 */
export function removeKeyFromEncryptedCid(encryptedCid: string): string {
  return encryptedCid.slice(0, -96) + encryptedCid.slice(-53);
}
/**
 * Combines an encryption key with an encrypted CID.
 * @param {string} key - The encryption key to combine with the encrypted CID.
 * @param {string} encryptedCidWithoutKey - The encrypted CID without the encryption key.
 * @returns {string} The encrypted CID with the encryption key combined.
 */
export function combineKeytoEncryptedCid(key: string, encryptedCidWithoutKey: string): string {
  return encryptedCidWithoutKey.slice(0, -54) + key + encryptedCidWithoutKey.slice(-53);
}

/**
 * Creates an encrypted Content Identifier (CID) from the provided parameters.
 * @param cidTypeEncrypted - The encrypted type of the CID.
 * @param encryptionAlgorithm - The encryption algorithm used.
 * @param chunkSizeAsPowerOf2 - The chunk size as a power of 2.
 * @param encryptedBlobHash - The encrypted hash of the blob.
 * @param encryptionKey - The encryption key used.
 * @param padding - Additional padding to be used.
 * @param originalCid - The original CID before encryption.
 * @returns A Uint8Array representing the encrypted CID.
 */
export function createEncryptedCid(
  cidTypeEncrypted: number,
  encryptionAlgorithm: number,
  chunkSizeAsPowerOf2: number,
  encryptedBlobHash: Uint8Array,
  encryptionKey: Uint8Array,
  padding: number,
  originalCid: Uint8Array
): Uint8Array {
  const result: number[] = [];
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
 * Encrypts a file using a specified encryption key and CID. This function
 * first reads the input file and converts it into a Uint8Array format.
 * It then initializes a WebAssembly (WASM) module and calls an encryption
 * function to encrypt the file content. The encrypted file content is then
 * converted back into a Blob and then into a File object.
 * It also computes the encrypted blob hash, constructs the encrypted CID,
 * and returns the encrypted file along with the encrypted CID.
 * @param {File} file - The file to be encrypted.
 * @param {string} filename - The name of the file.
 * @param {Uint8Array} encryptedKey - The encryption key to be used.
 * @param {string} cid - The Content Identifier of the file.
 * @returns {Promise<{ encryptedFile: File; encryptedCid: string }>} A promise that resolves with an object containing the encrypted file and the encrypted CID.
 */
export async function encryptFile(
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

  const b3hash = await calculateB3hashFromFile(encryptedFile);
  const encryptedBlobHash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), b3hash]);

  const padding = 0;

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
 * Returns a ReadableStreamDefaultReader for a ReadableStream of encrypted data from the provided File object.
 * The data is encrypted using the XChaCha20-Poly1305 algorithm with the provided encryption key.
 * The encryption is done on-the-fly using a transformer function.
 * The input data is split into chunks of size 262144 bytes (256 KB) and each chunk is encrypted separately.
 * @param file The File object to read from.
 * @param encryptedKey The encryption key to use, as a Uint8Array.
 * @returns A ReadableStreamDefaultReader for a ReadableStream of encrypted data from the provided File object.
 */
export function getEncryptedStreamReader(
  file: File,
  encryptedKey: Uint8Array
): ReadableStreamDefaultReader<Uint8Array> {
  // Creates a ReadableStream from a File object, encrypts the stream using a transformer,
  // and returns a ReadableStreamDefaultReader for the encrypted stream.

  const fileStream = file.stream();
  const transformerEncrypt = getTransformerEncrypt(encryptedKey);
  const encryptedFileStream = fileStream.pipeThrough(transformerEncrypt);
  const reader = encryptedFileStream.getReader();

  return reader;
}

/**
 * Returns a transformer function that encrypts the input data using the provided key.
 * The encryption is done using the XChaCha20-Poly1305 algorithm.
 * The input data is split into chunks of size 262144 bytes (256 KB) and each chunk is encrypted separately.
 * @param key The encryption key to use, as a Uint8Array.
 * @returns A TransformStream object that takes in Uint8Array chunks and outputs encrypted Uint8Array chunks.
 */
function getTransformerEncrypt(key: Uint8Array): TransformStream<Uint8Array, Uint8Array> {
  let buffer = new Uint8Array(0);
  let chunkIndex = 0;
  const chunkSize = 262144; // Chunk size in bytes

  return new TransformStream({
    async transform(chunk, controller) {
      const newBuffer = new Uint8Array(buffer.length + chunk.length);
      newBuffer.set(buffer);
      newBuffer.set(chunk, buffer.length);
      buffer = newBuffer;

      while (buffer.length >= chunkSize) {
        const chunk = buffer.slice(0, chunkSize);
        const encryptedChunkUint8Array = Promise.resolve(encrypt_file_xchacha20(chunk, key, 0x0, chunkIndex));
        controller.enqueue(await encryptedChunkUint8Array);

        buffer = buffer.slice(chunkSize);
        console.log("encrypt: chunkIndex = ", chunkIndex);
        chunkIndex++;
      }
    },
    async flush(controller) {
      // Process remaining data in the buffer, if any
      while (buffer.length > 0) {
        const chunk = buffer.slice(0, Math.min(chunkSize, buffer.length));
        const encryptedChunkUint8Array = Promise.resolve(encrypt_file_xchacha20(chunk, key, 0x0, chunkIndex));
        controller.enqueue(await encryptedChunkUint8Array);

        buffer = buffer.slice(Math.min(chunkSize, buffer.length));
        console.log("encrypt: chunkIndex = ", chunkIndex);
        chunkIndex++;
      }
    },
  });
}
