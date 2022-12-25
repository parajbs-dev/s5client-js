"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataProofTypeTimestamp = exports.metadataProofTypeSignature = exports.metadataMediaDetailsDuration = exports.metadataExtensionBasicMediaMetadata = exports.metadataExtensionViewTypes = exports.metadataExtensionCategories = exports.metadataExtensionTags = exports.metadataExtensionTimestamp = exports.metadataExtensionPreviousVersions = exports.metadataExtensionUpdateCID = exports.metadataExtensionSourceUris = exports.metadataExtensionLanguages = exports.metadataExtensionWikidataClaims = exports.metadataExtensionDonationKeys = exports.metadataExtensionLicenses = exports.metadataExtensionChildren = exports.protocolMethodRegistryQuery = exports.protocolMethodRegistryUpdate = exports.protocolMethodAnnouncePeers = exports.protocolMethodHashQuery = exports.protocolMethodHashQueryResponse = exports.protocolMethodSignedMessage = exports.protocolMethodHandshakeDone = exports.protocolMethodHandshakeOpen = exports.registryMaxDataSize = exports.metadataTypeDirectory = exports.metadataTypeMedia = exports.metadataMagicByte = exports.mkeyEd25519 = exports.mhashBlake3Default = exports.registryS5MagicByte = exports.cidTypeResolver = exports.cidTypeMetadataWebApp = exports.cidTypeMetadataMedia = exports.cidTypeRaw = void 0;
// ! CID types
// These bytes are carefully selected to make the base58 and base32 representations of different CID types
// easy to distinguish and not collide with anything on https://github.com/multiformats/multicodec
exports.cidTypeRaw = 0x26;
exports.cidTypeMetadataMedia = 0xc5;
// const cidTypeMetadataFile = 0xc6;
exports.cidTypeMetadataWebApp = 0x59;
exports.cidTypeResolver = 0x25;
// ! indicates that the registry entry contains a S5 CID
exports.registryS5MagicByte = 0x5a;
// ! some multicodec bytes
// BLAKE3 with default output size of 256 bits
exports.mhashBlake3Default = 0x1f;
exports.mkeyEd25519 = 0xed;
// ! metadata files
// used as the first byte of metadata files
exports.metadataMagicByte = 0x5f;
// types for metadata files
exports.metadataTypeMedia = 0x02;
exports.metadataTypeDirectory = 0x03;
exports.registryMaxDataSize = 48;
// ! p2p protocol message types
exports.protocolMethodHandshakeOpen = 1;
exports.protocolMethodHandshakeDone = 2;
exports.protocolMethodSignedMessage = 10;
exports.protocolMethodHashQueryResponse = 5;
exports.protocolMethodHashQuery = 4;
exports.protocolMethodAnnouncePeers = 7;
exports.protocolMethodRegistryUpdate = 12;
exports.protocolMethodRegistryQuery = 13;
// ! Some optional metadata extensions (same for files, media files and directories)
// List<SpecialObject> (with CIDs)
exports.metadataExtensionChildren = 1;
// List<String>, license identifier from https://spdx.org/licenses/
exports.metadataExtensionLicenses = 11;
// List<Uint8List>, multicoded pubkey that references a registry entry that contains donation links and addresses
exports.metadataExtensionDonationKeys = 12;
// map string->map, external ids of this object by their wikidata property id. Can be used to for example internet archive identifiers
exports.metadataExtensionWikidataClaims = 13;
// List<String>, for example [en, de, de-DE]
exports.metadataExtensionLanguages = 14;
// List<String>,
exports.metadataExtensionSourceUris = 15;
// Resolver CID, can be used to update this post. can also be used to "delete" a post.
exports.metadataExtensionUpdateCID = 16;
// List<CID>, lists previous versions of this post
exports.metadataExtensionPreviousVersions = 17;
// unix timestamp in milliseconds
exports.metadataExtensionTimestamp = 18;
exports.metadataExtensionTags = 19;
exports.metadataExtensionCategories = 20;
// video, podcast, book, audio, music, ...
exports.metadataExtensionViewTypes = 21;
exports.metadataExtensionBasicMediaMetadata = 22;
// TODO comment to / reply to
// TODO mentions
// TODO Reposts (just link the original item)
// ! media details
exports.metadataMediaDetailsDuration = 10;
// ! metadata proofs
exports.metadataProofTypeSignature = 1;
exports.metadataProofTypeTimestamp = 2;
