/**
 * TUS proxy: forwards PATCH/HEAD requests to the Cloudflare upload URL.
 * The browser sends chunks to us; we forward to Cloudflare to avoid CORS.
 * Cloudflare requires Authorization on PATCH/HEAD; we add it server-side.
 */

import { NextRequest, NextResponse } from "next/server";

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset, Content-Type",
  "Access-Control-Expose-Headers": "Location, Upload-Offset, Upload-Length, stream-media-id",
};

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  if (CF_API_TOKEN) {
    headers["Authorization"] = `Bearer ${CF_API_TOKEN}`;
  }
  const forward = [
    "tus-resumable",
    "upload-offset",
    "upload-length",
    "content-type",
    "content-length",
  ];
  for (const name of forward) {
    const val = request.headers.get(name);
    if (val) headers[name] = val;
  }
  return headers;
}

export async function PATCH(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  if (!target) {
    return NextResponse.json(
      { error: "Missing target query parameter" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json(
      { error: "Invalid target URL" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const headers = forwardHeaders(request);

  try {
    const body = await request.arrayBuffer();
    const res = await fetch(targetUrl.toString(), {
      method: "PATCH",
      headers,
      body: body.byteLength > 0 ? body : undefined,
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    const copyHeaders = [
      "tus-resumable",
      "upload-offset",
      "upload-length",
      "upload-expires",
      "stream-media-id",
    ];
    for (const name of copyHeaders) {
      const val = res.headers.get(name);
      if (val) responseHeaders.set(name, val);
    }

    const resBody = res.status === 204 ? null : await res.arrayBuffer();
    return new NextResponse(resBody, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause ? String(err.cause) : "";
    console.error("TUS proxy PATCH error:", message, cause, err);
    return NextResponse.json(
      {
        error: "Failed to forward upload chunk to Cloudflare",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export async function HEAD(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  if (!target) {
    return new NextResponse(null, {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new NextResponse(null, {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const headers = forwardHeaders(request);

  try {
    const res = await fetch(targetUrl.toString(), {
      method: "HEAD",
      headers,
    });

    const responseHeaders = new Headers(CORS_HEADERS);
    const copyHeaders = [
      "tus-resumable",
      "upload-offset",
      "upload-length",
      "upload-expires",
      "cache-control",
      "stream-media-id",
    ];
    for (const name of copyHeaders) {
      const val = res.headers.get(name);
      if (val) responseHeaders.set(name, val);
    }

    return new NextResponse(null, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("TUS proxy HEAD error:", err);
    return NextResponse.json(
      { error: "Failed to forward HEAD to Cloudflare" },
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
