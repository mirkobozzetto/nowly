"use client"

import { Minus, Square, X } from "lucide-react"
import type { FC, ReactElement } from "react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

type LogEntry = {
  time: string
  text: string
  type: string
}

export const CompanionWindow: FC = (): ReactElement => {
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState("32:47")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const t = useTranslations("CompanionWindow")
  const logMessages = t.raw("logs") as LogEntry[]

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 65) return 65
        return prev + 0.5
      })
    }, 100)

    // Simulate time update
    const timeInterval = setInterval(() => {
      setCurrentTime((prev) => {
        const [min, sec] = prev.split(":").map(Number)
        const newSec = sec + 1
        if (newSec >= 60) {
          return `${min + 1}:00`
        }
        return `${min}:${newSec.toString().padStart(2, "0")}`
      })
    }, 1000)

    // Add logs progressively
    logMessages.forEach((log, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log])
      }, (index + 1) * 800)
    })

    return () => {
      clearInterval(progressInterval)
      clearInterval(timeInterval)
    }
  }, [])

  return (
    <div className="perspective-[1000px] relative">
      <div className="bg-[#202020] border border-[#333] rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.9),0_0_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform rotate-y-[-5deg] rotate-x-[2deg] animate-float">
        {/* Window Header */}
        <div className="h-8 bg-[#202020] flex items-center justify-between pl-2.5 select-none border-b border-white/5">
            <span className="text-xs text-white/80">{t("windowTitle")}</span>
          <div className="flex items-center gap-1.5 pr-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_rgba(34,197,94,0.65)]" />
          </div>
          <div className="flex h-full">
            <button className="w-[46px] h-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <Minus className="w-2.5 h-2.5 text-white" />
            </button>
            <button className="w-[46px] h-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <Square className="w-2.5 h-2.5 text-white" />
            </button>
            <button className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] transition-colors group">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        </div>

        {/* Window Body */}
        <div className="p-5 bg-[#1e1e1e] min-h-[280px]">
          {/* Media Card */}
          <div className="rounded-lg border border-white/5 relative overflow-hidden min-h-[160px]">
            {/* Blurred Backdrop */}
            <div 
              className="absolute inset-[-20px] bg-cover bg-center blur-[22px] saturate-50 brightness-[0.45]"
              style={{ backgroundImage: "url(\"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop\")" }}
            />
            
            {/* Vignette */}
            <div 
              className="absolute inset-0 z-[1]"
              style={{
                background: `
                  linear-gradient(to bottom, rgba(17,17,19,.6) 0%, transparent 30%),
                  linear-gradient(to top, rgba(17,17,19,.98) 0%, transparent 55%),
                  linear-gradient(to right, rgba(17,17,19,.18) 0%, transparent 40%),
                  linear-gradient(to left, rgba(17,17,19,.18) 0%, transparent 40%)
                `
              }}
            />

            {/* Content */}
            <div className="relative z-[2] flex flex-col p-2.5 gap-2.5">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-accent">Netflix</span>
                <span className="text-[9px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                  {t("season", {season: 2})}
                </span>
              </div>

              {/* Poster + Info Row */}
              <div className="flex gap-3">
                <div className="w-[72px] h-[108px] rounded-lg bg-black flex-shrink-0 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=150&h=225&fit=crop" 
                    alt={t("moviePosterAlt")}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0 gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-white truncate">{t("title")}</h4>
                    <p className="text-[11px] text-muted-foreground">{t("episode")}</p>
                  </div>

                  <div>
                    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/70 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-dim-foreground mt-1.5 font-mono tabular-nums">
                      <span>{currentTime}</span>
                      <span>50:23</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="mt-4 bg-[#0c0c0c] rounded border border-[#333] p-2.5 font-mono text-[10px] text-[#ccc] h-[90px] overflow-hidden flex flex-col">
            {logs.map((log, index) => (
              <div key={index} className="animate-fade-in mb-0.5" style={{ animationDelay: `${index * 0.1}s` }}>
                <span className="text-[#569cd6] mr-2">{log.time}</span>
                <span className={log.type === "success" ? "text-[#6a9955]" : log.type === "highlight" ? "text-[#4ec9b0]" : ""}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
