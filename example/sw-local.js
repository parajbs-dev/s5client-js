'use strict'

// ! S5 web proxy service worker (version 11)

// ! WASM bindings (generated) START
let wasm;

const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
* @param {Uint8Array} key
* @param {Uint8Array} nonce
* @param {Uint8Array} ciphertext
* @returns {Uint8Array}
*/
function decrypt_xchacha20poly1305(key, nonce, ciphertext) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(nonce, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    wasm.decrypt_xchacha20poly1305(retptr, ptr0, len0, ptr1, len1, ptr2, len2);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v3 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v3;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
* @param {Uint8Array} input
* @returns {Uint8Array}
*/
function hash_blake3(input) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.hash_blake3(retptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v1 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v1;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
* @param {Uint8Array} chunk_bytes
* @param {bigint} offset
* @param {Uint8Array} bao_outboard_bytes
* @param {Uint8Array} blake3_hash
* @returns {number}
*/
function verify_integrity(chunk_bytes, offset, bao_outboard_bytes, blake3_hash) {
  const ptr0 = passArray8ToWasm0(chunk_bytes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray8ToWasm0(bao_outboard_bytes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(blake3_hash, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.verify_integrity(ptr0, len0, offset, ptr1, len1, ptr2, len2);
  return ret;
}

async function load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);

      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);

  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };

    } else {
      return instance;
    }
  }
}

function getImports() {
  const imports = {};
  imports.wbg = {};
  imports.wbg.__wbindgen_throw = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };

  return imports;
}

function initMemory(imports, maybe_memory) {

}

function finalizeInit(instance, module) {
  wasm = instance.exports;
  init.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = null;
  cachedUint8Memory0 = null;


  return wasm;
}

function initSync(module) {
  const imports = getImports();

  initMemory(imports);

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }

  const instance = new WebAssembly.Instance(module, imports);

  return finalizeInit(instance, module);
}

async function init(input) {
  if (typeof input === 'undefined') {
    input = new URL('rust_lib.wasm', self.location.origin);
  }
  const imports = getImports();

  if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
    input = fetch(input);
  }

  initMemory(imports);

  const { instance, module } = await load(await input, imports);

  return finalizeInit(instance, module);
}
// ! WASM bindings (generated) END

let availableDirectoryFiles = {};
let chunkCache = {};
let downloadingChunkLock = {};

