import { Buffer } from "buffer";

import * as blake3 from "blake3-wasm";

import {
  convertMHashToB64url,
  cidTypeEncrypted,
  mhashBlake3Default,
  encryptionAlgorithmXChaCha20Poly1305,
} from "s5-utils-js";

import __wbg_init, { encrypt_file_xchacha20, generate_key } from "../encrypt_file/pkg/encrypt_file";

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

  const { b3hash } = await calculateB3hashFromFileEncrypt(file, encryptedKey);

  const encryptedBlobHash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), Buffer.from(b3hash)]);

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
 * Creates a ReadableStreamDefaultReader from an encrypted file. This function
 * first gets a reader from the input file's stream. It then creates a new
 * readable stream where the encryption is applied to each chunk of data read
 * from the original reader. The function uses the WASM module and the
 * encryption function to encrypt the chunks. Encrypted chunks are then
 * enqueued in the new stream's controller. When the original reader is done,
 * any remaining data in the buffer is also encrypted and enqueued. Finally,
 * the function returns a reader from the new stream.
 * @param {File} file - The file to be encrypted.
 * @param {Uint8Array} key - The encryption key to be used.
 * @returns {ReadableStreamDefaultReader<Uint8Array>} A ReadableStreamDefaultReader of the encrypted file chunks.
 */
export function getReaderFromFileEncrypt(file: File, key: Uint8Array): ReadableStreamDefaultReader<Uint8Array> {
  const originalReader = file.stream().getReader();
  const chunkSize = 262144; // Chunk size in bytes

  const modifiedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = new Uint8Array(0);

      // eslint-disable-next-line no-constant-condition
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
          const newBuffer = new Uint8Array(buffer.length + value.length);
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
