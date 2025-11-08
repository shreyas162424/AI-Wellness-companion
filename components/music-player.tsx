"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, X } from "lucide-react"

interface MusicPlayerProps {
  onClose: () => void
}

const calmingMusicTracks = [
  { title: "Ambient Meditation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "Nature Sounds", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "Peaceful Piano", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { title: "Forest Breeze", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
]

export default function MusicPlayer({ onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const audioRef = React.useRef<HTMLAudioElement>(null)

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 w-full max-w-md shadow-lg border border-accent/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-accent" />
            Calming Music Player
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent/10 rounded-lg transition-colors"
            aria-label="Close music player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <audio
          ref={audioRef}
          src={calmingMusicTracks[currentTrack].url}
          onEnded={() => {
            const nextTrack = (currentTrack + 1) % calmingMusicTracks.length
            handleTrackChange(nextTrack)
          }}
        />

        {/* Track Display */}
        <div className="bg-accent/10 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-center">{calmingMusicTracks[currentTrack].title}</p>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 rounded-lg mb-4 flex items-center justify-center gap-2 transition-colors"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? "Pause" : "Play"}
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-accent/20 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume control"
          />
          <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
        </div>

        {/* Track List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Available Tracks</p>
          {calmingMusicTracks.map((track, index) => (
            <button
              key={index}
              onClick={() => handleTrackChange(index)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTrack === index
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "bg-accent/5 hover:bg-accent/10 text-foreground"
              }`}
            >
              {track.title}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
