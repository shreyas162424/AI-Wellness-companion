// app/api/analyze/route.js
export async function POST(request) {
  try {
    // Try to get formData (works in Node runtime). If unavailable, fall back to arrayBuffer.
    let formData;
    try {
      formData = await request.formData();
    } catch {
      // fallback: build a passthrough body
      const buf = await request.arrayBuffer();
      const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
      const backendResponse = await fetch(`${backendUrl}/infer`, {
        method: "POST",
        body: Buffer.from(buf),
        headers: { "content-type": request.headers.get("content-type") || "application/octet-stream" }
      });
      if (!backendResponse.ok) {
        const errText = await safeText(backendResponse);
        console.error("[v0] Backend error (arrayBuffer fallback):", backendResponse.status, errText);
        return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: errText }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
      }
      const json = await backendResponse.json();
      return new Response(JSON.stringify(mapAudioResponse(json)), { status: backendResponse.status, headers: { "content-type": "application/json" }});
    }

    const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

    // Forward formData to backend
    const backendForm = new FormData();
    // copy all formData entries (files + simple fields)
    for (const entry of formData.entries()) {
      backendForm.append(entry[0], entry[1]);
    }

    const backendResponse = await fetch(`${backendUrl}/infer`, {
      method: "POST",
      body: backendForm
    });

    if (!backendResponse.ok) {
      const errBody = await safeParse(backendResponse);
      console.error("[v0] Python backend error:", backendResponse.status, errBody);
      return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: errBody }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
    }

    const analysisResult = await backendResponse.json();
    const mapped = mapAudioResponse(analysisResult);
    return new Response(JSON.stringify(mapped), { status: 200, headers: { "content-type": "application/json" }});
  } catch (err) {
    console.error("[v0] Analysis API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Failed to process recording", message: String(err) }), { status: 500, headers: { "content-type": "application/json" }});
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "healthy", message: "Analysis API is running", note: "POST audio as multipart/form-data to this route" }), { status: 200, headers: { "content-type": "application/json" }});
}

/* Helpers */
function mapAudioResponse(analysisResult = {}) {
  try {
    const analysis = analysisResult.analysis || {};
    const metadata = analysisResult.metadata || {};
    return {
      success: !!analysisResult.success,
      score: Math.round(analysis.wellness_score ?? 0),
      emotion: (analysis.primary_emotion || "neutral").toLowerCase(),
      stress_level: Math.round(analysis.stress_level ?? 0),
      energy_level: Math.round(analysis.energy_level ?? 0),
      hydration_level: Math.round(analysis.hydration_level ?? 0),
      emotions: analysis.emotions || {},
      voice_quality: analysis.voice_quality || {},
      health_indicators: analysis.health_indicators || {},
      suggestions: (analysisResult.recommendations || []).map(r => ({ type: r.type, priority: r.priority, message: r.message })),
      confidence_score: metadata.confidence_score ?? 0,
      processing_time_ms: metadata.processing_time_ms ?? 0,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { success: false, error: "MAPPING_FAILED", message: String(e) };
  }
}

async function safeParse(resp) {
  try { return await resp.json(); } catch { return await safeText(resp); }
}
async function safeText(resp) {
  try { return await resp.text(); } catch { return null; }
}
