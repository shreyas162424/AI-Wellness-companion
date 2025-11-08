"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Moon, Sun, Settings, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import SettingsModal from "./settings-modal"

interface NavigationProps {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  onExport?: () => void
  onImport?: (file: File) => void
}

export default function Navigation({ darkMode, setDarkMode, onExport, onImport }: NavigationProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleExport = async () => {
    if (onExport) {
      onExport()
    }
  }

  const handleImport = async (file: File) => {
    if (onImport) {
      onImport(file)
    }
  }

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-strong border-b border-border/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xl font-bold text-primary-foreground">WC</span>
            </motion.div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Wellness Companion
              </h1>
              <p className="text-xs text-muted-foreground">Local • Offline-First • Private</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "Light mode" : "Dark mode"}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="rounded-lg"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                title="Export results"
                onClick={handleExport}
                aria-label="Export wellness data"
                className="rounded-lg"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                title="Settings"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open settings"
                className="rounded-lg"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onExport={handleExport}
        onImport={handleImport}
      />
    </>
  )
}
