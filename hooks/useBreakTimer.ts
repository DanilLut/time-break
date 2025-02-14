'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TimerConfig = {
    workDuration: number
    shortBreakDuration: number
    longBreakDuration: number
    sessionsBeforeLongBreak: number
    totalCycles: number
}

export const useBreakTimer = (
    config: TimerConfig,
    enforceBreak: boolean,
    setEnforceBreak: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const [timeLeft, setTimeLeft] = useState(config.workDuration)
    const [isBreak, setIsBreak] = useState(false)
    const [isLongBreak, setIsLongBreak] = useState(false)
    const [currentSession, setCurrentSession] = useState(1)
    const [completedCycles, setCompletedCycles] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [isTabActive, setIsTabActive] = useState(true)
    const [lastTimestamp, setLastTimestamp] = useState<number | null>(null)
    const [lastActiveTimestamp, setLastActiveTimestamp] = useState<
        number | null
    >(null)
    const initialLoadDone = useRef(false)

    const playSound = useCallback((frequency: number, duration: number) => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext ||
                (window as any).webkitAudioContext)()
        }

        const oscillator = audioContext.current.createOscillator()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(
            frequency,
            audioContext.current.currentTime
        )
        oscillator.connect(audioContext.current.destination)
        oscillator.start()
        oscillator.stop(audioContext.current.currentTime + duration)
    }, [])

    const timerRef = useRef<number | null>(null)
    const audioContext = useRef<AudioContext | null>(null)

    // const showNotification = useCallback((title: string, body: string) => {
    //     if ('Notification' in window && Notification.permission === 'granted') {
    //         new Notification(title, { body })
    //     }
    // }, [])

    const switchMode = useCallback(() => {
        if (isBreak) {
            setIsBreak(false)
            setTimeLeft(config.workDuration)
            if (currentSession % config.sessionsBeforeLongBreak === 0) {
                setCompletedCycles((prev) => prev + 1)
            }
            setCurrentSession((prev) => prev + 1)
            playSound(440, 0.5) // A4 note
            // showNotification('Work Time', 'Time to focus!')
        } else {
            setIsBreak(true)
            if (currentSession % config.sessionsBeforeLongBreak === 0) {
                setIsLongBreak(true)
                setTimeLeft(config.longBreakDuration)
                // showNotification('Long Break', 'Time for a long break!')
            } else {
                setIsLongBreak(false)
                setTimeLeft(config.shortBreakDuration)
                // showNotification('Short Break', 'Time for a short break!')
            }
            playSound(523.25, 0.5) // C5 note
        }

        const now = Date.now()
        setLastTimestamp(now)
        setLastActiveTimestamp(now)
    }, [config, currentSession, isBreak, playSound])
    // }, [config, currentSession, isBreak, playSound, showNotification])

    const tick = useCallback(() => {
        if (isRunning) {
            if (
                config.totalCycles > 0 &&
                completedCycles >= config.totalCycles
            ) {
                setIsRunning(false)
                // showNotification(
                //     'All Cycles Completed',
                //     "Great job! You've completed all your scheduled cycles."
                // )
                reset()
                return
            }

            const now = Date.now()
            if (!isBreak || (isBreak && enforceBreak)) {
                setTimeLeft((prev) => {
                    const newTime = Math.max(0, prev - 1)
                    if (newTime === 0) {
                        switchMode()
                    }
                    return newTime
                })
                setLastTimestamp(now)
                setLastActiveTimestamp(now)
            } else {
                // Only update lastTimestamp when not in break or when break is enforced
                setLastTimestamp(now)
            }
        }
    }, [
        isRunning,
        isBreak,
        enforceBreak,
        config.totalCycles,
        completedCycles,
        // showNotification,
        switchMode,
    ])

    const start = useCallback(() => {
        const now = Date.now()
        setIsRunning(true)
        setLastTimestamp(now)
        setLastActiveTimestamp(now)
    }, [])

    const pause = useCallback(() => {
        setIsRunning(false)
        setLastTimestamp(null)
        setLastActiveTimestamp(null)
    }, [])

    const reset = useCallback(() => {
        pause()
        setTimeLeft(config.workDuration)
        setIsBreak(false)
        setIsLongBreak(false)
        setCurrentSession(1)
        setCompletedCycles(0)
    }, [config.workDuration, pause])

    // Handle tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden
            setIsTabActive(isVisible)

            if (isVisible && isRunning && lastTimestamp) {
                const now = Date.now()

                // Only update timer if not in break or if break is enforced
                if (
                    !isBreak ||
                    (isBreak && enforceBreak && lastActiveTimestamp)
                ) {
                    const elapsedSeconds = Math.floor(
                        (now - lastActiveTimestamp!) / 1000
                    )
                    if (elapsedSeconds > 0) {
                        setTimeLeft((prev) => {
                            const newTime = Math.max(0, prev - elapsedSeconds)
                            if (newTime === 0) {
                                switchMode()
                            }
                            return newTime
                        })
                        setLastActiveTimestamp(now)
                    }
                }
                setLastTimestamp(now)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            )
        }
    }, [
        isRunning,
        lastTimestamp,
        lastActiveTimestamp,
        isBreak,
        enforceBreak,
        switchMode,
    ])

    // Load initial state
    useEffect(() => {
        if (!initialLoadDone.current && typeof window !== 'undefined') {
            const savedState = localStorage.getItem('breakTimerState')
            if (savedState) {
                const parsedState = JSON.parse(savedState)
                setTimeLeft(parsedState.timeLeft)
                setIsBreak(parsedState.isBreak)
                setIsLongBreak(parsedState.isLongBreak)
                setCurrentSession(parsedState.currentSession)
                setCompletedCycles(parsedState.completedCycles)
                setIsRunning(parsedState.isRunning)

                if (parsedState.isRunning) {
                    const now = Date.now()
                    const lastSaved = parsedState.lastTimestamp || now

                    // Only update timer if not in break or if break was enforced
                    if (
                        !parsedState.isBreak ||
                        (parsedState.isBreak && parsedState.enforceBreak)
                    ) {
                        const lastActive =
                            parsedState.lastActiveTimestamp || lastSaved
                        const elapsedSeconds = Math.floor(
                            (now - lastActive) / 1000
                        )

                        if (elapsedSeconds > 0) {
                            const newTime = Math.max(
                                0,
                                parsedState.timeLeft - elapsedSeconds
                            )
                            setTimeLeft(newTime)
                        }
                        setLastActiveTimestamp(now)
                    }
                    setLastTimestamp(now)
                } else {
                    setLastTimestamp(parsedState.lastTimestamp)
                    setLastActiveTimestamp(parsedState.lastActiveTimestamp)
                }
            }

            initialLoadDone.current = true
        }

        if ('Notification' in window) {
            Notification.requestPermission()
        }
    }, [])

    // Save state
    useEffect(() => {
        if (initialLoadDone.current) {
            localStorage.setItem(
                'breakTimerState',
                JSON.stringify({
                    timeLeft,
                    isBreak,
                    isLongBreak,
                    currentSession,
                    completedCycles,
                    isRunning,
                    lastTimestamp,
                    lastActiveTimestamp,
                    enforceBreak,
                })
            )
        }
    }, [
        timeLeft,
        isBreak,
        isLongBreak,
        currentSession,
        completedCycles,
        isRunning,
        lastTimestamp,
        lastActiveTimestamp,
        enforceBreak,
    ])

    // Regular timer interval
    useEffect(() => {
        if (isRunning) {
            timerRef.current = window.setInterval(tick, 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isRunning, tick])

    // Reset break enforcement when switching to break
    useEffect(() => {
        if (isBreak) {
            setEnforceBreak(false)
        }
    }, [isBreak, setEnforceBreak])

    return {
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
    }
}
