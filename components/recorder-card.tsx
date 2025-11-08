"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Square, PlayCircle, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { MediaStreamAudioSourceNode } from "some-audio-source-node-module" // Import MediaStreamAudioSourceNode
import type { SessionData } from "@/types/session"

interface RecorderCardProps {
  sessions: SessionData[]
  setSessions: (sessions: SessionData[]) => void
  setCurrentSession: (session: SessionData) => void
  onRecordingComplete: (blob: Blob, ambient: any, videoObjects?: Record<string, any>) => Promise<void>
  isLoading: boolean
}

export default function RecorderCard({
  sessions,
  setSessions,
  setCurrentSession,
  onRecordingComplete,
  isLoading,
}: RecorderCardProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])
  const [frequencyBars, setFrequencyBars] = useState<number[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [useVideo, setUseVideo] = useState(false)
  const [detectedObjects, setDetectedObjects] = useState<Record<string, any>>({})
  const [currentDetections, setCurrentDetections] = useState<Array<{
    class: string
    confidence: number
    bbox: number[] // [x1, y1, x2, y2] normalized
  }>>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null) // Canvas overlay for bounding boxes
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([]) // For video recording
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // For capturing video frames
  const isRecordingRef = useRef<boolean>(false) // Use ref to track recording state for animation loop
  const videoAnalysisIntervalRef = useRef<NodeJS.Timeout | null>(null) // For periodic video analysis

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (videoAnalysisIntervalRef.current) clearTimeout(videoAnalysisIntervalRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      // Improved audio constraints for better quality
      // Start with ideal constraints, fallback to basic if needed
      let constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 }, // Match model's expected sample rate
          channelCount: { ideal: 1 }, // Mono for better processing
        } as MediaTrackConstraints,
        video: useVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        // Fallback to basic audio constraints if advanced ones fail
        console.log("[v0] Advanced constraints failed, using basic audio:", err)
        constraints = {
          audio: true,
          video: useVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      }
      streamRef.current = stream

      // Show video preview if video is enabled
      if (useVideo && videoRef.current) {
        videoRef.current.srcObject = stream
      }

      try {
        // Create or resume AudioContext
        let audioContext = audioContextRef.current
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          audioContextRef.current = audioContext
        }

        // Resume context if suspended (required in some browsers)
        if (audioContext.state === "suspended") {
          await audioContext.resume()
        }

        // Create analyzer with better settings
        const analyzer = audioContext.createAnalyser()
        analyzer.fftSize = 2048 // Higher FFT size for better frequency resolution
        analyzer.smoothingTimeConstant = 0.8
        analyzerRef.current = analyzer

        // Always create a new source node for the new stream
        // Disconnect old source if it exists
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect()
          } catch (e) {
            // Ignore disconnect errors
          }
        }

        // Create new source from stream
        const source = audioContext.createMediaStreamSource(stream)
        sourceNodeRef.current = source as MediaStreamAudioSourceNode

        // Connect source to analyzer
        source.connect(analyzer)
      } catch (audioError) {
        console.error("[v0] Error setting up audio context:", audioError)
      }

      // Start media recorder with better quality settings
      // Use video/webm if video is enabled, otherwise audio/webm
      let mimeType: string
      let options: MediaRecorderOptions
      
      if (useVideo) {
        mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : MediaRecorder.isTypeSupported("video/webm")
              ? "video/webm"
              : "video/webm"
        options = {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000, // 2.5 Mbps for video
          audioBitsPerSecond: 128000,
        }
        videoChunksRef.current = []
      } else {
        mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/webm"
        options = {
          mimeType: mimeType,
          audioBitsPerSecond: 128000, // Higher bitrate for better quality
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (useVideo) {
            videoChunksRef.current.push(e.data)
          } else {
            chunksRef.current.push(e.data)
          }
        }
      }
      mediaRecorder.start(100) // Collect data every 100ms for better quality
      
      // Setup canvas for video frame capture if video is enabled
      if (useVideo && videoRef.current && !canvasRef.current) {
        const canvas = document.createElement("canvas")
        canvas.width = 640
        canvas.height = 480
        canvasRef.current = canvas
      }
      
      // Start periodic video frame analysis if video is enabled
      if (useVideo && videoRef.current) {
        analyzeVideoFrames()
        // Start drawing bounding boxes
        drawBoundingBoxes()
      }

      setIsRecording(true)
      isRecordingRef.current = true // Set ref immediately
      setRecordingTime(0)
      setWaveform([])
      setFrequencyBars([])

      // Update waveform and frequency bars
      const updateVisualization = () => {
        if (!analyzerRef.current || !isRecordingRef.current) {
          animationRef.current = null
          return
        }

        try {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
          analyzerRef.current.getByteFrequencyData(dataArray)

          // Waveform (time domain)
          const timeData = new Uint8Array(analyzerRef.current.fftSize)
          analyzerRef.current.getByteTimeDomainData(timeData)
          setWaveform(Array.from(timeData).slice(0, 50))

          // Frequency bars (downsampled)
          const bars = Array.from(dataArray)
            .slice(0, 128)
            .reduce((acc: number[], val, i) => {
              if (i % 4 === 0) acc.push(val)
              return acc
            }, [])
          setFrequencyBars(bars)
        } catch (err) {
          console.error("[v0] Visualization error:", err)
        }

        // Continue animation loop
        if (isRecordingRef.current) {
          animationRef.current = requestAnimationFrame(updateVisualization)
        }
      }
      // Start the visualization loop
      animationRef.current = requestAnimationFrame(updateVisualization)

      // Timer
      let seconds = 0
      timerRef.current = setInterval(() => {
        seconds++
        setRecordingTime(seconds)
        if (seconds >= 10) stopRecording()
      }, 1000)
    } catch (err) {
      console.error("[v0] Error accessing media devices:", err)
    }
  }

  // Analyze video frames periodically during recording
  const analyzeVideoFrames = async () => {
    if (!useVideo || !videoRef.current || !canvasRef.current || !isRecordingRef.current) {
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob || !isRecordingRef.current) return

        try {
          // Send frame to backend for analysis
          const formData = new FormData()
          formData.append("frame", blob, "frame.jpg")
          formData.append("conf", "0.25") // Confidence threshold

          const response = await fetch("/api/analyze-video-frame", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              // Update current detections with bounding boxes for real-time display
              if (result.detections && Array.isArray(result.detections)) {
                setCurrentDetections(result.detections)
              }
              
              // Merge detected objects for summary
              if (result.detected_objects) {
                setDetectedObjects((prev) => {
                  const merged = { ...prev }
                  Object.entries(result.detected_objects).forEach(([obj, data]: [string, any]) => {
                    if (merged[obj]) {
                      merged[obj] = {
                        ...merged[obj],
                        count: (merged[obj].count || 0) + (data.count || 1),
                        max_confidence: Math.max(merged[obj].max_confidence || 0, data.max_confidence || 0),
                      }
                    } else {
                      merged[obj] = data
                    }
                  })
                  return merged
                })
              }
            }
          }
        } catch (err) {
          console.error("[Video] Frame analysis error:", err)
        }
      }, "image/jpeg", 0.8)
    } catch (err) {
      console.error("[Video] Error capturing frame:", err)
    }

    // Schedule next frame analysis (every 0.5 seconds for smoother detection)
    if (isRecordingRef.current) {
      videoAnalysisIntervalRef.current = setTimeout(analyzeVideoFrames, 500)
    }
  }

  // Draw bounding boxes on video overlay
  const drawBoundingBoxes = () => {
    if (!useVideo || !videoRef.current || !overlayCanvasRef.current || !isRecordingRef.current) {
      return
    }

    const video = videoRef.current
    const overlayCanvas = overlayCanvasRef.current
    const ctx = overlayCanvas.getContext("2d")
    
    if (!ctx) return

    // Match overlay canvas size to video element
    const videoRect = video.getBoundingClientRect()
    if (videoRect.width === 0 || videoRect.height === 0) {
      // Video not ready yet, retry
      if (isRecordingRef.current) {
        requestAnimationFrame(drawBoundingBoxes)
      }
      return
    }

    // Use device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1
    if (overlayCanvas.width !== videoRect.width * dpr || overlayCanvas.height !== videoRect.height * dpr) {
      overlayCanvas.width = videoRect.width * dpr
      overlayCanvas.height = videoRect.height * dpr
      ctx.scale(dpr, dpr)
    }

    // Clear previous drawings
    ctx.clearRect(0, 0, videoRect.width, videoRect.height)

    // Draw bounding boxes for current detections
    currentDetections.forEach((detection) => {
      if (!detection.bbox || detection.bbox.length !== 4) return
      
      const [x1_norm, y1_norm, x2_norm, y2_norm] = detection.bbox
      const x1 = x1_norm * videoRect.width
      const y1 = y1_norm * videoRect.height
      const x2 = x2_norm * videoRect.width
      const y2 = y2_norm * videoRect.height
      const width = x2 - x1
      const height = y2 - y1

      // Skip if invalid dimensions
      if (width <= 0 || height <= 0) return

      // Draw bounding box with green color
      ctx.strokeStyle = "#00ff00"
      ctx.lineWidth = 2
      ctx.strokeRect(x1, y1, width, height)

      // Prepare label text
      const label = `${detection.class} ${(detection.confidence * 100).toFixed(1)}%`
      ctx.font = "bold 12px Arial"
      ctx.textBaseline = "top"
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = 18

      // Draw label background (semi-transparent green)
      ctx.fillStyle = "rgba(0, 255, 0, 0.8)"
      ctx.fillRect(x1, Math.max(0, y1 - textHeight), textWidth + 8, textHeight)

      // Draw label text (black)
      ctx.fillStyle = "#000000"
      ctx.fillText(label, x1 + 4, Math.max(2, y1 - textHeight + 2))
    })

    // Continue drawing loop
    if (isRecordingRef.current) {
      requestAnimationFrame(drawBoundingBoxes)
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    // Stop video analysis interval
    if (videoAnalysisIntervalRef.current) {
      clearTimeout(videoAnalysisIntervalRef.current)
      videoAnalysisIntervalRef.current = null
    }

    // Stop bounding box drawing loop
    isRecordingRef.current = false

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        setIsRecording(false)
        isRecordingRef.current = false // Stop animation loop
        if (timerRef.current) clearInterval(timerRef.current)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
        
        // Clear overlay canvas
        if (overlayCanvasRef.current) {
          const ctx = overlayCanvasRef.current.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
          }
        }

        let blob: Blob
        if (useVideo && videoChunksRef.current.length > 0) {
          // Video recording
          blob = new Blob(videoChunksRef.current, { type: "video/webm" })
        } else {
          // Audio only recording
          blob = new Blob(chunksRef.current, { type: "audio/webm" })
        }
        
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)

        if (useVideo && videoRef.current) {
          videoRef.current.srcObject = null
        }

        // Get ambient data
        const ambient = {
          noise: Math.floor(Math.random() * 50) + 30,
          light: Math.floor(Math.random() * 100),
          timeOfDay: new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening",
        }

        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        // Pass video blob and detected objects if video was used
        await onRecordingComplete(blob, ambient, useVideo ? detectedObjects : undefined)
        
        // Reset detected objects and detections
        setDetectedObjects({})
        setCurrentDetections([])
        resolve()
      }
      mediaRecorderRef.current!.stop()
    })
  }

  const recordingSeconds = recordingTime
  const maxSeconds = 10

  return (
    <Card className="gradient-card overflow-hidden hover-lift">
      <motion.div 
        className="p-6 md:p-8" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Mic className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Voice Analysis</h2>
              <p className="text-xs text-muted-foreground">Record audio or video for emotion detection</p>
            </div>
          </div>
          {!isRecording && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={useVideo ? "default" : "outline"}
                size="sm"
                onClick={() => setUseVideo(!useVideo)}
                className="rounded-lg"
              >
                {useVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          {/* Video Preview with Real-time Bounding Boxes */}
          {useVideo && (
            <motion.div 
              className="relative w-full rounded-xl overflow-hidden border-2 border-border/50 shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <video ref={videoRef} autoPlay muted className="w-full h-96 bg-black object-cover" />
              {/* Overlay canvas for bounding boxes - positioned exactly over video */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {Object.keys(detectedObjects).length > 0 && (
                <motion.div 
                  className="absolute top-3 left-3 glass-strong text-foreground text-xs p-3 rounded-xl max-h-32 overflow-y-auto z-10 shadow-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="font-semibold mb-2 text-primary">Detected Objects:</div>
                  {Object.entries(detectedObjects).map(([obj, data]: [string, any]) => (
                    <div key={obj} className="text-xs mb-1 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="font-medium">{obj}</span>
                      <span className="text-muted-foreground">({data.count || 0}x)</span>
                      <span className="text-primary font-semibold">{((data.max_confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Frequency Bars Visualization */}
          {isRecording && (
            <motion.div 
              className="bg-gradient-to-br from-card/60 to-muted/30 rounded-xl p-4 h-28 flex items-end justify-center gap-1 overflow-hidden border border-border/30 shadow-inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {frequencyBars.length > 0 ? (
                frequencyBars.map((value, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary via-accent to-primary rounded-t shadow-sm"
                    style={{ minHeight: "4px" }}
                    animate={{ height: `${Math.max(4, (value / 255) * 100)}%` }}
                    transition={{ duration: 0.05, ease: "easeOut" }}
                  />
                ))
              ) : (
                // Show placeholder bars while initializing
                Array.from({ length: 32 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary/20 to-accent/20 rounded-t"
                    style={{ height: "4px" }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: i * 0.05 }}
                  />
                ))
              )}
            </motion.div>
          )}

          {/* Waveform Visualization */}
          <motion.div 
            className="bg-gradient-to-br from-card/60 to-muted/30 rounded-xl p-4 h-20 flex items-center justify-center border border-border/30 shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isRecording ? (
              waveform.length > 0 ? (
                <svg className="w-full h-full" viewBox={`0 0 ${waveform.length} 255`} preserveAspectRatio="none">
                  <polyline
                    points={waveform.map((v, i) => `${i},${255 - v}`).join(" ")}
                    fill="none"
                    stroke="url(#waveGradient)"
                    strokeWidth="2.5"
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-sm"
                  />
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="oklch(0.55 0.16 220)" />
                      <stop offset="50%" stopColor="oklch(0.65 0.18 150)" />
                      <stop offset="100%" stopColor="oklch(0.7 0.15 90)" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div 
                    className="w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-accent/20 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  />
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground font-medium">Microphone visualization will appear here</p>
            )}
          </motion.div>

          {/* Recording Status */}
          <div className="text-center space-y-2">
            {isRecording && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
                className="inline-block"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </motion.div>
            )}
            <p className="text-sm font-mono">
              {isRecording ? `Recording: ${recordingSeconds}/${maxSeconds}s` : `Ready to record`}
            </p>
            {previewUrl && !isRecording && <p className="text-xs text-muted-foreground">Last recording saved</p>}
          </div>

          {/* Progress Bar */}
          {isRecording && (
            <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(recordingSeconds / maxSeconds) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {!isRecording ? (
              <>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl"
                    size="lg"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                </motion.div>
                {previewUrl && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const audio = new Audio(previewUrl)
                        audio.play()
                      }}
                      className="rounded-lg"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={stopRecording}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none shadow-lg hover:shadow-xl"
                  size="lg"
                >
                  Stop
                </Button>
              </motion.div>
            )}
          </div>

          {isLoading && (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="inline-block"
              >
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-2">Processing analysis...</p>
            </div>
          )}
        </div>
      </motion.div>
    </Card>
  )
}
