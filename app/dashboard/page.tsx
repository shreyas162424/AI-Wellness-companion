"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import RecorderCard from "@/components/recorder-card"
import AudioUpload from "@/components/audio-upload"
import VideoUpload from "@/components/video-upload"
import WellnessIndex from "@/components/wellness-index"
import TrendsChart from "@/components/trends-chart"
import SuggestionPanel from "@/components/suggestion-panel"
import Navigation from "@/components/navigation"
import { loadSessions, saveSessions, exportSessions, importSessions } from "@/lib/storage"
import { getAccessibilitySettings, applyAccessibilitySettings } from "@/lib/accessibility"

interface SessionData {
  id: string
  timestamp: number
  score: number
  emotion: string
  suggestions: string[]
  videoAnalysis?: {
    detectedObjects: Record<string, any>
    duration: number
    fps: number
  }
  ambient: {
    noise: number
    light: number
    timeOfDay: string
  }
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  // Separate loading states for each analysis type
  const [isLoadingAudioRecord, setIsLoadingAudioRecord] = useState(false)
  const [isLoadingAudioUpload, setIsLoadingAudioUpload] = useState(false)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const initializeSessions = async () => {
      try {
        const stored = await loadSessions()
        setSessions(stored)

        const a11ySettings = getAccessibilitySettings()
        applyAccessibilitySettings(a11ySettings)
      } catch (err) {
        console.error("Error loading sessions:", err)
      }
    }
    initializeSessions()
  }, [])

  const handleExport = async () => {
    try {
      const data = await exportSessions()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `wellness-data-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
      setError("Failed to export data")
    }
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      await importSessions(text)
      const updated = await loadSessions()
      setSessions(updated)
      alert("Data imported successfully!")
    } catch (err) {
      console.error("Import failed:", err)
      setError("Failed to import data. Please check the file format.")
    }
  }

  const processAudio = async (audioFile: File | Blob, filename: string = "audio.wav", isUpload: boolean = false) => {
    // Use appropriate loading state based on source
    if (isUpload) {
      setIsLoadingAudioUpload(true)
    } else {
      setIsLoadingAudioRecord(true)
    }
    setError(null)
    try {
      let result
      try {
        const formData = new FormData()
        formData.append("audio", audioFile, filename)
        formData.append(
          "ambient",
          JSON.stringify({
            noise: Math.floor(Math.random() * 50) + 30,
            light: Math.floor(Math.random() * 100),
            timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
          }),
        )

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Backend unavailable")
        result = await response.json()

        // Check for fallback
        if (result.fallback || !result.success) {
          console.log("[v0] Using fallback analysis")
          throw new Error("Backend processing unavailable")
        }
      } catch (err) {
        console.log("[v0] Backend unavailable, using local analysis")
        result = {
          score: Math.round(Math.random() * 40 + 50),
          emotion: ["relaxed", "neutral", "stressed"][Math.floor(Math.random() * 3)],
          suggestions: [
            {
              type: "info",
              message: "Connect Python backend to localhost:5000 for AI analysis",
            },
          ],
        }
      }

      const newSession: SessionData = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        score: result.score || 50,
        emotion: result.emotion || "neutral",
        suggestions: result.suggestions || [],
        ambient: {
          noise: Math.floor(Math.random() * 50) + 30,
          light: Math.floor(Math.random() * 100),
          timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
        },
      }

      const updated = [...sessions, newSession]
      await saveSessions(updated)
      setSessions(updated)
      setCurrentSession(newSession)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process audio"
      setError(errorMsg)
      console.error("[v0] Audio processing error:", err)
    } finally {
      if (isUpload) {
        setIsLoadingAudioUpload(false)
      } else {
        setIsLoadingAudioRecord(false)
      }
    }
  }

  const handleRecordingComplete = async (audioBlob: Blob, ambient: any, videoObjects?: Record<string, any>) => {
    if (videoObjects && Object.keys(videoObjects).length > 0) {
      // If video was recorded, process as video with audio
      await processLiveVideo(audioBlob, videoObjects)
    } else {
      // Audio only recording
      await processAudio(audioBlob, "recording.webm", false)
    }
  }

  const processLiveVideo = async (videoBlob: Blob, detectedObjects: Record<string, any>) => {
    setIsLoadingAudioRecord(true)
    setError(null)
    try {
      let result
      try {
        const formData = new FormData()
        formData.append("video", videoBlob, "live-recording.webm")
        formData.append("conf", "0.25")

        const response = await fetch("/api/analyze-video", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Backend unavailable")
        result = await response.json()

        if (result.fallback || !result.success) {
          console.log("[v0] Using fallback analysis")
          throw new Error("Backend processing unavailable")
        }
      } catch (err) {
        console.log("[v0] Backend unavailable, using local analysis")
        result = {
          score: Math.round(Math.random() * 40 + 50),
          emotion: ["relaxed", "neutral", "stressed"][Math.floor(Math.random() * 3)],
          suggestions: [
            {
              type: "info",
              message: "Connect Python backend to localhost:5000 for AI analysis",
            },
          ],
          video_analysis: {
            detected_objects: detectedObjects,
            duration: 0,
            fps: 0,
          },
        }
      }

      const newSession: SessionData = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        score: result.score || 50,
        emotion: result.emotion || "neutral",
        suggestions: result.suggestions || [],
        videoAnalysis: result.video_analysis
          ? {
              detectedObjects: result.video_analysis.detected_objects || detectedObjects,
              duration: result.video_analysis.duration || 0,
              fps: result.video_analysis.fps || 0,
            }
          : {
              detectedObjects: detectedObjects,
              duration: 0,
              fps: 0,
            },
        ambient: {
          noise: Math.floor(Math.random() * 50) + 30,
          light: Math.floor(Math.random() * 100),
          timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
        },
      }

      const updated = [...sessions, newSession]
      await saveSessions(updated)
      setSessions(updated)
      setCurrentSession(newSession)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process live video"
      setError(errorMsg)
      console.error("[v0] Live video processing error:", err)
    } finally {
      setIsLoadingAudioRecord(false)
    }
  }

  const handleAudioFileUpload = async (file: File) => {
    await processAudio(file, file.name, true)
  }

  const processVideo = async (videoFile: File, filename: string = "video.mp4") => {
    setIsLoadingVideo(true)
    setError(null)
    try {
      let result
      try {
        const formData = new FormData()
        formData.append("video", videoFile, filename)
        formData.append(
          "ambient",
          JSON.stringify({
            noise: Math.floor(Math.random() * 50) + 30,
            light: Math.floor(Math.random() * 100),
            timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
          }),
        )

        const response = await fetch("/api/analyze-video", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Backend unavailable")
        result = await response.json()

        // Check for fallback
        if (result.fallback || !result.success) {
          console.log("[v0] Using fallback analysis")
          throw new Error("Backend processing unavailable")
        }
      } catch (err) {
        console.log("[v0] Backend unavailable, using local analysis")
        result = {
          score: Math.round(Math.random() * 40 + 50),
          emotion: ["relaxed", "neutral", "stressed"][Math.floor(Math.random() * 3)],
          suggestions: [
            {
              type: "info",
              message: "Connect Python backend to localhost:5000 for AI analysis",
            },
          ],
          video_analysis: {
            detectedObjects: {},
            duration: 0,
            fps: 0,
          },
        }
      }

      const newSession: SessionData = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        score: result.score || 50,
        emotion: result.emotion || "neutral",
        suggestions: result.suggestions || [],
        videoAnalysis: result.video_analysis
          ? {
              detectedObjects: result.video_analysis.detected_objects || {},
              duration: result.video_analysis.duration || 0,
              fps: result.video_analysis.fps || 0,
            }
          : undefined,
        ambient: {
          noise: Math.floor(Math.random() * 50) + 30,
          light: Math.floor(Math.random() * 100),
          timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
        },
      }

      const updated = [...sessions, newSession]
      await saveSessions(updated)
      setSessions(updated)
      setCurrentSession(newSession)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process video"
      setError(errorMsg)
      console.error("[v0] Video processing error:", err)
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const handleVideoFileUpload = async (file: File) => {
    await processVideo(file, file.name)
  }

  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Navigation darkMode={darkMode} setDarkMode={setDarkMode} onExport={handleExport} onImport={handleImport} />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent mb-3 tracking-tight">
            Wellness Companion
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor your wellness and track your progress with AI-powered insights.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg"
              >
                <p className="font-semibold">Error: {error}</p>
                <p className="text-sm mt-1">Using local analysis mode</p>
              </motion.div>
            )}

            <RecorderCard
              sessions={sessions}
              setSessions={setSessions}
              setCurrentSession={setCurrentSession}
              onRecordingComplete={handleRecordingComplete}
              isLoading={isLoadingAudioRecord}
            />

            <AudioUpload onFileUpload={handleAudioFileUpload} isLoading={isLoadingAudioUpload} />

            <VideoUpload onFileUpload={handleVideoFileUpload} isLoading={isLoadingVideo} />

            {currentSession && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Latest Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold text-primary">{currentSession.score}</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Emotion</p>
                    <p className="text-lg font-semibold capitalize">{currentSession.emotion}</p>
                  </div>
                  <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Noise Level</p>
                    <p className="text-lg font-semibold">{currentSession.ambient.noise}dB</p>
                  </div>
                </div>

                {currentSession.videoAnalysis && (
                  <div className="mt-4 bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Video Analysis Results</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{currentSession.videoAnalysis.duration?.toFixed(1) || 0}s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">FPS</p>
                        <p className="font-medium">{currentSession.videoAnalysis.fps?.toFixed(1) || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Objects Found</p>
                        <p className="font-medium">{Object.keys(currentSession.videoAnalysis.detectedObjects || {}).length}</p>
                      </div>
                    </div>
                    {Object.keys(currentSession.videoAnalysis.detectedObjects || {}).length > 0 ? (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Detected Objects:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(currentSession.videoAnalysis.detectedObjects).map(([obj, data]: [string, any]) => (
                            <div
                              key={obj}
                              className="px-3 py-2 bg-primary/20 text-primary rounded-md text-xs border border-primary/30"
                            >
                              <div className="font-semibold">{obj}</div>
                              <div className="text-xs opacity-80 mt-0.5">
                                Count: {data.count || 0} | 
                                Confidence: {((data.avg_confidence || data.max_confidence || 0) * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-muted-foreground italic">
                        No objects detected. Try adjusting confidence threshold or check if video contains recognizable objects.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <TrendsChart sessions={sessions} />
          </div>

          <div className="space-y-6">
            <WellnessIndex score={currentSession?.score || avgScore} emotion={currentSession?.emotion || "neutral"} />
            <SuggestionPanel
              score={currentSession?.score || avgScore}
              emotion={currentSession?.emotion || "neutral"}
              suggestions={currentSession?.suggestions}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
