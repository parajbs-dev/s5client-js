import { CustomClientOptions } from "../client";
/**
 * Base custom options for methods hitting the API.
 */
export type BaseCustomOptions = CustomClientOptions;
/**
 * The default base custom options.
 */
export declare const DEFAULT_BASE_OPTIONS: {
    APIKey: string;
    s5ApiKey: string;
    customUserAgent: string;
    customCookie: string;
    onDownloadProgress: undefined;
    onUploadProgress: undefined;
    loginFn: undefined;
};
//# sourceMappingURL=options.d.ts.map