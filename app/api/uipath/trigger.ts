import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { triggerType, data, config } = await request.json()

    // Validate config
    if (
      !config.organizationUrl ||
      !config.tenantName ||
      !config.clientId ||
      !config.clientSecret ||
      !config.processKey
    ) {
      return NextResponse.json({ error: "UiPath configuration incomplete" }, { status: 400 })
    }

    // Example: Trigger UiPath Cloud API
    // In production, you would authenticate with UiPath OAuth2 and trigger the process
    console.log("[v0] UiPath trigger:", { triggerType, data, config })

    // Mock response for now
    return NextResponse.json({
      success: true,
      automationId: `auto_${Date.now()}`,
      status: "triggered",
      message: `${triggerType} automation triggered successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("UiPath API error:", error)
    return NextResponse.json({ error: "Failed to trigger automation" }, { status: 500 })
  }
}
