export interface AccessibilitySettings {
  fontSize: "sm" | "base" | "lg" | "xl"
  soundEnabled: boolean
  highContrast: boolean
  reduceMotion: boolean
}

const ACCESSIBILITY_KEY = "health_companion_accessibility"

const defaultSettings: AccessibilitySettings = {
  fontSize: "base",
  soundEnabled: true,
  highContrast: false,
  reduceMotion: false,
}

export function getAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const stored = localStorage.getItem(ACCESSIBILITY_KEY)
    return stored ? JSON.parse(stored) : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings))
    applyAccessibilitySettings(settings)
  } catch (err) {
    console.error("Failed to save accessibility settings:", err)
  }
}

export function applyAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window === "undefined") return

  const root = document.documentElement

  // Apply font size
  const fontSizeMap = {
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  }
  root.style.setProperty("--base-font-size", fontSizeMap[settings.fontSize])

  // Apply high contrast
  if (settings.highContrast) {
    root.classList.add("high-contrast")
  } else {
    root.classList.remove("high-contrast")
  }

  // Apply reduce motion
  if (settings.reduceMotion) {
    root.style.setProperty("--animation-duration", "0s")
    root.classList.add("reduce-motion")
  } else {
    root.style.setProperty("--animation-duration", "1s")
    root.classList.remove("reduce-motion")
  }
}
