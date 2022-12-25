"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileMimeType = void 0;
const lite_1 = __importDefault(require("mime/lite"));
const path_browserify_1 = __importDefault(require("path-browserify"));
const string_1 = require("./string");
/**
 * Get the file mime type. In case the type is not provided, try to guess the
 * file type based on the extension.
 *
 * @param file - The file.
 * @returns - The mime type.
 */
function getFileMimeType(file) {
    if (file.type)
        return file.type;
    let ext = path_browserify_1.default.extname(file.name);
    ext = (0, string_1.trimPrefix)(ext, ".");
    if (ext !== "") {
        const mimeType = lite_1.default.getType(ext);
        if (mimeType) {
            return mimeType;
        }
    }
    return "";
}
exports.getFileMimeType = getFileMimeType;
