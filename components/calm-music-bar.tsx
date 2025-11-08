"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, SkipForward, SkipBack } from "lucide-react"

interface CalmMusicBarProps {
  onClose?: () => void
  compact?: boolean
}

const calmingMusicTracks = [
  {
    title: "Peaceful Meditation",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    artist: "Nature Sounds",
  },
  {
    title: "Calm Ocean Waves",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    artist: "Ambient",
  },
  {
    title: "Forest Breeze",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    artist: "Nature",
  },
  {
    title: "Zen Garden",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    artist: "Meditation",
  },
]

export default function CalmMusicBar({ onClose, compact = false }: CalmMusicBarProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      const nextTrack = (currentTrack + 1) % calmingMusicTracks.length
      handleTrackChange(nextTrack)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentTrack])

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTrackChange = (index: number) => {
    setCurrentTrack(index)
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.src = calmingMusicTracks[index].url
      audioRef.current.play()
    }
  }

  const handlePrevious = () => {
    const prevTrack = currentTrack === 0 ? calmingMusicTracks.length - 1 : currentTrack - 1
    handleTrackChange(prevTrack)
  }

  const handleNext = () => {
    const nextTrack = (currentTrack + 1) % calmingMusicTracks.length
    handleTrackChange(nextTrack)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-3 border border-accent/20">
        <audio ref={audioRef} src={calmingMusicTracks[currentTrack].url} volume={volume} />
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{calmingMusicTracks[currentTrack].title}</p>
            <p className="text-xs text-muted-foreground truncate">{calmingMusicTracks[currentTrack].artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-1.5 hover:bg-accent/20 rounded transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-accent/20 rounded transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 w-20">
              <Volume2 className="w-3 h-3 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 bg-accent/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-4 border border-accent/20"
    >
      <audio ref={audioRef} src={calmingMusicTracks[currentTrack].url} volume={volume} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{calmingMusicTracks[currentTrack].title}</p>
            <p className="text-xs text-muted-foreground truncate">{calmingMusicTracks[currentTrack].artist}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              ×
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-accent/20 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-accent/20 rounded-full transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-accent/20 rounded-full transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 bg-accent/20 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume control"
          />
          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </motion.div>
  )
}

