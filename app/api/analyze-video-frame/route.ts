// app/api/analyze-video-frame/route.js
export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      // fallback to arrayBuffer: cannot extract 'frame' file, so forward raw body
      const buf = await request.arrayBuffer();
      const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
      const backendResponse = await fetch(`${backendUrl}/infer_frame`, {
        method: "POST",
        body: Buffer.from(buf),
        headers: { "content-type": request.headers.get("content-type") || "application/octet-stream" }
      });
      if (!backendResponse.ok) {
        const err = await safeParse(backendResponse);
        console.error("[v0] Backend error (frame arrayBuffer fallback):", backendResponse.status, err);
        return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: err }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
      }
      const json = await backendResponse.json();
      if (json.success && !json.detections) json.detections = [];
      return new Response(JSON.stringify(json), { status: 200, headers: { "content-type": "application/json" }});
    }

    const frameFile = formData.get("frame");
    if (!frameFile) {
      return new Response(JSON.stringify({ success: false, error: "NO_FRAME", message: "No frame file provided" }), { status: 400, headers: { "content-type": "application/json" }});
    }

    const conf = String(formData.get("conf") ?? "0.25");
    const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
    const backendForm = new FormData();
    backendForm.append("frame", frameFile);
    backendForm.append("conf", conf);

    const backendResponse = await fetch(`${backendUrl}/infer_frame`, {
      method: "POST",
      body: backendForm
    });

    if (!backendResponse.ok) {
      const errBody = await safeParse(backendResponse);
      console.error("[v0] Python backend error:", backendResponse.status, errBody);
      return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: errBody }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
    }

    const result = await backendResponse.json();
    if (result.success && !result.detections) result.detections = [];
    return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" }});
  } catch (err) {
    console.error("[v0] Frame Analysis API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Failed to process frame", message: String(err) }), { status: 500, headers: { "content-type": "application/json" }});
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "healthy", message: "Frame Analysis API is running", note: "POST frame file multipart/form-data to this route" }), { status: 200, headers: { "content-type": "application/json" }});
}

/* Helpers */
async function safeParse(resp) {
  try { return await resp.json(); } catch { return await safeText(resp); }
}
async function safeText(resp) {
  try { return await resp.text(); } catch { return null; }
}
