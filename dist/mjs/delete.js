import { DEFAULT_DELETE_OPTIONS } from "./defaults";
/**
 * Deletes a S5 Cid using an HTTP DELETE request.
 *
 * @param this - An instance of S5Client.
 * @param cid - The S5 Cid to be deleted.
 * @param [customOptions] - Additional settings that can optionally be set.
 * @returns A promise that resolves to a string indicating the result of the delete operation ("successful" or "failed").
 */
export async function deleteCid(cid, customOptions) {
    // Merge default delete options with custom options
    const opts = { ...DEFAULT_DELETE_OPTIONS, ...this.customOptions, ...customOptions };
    // Variable to store the response message
    let responseMessage;
    try {
        // Execute the delete request
        const response = await this.executeRequest({
            ...opts,
            method: "delete",
            extraPath: cid,
        });
        // Check the response status and set the response message accordingly
        if (response.status === 200) {
            responseMessage = "successful";
        }
        else {
            responseMessage = "failed";
        }
        return responseMessage;
    }
    catch (e) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log(e.message);
        return (responseMessage = "failed");
    }
}
