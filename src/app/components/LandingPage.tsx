"use client"

import { Dithering } from "@paper-design/shaders-react"
import { useState } from "react"

interface LandingPageProps {
    onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
    const [isDarkMode, setIsDarkMode] = useState(true)

    return (
        <div className="relative min-h-screen overflow-hidden flex">
            <div
                className={`w-1/2 p-8 font-mono relative z-10 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"}`}
            >
                {/* Theme toggle button in top right of left panel */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`absolute top-8 right-8 p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"
                        }`}
                    aria-label="Toggle theme"
                >
                    {isDarkMode ? (
                        // Sun icon for light mode
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                    ) : (
                        // Moon icon for dark mode
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    )}
                </button>

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-normal mb-8">AFTER YOU</h1>
                    <div className="mb-8">
                        <h2 className="text-2xl font-normal">A COLLABORATIVE</h2>
                        <h3 className="text-2xl font-normal">TYPEWRITER</h3>
                    </div>
                </div>

                {/* Description Section */}
                <div className="mb-12 space-y-4 text-base leading-relaxed">
                    <p>be anonymous.</p>
                    <p>type type and type</p>
                    <p>{"don't forget to drag the carriage to save the line :)"}</p>
                </div>

                {/* Enter Button */}
                <div className="mb-12">
                    <button
                        onClick={onEnter}
                        className={`px-8 py-3 text-lg font-mono border-2 transition-all duration-300 ${isDarkMode
                            ? "border-white hover:bg-white hover:text-black"
                            : "border-black hover:bg-black hover:text-white"
                            }`}
                    >
                        SHARE LOVE
                    </button>
                </div>

                {/* Footer Links Section */}
                <div className="absolute bottom-8 left-8">
                    <div className="flex space-x-4 text-sm font-mono opacity-70">
                        <span>created by jaineerasuhas</span>
                    </div>
                </div>
            </div>

            <div className="w-1/2 relative">
                <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "hsl(320, 100%, 70%)" : "hsl(220, 100%, 70%)"}
                    shape="cat"
                    type="4x4"
                    pxSize={3}
                    offsetX={0}
                    offsetY={0}
                    scale={0.8}
                    rotation={0}
                    speed={0.1}
                />
            </div>
        </div>
    )
}
