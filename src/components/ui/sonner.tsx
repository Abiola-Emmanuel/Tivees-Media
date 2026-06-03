"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#18181b",
          "--normal-text": "#fafafa",
          "--normal-border": "#3f3f46",
          "--success-bg": "#052e16",
          "--success-text": "#dcfce7",
          "--success-border": "#16a34a",
          "--info-bg": "#082f49",
          "--info-text": "#e0f2fe",
          "--info-border": "#0284c7",
          "--warning-bg": "#422006",
          "--warning-text": "#fef3c7",
          "--warning-border": "#d97706",
          "--error-bg": "#450a0a",
          "--error-text": "#fee2e2",
          "--error-border": "#dc2626",
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
