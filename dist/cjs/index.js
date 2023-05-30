"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uriS5Prefix = exports.defaultPortalUrl = exports.defaultS5PortalUrl = exports.S5Client = void 0;
// Main exports.
var client_1 = require("./client");
Object.defineProperty(exports, "S5Client", { enumerable: true, get: function () { return client_1.S5Client; } });
var s5_utils_js_1 = require("s5-utils-js");
Object.defineProperty(exports, "defaultS5PortalUrl", { enumerable: true, get: function () { return s5_utils_js_1.defaultS5PortalUrl; } });
Object.defineProperty(exports, "defaultPortalUrl", { enumerable: true, get: function () { return s5_utils_js_1.defaultPortalUrl; } });
Object.defineProperty(exports, "uriS5Prefix", { enumerable: true, get: function () { return s5_utils_js_1.uriS5Prefix; } });
