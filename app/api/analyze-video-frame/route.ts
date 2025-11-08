import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const frameFile = formData.get("frame") as File

    if (!frameFile) {
      return NextResponse.json(
        { success: false, error: "NO_FRAME", message: "No frame file provided" },
        { status: 400 }
      )
    }

    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:5000"
    const conf = formData.get("conf") || "0.25"

    try {
      const backendFormData = new FormData()
      backendFormData.append("frame", frameFile)
      backendFormData.append("conf", conf as string)

      const backendResponse = await fetch(`${backendUrl}/infer_frame`, {
        method: "POST",
        body: backendFormData,
      })

      if (!backendResponse.ok) {
        console.error("[v0] Python backend error:", backendResponse.status)
        throw new Error(`Backend returned ${backendResponse.status}`)
      }

      const result = await backendResponse.json()
      
      // Ensure detections array is included in response
      if (result.success && !result.detections) {
        result.detections = []
      }
      
      return NextResponse.json(result)
    } catch (backendError) {
      console.error("[v0] Failed to reach Python backend:", backendError)
      // Return empty result instead of error to not break live recording
      return NextResponse.json({
        success: false,
        detected_objects: {},
        message: "Backend unavailable for frame analysis",
      })
    }
  } catch (error) {
    console.error("[v0] Frame Analysis API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process frame", message: String(error) },
      { status: 500 }
    )
  }
}

