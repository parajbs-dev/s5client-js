use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use chacha20poly1305::{
    aead::{generic_array::GenericArray, Aead, KeyInit, OsRng},
    XChaCha20Poly1305, XNonce,
};
use std::io::{Cursor, Read};

/// This function encrypts the input file using the XChaCha20 algorithm.
///
/// @param input_file - The bytes of the file to be encrypted.
/// @param padding - The size of the padding to be added to each chunk of the file.
/// @returns A Result that, if Ok, contains the encrypted file as a vector of bytes.
#[wasm_bindgen]
pub fn encrypt_file_xchacha20(
    input_file: &[u8],
    key: &[u8],
    padding: usize,
) -> Result<Vec<u8>, JsValue> {
    let reader = Cursor::new(input_file);

    let encrypted_file = encrypt_file_xchacha20_internal(reader, key, padding);
    //    let key: Vec<u8> = res.1;

    Ok(encrypted_file)
}

/// This function generates a key for XChaCha20Poly1305 encryption.
///
/// @returns The generated key as a vector of bytes.
#[wasm_bindgen]
pub fn generate_key() -> Vec<u8> {
    let key = XChaCha20Poly1305::generate_key(&mut OsRng);
    key.to_vec()
}

fn encrypt_file_xchacha20_internal<R: Read>(mut reader: R, key: &[u8], padding: usize) -> Vec<u8> {
    let key = GenericArray::from_slice(key);
    let cipher = XChaCha20Poly1305::new(key);

    let mut chunk_index: u32 = 0;

    let chunk_size = 262144;

    let mut buffer = [0u8; 262144];
    let mut output = Vec::new();

    loop {
        let count = reader.read(&mut buffer).unwrap();
        if count == 0 {
            break;
        }

        let length = if count < chunk_size {
            count + padding
        } else {
            count
        };

        let nonce = XNonce::default();

        let ciphertext = cipher.encrypt(&nonce, &buffer[..length]).unwrap();
        let ciphertext_hex = hex::encode(&ciphertext);
        println!("{}", ciphertext_hex);

        output.extend_from_slice(&ciphertext);
        chunk_index = chunk_index + 1;
    }

    output
}
