import { S5Client } from "./client";

import { DEFAULT_PIN_OPTIONS, CustomPinOptions } from "./defaults";

/**
 * Pins a S5 Cid using the S5Client instance.
 *
 * @param this - The instance of the S5Client object.
 * @param cid - The CID to be pinned.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns A Promise that resolves with a string indicating the result of the pinning operation ("successful" or "failed").
 */
export async function pinCid(this: S5Client, cid: string, customOptions?: CustomPinOptions): Promise<string> {
  // Merge default pin options, customOptions, and this.customOptions into opts
  const opts = { ...DEFAULT_PIN_OPTIONS, ...this.customOptions, ...customOptions };

  // Variable to store the result of the pinning operation
  let responseMessage: string;

  try {
    // Execute the pinning request asynchronously
    const response = await this.executeRequest({
      ...opts,
      method: "post",
      extraPath: cid,
    });

    // Check the response status and set responseMessage accordingly
    if (response.status === 200) {
      responseMessage = "successful";
    } else {
      responseMessage = "failed";
    }

    return responseMessage;
  } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log(e.message);
    return (responseMessage = "failed");
  }
}
