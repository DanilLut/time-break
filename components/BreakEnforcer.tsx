'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

type BreakEnforcerProps = {
    onEnforce: (enforce: boolean) => void
    onSkip: () => void
}

export default function BreakEnforcer({
    onEnforce,
    onSkip,
}: BreakEnforcerProps) {
    const [isInside, setIsInside] = useState(false)

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            const enforceBox = document.getElementById('enforce-box')
            if (enforceBox) {
                const rect = enforceBox.getBoundingClientRect()
                const newIsInside =
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                setIsInside(newIsInside)
                onEnforce(newIsInside)
            }
        },
        [onEnforce]
    )

    const handleMouseLeave = useCallback(() => {
        setIsInside(false)
        onEnforce(false)
    }, [onEnforce])

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [handleMouseMove, handleMouseLeave])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <div
                id="enforce-box"
                className={`w-64 h-64 flex items-center justify-center text-white text-center p-4 rounded-lg ${
                    isInside ? 'bg-green-500' : 'bg-red-500'
                }`}
            >
                {isInside
                    ? 'Keep your mouse here during the break'
                    : 'Move your mouse back inside to continue the break'}
            </div>
            <Button onClick={onSkip} className="mt-4">
                Skip Break
            </Button>
        </div>
    )
}
