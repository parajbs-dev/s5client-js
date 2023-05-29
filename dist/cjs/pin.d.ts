import { S5Client } from "./client";
import { CustomPinOptions } from "./defaults";
/**
 * Pins a S5 Cid using the S5Client instance.
 *
 * @param this - The instance of the S5Client object.
 * @param cid - The CID to be pinned.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns A Promise that resolves with a string indicating the result of the pinning operation ("successful" or "failed").
 */
export declare function pinCid(this: S5Client, cid: string, customOptions?: CustomPinOptions): Promise<string>;
//# sourceMappingURL=pin.d.ts.map