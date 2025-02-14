'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBreakTimer } from '@/hooks/useBreakTimer'
import BreakEnforcer from '@/components/BreakEnforcer'

import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

// Format seconds to human-readable time
const formatSecondsToTime = (seconds: number): string => {
    if (seconds === 0) return '0s'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0) parts.push(`${mins}m`)
    if (secs > 0) parts.push(`${secs}s`)
    return parts.length > 0 ? parts.join(' ') : '0s'
}

const parseTimeExpression = (input: string, currentValue: number): number => {
    try {
        const cleaned = input.replace(/\s+/g, '').toLowerCase()
        if (!cleaned) return currentValue

        // Handle relative operations
        if (cleaned.startsWith('+') || cleaned.startsWith('-')) {
            const absoluteValue = parseTimeExpression(cleaned.slice(1), 0)
            return (
                currentValue +
                (cleaned.startsWith('-') ? -absoluteValue : absoluteValue)
            )
        }

        // Split into terms considering both + and -
        const terms = cleaned.split(/(?=[+-])/g)

        return terms.reduce((total, term) => {
            const sign = term.startsWith('-') ? -1 : 1
            const termWithoutSign = term.replace(/^[+-]/, '')
            const matches = Array.from(
                termWithoutSign.matchAll(/(\d+)(h|m|s)?/g)
            )
            if (matches.length === 0) throw new Error('Invalid format')

            const termTotal = matches.reduce((sum, match) => {
                const value = parseInt(match[1], 10)
                const unit = (match[2] || 's').toLowerCase()
                switch (unit) {
                    case 'h':
                        return sum + value * 3600
                    case 'm':
                        return sum + value * 60
                    case 's':
                        return sum + value
                    default:
                        throw new Error('Invalid unit')
                }
            }, 0)

            return total + termTotal * sign
        }, 0)
    } catch {
        return NaN
    }
}

