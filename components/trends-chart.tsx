"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Calendar, Activity } from "lucide-react"

interface SessionData {
  id: string
  timestamp: number
  score: number
  emotion: string
  suggestions: string[]
  ambient: any
}

interface TrendsChartProps {
  sessions: SessionData[]
}

export default function TrendsChart({ sessions }: TrendsChartProps) {
  const data = sessions.slice(-14).map((session) => ({
    time: new Date(session.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: session.score,
    timestamp: session.timestamp,
  }))

  const emotionDistribution = sessions.reduce(
    (acc, session) => {
      const existing = acc.find((e) => e.name === session.emotion)
      if (existing) {
        existing.value++
      } else {
        acc.push({ name: session.emotion, value: 1 })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const timeOfDayAnalysis = sessions.reduce(
    (acc, session) => {
      const timeOfDay = session.ambient?.timeOfDay || "unknown"
      const existing = acc.find((t) => t.name === timeOfDay)
      const avgScore = existing ? (existing.avg * existing.count + session.score) / (existing.count + 1) : session.score
      if (existing) {
        existing.count++
        existing.avg = avgScore
      } else {
        acc.push({ name: timeOfDay, avg: session.score, count: 1 })
      }
      return acc
    },
    [] as Array<{ name: string; avg: number; count: number }>,
  )

  const streak = (() => {
    let count = 0
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].score >= 70) count++
      else break
    }
    return count
  })()

  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length) : 0

  const recentAvg =
    sessions.slice(-7).length > 0
      ? Math.round(sessions.slice(-7).reduce((sum, s) => sum + s.score, 0) / sessions.slice(-7).length)
      : 0
  const previousAvg =
    sessions.slice(-14, -7).length > 0
      ? Math.round(sessions.slice(-14, -7).reduce((sum, s) => sum + s.score, 0) / sessions.slice(-14, -7).length)
      : 0
  const trend = recentAvg - previousAvg

  const EMOTION_COLORS: Record<string, string> = {
    relaxed: "#22c55e",
    neutral: "#3b82f6",
    stressed: "#ef4444",
    fatigued: "#f59e0b",
  }

  return (
    <div className="space-y-4">
      {/* Main Trends Chart */}
      <Card className="bg-gradient-to-br from-card to-card/80">
        <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-lg font-semibold mb-4">Wellness Trends (14 Days)</h3>
          {data.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.6} style={{ fontSize: "12px" }} />
                  <YAxis stroke="currentColor" opacity={0.6} style={{ fontSize: "12px" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} score`, "Wellness"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Record sessions to see trends
            </div>
          )}
        </motion.div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{avgScore}</p>
              <p className="text-xs text-muted-foreground mt-2">Last {sessions.length} sessions</p>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Healthy Streak</p>
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <p className="text-3xl font-bold text-accent">{streak}</p>
              <p className="text-xs text-muted-foreground mt-2">Consecutive healthy days</p>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-chart-4/10 to-chart-4/5">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <Calendar className="w-4 h-4" style={{ color: "rgb(250, 204, 21)" }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: "rgb(250, 204, 21)" }}>
                {sessions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Analysis records</p>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-blue-400/10 to-blue-400/5">
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-1">7-Day Trend</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-blue-500">
                  {trend > 0 ? "+" : ""}
                  {trend}
                </p>
                <p className="text-xs text-muted-foreground">from previous week</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {trend > 0 ? "Improving" : trend < 0 ? "Declining" : "Stable"}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time of Day Analysis */}
        {timeOfDayAnalysis.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gradient-to-br from-card to-card/80">
              <div className="p-6">
                <h4 className="text-sm font-semibold mb-4">Wellness by Time of Day</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeOfDayAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="name" stroke="currentColor" opacity={0.6} style={{ fontSize: "12px" }} />
                      <YAxis stroke="currentColor" opacity={0.6} style={{ fontSize: "12px" }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => [`${Math.round(value as number)} avg`, "Score"]}
                      />
                      <Bar dataKey="avg" fill="rgb(99, 102, 241)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Emotion Distribution */}
        {emotionDistribution.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gradient-to-br from-card to-card/80">
              <div className="p-6">
                <h4 className="text-sm font-semibold mb-4">Emotion Distribution</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emotionDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {emotionDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={EMOTION_COLORS[entry.name.toLowerCase()] || `hsl(${index * 60}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} sessions`, "Count"]}
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
