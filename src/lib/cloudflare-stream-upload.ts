/**
 * Cloudflare Stream upload via TUS (resumable) for all file sizes.
 * Uses Next.js proxy (/api/tus-upload) so the API token stays server-side.
 * On success, returns the video UID; the page saves poster + details via Save Changes.
 */

/** Chunk size for TUS: min 5 MB, must be multiple of 256 KiB (Cloudflare). */
const TUS_CHUNK_SIZE = 5 * 1024 * 1024;

function getTusEndpoint(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/tus-upload`;
  }
  return "/api/tus-upload";
}

export interface UploadContentResponse {
  data?: {
    uploadURL: string;
    videoUID: string;
  };
  message?: string;
}

export interface CloudflareUploadCallbacks {
  onProgress?: (
    percent: number,
    bytesUploaded: number,
    bytesTotal: number,
  ) => void;
  onSuccess?: (videoUID: string) => void;
  onError?: (error: Error) => void;
}

export interface TusUploadInstance {
  abort: () => boolean;
}

/** Extract video ID from our proxy URL (target param contains the Cloudflare URL). */
function getVideoIdFromProxyUrl(url: string): string {
  try {
    const u = new URL(url);
    const target = u.searchParams.get("target");
    if (!target) return "";
    const targetUrl = new URL(decodeURIComponent(target));
    const pathParts = targetUrl.pathname.split("/");
    const mediaIdx = pathParts.indexOf("media");
    if (mediaIdx >= 0 && pathParts[mediaIdx + 1]) {
      return pathParts[mediaIdx + 1].split("?")[0] ?? "";
    }
    return "";
  } catch {
    return "";
  }
}

async function uploadViaTus(
  file: File,
  title: string,
  description: string,
  token: string | null,
  callbacks: CloudflareUploadCallbacks,
): Promise<TusUploadInstance | null> {
  const { onProgress, onSuccess, onError } = callbacks;

  const { Upload } = await import("tus-js-client");

  let capturedVideoId = "";
  let uploadCompleted = false;
  const fileSize = file.size;
  let lastProgress = 0;
  let lastProgressTime = Date.now();
  let inactivityTimeout: NodeJS.Timeout | null = null;

  const upload = new Upload(file, {
    endpoint: getTusEndpoint(),
    uploadSize: file.size,
    chunkSize: TUS_CHUNK_SIZE,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    metadata: {
      name: title.trim() || file.name,
    },
    onAfterResponse(
      _req: unknown,
      res: { getHeader?: (name: string) => string | null },
    ) {
      const mediaId = res.getHeader?.("stream-media-id");
      if (mediaId && !capturedVideoId) {
        console.log("[TUS] Captured video ID from header:", mediaId);
        capturedVideoId = mediaId;
      }
    },
    onError(error: unknown) {
      const err =
        error instanceof Error
          ? error
          : new Error(String(error ?? "TUS upload failed"));
      console.error("[TUS] Upload error:", err);
      onError?.(err);
    },
    onProgress(bytesUploaded: number, bytesTotal: number) {
      const percent =
        bytesTotal > 0 ? Math.min(100, (bytesUploaded / bytesTotal) * 100) : 0;

      onProgress?.(percent, bytesUploaded, bytesTotal);
      lastProgress = percent;
      lastProgressTime = Date.now();

      // If we've reached 100% or all bytes uploaded and have a video ID, trigger success
      if ((percent >= 99.9 || bytesUploaded >= bytesTotal) && capturedVideoId && !uploadCompleted) {
        // Small delay to ensure Cloudflare has finalized
        setTimeout(() => {
          if (!uploadCompleted) {
            handleUploadComplete();
          }
        }, 1000);
      }
    },
    async onSuccess() {
      console.log("[TUS] onSuccess callback triggered");
      handleUploadComplete();
    },
  });

  function handleUploadComplete() {
    if (uploadCompleted) return;
    uploadCompleted = true;

    console.log("[TUS] Upload completed");
    console.log("[TUS] Video ID:", capturedVideoId);

    if (!capturedVideoId) {
      const error = new Error("Upload completed but no video ID was captured. Try uploading again.");
      console.error("[TUS] Error:", error.message);
      onError?.(error);
      return;
    }

    console.log("[TUS] ✅ Success! Video ID:", capturedVideoId);
    onSuccess?.(capturedVideoId);
  }

  upload.start();

  return {
    abort: () => {
      upload.abort();
      return true;
    },
  };
}

/**
 * Upload video to Cloudflare Stream via TUS (resumable) for all file sizes.
 */
export async function uploadVideoToCloudflareStream(
  file: File,
  title: string,
  description: string,
  token: string | null,
  callbacks: CloudflareUploadCallbacks = {},
): Promise<TusUploadInstance | null> {
  const { onError } = callbacks;

  if (!file || !title?.trim()) {
    const err = new Error("File and title are required.");
    onError?.(err);
    return null;
  }

  return uploadViaTus(file, title, description, token, callbacks);
}
