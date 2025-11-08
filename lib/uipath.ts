// UiPath integration utility for automation triggers
export interface UiPathConfig {
  organizationUrl: string
  tenantName: string
  clientId: string
  clientSecret: string
  processKey: string
  isEnabled: boolean
}

export interface AutomationTrigger {
  id: string
  name: string
  triggerType: "low_wellness" | "high_stress" | "daily_report" | "manual"
  enabled: boolean
  threshold?: number
  recipients: string[]
}

// Store UiPath config in localStorage
export const saveUiPathConfig = (config: UiPathConfig) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("uipath_config", JSON.stringify(config))
  }
}

export const getUiPathConfig = (): UiPathConfig | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("uipath_config")
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export const saveAutomationTriggers = (triggers: AutomationTrigger[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("uipath_triggers", JSON.stringify(triggers))
  }
}

export const getAutomationTriggers = (): AutomationTrigger[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("uipath_triggers")
    return stored
      ? JSON.parse(stored)
      : [
          {
            id: "1",
            name: "Low Wellness Alert",
            triggerType: "low_wellness",
            enabled: false,
            threshold: 40,
            recipients: [],
          },
          {
            id: "2",
            name: "High Stress Alert",
            triggerType: "high_stress",
            enabled: false,
            threshold: 70,
            recipients: [],
          },
          {
            id: "3",
            name: "Daily Report",
            triggerType: "daily_report",
            enabled: false,
            recipients: [],
          },
        ]
  }
  return []
}

export const triggerAutomation = async (triggerType: string, data: Record<string, any>, config: UiPathConfig) => {
  try {
    const response = await fetch("/api/uipath/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        triggerType,
        data,
        config,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to trigger automation")
    }

    return await response.json()
  } catch (error) {
    console.error("UiPath trigger error:", error)
    throw error
  }
}
