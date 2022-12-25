import { CustomClientOptions } from "../client";

// TODO: Unnecessary, remove.
/**
 * Base custom options for methods hitting the API.
 */
export type BaseCustomOptions = CustomClientOptions;

// TODO: Move to client.ts.
/**
 * The default base custom options.
 */
export const DEFAULT_BASE_OPTIONS = {
  APIKey: "",
  s5ApiKey: "",
  customUserAgent: "",
  customCookie: "",
  onDownloadProgress: undefined,
  onUploadProgress: undefined,
  loginFn: undefined,
};
