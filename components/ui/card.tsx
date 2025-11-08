import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-card-foreground",
      "shadow-modern transition-all duration-300",
      "hover:shadow-modern-lg hover:border-primary/20",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
