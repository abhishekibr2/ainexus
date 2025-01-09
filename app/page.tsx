import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, Code, Cpu, Search, Zap } from 'lucide-react'
import { Navbar } from '@/components/navbar/navbar'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen pt-16">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to the AI Agents Marketplace
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Discover, deploy, and manage cutting-edge AI agents for your business needs. Boost productivity and innovation with our diverse marketplace.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2">
                  <Input className="max-w-lg flex-1" placeholder="Search for AI agents" type="text" />
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <Bot className="h-12 w-12 text-blue-500" />
                <h2 className="text-2xl font-bold">Diverse Agent Selection</h2>
                <p className="max-w-[300px] text-gray-500 dark:text-gray-400">
                  Choose from a wide range of specialized AI agents tailored for various tasks and industries.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <Zap className="h-12 w-12 text-green-500" />
                <h2 className="text-2xl font-bold">Easy Integration</h2>
                <p className="max-w-[300px] text-gray-500 dark:text-gray-400">
                  Seamlessly integrate AI agents into your existing workflows with our user-friendly platform.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <Code className="h-12 w-12 text-purple-500" />
                <h2 className="text-2xl font-bold">Customization</h2>
                <p className="max-w-[300px] text-gray-500 dark:text-gray-400">
                  Tailor AI agents to your specific needs with our powerful customization tools and API.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Transform Your Business?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Join our AI marketplace today and unlock the potential of intelligent automation.
                </p>
              </div>
              <Link className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300" href="/sign-in">
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

