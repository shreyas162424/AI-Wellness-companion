"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Lightbulb, Wind, Focus, Music, Leaf, Moon, Zap, Play, Heart, Activity } from "lucide-react"
import CalmMusicBar from "./calm-music-bar"

interface SuggestionPanelProps {
  suggestions?: string[]
  score?: number
  emotion?: string
}

// Get health suggestions based on Wellness Index and Emotion
// ALWAYS includes YouTube iframe and Calming Music
const getHealthSuggestions = (score: number, emotion: string) => {
  const suggestions: any[] = []
  const emotionLower = emotion?.toLowerCase() || "neutral"

  // ALWAYS add embedded YouTube Breathing Exercise iframe and Calming Music first
  suggestions.push({
    icon: Wind,
    title: "Breathing Exercise",
    desc: "Watch guided 4-7-8 breathing technique video for immediate stress relief",
    priority: "high",
    // Use embed src (iframe src) instead of a regular URL
    videoSrc: "https://www.youtube.com/embed/LiUnFJ8P4gM?si=jhAwzrV1gXyNEyb1",
    actionType: "video",
  })
  
  suggestions.push({
    icon: Music,
    title: "Calming Music",
    desc: "Listen to relaxing ambient sounds and peaceful melodies",
    priority: "high",
    actionType: "music",
  })

  // Emotion-specific suggestions...
  if (emotionLower === "sad") {
    suggestions.push({
      icon: Zap,
      title: "Energy Boost",
      desc: "Take a 10-15 minute walk outside. Natural light and movement can help lift your mood.",
      priority: "high",
    })
    suggestions.push({
      icon: Heart,
      title: "Self-Compassion",
      desc: "Practice self-kindness. It's okay to feel sad. Consider journaling your thoughts.",
      priority: "medium",
    })
    suggestions.push({
      icon: Leaf,
      title: "Connect with Nature",
      desc: "Spend time in nature or listen to nature sounds. It can help improve emotional well-being.",
      priority: "medium",
    })
  } 
  else if (emotionLower === "anger") {
    suggestions.push({
      icon: Wind,
      title: "Cool Down Technique",
      desc: "Take deep breaths and count to 10. Remove yourself from the situation if possible.",
      priority: "high",
    })
    suggestions.push({
      icon: Activity,
      title: "Physical Release",
      desc: "Engage in physical activity like walking, running, or stretching to release tension.",
      priority: "high",
    })
    suggestions.push({
      icon: Focus,
      title: "Mindful Reflection",
      desc: "Take a moment to identify what triggered the anger and consider healthy responses.",
      priority: "medium",
    })
  }
  else if (emotionLower === "fear") {
    suggestions.push({
      icon: Heart,
      title: "Grounding Exercise",
      desc: "Practice the 5-4-3-2-1 technique: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
      priority: "high",
    })
    suggestions.push({
      icon: Focus,
      title: "Progressive Muscle Relaxation",
      desc: "Tense and relax each muscle group from toes to head. This helps reduce physical tension.",
      priority: "medium",
    })
    suggestions.push({
      icon: Leaf,
      title: "Safe Space Visualization",
      desc: "Imagine yourself in a peaceful, safe place. Focus on the details and how it makes you feel.",
      priority: "medium",
    })
  }
  else if (emotionLower === "disgust") {
    suggestions.push({
      icon: Wind,
      title: "Deep Breathing",
      desc: "Focus on slow, deep breaths to help calm your nervous system and reduce the intensity.",
      priority: "high",
    })
    suggestions.push({
      icon: Focus,
      title: "Mindful Distraction",
      desc: "Engage in an activity that requires focus, like reading, puzzles, or creative work.",
      priority: "medium",
    })
    suggestions.push({
      icon: Leaf,
      title: "Fresh Air Break",
      desc: "Step outside for fresh air. Changing your environment can help shift your emotional state.",
      priority: "medium",
    })
  }
  else if (emotionLower === "surprised") {
    suggestions.push({
      icon: Focus,
      title: "Process the Moment",
      desc: "Take a few deep breaths to process what surprised you. Give yourself time to adjust.",
      priority: "medium",
    })
    suggestions.push({
      icon: Heart,
      title: "Stay Grounded",
      desc: "Practice grounding techniques like feeling your feet on the floor and taking slow breaths.",
      priority: "medium",
    })
    suggestions.push({
      icon: Activity,
      title: "Gentle Movement",
      desc: "Light stretching or walking can help your body process the surprise and return to balance.",
      priority: "low",
    })
  }
  else if (emotionLower === "happy") {
    suggestions.push({
      icon: Heart,
      title: "Savor the Moment",
      desc: "Take time to fully appreciate and enjoy this positive feeling. Practice gratitude.",
      priority: "low",
    })
    suggestions.push({
      icon: Zap,
      title: "Share the Joy",
      desc: "Connect with others or do something creative. Positive emotions are amplified when shared.",
      priority: "low",
    })
    suggestions.push({
      icon: Focus,
      title: "Maintain Balance",
      desc: "Continue practices that keep you in this positive state - regular exercise, good sleep, healthy habits.",
      priority: "low",
    })
  }
  else if (emotionLower === "calm") {
    suggestions.push({
      icon: Heart,
      title: "Maintain This State",
      desc: "Continue your current practices. Regular meditation, breathing exercises, and mindfulness help maintain calm.",
      priority: "low",
    })
    suggestions.push({
      icon: Focus,
      title: "Mindful Activities",
      desc: "Engage in activities that promote calm: reading, gentle yoga, nature walks, or creative hobbies.",
      priority: "low",
    })
    suggestions.push({
      icon: Moon,
      title: "Evening Routine",
      desc: "Establish a calming evening routine to preserve this peaceful state and improve sleep quality.",
      priority: "low",
    })
  }
  else if (emotionLower === "neutral") {
    suggestions.push({
      icon: Activity,
      title: "Maintain Wellness",
      desc: "Keep up your wellness routine. Regular exercise, balanced nutrition, and good sleep habits support emotional balance.",
      priority: "low",
    })
    suggestions.push({
      icon: Focus,
      title: "Mindful Awareness",
      desc: "Practice mindfulness to stay aware of your emotional state and respond appropriately to changes.",
      priority: "low",
    })
    suggestions.push({
      icon: Leaf,
      title: "Preventive Care",
      desc: "Use this balanced state to build resilience through regular self-care practices.",
      priority: "low",
    })
  }
  // Fallback for unknown emotions
  else {
    suggestions.push({
      icon: Heart,
      title: "Self-Care",
      desc: "Take time for yourself. Listen to calming music, practice breathing, or engage in activities you enjoy.",
      priority: "medium",
    })
    suggestions.push({
      icon: Focus,
      title: "Mindful Check-in",
      desc: "Take a moment to check in with yourself. How are you feeling? What do you need right now?",
      priority: "medium",
    })
  }

  return suggestions
}

