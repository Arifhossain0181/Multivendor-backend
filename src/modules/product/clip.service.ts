const MODEL_ID = "Xenova/clip-vit-base-patch32";

type Loaded = { processor: any; model: any; RawImage: any };

let loading: Promise<Loaded> | null = null;

// মডেল একবারই লোড হবে, সার্ভার স্টার্ট ধীর হবে না
function loadClip(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const tf: any = await import("@xenova/transformers");
      tf.env.allowLocalModels = false;

      const [processor, model] = await Promise.all([
        tf.AutoProcessor.from_pretrained(MODEL_ID),
        tf.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
      ]);

      return { processor, model, RawImage: tf.RawImage };
    })().catch((e) => {
      loading = null; // ফেইল করলে পরের রিকোয়েস্টে আবার চেষ্টা করবে
      throw e;
    });
  }
  return loading;
}

export type ImageInput = Buffer | string; // Buffer = আপলোড করা ছবি, string = URL

export async function generateImageEmbedding(
  input: ImageInput,
  mime = "image/jpeg"
): Promise<number[]> {
  try {
    const { processor, model, RawImage } = await loadClip();

    const image = Buffer.isBuffer(input)
      ? await RawImage.fromBlob(new Blob([new Uint8Array(input)], { type: mime }))
      : await RawImage.read(input);

    const inputs = await processor(image); // { pixel_values }
    const { image_embeds } = await model(inputs);

    const vec = Array.from(image_embeds.data as Float32Array);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;

    return vec.map((v) => v / norm); // ৫১২ ডাইমেনশন, নরমালাইজড
  } catch (error: any) {
    console.error("[CLIP] Failed:", error.message);
    throw new Error(`Failed to generate image embedding: ${error.message}`);
  }
}

export const warmUpClip = () => loadClip();

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
};