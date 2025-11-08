"use client"

import { useState, useEffect } from "react"
import { Zap, Copy, Check, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { getUiPathConfig, saveUiPathConfig, getAutomationTriggers, saveAutomationTriggers } from "@/lib/uipath"
import type { UiPathConfig, AutomationTrigger } from "@/lib/uipath"

export default function UiPathSettings() {
  const [config, setConfig] = useState<UiPathConfig>({
    organizationUrl: "",
    tenantName: "",
    clientId: "",
    clientSecret: "",
    processKey: "",
    isEnabled: false,
  })

  const [triggers, setTriggers] = useState<AutomationTrigger[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState("")

  useEffect(() => {
    const saved = getUiPathConfig()
    if (saved) {
      setConfig(saved)
    }

    const savedTriggers = getAutomationTriggers()
    setTriggers(savedTriggers)
  }, [])

  const handleConfigChange = (key: keyof UiPathConfig, value: string | boolean) => {
    const updated = { ...config, [key]: value }
    setConfig(updated)
    saveUiPathConfig(updated)
  }

  const handleTriggerToggle = (triggerId: string) => {
    const updated = triggers.map((t) => (t.id === triggerId ? { ...t, enabled: !t.enabled } : t))
    setTriggers(updated)
    saveAutomationTriggers(updated)
  }

  const handleAddRecipient = (triggerId: string, email: string) => {
    if (!email || !email.includes("@")) return
    const updated = triggers.map((t) =>
      t.id === triggerId && !t.recipients.includes(email) ? { ...t, recipients: [...t.recipients, email] } : t,
    )
    setTriggers(updated)
    saveAutomationTriggers(updated)
  }

  const handleRemoveRecipient = (triggerId: string, email: string) => {
    const updated = triggers.map((t) =>
      t.id === triggerId ? { ...t, recipients: t.recipients.filter((r) => r !== email) } : t,
    )
    setTriggers(updated)
    saveAutomationTriggers(updated)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          UiPath Configuration
        </h3>

        <div className="space-y-3">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              How to Get Your UiPath Credentials:
            </h4>
            <ol className="text-xs space-y-2 text-muted-foreground">
              <li>
                1. Go to <strong>UiPath Cloud (cloud.uipath.com)</strong> and login
              </li>
              <li>
                2. Click <strong>Settings → Admin → Tenant Settings</strong>
              </li>
              <li>
                3. Copy <strong>Organization URL</strong> (from the top)
              </li>
              <li>
                4. Click <strong>API Access</strong> and create a new <strong>OAuth Application</strong>
              </li>
              <li>
                5. Copy <strong>Client ID</strong> and <strong>Client Secret</strong>
              </li>
              <li>
                6. Go to <strong>Processes</strong> and find your process, copy the <strong>Process Key</strong>
              </li>
            </ol>
          </div>

          {/* Input Fields */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://cloud.uipath.com/organization-name"
                value={config.organizationUrl}
                onChange={(e) => handleConfigChange("organizationUrl", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <button
                onClick={() => copyToClipboard(config.organizationUrl, "orgUrl")}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                {copied === "orgUrl" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tenant Name</label>
            <input
              type="text"
              placeholder="e.g., DefaultTenant"
              value={config.tenantName}
              onChange={(e) => handleConfigChange("tenantName", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Client ID</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Your OAuth Client ID"
                value={config.clientId}
                onChange={(e) => handleConfigChange("clientId", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <button
                onClick={() => copyToClipboard(config.clientId, "clientId")}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                {copied === "clientId" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Client Secret</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Your OAuth Client Secret"
                value={config.clientSecret}
                onChange={(e) => handleConfigChange("clientSecret", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <button
                onClick={() => copyToClipboard(config.clientSecret, "clientSecret")}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                {copied === "clientSecret" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Process Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., HealthMonitoring_AlertCaregivers"
                value={config.processKey}
                onChange={(e) => handleConfigChange("processKey", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              />
              <button
                onClick={() => copyToClipboard(config.processKey, "processKey")}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                {copied === "processKey" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mt-4">
            <label className="text-sm font-medium cursor-pointer">Enable UiPath Automations</label>
            <input
              type="checkbox"
              checked={
                config.isEnabled &&
                Object.values(config)
                  .slice(0, -1)
                  .every((v) => v)
              }
              onChange={(e) =>
                handleConfigChange(
                  "isEnabled",
                  e.target.checked &&
                    Object.values(config)
                      .slice(0, -1)
                      .every((v) => v),
                )
              }
              disabled={
                !Object.values(config)
                  .slice(0, -1)
                  .every((v) => v)
              }
              className="w-5 h-5 rounded cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Automation Triggers Section */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-semibold mb-4">Automation Triggers</h3>
        <div className="space-y-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="p-4 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm">{trigger.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: <strong>{trigger.triggerType.replace(/_/g, " ")}</strong>
                    {trigger.threshold && ` • Threshold: ${trigger.threshold}`}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={trigger.enabled && config.isEnabled}
                  onChange={() => handleTriggerToggle(trigger.id)}
                  disabled={!config.isEnabled}
                  className="w-5 h-5 rounded cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Notification Recipients</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="collaborator@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-foreground text-xs"
                  />
                  <button
                    onClick={() => {
                      handleAddRecipient(trigger.id, testEmail)
                      setTestEmail("")
                    }}
                    className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
                  >
                    Add
                  </button>
                </div>

                {trigger.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trigger.recipients.map((email) => (
                      <div
                        key={email}
                        className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient(trigger.id, email)}
                          className="font-bold hover:text-primary/70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          UiPath automations are triggered when your wellness metrics meet specific conditions. Notifications will be
          sent to configured collaborators via email.
        </p>
      </div>
    </div>
  )
}
