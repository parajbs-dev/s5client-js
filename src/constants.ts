// ! CID types
// These bytes are carefully selected to make the base58 and base32 representations of different CID types
// easy to distinguish and not collide with anything on https://github.com/multiformats/multicodec
export const cidTypeRaw = 0x26;
export const cidTypeMetadataMedia = 0xc5;
// const cidTypeMetadataFile = 0xc6;
export const cidTypeMetadataWebApp = 0x59;
export const cidTypeResolver = 0x25;

// ! indicates that the registry entry contains a S5 CID
export const registryS5MagicByte = 0x5a;

// ! some multicodec bytes
// BLAKE3 with default output size of 256 bits
export const mhashBlake3Default = 0x1f;

export const mkeyEd25519 = 0xed;

// ! metadata files

// used as the first byte of metadata files
export const metadataMagicByte = 0x5f;

// types for metadata files
export const metadataTypeMedia = 0x02;
export const metadataTypeDirectory = 0x03;

export const registryMaxDataSize = 48;

// ! p2p protocol message types

export const protocolMethodHandshakeOpen = 1;
export const protocolMethodHandshakeDone = 2;

export const protocolMethodSignedMessage = 10;

export const protocolMethodHashQueryResponse = 5;
export const protocolMethodHashQuery = 4;

export const protocolMethodAnnouncePeers = 7;

export const protocolMethodRegistryUpdate = 12;
export const protocolMethodRegistryQuery = 13;

// ! Some optional metadata extensions (same for files, media files and directories)

// List<SpecialObject> (with CIDs)
export const metadataExtensionChildren = 1;

// List<String>, license identifier from https://spdx.org/licenses/
export const metadataExtensionLicenses = 11;

// List<Uint8List>, multicoded pubkey that references a registry entry that contains donation links and addresses
export const metadataExtensionDonationKeys = 12;

// map string->map, external ids of this object by their wikidata property id. Can be used to for example internet archive identifiers
export const metadataExtensionWikidataClaims = 13;

// List<String>, for example [en, de, de-DE]
export const metadataExtensionLanguages = 14;

// List<String>,
export const metadataExtensionSourceUris = 15;

// Resolver CID, can be used to update this post. can also be used to "delete" a post.
export const metadataExtensionUpdateCID = 16;

// List<CID>, lists previous versions of this post
export const metadataExtensionPreviousVersions = 17;

// unix timestamp in milliseconds
export const metadataExtensionTimestamp = 18;

export const metadataExtensionTags = 19;
export const metadataExtensionCategories = 20;

// video, podcast, book, audio, music, ...
export const metadataExtensionViewTypes = 21;

export const metadataExtensionBasicMediaMetadata = 22;

// TODO comment to / reply to
// TODO mentions
// TODO Reposts (just link the original item)

// ! media details
export const metadataMediaDetailsDuration = 10;

// ! metadata proofs
export const metadataProofTypeSignature = 1;
export const metadataProofTypeTimestamp = 2;