const getSuggestionsForCondition = (score: number, emotion: string) => {
  const suggestions = getHealthSuggestions(score, emotion)
  // Return all suggestions (they already include video embed and music)
  return suggestions
}

const defaultSuggestions = [
  {
    icon: Wind,
    title: "Breathing Exercise",
    desc: "Try 4-7-8 breathing technique for stress relief",
    priority: "medium",
    videoSrc: "https://www.youtube.com/embed/LiUnFJ8P4gM?si=jhAwzrV1gXyNEyb1",
    actionType: "video",
  },
  {
    icon: Music,
    title: "Calming Music",
    desc: "Listen to relaxing ambient sounds to reduce stress",
    priority: "medium",
    actionType: "music",
  },
]

export default function SuggestionPanel({ suggestions, score = 70, emotion = "neutral" }: SuggestionPanelProps) {
  const [showMusicBar, setShowMusicBar] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideoSrc, setSelectedVideoSrc] = useState("")

  // Always generate AI suggestions based on wellness index and emotion
  const aiSuggestions = getSuggestionsForCondition(score, emotion || "neutral")
  
  const finalSuggestions = aiSuggestions.length > 0 ? aiSuggestions : defaultSuggestions

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive"
      case "medium":
        return "bg-accent/10 text-accent"
      case "low":
        return "bg-primary/10 text-primary"
      default:
        return "bg-secondary/10 text-secondary"
    }
  }

  const getHeaderMessage = () => {
    if (score < 40) return "Immediate Care Recommended"
    if (score < 60) return "Self-Care Suggestions"
    return "Wellness Tips"
  }

  const handleActionClick = (suggestion: any) => {
    if (suggestion.actionType === "video" && suggestion.videoSrc) {
      setSelectedVideoSrc(suggestion.videoSrc)
      setShowVideoModal(true)
    } else if (suggestion.actionType === "music") {
      setShowMusicBar(true)
    }
  }

  return (
    <>
      <Card className="gradient-card overflow-hidden hover-lift">
        <motion.div 
          className="p-6 md:p-8" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Recommendations</h3>
              <p className="text-xs text-muted-foreground">{getHeaderMessage()}</p>
            </div>
          </div>

          {/* Calm Music Bar */}
          {showMusicBar && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <CalmMusicBar compact={false} onClose={() => setShowMusicBar(false)} />
            </motion.div>
          )}

          <div className="space-y-3">
            {Array.isArray(finalSuggestions) && finalSuggestions.length > 0
              ? finalSuggestions.map((suggestion, i) => {
                  if (!suggestion || typeof suggestion !== "object") {
                    return null
                  }
                  
                  const Icon = suggestion.icon || Lightbulb
                  const title = suggestion.title || "Suggestion"
                  const desc = suggestion.desc || ""
                  const priority = suggestion.priority
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="bg-gradient-to-br from-card/60 to-muted/30 p-4 rounded-xl border border-border/30 hover:border-primary/30 transition-all hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                          <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="text-sm font-semibold text-foreground">{title}</p>
                            {priority && (
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityColor(priority)}`}
                              >
                                {priority}
                              </span>
                            )}
                          </div>
                          {desc && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                          )}
                          {(suggestion.videoSrc || suggestion.actionType === "music") && (
                            <motion.button
                              onClick={() => handleActionClick(suggestion)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all shadow-sm hover:shadow-md"
                            >
                              <Play className="w-3.5 h-3.5" />
                              {suggestion.actionType === "video" ? "Watch Video" : "Play Music"}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No suggestions available. Please try analyzing your audio again.
                </div>
              )}
          </div>

          <motion.div
            className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-foreground leading-relaxed">
              {score < 40 ? (
                <>
                  <span className="font-semibold text-destructive">Alert:</span> Your wellness score indicates high stress. Consider
                  taking a break and trying the breathing exercises above.
                </>
              ) : score < 60 ? (
                <>
                  <span className="font-semibold text-accent">Tip:</span> Incorporate small wellness breaks throughout your day to maintain balance.
                </>
              ) : (
                <>
                  <span className="font-semibold text-primary">Great!</span> Maintain this momentum with consistent self-care
                  routines and mindfulness practices.
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      </Card>

      {/* Inline video modal that renders an iframe using the embed src */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVideoModal(false)}
          />
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-1 rounded-md bg-white/90 text-sm font-medium shadow"
              >
                Close
              </button>
            </div>
            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
              <iframe
                width="100%"
                height="100%"
                src={selectedVideoSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
