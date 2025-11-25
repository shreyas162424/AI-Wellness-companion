// app/api/analyze-video/route.js
export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      // fallback to arrayBuffer passthrough
      const buf = await request.arrayBuffer();
      const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
      const backendResponse = await fetch(`${backendUrl}/infer_video`, {
        method: "POST",
        body: Buffer.from(buf),
        headers: { "content-type": request.headers.get("content-type") || "application/octet-stream" }
      });
      if (!backendResponse.ok) {
        const err = await safeParse(backendResponse);
        console.error("[v0] Backend error (video arrayBuffer fallback):", backendResponse.status, err);
        return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: err }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
      }
      const json = await backendResponse.json();
      return new Response(JSON.stringify(mapVideoResponse(json)), { status: 200, headers: { "content-type": "application/json" }});
    }

    const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
    const backendForm = new FormData();
    for (const entry of formData.entries()) backendForm.append(entry[0], entry[1]);

    const backendResponse = await fetch(`${backendUrl}/infer_video`, {
      method: "POST",
      body: backendForm
    });

    if (!backendResponse.ok) {
      const errBody = await safeParse(backendResponse);
      console.error("[v0] Python backend error:", backendResponse.status, errBody);
      return new Response(JSON.stringify({ success: false, error: "BACKEND_ERROR", details: errBody }), { status: backendResponse.status, headers: { "content-type": "application/json" }});
    }

    const analysisResult = await backendResponse.json();
    if (!analysisResult.success) {
      return new Response(JSON.stringify({ success: false, error: analysisResult.error || "Video processing failed", message: analysisResult.message || "" }), { status: 400, headers: { "content-type": "application/json" }});
    }

    const mapped = mapVideoResponse(analysisResult);
    return new Response(JSON.stringify(mapped), { status: 200, headers: { "content-type": "application/json" }});
  } catch (err) {
    console.error("[v0] Video Analysis API error:", err);
    return new Response(JSON.stringify({ success: false, error: "Failed to process video", message: String(err) }), { status: 500, headers: { "content-type": "application/json" }});
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "healthy", message: "Video Analysis API is running", note: "POST video as multipart/form-data to this route" }), { status: 200, headers: { "content-type": "application/json" }});
}

/* Helpers */
function mapVideoResponse(analysisResult = {}) {
  try {
    const analysis = analysisResult.analysis || {};
    const metadata = analysisResult.metadata || {};
    return {
      success: !!analysisResult.success,
      score: Math.round(analysis.wellness_score ?? analysis.audio_analysis?.wellness_score ?? 0),
      emotion: (analysis.primary_emotion || "neutral").toLowerCase(),
      stress_level: Math.round(analysis.stress_level ?? 0),
      energy_level: Math.round(analysis.energy_level ?? 0),
      hydration_level: analysis.audio_analysis?.hydration_level ?? 55,
      emotions: analysis.emotions || analysis.audio_analysis?.emotions || {},
      video_analysis: analysis.video_analysis || {},
      audio_analysis: analysis.audio_analysis || null,
      voice_quality: analysis.audio_analysis?.voice_quality || {},
      health_indicators: analysis.audio_analysis?.health_indicators || {},
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
