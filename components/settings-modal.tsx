"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download, Upload, Volume2, Eye, Type, Zap } from "lucide-react"
import UiPathSettings from "./uipath-settings"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export default function SettingsModal({ isOpen, onClose, onExport, onImport }: SettingsModalProps) {
  const [fontSize, setFontSize] = useState("base")
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
    }
  }

  const fontSizeOptions = [
    { value: "sm", label: "Small" },
    { value: "base", label: "Normal" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "Extra Large" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border">
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 px-6 pt-4 border-b border-border overflow-x-auto">
                <button
                  onClick={() => setActiveTab("general")}
                  className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === "general"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab("uipath")}
                  className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === "uipath"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  UiPath
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <div className="p-6 space-y-6">
                  {activeTab === "general" && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Accessibility
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="flex items-center gap-2 mb-2 text-sm font-medium">
                              <Type className="w-4 h-4" />
                              Text Size
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {fontSizeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => setFontSize(option.value)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    fontSize === option.value
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted hover:bg-muted/80"
                                  }`}
                                  aria-pressed={fontSize === option.value}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <label className="text-sm font-medium cursor-pointer">High Contrast Mode</label>
                            <input
                              type="checkbox"
                              checked={highContrast}
                              onChange={(e) => setHighContrast(e.target.checked)}
                              className="w-5 h-5 rounded cursor-pointer"
                              aria-label="Enable high contrast mode"
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <label className="text-sm font-medium cursor-pointer">Reduce Motion</label>
                            <input
                              type="checkbox"
                              checked={reduceMotion}
                              onChange={(e) => setReduceMotion(e.target.checked)}
                              className="w-5 h-5 rounded cursor-pointer"
                              aria-label="Enable reduce motion"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <label className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <Volume2 className="w-4 h-4" />
                            Sound Effects
                          </span>
                          <input
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={(e) => setSoundEnabled(e.target.checked)}
                            className="w-5 h-5 rounded cursor-pointer"
                            aria-label="Enable sound effects"
                          />
                        </label>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Download className="w-5 h-5" />
                          Data Management
                        </h3>
                        <div className="space-y-3">
                          <Button
                            onClick={onExport}
                            className="w-full justify-center gap-2 bg-primary hover:bg-primary/90"
                            aria-label="Export all wellness data as JSON"
                          >
                            <Download className="w-4 h-4" />
                            Export Data
                          </Button>

                          <div className="relative">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleFileImport}
                              className="hidden"
                              id="import-file"
                              aria-label="Import wellness data from JSON file"
                            />
                            <label htmlFor="import-file" className="w-full">
                              <Button
                                as="span"
                                className="w-full justify-center gap-2 bg-secondary hover:bg-secondary/90 cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                Import Data
                              </Button>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          All your health data is stored locally on your device and never sent to external servers
                          without your consent. Your privacy is our priority.
                        </p>
                      </div>
                    </>
                  )}

                  {activeTab === "uipath" && <UiPathSettings />}
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
