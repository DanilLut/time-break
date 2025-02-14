import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Theme } from '@/types/theme-context'
import { useTheme } from '@/hooks/use-theme'

const themeNames: Record<Theme, string> = {
    light: 'Светлая тема',
    dark: 'Темная тема',
    system: 'Авто',
}

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-5 h-5">
                        <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span>{themeNames[theme]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(themeNames).map(([key, label]) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => {
                            setTheme(key as Theme)
                        }}
                    >
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
