import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Cpu, Menu } from 'lucide-react'
import { ThemeSwitcher } from '../theme-switcher'
import { cn } from '@/lib/utils'

export function Navbar() {
    const routes = [
        { id: 1, href: '/upcoming', label: 'Features' },
        { id: 2, href: '/upcoming', label: 'Marketplace' },
        { id: 3, href: '/upcoming', label: 'Pricing' },
        { id: 4, href: '/upcoming', label: 'About' },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link 
                    className="flex items-center justify-center space-x-2 hover:opacity-75 transition" 
                    href="/"
                >
                    <Cpu className="h-6 w-6" />
                    <span className="text-xl font-bold">AI Marketplace</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    {routes.map((route) => (
                        <Link 
                            key={route.id}
                            href={route.href}
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            {route.label}
                        </Link>
                    ))}
                    <Link href="/sign-in">
                        <Button variant="ghost" className="w-full border" size="sm">
                            Sign In
                        </Button>
                    </Link>
                    <ThemeSwitcher />
                </nav>

                {/* Mobile Navigation */}
                <Sheet>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <nav className="flex flex-col gap-4 mt-8">
                            {routes.map((route) => (
                                <Link
                                    key={route.id}
                                    href={route.href}
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    {route.label}
                                </Link>
                            ))}
                            <Link href="/sign-in">
                                <Button className="w-full" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <div className="flex justify-center mt-4">
                                <ThemeSwitcher />
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    )
} 