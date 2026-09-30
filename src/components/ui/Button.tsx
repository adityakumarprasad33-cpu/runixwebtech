import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EF7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1F2F4] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#111317] text-white hover:bg-[#1C1F26]",
        primary: "bg-[#315EF7] text-white hover:bg-[#2A50D4]",
        destructive: "bg-[#D83A3A] text-white hover:bg-[#B82E2E]",
        outline: "border border-[rgba(17,19,23,0.12)] bg-white text-[#111317] hover:bg-[#F8F9FA] hover:border-[rgba(17,19,23,0.18)]",
        secondary: "bg-[#E5E7EB] text-[#111317] hover:bg-[#D1D5DB]",
        ghost: "hover:bg-[rgba(17,19,23,0.05)] text-[#4B5563] hover:text-[#111317]",
        link: "text-[#315EF7] underline-offset-4 hover:underline",
        accent: "bg-[#315EF7] text-white hover:bg-[#2A50D4]",
      },
      size: {
        default: "h-10 px-5 text-[14px]",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-11 px-6 text-[14px]",
        icon: "h-10 w-10 rounded-[8px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
