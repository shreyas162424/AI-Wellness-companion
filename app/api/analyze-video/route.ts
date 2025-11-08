import { type NextRequest, NextResponse } from "next/server"

interface VideoAnalysisResponse {
  success: boolean
  recording_id: string
  timestamp: string
  analysis: {
    video_analysis: {
      duration: number
      fps: number
      total_frames: number
      processed_frames: number
      detected_objects: Record<string, any>
      frame_detections: Array<any>
    }
    audio_analysis?: {
      wellness_score: number
      stress_level: number
      energy_level: number
      hydration_level: number
      emotions: Record<string, number>
      primary_emotion: string
      voice_quality: any
      health_indicators: any
    }
    wellness_score: number
    stress_level: number
    energy_level: number
    emotions: Record<string, number>
    primary_emotion: string
  }
  recommendations: Array<{
    type: string
    priority: string
    message: string
  }>
  metadata: {
    processing_time_ms: number
    model_version: string
    video_model: string
    audio_model?: string
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()

    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:5000"

    try {
      const backendResponse = await fetch(`${backendUrl}/infer_video`, {
        method: "POST",
        body: formData,
      })

      if (!backendResponse.ok) {
        console.error("[v0] Python backend error:", backendResponse.status)
        throw new Error(`Backend returned ${backendResponse.status}`)
      }

      const analysisResult: VideoAnalysisResponse = await backendResponse.json()

      if (!analysisResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: analysisResult.error || "Video processing failed",
            message: analysisResult.message || "Could not process video",
          },
          { status: 400 }
        )
      }

      // Map Python backend response to frontend format
      const response = {
        success: analysisResult.success,
        score: Math.round(analysisResult.analysis.wellness_score || 70),
        emotion: analysisResult.analysis.primary_emotion?.toLowerCase() || "neutral",
        stress_level: Math.round(analysisResult.analysis.stress_level || 30),
        energy_level: Math.round(analysisResult.analysis.energy_level || 60),
        hydration_level: analysisResult.analysis.audio_analysis?.hydration_level || 55,
        emotions: analysisResult.analysis.emotions || {},
        video_analysis: analysisResult.analysis.video_analysis,
        audio_analysis: analysisResult.analysis.audio_analysis,
        voice_quality: analysisResult.analysis.audio_analysis?.voice_quality,
        health_indicators: analysisResult.analysis.audio_analysis?.health_indicators,
        suggestions: analysisResult.recommendations?.map((rec) => ({
          type: rec.type,
          priority: rec.priority,
          message: rec.message,
        })) || [],
        confidence_score: analysisResult.metadata.confidence_score || 0,
        processing_time_ms: analysisResult.metadata.processing_time_ms,
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json(response)
    } catch (backendError) {
      console.error("[v0] Failed to reach Python backend:", backendError)
      return NextResponse.json(
        {
          success: false,
          error: "Backend unavailable",
          fallback: true,
          message: "Python backend is not running. Please ensure FVATool.py is running on localhost:5000",
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("[v0] Video Analysis API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process video", message: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    message: "Video Analysis API is running",
    note: "Send video file via POST to /api/analyze-video",
  })
}

