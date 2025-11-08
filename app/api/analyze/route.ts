import { type NextRequest, NextResponse } from "next/server"

interface AnalysisResponse {
  success: boolean
  recording_id: string
  timestamp: string
  analysis: {
    wellness_score: number
    stress_level: number
    energy_level: number
    hydration_level: number
    emotions: {
      happy: number
      calm: number
      stressed: number
      tired: number
      surprised: number
      neutral: number
    }
    primary_emotion: string
    voice_quality: {
      clarity: number
      volume_consistency: number
      speech_rate: string
    }
    health_indicators: {
      breathing_rate: string
      voice_tone: string
      fatigue_detected: boolean
    }
  }
  recommendations: Array<{
    type: string
    priority: string
    message: string
  }>
  metadata: {
    processing_time_ms: number
    model_version: string
    confidence_score: number
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()

    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:5000"

    try {
      const backendResponse = await fetch(`${backendUrl}/infer`, {
        method: "POST",
        body: formData,
      })

      if (!backendResponse.ok) {
        console.error("[v0] Python backend error:", backendResponse.status)
        throw new Error(`Backend returned ${backendResponse.status}`)
      }

      const analysisResult: AnalysisResponse = await backendResponse.json()

      // Map Python backend response to frontend format
      const response = {
        success: analysisResult.success,
        score: Math.round(analysisResult.analysis.wellness_score),
        emotion: analysisResult.analysis.primary_emotion.toLowerCase(),
        stress_level: Math.round(analysisResult.analysis.stress_level),
        energy_level: Math.round(analysisResult.analysis.energy_level),
        hydration_level: Math.round(analysisResult.analysis.hydration_level),
        emotions: analysisResult.analysis.emotions,
        voice_quality: analysisResult.analysis.voice_quality,
        health_indicators: analysisResult.analysis.health_indicators,
        suggestions: analysisResult.recommendations.map((rec) => ({
          type: rec.type,
          priority: rec.priority,
          message: rec.message,
        })),
        confidence_score: analysisResult.metadata.confidence_score,
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
          message: "Python backend is not running. Please ensure app.py is running on localhost:5000",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("[v0] Analysis API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process recording", message: String(error) },
      { status: 500 },
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    message: "Analysis API is running",
    note: "Send audio file via POST to /api/analyze",
  })
}
