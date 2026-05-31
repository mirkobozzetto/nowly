import type { ButtonHTMLAttributes, FC, ReactElement, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "accent" | "secondary" | "disabled"
type Size = "sm" | "md" | "lg"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  className?: string
  size?: Size
  variant?: Variant
}

type ButtonVariantsOptions = {
  className?: string
  disabled?: boolean
  size?: Size
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-foreground text-background shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-[#e4e4e7] hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] active:scale-[0.98]",
  accent:
    "bg-accent text-background shadow-[0_0_20px_rgba(34,211,238,0.14)] hover:bg-cyan-300 hover:shadow-[0_4px_25px_rgba(34,211,238,0.22)] active:scale-[0.98]",
  secondary:
    "bg-card-2 text-foreground border border-border hover:border-muted-foreground hover:bg-card-hover",
  disabled:
    "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60",
}

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-10 py-4 text-lg",
}

export const buttonVariants = ({
  className,
  disabled,
  size = "lg",
  variant = "secondary",
}: ButtonVariantsOptions = {}): string => {
  const computedVariant = disabled ? "disabled" : variant

  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
    sizeClasses[size],
    variantClasses[computedVariant],
    className,
  )
}

export const Button: FC<Props> = ({
  children,
  className,
  disabled,
  size = "lg",
  variant = "secondary",
  ...props
}): ReactElement => {
  return (
    <button
      className={buttonVariants({ className, disabled, size, variant })}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
