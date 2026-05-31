"use client"

import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants"
import { useEffect, useState } from "react"

interface KofiModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KofiModal({ isOpen, onClose }: KofiModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = (callback?: () => void) => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
      if (callback) callback()
    }, 250)
  }

  const triggerDownload = () => {
    const COMPANION_DOWNLOAD_URL = PROJECT_EXTENSION_DOWNLOAD_URL
    const a = document.createElement("a")
    a.href = COMPANION_DOWNLOAD_URL
    a.download = ""
    a.click()
  }

  const handleSupport = () => {
    handleClose(() => {
      window.open("https://ko-fi.com/qkimi_", "_blank", "noopener,noreferrer")
      triggerDownload()
    })
  }

  const handleSkip = () => {
    handleClose(triggerDownload)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  return (
    <div
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-lg transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100 animate-in fade-in"
      }`}
    >
      <div
        className={`bg-card border border-border-light rounded-2xl max-w-[400px] w-[calc(100%-40px)] overflow-hidden shadow-[0_32px_72px_rgba(0,0,0,0.8)] transition-all duration-300 ${
          isClosing ? "opacity-0 translate-y-2.5" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-5"
        }`}
      >
        {/* Header */}
        <div className="bg-card-2 border-b border-border px-7 py-9 text-center">
          <svg 
            className="w-10 h-10 text-foreground/90 mx-auto mb-4"
            viewBox="0 -4 24 28" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ overflow: "visible" }}
          >
            {/* Animated smoke */}
            <path className="animate-smoke-1" d="M6 4 Q5 2 6 0 Q7 -2 6 -4" fill="none"/>
            <path className="animate-smoke-2" d="M10 4 Q11 2 10 0 Q9 -2 10 -4" fill="none"/>
            <path className="animate-smoke-3" d="M14 4 Q13 2 14 0 Q15 -2 14 -4" fill="none"/>
            {/* Cup */}
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          </svg>
          <h3 className="text-lg font-bold tracking-tight text-foreground mb-1.5">
            Le projet est gratuit
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Developpe seul, sur mon temps libre.<br/>
            Un cafe aide a faire avancer les choses.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 flex flex-col gap-2">
          <button
            onClick={handleSupport}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-foreground text-background rounded-lg font-semibold text-sm hover:bg-[#e4e4e7] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Soutenir sur Ko-fi
          </button>
          <button
            onClick={handleSkip}
            className="w-full px-2 py-2 bg-transparent text-dim-foreground text-sm hover:text-muted-foreground hover:underline transition-colors"
          >
            Non merci, telecharger directement
          </button>
        </div>
      </div>
    </div>
  )
}
