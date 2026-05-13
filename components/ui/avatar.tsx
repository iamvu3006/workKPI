import * as React from "react"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, size = "md", ...props }, ref) => {
    const sizeStyles: Record<string, string> = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-16 w-16 text-lg",
      xl: "h-24 w-24 text-2xl",
    }

    // Generate a consistent color based on initials
    const colors = [
      "bg-red-100 text-red-700",
      "bg-orange-100 text-orange-700",
      "bg-amber-100 text-amber-700",
      "bg-yellow-100 text-yellow-700",
      "bg-lime-100 text-lime-700",
      "bg-green-100 text-green-700",
      "bg-emerald-100 text-emerald-700",
      "bg-teal-100 text-teal-700",
      "bg-cyan-100 text-cyan-700",
      "bg-sky-100 text-sky-700",
      "bg-blue-100 text-blue-700",
      "bg-indigo-100 text-indigo-700",
      "bg-violet-100 text-violet-700",
      "bg-purple-100 text-purple-700",
      "bg-fuchsia-100 text-fuchsia-700",
      "bg-pink-100 text-pink-700",
    ]

    const getColorByInitials = (init?: string) => {
      if (!init) return colors[0]
      const charCode = init.charCodeAt(0)
      return colors[charCode % colors.length]
    }

    if (src) {
      return (
        <img
          ref={ref as React.Ref<HTMLImageElement>}
          src={src}
          alt={alt || "User avatar"}
          className={`rounded-full object-cover ${sizeStyles[size]} ${className || ""}`}
          {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={`flex items-center justify-center rounded-full font-semibold ${sizeStyles[size]} ${getColorByInitials(initials)} ${className || ""}`}
        {...props}
      >
        {initials || "?"}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
export type { AvatarProps }
