"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Brain, Zap, Droplets } from "lucide-react"

interface WellnessIndexProps {
  score: number
  emotion: string
}

const getWellnessColor = (score: number) => {
  if (score >= 80) return "from-green-400 to-emerald-600"
  if (score >= 60) return "from-blue-400 to-cyan-600"
  if (score >= 40) return "from-yellow-400 to-orange-600"
  return "from-orange-400 to-red-600"
}

// Get wellness label based on actual emotion - using exact model labels
const getWellnessLabel = (emotion: string, score: number) => {
  const emotionLower = emotion?.toLowerCase() || ""
  
  // Use exact model labels: Happy, Sad, Fear, Disgust, Surprised, Calm, Neutral, Anger
  if (emotionLower === "happy" || emotionLower.includes("happy")) return "Happy"
  if (emotionLower === "sad" || emotionLower.includes("sad")) return "Sad"
  if (emotionLower === "fear" || emotionLower.includes("fear")) return "Fear"
  if (emotionLower === "disgust" || emotionLower.includes("disgust")) return "Disgust"
  if (emotionLower === "surprised" || emotionLower.includes("surprised")) return "Surprised"
  if (emotionLower === "calm" || emotionLower.includes("calm")) return "Calm"
  if (emotionLower === "neutral" || emotionLower.includes("neutral")) return "Neutral"
  if (emotionLower === "anger" || emotionLower.includes("anger") || emotionLower.includes("angry")) return "Anger"
  
  // Fallback to score-based label if emotion not recognized
  if (score >= 80) return "Relaxed"
  if (score >= 60) return "Mild Stress"
  if (score >= 40) return "Fatigued"
  return "High Stress"
}

const calculateMetrics = (score: number) => {
  return {
    stressLevel: 100 - score,
    energy: score,
    
  }
}

export default function WellnessIndex({ score, emotion }: WellnessIndexProps) {
  // Get color based on emotion - using exact model labels
  const getEmotionColor = (emotion: string, score: number) => {
    const emotionLower = emotion?.toLowerCase() || ""
    // Positive emotions
    if (emotionLower === "happy" || emotionLower === "calm") {
      return "from-green-400 to-emerald-600"
    }
    // Negative emotions
    if (emotionLower === "sad") {
      return "from-blue-400 to-cyan-600"
    }
    // High stress emotions
    if (emotionLower === "anger" || emotionLower === "fear" || emotionLower === "disgust") {
      return "from-orange-400 to-red-600"
    }
    // Surprised
    if (emotionLower === "surprised") {
      return "from-yellow-400 to-orange-600"
    }
    // Neutral
    if (emotionLower === "neutral") {
      return "from-gray-400 to-gray-600"
    }
    // Fallback to score-based color
    return getWellnessColor(score)
  }
  
  const colorClass = getEmotionColor(emotion, score)
  const label = getWellnessLabel(emotion, score)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference
  const metrics = calculateMetrics(score)

  const metricIndicators = [
    {
      icon: Brain,
      label: "Stress Level",
      value: `${metrics.stressLevel}`,
      unit: "%",
      color: "from-purple-400 to-indigo-600",
    },
    {
      icon: Zap,
      label: "Energy",
      value: `${metrics.energy}`,
      unit: "%",
      color: "from-yellow-400 to-orange-600",
    },
    
  ]

  return (
    <Card className="gradient-card overflow-hidden hover-lift">
      <motion.div 
        className="p-6 md:p-8" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
          <h3 className="text-xl font-semibold tracking-tight">Wellness Index</h3>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Radial Gauge */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/20"
              />
              {/* Animated progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{
                  stroke: `url(#wellness-gradient)`,
                  filter: "drop-shadow(0 0 12px oklch(0.55 0.16 220 / 0.4))",
                }}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="wellness-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.55 0.16 220)" />
                  <stop offset="50%" stopColor="oklch(0.65 0.18 150)" />
                  <stop offset="100%" stopColor="oklch(0.7 0.15 90)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {score}
              </motion.p>
              <p className="text-xs text-muted-foreground mt-1">out of 100</p>
            </div>
          </div>

          {/* Status Label */}
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r ${colorClass} text-white text-sm font-semibold shadow-lg`}
            >
              <motion.div 
                className="w-2.5 h-2.5 rounded-full bg-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />
              {label}
            </div>
            <p className="text-sm text-muted-foreground font-medium">Wellness Score: {score}/100</p>
          </motion.div>

          {/* Health Status */}
          <div className="w-full space-y-3 pt-6 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Overall Health</span>
              <span className="font-semibold text-foreground">{score >= 70 ? "Great" : score >= 50 ? "Good" : "Needs Attention"}</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
            {metricIndicators.map((metric, i) => {
              const Icon = metric.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + 0.1 * i, duration: 0.4 }}
                  className="bg-gradient-to-br from-card/60 to-muted/30 rounded-xl p-4 space-y-3 border border-border/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}
                    >
                      {metric.value}
                    </span>
                    <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: 0.6 + 0.1 * i, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </Card>
  )
}
