"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Upload, FileAudio, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AudioUploadProps {
  onFileUpload: (file: File) => Promise<void>
  isLoading: boolean
}

export default function AudioUpload({ onFileUpload, isLoading }: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Check if file is audio
    if (!file.type.startsWith("audio/") && !file.name.toLowerCase().endsWith(".wav")) {
      alert("Please select a valid audio file (WAV format preferred)")
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      await onFileUpload(selectedFile)
      // Keep file selected for potential re-upload
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 overflow-hidden">
      <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upload Audio File</h2>
          <FileAudio className="w-5 h-5 text-accent" />
        </div>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-2">
                {isDragging ? "Drop your audio file here" : "Drag & drop an audio file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">or</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="bg-background hover:bg-primary/10"
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-4">Supports WAV, MP3, and other audio formats</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileAudio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemove}
                    className="text-muted-foreground hover:text-destructive transition"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {previewUrl && (
                  <div className="mt-4">
                    <audio controls src={previewUrl} className="w-full" />
                  </div>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Analyzing...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Analyze Emotion
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Card>
  )
}