export default function BreakScheduler() {
    const [config, setConfig] = useState(() => {
        if (typeof window === 'undefined') {
            return {
                workDuration: 24 * 60,
                shortBreakDuration: 5 * 60,
                longBreakDuration: 15 * 60,
                sessionsBeforeLongBreak: 4,
                totalCycles: 0,
            }
        }

        const savedConfig = localStorage.getItem('breakTimerConfig')
        if (savedConfig) {
            return JSON.parse(savedConfig)
        } else {
            const defaultConfig = {
                workDuration: 24 * 60,
                shortBreakDuration: 5 * 60,
                longBreakDuration: 15 * 60,
                sessionsBeforeLongBreak: 4,
                totalCycles: 0,
            }
            localStorage.setItem(
                'breakTimerConfig',
                JSON.stringify(defaultConfig)
            )
            return defaultConfig
        }
    })

    const [rawInputs, setRawInputs] = useState(() => {
        if (typeof window === 'undefined') {
            return {
                workDuration: '24m',
                shortBreakDuration: '5m',
                longBreakDuration: '15m',
            }
        }

        const savedConfig = localStorage.getItem('breakTimerConfig')
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig)
            return {
                workDuration: formatSecondsToTime(parsedConfig.workDuration),
                shortBreakDuration: formatSecondsToTime(
                    parsedConfig.shortBreakDuration
                ),
                longBreakDuration: formatSecondsToTime(
                    parsedConfig.longBreakDuration
                ),
            }
        } else {
            return {
                workDuration: '24m',
                shortBreakDuration: '5m',
                longBreakDuration: '15m',
            }
        }
    })

    // Update localStorage whenever config changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('breakTimerConfig', JSON.stringify(config))
        }
    }, [config])

    const handleKeyPress =
        (field: keyof typeof rawInputs) =>
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                const parsed = parseTimeExpression(
                    rawInputs[field],
                    config[field]
                )

                if (!isNaN(parsed) && parsed >= 0) {
                    setConfig((prev: typeof config) => {
                        const newConfig = { ...prev, [field]: parsed }

                        // Ensure rawInputs updates immediately
                        setRawInputs((prevRaw: typeof rawInputs) => ({
                            ...prevRaw,
                            [field]: formatSecondsToTime(parsed),
                        }))

                        return newConfig
                    })
                } else {
                    // Reset to last valid value if input is invalid
                    setRawInputs((prevRaw: typeof rawInputs) => ({
                        ...prevRaw,
                        [field]: formatSecondsToTime(config[field]),
                    }))
                }

                // Remove focus from input
                e.currentTarget.blur()
            }
        }

    const handleRawInputChange =
        (field: keyof typeof rawInputs) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setRawInputs((prev) => ({
                ...prev,
                [field]: e.target.value,
            }))
        }

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const numValue = Number.parseInt(value)
        if (!isNaN(numValue) && numValue >= 0) {
            setConfig((prev) => ({
                ...prev,
                [name]: numValue,
            }))
        }
    }

    const [enforceBreak, setEnforceBreak] = useState(true)
    const {
        timeLeft,
        isBreak,
        isLongBreak,
        currentSession,
        completedCycles,
        isRunning,
        start,
        pause,
        reset,
        switchMode,
    } = useBreakTimer(config, enforceBreak, setEnforceBreak)

    useEffect(() => {
        let breakType = isBreak
            ? isLongBreak
                ? 'Long Break'
                : 'Short Break'
            : `Work Session ${currentSession}`
        document.title = `${formatTime(timeLeft)} - ${breakType}`
    }, [timeLeft, isBreak, isLongBreak, currentSession])

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainingSeconds = seconds % 60

        const parts = []
        if (hours > 0) {
            parts.push(hours.toString().padStart(2, '0'))
            parts.push(minutes.toString().padStart(2, '0'))
        } else {
            parts.push(minutes.toString().padStart(2, '0'))
        }
        parts.push(remainingSeconds.toString().padStart(2, '0'))

        return parts.join(':')
    }

    const skipBreak = () => {
        setEnforceBreak(true)
        switchMode()
    }

    const inputConfig = [
        { id: 'workDuration', label: 'Work Duration', field: 'workDuration' },
        {
            id: 'shortBreakDuration',
            label: 'Short Break',
            field: 'shortBreakDuration',
        },
        {
            id: 'longBreakDuration',
            label: 'Long Break',
            field: 'longBreakDuration',
        },
    ]

    return (
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <div className="container mx-auto p-4">
                <div className="flex gap-4 mt-8">
                    <h1 className="text-3xl font-bold mb-6">Break Scheduler</h1>
                    <ThemeToggle />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Timer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-6xl font-bold mb-4">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="mb-4">
                                {isBreak
                                    ? isLongBreak
                                        ? 'Long Break'
                                        : 'Short Break'
                                    : `Work Session ${currentSession}`}
                            </div>
                            <div className="mb-4">
                                Completed Cycles: {completedCycles}{' '}
                                {config.totalCycles > 0 &&
                                    `/ ${config.totalCycles}`}
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={start} disabled={isRunning}>
                                    Start
                                </Button>
                                <Button onClick={pause} disabled={!isRunning}>
                                    Pause
                                </Button>
                                <Button onClick={reset}>Reset</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {inputConfig.map(({ id, label, field }) => (
                                    <div key={id}>
                                        <Label htmlFor={id}>{label}</Label>
                                        <Input
                                            id={id}
                                            value={
                                                rawInputs[
                                                    field as keyof typeof rawInputs
                                                ]
                                            }
                                            onChange={handleRawInputChange(
                                                field as keyof typeof rawInputs
                                            )}
                                            onKeyDown={handleKeyPress(
                                                field as keyof typeof rawInputs
                                            )}
                                            onBlur={() =>
                                                setRawInputs((prev) => ({
                                                    ...prev,
                                                    [field]:
                                                        formatSecondsToTime(
                                                            config[
                                                                field as keyof typeof config
                                                            ]
                                                        ),
                                                }))
                                            }
                                            placeholder="e.g., 1m 30s, 150+5s"
                                        />
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {' '}
                                            {
                                                config[
                                                    field as keyof typeof config
                                                ]
                                            }{' '}
                                            seconds
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <Label htmlFor="sessionsBeforeLongBreak">
                                        Sessions before Long Break
                                    </Label>
                                    <Input
                                        id="sessionsBeforeLongBreak"
                                        name="sessionsBeforeLongBreak"
                                        type="number"
                                        min="1"
                                        value={config.sessionsBeforeLongBreak}
                                        onChange={handleConfigChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="totalCycles">
                                        Total Cycles (0 for infinite)
                                    </Label>
                                    <Input
                                        id="totalCycles"
                                        name="totalCycles"
                                        type="number"
                                        min="0"
                                        value={config.totalCycles}
                                        onChange={handleConfigChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {isBreak && (
                    <BreakEnforcer
                        onEnforce={setEnforceBreak}
                        onSkip={skipBreak}
                    />
                )}
            </div>
        </ThemeProvider>
    )
}
