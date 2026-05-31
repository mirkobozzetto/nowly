import { cn } from "@/lib/utils"
import { FC, PropsWithChildren } from "react"

type Props = PropsWithChildren & {
  className?: string
}

export const Container: FC<Props> = ({ children, className }) => {
  return (
    <div className={cn("mx-auto w-full max-w-300 px-6", className)}>
      {children}
    </div>
  )
}
