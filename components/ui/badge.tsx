import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "accent" | "success" | "warning" | "danger"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles: Record<string, string> = {
      default: "bg-slate-100 text-slate-900 border border-slate-200",
      secondary: "bg-slate-50 text-slate-700 border border-slate-200",
      accent: "bg-teal-50 text-teal-900 border border-teal-200",
      success: "bg-emerald-50 text-emerald-900 border border-emerald-200",
      warning: "bg-amber-50 text-amber-900 border border-amber-200",
      danger: "bg-red-50 text-red-900 border border-red-200",
    }

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${variantStyles[variant]} ${className || ""}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
export type { BadgeProps }
