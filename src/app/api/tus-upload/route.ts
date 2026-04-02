/**
 * TUS proxy for Cloudflare Stream: proxies ALL TUS requests (POST create + PATCH chunks)
 * through our server to avoid CORS when the browser would otherwise PATCH directly to
 * Cloudflare's edge-production.gateway.api.cloudflare.com (which blocks cross-origin).
 */

import { NextRequest, NextResponse } from "next/server";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_TUS_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset, Content-Type",
  "Access-Control-Expose-Headers":
    "Location, Upload-Offset, Upload-Length, stream-media-id",
};

export async function POST(request: NextRequest) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    return NextResponse.json(
      {
        error:
          "TUS upload not configured: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN",
      },
      { status: 500 },
    );
  }

  const tusResumable = request.headers.get("tus-resumable");
  const uploadLength = request.headers.get("upload-length");
  const uploadMetadata = request.headers.get("upload-metadata");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${CF_API_TOKEN}`,
    "Tus-Resumable": tusResumable ?? "1.0.0",
    ...(uploadLength && { "Upload-Length": uploadLength }),
    ...(uploadMetadata && { "Upload-Metadata": uploadMetadata }),
  };

  try {
    const res = await fetch(CF_TUS_ENDPOINT, {
      method: "POST",
      headers,
      body: undefined,
    });

    console.log("[TUS POST] Response status:", res.status);
    console.log("[TUS POST] Response headers:", Object.fromEntries(res.headers));

    const responseHeaders = new Headers(CORS_HEADERS);
    responseHeaders.set(
      "Tus-Resumable",
      res.headers.get("Tus-Resumable") ?? "1.0.0",
    );
    const streamMediaId = res.headers.get("stream-media-id");
    console.log("[TUS POST] stream-media-id header:", streamMediaId);

    if (streamMediaId) {
      responseHeaders.set("stream-media-id", streamMediaId);
      console.log("[TUS POST] Set stream-media-id in response:", streamMediaId);
    }

    const cloudflareLocation = res.headers.get("Location");
    if (cloudflareLocation) {
      const origin = new URL(request.url).origin;
      const proxyLocation = `${origin}/api/tus-upload/proxy?target=${encodeURIComponent(cloudflareLocation)}`;
      responseHeaders.set("Location", proxyLocation);
      console.log("[TUS POST] Cloudflare Location:", cloudflareLocation);
      console.log("[TUS POST] Proxy Location:", proxyLocation);
    }

    const body = await res.text();
    return new NextResponse(body || undefined, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[TUS POST] Error:", message);
    console.error("[TUS POST] Full error:", err);
    return NextResponse.json(
      { error: "Failed to create TUS upload with Cloudflare" },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