function _base64ToUint8Array(base64) {
  var binary_string = atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

let streamingUrlCache = {};

async function getStreamingLocation(hash, types) {
  let val = streamingUrlCache[hash];
  if (val !== undefined) {
    return val;
  }

  // TODO Expiry

//  console.debug('fetch', 'https://s5.cx/api/locations/' + hash + '?types=' + types)
//  const res = await fetch('https://s5.cx/api/locations/' + hash + '?types=' + types);


  console.debug('fetch', 'http://localhost:5050/s5/debug/storage_locations/' + hash + '?types=' + types)
  const res = await fetch('http://localhost:5050/s5/debug/storage_locations/' + hash + '?types=' + types);


  const parts = (await res.json())['locations'][0]['parts'];

  streamingUrlCache[hash] = parts;

  return parts;

}

// ! Default cache limit: ~ 512 MB
async function runCacheCleaner(cache, keys) {
  let additionalKeys = await cache.keys();

  for (const akeyRaw of additionalKeys) {
    const akey = (new URL(akeyRaw.url)).pathname.substr(1)
    if (!keys.includes(akey)) {
      keys.unshift(akey);
    }
  }
  console.debug('CacheCleaner', 'length', keys.length)
  while (keys.length > 2048) {
    let key = keys.shift();
    cache.delete(key);
    console.debug('CacheCleaner', 'delete', key)
  }
}

let chunkCacheKeys = [];
let smallFileCacheKeys = [];

let bao_outboard_bytes_cache = {};

function equal(buf1, buf2) {
  if (buf1.byteLength != buf2.byteLength) return false;

  for (var i = 0; i != buf1.byteLength; i++) {
    if (buf1[i] != buf2[i]) return false;
  }
  return true;
}

const nonceBytes = 24;

function numberToArrayBuffer(value) {
  const view = new DataView(new ArrayBuffer(nonceBytes))
  for (var index = (nonceBytes - 1); index >= 0; --index) {
    view.setUint8(nonceBytes - 1 - index, value % 256)
    value = value >> 8;
  }
  return view.buffer
}

function hashToBase64UrlNoPadding(hashBytes) {
  return btoa(String.fromCharCode.apply(null, hashBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/\=/g, '')
}

function safeDivision(start, chunkSize) {
  const startN = BigInt(start);
  const chunkSizeN = BigInt(chunkSize);
  return Number((startN - (startN % chunkSizeN)) / chunkSizeN);
}

function openRead(cid, start, end, totalSize, limit, encryptionMetadata) {
  console.debug('openRead', cid, start, end, totalSize, limit, encryptionMetadata)
  // ! end is exclusive

  const isEncrypted = encryptionMetadata !== undefined;

  const hashBytes =
    _base64ToUint8Array(cid.substring(1).replace(/-/g, '+')
      .replace(/_/g, '/')).slice(1, 34);



    console.debug('encryptionMetadata', encryptionMetadata)
    console.debug('hashBytes:   ', hashBytes)

      const ghash_b64 = hashToBase64UrlNoPadding(isEncrypted ? encryptionMetadata.hash : hashBytes);

    console.debug('ghash_b64:   ', ghash_b64)




  return new ReadableStream({
    // TODO Test if type pull works better
    // type: 'bytes',
    async start(controller) {
      const hash_b64 = hashToBase64UrlNoPadding(isEncrypted ? encryptionMetadata.hash : hashBytes);

    console.debug('hash_b64:   ', hash_b64)


      if (totalSize <= 262144 && !isEncrypted) {
        let parts = await getStreamingLocation(hash_b64, '3,5');
        let url = parts[0];

        const s5Cache = await caches.open('s5-small-files');
        console.debug('openRead', 'small file')

        let cachedBytes = await s5Cache.match(cid);

        if (cachedBytes !== undefined) {
          const bytes = new Uint8Array(await cachedBytes.arrayBuffer());
          if (start === 0) {
            if (end === bytes.length) {
              controller.enqueue(bytes);
            } else {
              controller.enqueue(bytes.slice(0, end));
            }
          } else {
            controller.enqueue(bytes.slice(start, end));
          }

          controller.close();
          return;
        }

        if (Math.random() < 0.01) {
          runCacheCleaner(s5Cache, smallFileCacheKeys);
        }

        console.debug('fetch', 'small file', url);
        const res = await fetch(url);
        const bytes = new Uint8Array(await res.arrayBuffer())

        const bytes_b3_hash = hash_blake3(bytes);

        const isValid = equal(hashBytes.slice(1), bytes_b3_hash);

        if (isValid !== true) {
          throw 'File integrity check failed (BLAKE3 with WASM)'
        }

        if (start === 0) {
          if (end === bytes.length) {
            controller.enqueue(bytes);
          } else {
            controller.enqueue(bytes.slice(0, end));
          }
        } else {
          controller.enqueue(bytes.slice(start, end));
        }
        controller.close();

        s5Cache.put(cid, new Response(bytes))

        smallFileCacheKeys.push(cid);

        return;

      }

      let chunkSize = 262144; // TODO Support custom chunk sizes

      let chunk = safeDivision(start, chunkSize);

      let offset = start % chunkSize;

      let downloadedEncData = new Uint8Array();

      let downloadStarted = false;

      const s5Cache = await caches.open(isEncrypted ? 's5-large-files-encrypted' : 's5-large-files');

      let lockedChunks = [];

      console.log('limit', limit);
      if (limit) {
        if ((end - start) > chunkSize * 64) {
          end = start + chunkSize * 64;
        }
      }

      while (start < end) {
        /* if (limit) {
          servedChunkCount++;
          if (servedChunkCount > (64)) {
            controller.close();
            console.log('openPlaintextRead stop (limit)')
            // TODO Check if empty
            downloadedEncData = new Uint8Array();
            return;
          }
        } */

        let chunkCacheKey = '0/' + hash_b64 + '/' + chunk.toString();
        
        let chunkRes = await s5Cache.match(chunkCacheKey);

        if (chunkRes !== undefined) {
          console.debug('serve', 'cache', chunk);

          const bytes = new Uint8Array(await chunkRes.arrayBuffer());

          if (offset === 0) {
            if ((start + bytes.length) > end) {
              controller.enqueue(bytes.slice(0, (end % chunkSize)));
            } else {
              controller.enqueue(bytes);
            }
          } else {
            if (((start - offset) + bytes.length) > end) {
              controller.enqueue(bytes.slice(offset, (end % chunkSize)));
            } else {
              controller.enqueue(bytes.slice(offset));
            }
          }
          start += bytes.length - offset;

        } else {
          const chunkLockKey = '0/' + hash_b64 + '/' + chunk.toString();
          if (downloadingChunkLock[chunkLockKey] === true && !lockedChunks.includes(chunkLockKey)) {
            console.debug('[chunk] wait for ' + chunk);
            // sub?.cancel();
            while (downloadingChunkLock[chunkLockKey] === true) {
              // TODO Risk for infinite loop, add timeout
              await new Promise(r => setTimeout(r, 10));
            }

            let chunkRes = await s5Cache.match(chunkCacheKey);

            const bytes = new Uint8Array(await chunkRes.arrayBuffer());

            if (offset === 0) {
              if ((start + bytes.length) > end) {
                controller.enqueue(bytes.slice(0, (end % chunkSize)));
              } else {
                controller.enqueue(bytes);
              }
            } else {
              if (((start - offset) + bytes.length) > end) {
                controller.enqueue(bytes.slice(offset, (end % chunkSize)));
              } else {
                controller.enqueue(bytes.slice(offset));
              }
            }
            start += bytes.length - offset;

          } else {

            const parts = await getStreamingLocation(hash_b64, isEncrypted ? '3,5' : '5');

            function lockChunk(index) {
              const chunkLockKey = '0/' + hash_b64 + '/' + index.toString();
              downloadingChunkLock[chunkLockKey] = true;
              lockedChunks.push(chunkLockKey);
            }

            lockChunk(chunk);

            let url = parts[0];

            let baoOutboardBytesUrl;

            if (parts[1] !== undefined) {
              baoOutboardBytesUrl = parts[1];
            } else {
              baoOutboardBytesUrl = parts[0] + '.obao';
            }

            if (Math.random() < 0.1) {
              runCacheCleaner(s5Cache, chunkCacheKeys);
            }

            if (!isEncrypted && bao_outboard_bytes_cache[baoOutboardBytesUrl] === undefined) {
              const baoLockKey = '0/' + hash_b64 + '/bao';
              if (downloadingChunkLock[baoLockKey] === true) {
                while (downloadingChunkLock[baoLockKey] === true) {
                  // TODO Risk for infinite loop, add timeout
                  await new Promise(r => setTimeout(r, 10));
                }
              } else {
                downloadingChunkLock[baoLockKey] = true;
                lockedChunks.push(baoLockKey);

                console.debug('fetch', 'bao', baoOutboardBytesUrl);
                const res = await fetch(baoOutboardBytesUrl);

                bao_outboard_bytes_cache[baoOutboardBytesUrl] = new Uint8Array(await res.arrayBuffer())

                delete downloadingChunkLock[baoLockKey];
              }
            }
            let chunkBytes;
            let retryCount = 0;

            while (true) {
              try {
                console.debug('[chunk] download ' + chunk);

                const startByte = chunk * chunkSize;

                let encStartByte = isEncrypted ?
                  chunk * (chunkSize + 16) :
                  startByte;

                let encChunkSize = isEncrypted ?
                  chunkSize + 16 :
                  chunkSize;

                let hasDownloadError = false;

                if (downloadStarted === false) {
                  // TODO: limit range by available cache
                  let rangeHeader;

                  if (end < (startByte + chunkSize)) {
                    if ((startByte + chunkSize) > totalSize) {
                      rangeHeader = 'bytes=' + encStartByte + '-';
                    } else {
                      rangeHeader = 'bytes=' + encStartByte + '-' + (encStartByte + encChunkSize - 1);
                    }
                  } else {

                    const downloadUntilChunkExclusive = safeDivision(end, chunkSize) + 1;

                    for (let ci = chunk + 1; ci < downloadUntilChunkExclusive; ci++) {
                      lockChunk(ci);
                    }

                    const length = encChunkSize * (downloadUntilChunkExclusive - chunk);

                    if ((encStartByte + length) > totalSize) {
                      rangeHeader = 'bytes=' + encStartByte + '-';
                    } else {
                      rangeHeader = 'bytes=' + encStartByte + '-' + (encStartByte + length - 1);
                    }
                  }              
                  console.debug('fetch', 'range', rangeHeader, url);

                  const res = await fetch(url, {
                    headers: {
                      'range': rangeHeader,
                    }
                  });

                  downloadStarted = true;

                  const reader = res.body.getReader();

                  function push() {
                    reader.read().then(
                      ({ done, value }) => {
                        if (done) {
                          console.debug('fetch', 'range', 'http reader done');
                          // isDone = true;
                          return;
                        }
                        // console.log('[debug] http reader', value.length);
                        let mergedArray = new Uint8Array(downloadedEncData.length + value.length);
                        mergedArray.set(downloadedEncData);
                        mergedArray.set(value, downloadedEncData.length);

                        downloadedEncData = mergedArray;
                        // console.log('addencdata', done, value);

                        push();
                      },
                      () => {
                        hasDownloadError = true;
                      }
                    );
                  }
                  push();
                }
                let isLastChunk = (startByte + chunkSize) > (totalSize);

                if (isLastChunk) {
                  while (downloadedEncData.length < (totalSize - encStartByte)) {
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise(r => setTimeout(r, 10));

                  }
                } else {
                  while (downloadedEncData.length < encChunkSize) {
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise(r => setTimeout(r, 10));
                  }
                }

                chunkBytes = isLastChunk
                  ? downloadedEncData
                  : downloadedEncData.slice(0, encChunkSize);

                if (isEncrypted) {
                  let nonce = new Uint8Array(numberToArrayBuffer(chunk));
//console.debug('chunk3', chunk)
console.debug('nonce3', nonce)


                  chunkBytes = decrypt_xchacha20poly1305(
                    encryptionMetadata.key,
                    nonce,
                    chunkBytes,
                  );
                  if (isLastChunk && encryptionMetadata.padding > 0) {
                    chunkBytes = chunkBytes.slice(0, chunkBytes.length - encryptionMetadata.padding)
                  }
                } else {
                  let integrity_res = verify_integrity(
                    chunkBytes,
                    BigInt(chunk * chunkSize),
                    bao_outboard_bytes_cache[baoOutboardBytesUrl],
                    hashBytes.slice(1),
                  );

                  if (integrity_res != 42) {
                    throw "File integrity check failed (BLAKE3-BAO with WASM)";
                  }
                }

                if (isLastChunk) {
                  await s5Cache.put(chunkCacheKey, new Response(chunkBytes,))
                  chunkCacheKeys.push(chunkCacheKey);
                  downloadedEncData = new Uint8Array();
                } else {

                  await s5Cache.put(chunkCacheKey, new Response(chunkBytes))
                  chunkCacheKeys.push(chunkCacheKey);
                  downloadedEncData = downloadedEncData.slice(encChunkSize);
                }

                try {
                  if (offset === 0) {
                    if ((start + chunkBytes.length) > end) {
                      controller.enqueue(chunkBytes.slice(0, (end % chunkSize)));
                    } else {
                      controller.enqueue(chunkBytes);
                    }
                  } else {
                    if (((start - offset) + chunkBytes.length) > end) {
                      controller.enqueue(chunkBytes.slice(offset, (end % chunkSize)));
                    } else {
                      controller.enqueue(chunkBytes.slice(offset));
                    }
                  }
                } catch (e) {
                  for (const key of lockedChunks) {
                    delete downloadingChunkLock[key];
                  }
                  console.warn(e);
                  if (downloadedEncData.length == 0) {
                    return;
                  }
                }
                start += chunkBytes.length - offset;

                delete downloadingChunkLock[chunkCacheKey];
                break;
              } catch (e) {
                console.error(e);
                retryCount++;
                if (retryCount > 10) {
                  complete();
                  for (const key of lockedChunks) {
                    delete downloadingChunkLock[key];
                  }
                  throw new Error('Too many retries. ($e)' + e);
                }

                downloadedEncData = new Uint8Array();
                downloadStarted = false;

                console.error('[chunk] download error for chunk ' + chunk + ' (try #' + retryCount + ')');
                await new Promise(r => setTimeout(r, 1000));
              }
            }
          }
        }
        offset = 0;
        chunk++;
      }
      controller.close();
    }
  });
}

function decodeBase64(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function decodeEndian(bytes) {
  let total = 0n;

  for (let i = 0; i < bytes.length; i++) {
    total += BigInt(bytes[i]) * (256n ** BigInt(i));
  }

  return Number(total);
}

console.debug = function() {
    if(!console.debugging) return;
    console.log.apply(this, arguments);
};


async function respond(url, req) {
console.debugging = true;
  // TODO maybe use custom path for encryption with keys
  if (url.pathname.startsWith('/s5/blob/')) {

    if (wasm === undefined) {
      await init();
    }

    const fullCID = url.pathname.substr(9)

    let cid = fullCID.split('.')[0]

    // TODO Support base58, base32 and base16 CIDs
    if (!cid.startsWith('u')) {
      throw 'Invalid CID format';
    }

    let bytes = decodeBase64(cid.substr(1));

    let encryptionMetadata;

    if (bytes[0] == 0xae) {
      if (bytes[1] != 0xa6) {
        throw 'Encryption algorithm not supported';
      }
      encryptionMetadata = {
        algorithm: bytes[1],
        chunkSize: Math.pow(2, bytes[2]),
        hash: bytes.subarray(3, 36),
        key: bytes.subarray(36, 68),
        padding: decodeEndian(bytes.subarray(68, 72)),
      }
      bytes = bytes.subarray(72);
      cid = 'u' + hashToBase64UrlNoPadding(bytes);
    }


console.debug('sfsfsfsf', 'jjjjj')




    let totalSize = decodeEndian(bytes.subarray(34));
    const urlParams = new URLSearchParams(url.search);

    const mediaType = urlParams.get('mediaType') || 'text/plain';

    let contentDisposition = 'inline';

    if (urlParams.get('filename')) {
      contentDisposition = 'attachment; filename="' + urlParams.get('filename') + '"';
    }

    const resOpt = {
      headers: {
        'Content-Type': mediaType,
        'Content-Disposition': contentDisposition,
      },
    }

    resOpt.headers['accept-ranges'] = 'bytes';

    var start = 0;
    var end = totalSize;

    const range = req.headers.get('range')

    if (range) {
      const m = range.match(/bytes=(\d+)-(\d*)/)
      if (m) {
        const size = totalSize
        start = +m[1]
        if (m[2]) {
          end = (+m[2] + 1)
        } else {
          end = size
        }

        resOpt.status = 206
        resOpt.headers['content-range'] = `bytes ${start}-${end - 1}/${size}`
      }
    }

    resOpt.headers['content-length'] = end - start;
console.debug('sfsfsfsf2', 'jjjjj2')
    return new Response(openRead(cid, start, end, totalSize, mediaType.startsWith('video/'), encryptionMetadata), resOpt)


  }
  return;

/*   let directoryFile = availableDirectoryFiles[url.pathname];

  const resOpt = {
    headers: {
      'Content-Type': directoryFile.mimeType || 'text/plain',
    },
  }


  var start = 0;
  var totalSize = directoryFile.file.size;

  const range = req.headers.get('range')

  if (range) {
    const m = range.match(/bytes=(\d+)-(\d*)/)
    if (m) {
      const size = directoryFile.file.size
      const begin = +m[1]
      const end = +m[2] || size

      start = begin;
      totalSize = end;

      resOpt.status = 206
      resOpt.headers['content-range'] = `bytes ${begin}-${end - 1}/${size}`
    }
  }

  resOpt.headers['content-length'] = directoryFile.file.size - start - (directoryFile.file.size - totalSize)
  return new Response(openReadOld(directoryFile, start, totalSize), resOpt) */
}

onfetch = (e) => {
  const req = e.request
  const url = new URL(req.url)

  if (url.origin !== location.origin) {
    return
  }

  if (url.pathname.startsWith('/s5/blob/')) {
    e.respondWith(respond(url, req));
    return;
  }
  return;

  // ! used for web apps
  /*  if (availableDirectoryFiles[url.pathname] === undefined) {
     return
   }
 
   e.respondWith(respond(url, req)) */
}

// TODO Migrate to S5 encryption
onmessage = (e) => {
/*   console.log('onmessage', e);

  const path = e.data['path'];
  const directoryFile = e.data['file'];

  if (e.data['ciphertext'] !== undefined) {
    console.log(e.data);

    const secretKey =
      _base64ToUint8Array(e.data['key'].replace(/-/g, '+')
        .replace(/_/g, '/'));

    const ciphertext =
      _base64ToUint8Array(e.data['ciphertext'].replace(/-/g, '+')
        .replace(/_/g, '/'));


    let bytes = sodium.crypto_secretbox_open_easy(ciphertext, new Uint8Array(24), secretKey);

    console.log(bytes);
    availableDirectoryFiles = JSON.parse(new TextDecoder().decode(bytes));
    availableDirectoryFiles['/'] = availableDirectoryFiles['/index.html'];
    availableDirectoryFiles[''] = availableDirectoryFiles['/index.html'];

    e.source.postMessage({ 'success': true })

  } else {
    if (availableDirectoryFiles[path] === undefined) {
      availableDirectoryFiles[path] = directoryFile;
      e.source.postMessage({ 'success': true })
    }
  } */
}

onactivate = () => {
  clients.claim()
}
