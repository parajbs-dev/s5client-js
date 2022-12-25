import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { S5Client } from "./client";
export type Headers = {
    [key: string]: string;
};
/**
 * Helper function that builds the request headers.
 *
 * @param [baseHeaders] - Any base headers.
 * @param [customUserAgent] - A custom user agent to set.
 * @param [customCookie] - A custom cookie.
 * @param [s5ApiKey] - Authentication key to use for a S5 portal.
 * @returns - The built headers.
 */
export declare function buildRequestHeaders(baseHeaders?: Headers, customUserAgent?: string, customCookie?: string, s5ApiKey?: string): Headers;
/**
 * Helper function that builds the request URL. Ensures that the final URL
 * always has a protocol prefix for consistency.
 *
 * @param client - The S5 client.
 * @param parts - The URL parts to use when constructing the URL.
 * @param [parts.baseUrl] - The base URL to use, instead of the portal URL.
 * @param [parts.endpointPath] - The endpoint to contact.
 * @param [parts.subdomain] - An optional subdomain to add to the URL.
 * @param [parts.extraPath] - An optional path to append to the URL.
 * @param [parts.query] - Optional query parameters to append to the URL.
 * @returns - The built URL.
 */
export declare function buildRequestUrl(client: S5Client, parts: {
    baseUrl?: string;
    endpointPath?: string;
    subdomain?: string;
    extraPath?: string;
    query?: {
        [key: string]: string | undefined;
    };
}): Promise<string>;
/**
 * The error type returned by the SDK whenever it makes a network request
 * (internally, this happens in `executeRequest`). It implements, so is
 * compatible with, `AxiosError`.
 */
export declare class ExecuteRequestError<T = any, D = any> extends Error implements AxiosError {
    originalError: AxiosError;
    responseStatus: number | null;
    responseMessage: string | null;
    config: AxiosRequestConfig<D>;
    code?: string;
    request?: any;
    response?: AxiosResponse<T, D>;
    isAxiosError: boolean;
    toJSON: () => object;
    /**
     * Creates an `ExecuteRequestError`.
     *
     * @param message - The error message.
     * @param axiosError - The original Axios error.
     * @param responseStatus - The response status, if found in the original error.
     * @param responseMessage - The response message, if found in the original error.
     */
    constructor(message: string, axiosError: AxiosError<T, D>, responseStatus: number | null, responseMessage: string | null);
    /**
     * Gets the full, descriptive error response returned from skyd on the portal.
     *
     * @param err - The Axios error.
     * @returns - A new error if the error response is malformed, or the skyd error message otherwise.
     */
    static From(err: AxiosError<any, any>): ExecuteRequestError;
}
//# sourceMappingURL=request.d.ts.map