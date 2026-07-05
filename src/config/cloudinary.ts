import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data-URL (or a remote URL) to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export const uploadImage = async (
    base64DataUrl: string,
    folder = "products"
): Promise<string> => {
    const result = await cloudinary.uploader.upload(base64DataUrl, {
        folder,
        resource_type: "image",
        transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // cap max size
            { quality: "auto", fetch_format: "auto" },     // optimise
        ],
    });

    return result.secure_url;
};

/**
 * Upload multiple base64 data-URLs in parallel.
 * Returns an array of secure URLs.
 */
export const uploadImages = async (
    base64DataUrls: string[],
    folder = "products"
): Promise<string[]> => {
    return Promise.all(
        base64DataUrls.map((url) => uploadImage(url, folder))
    );
};

export default cloudinary;
