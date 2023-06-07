import { S5Client } from "./client";
import { CustomDeleteOptions } from "./defaults";
/**
 * Deletes a S5 Cid using an HTTP DELETE request.
 *
 * @param this - An instance of S5Client.
 * @param cid - The S5 Cid to be deleted.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns A promise that resolves to a string indicating the result of the delete operation ("successful" or "failed").
 */
export declare function deleteCid(this: S5Client, cid: string, customOptions?: CustomDeleteOptions): Promise<string>;
//# sourceMappingURL=delete.d.ts.map