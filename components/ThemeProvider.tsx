'use client'

import { useEffect, useState } from 'react'
import {
    ThemeProviderContext,
    type ThemeProviderProps,
    type Theme,
} from '@/types/theme-context'

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        const storedTheme = localStorage.getItem(storageKey) as Theme | null
        setTheme(storedTheme ?? defaultTheme)
    }, [])

    useEffect(() => {
        if (!theme) return
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light'
            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }

        localStorage.setItem(storageKey, theme) // Ensure storage updates
    }, [theme])

    const value = {
        theme,
        setTheme,
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
