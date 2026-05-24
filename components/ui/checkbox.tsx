import * as React from "react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, onCheckedChange, onChange, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`h-4 w-4 rounded border border-slate-300 accent-teal-600 outline-none transition focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${className || ""}`}
            onChange={(event) => {
              onChange?.(event)
              onCheckedChange?.(event.target.checked)
            }}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              {label}
            </label>
          )}
        </div>
        {hint && <p className="text-xs text-slate-500 ml-7">{hint}</p>}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
export type { CheckboxProps }
