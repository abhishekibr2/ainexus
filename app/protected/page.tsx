'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Mic, Globe, Paperclip, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const [isTyping, setIsTyping] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsTyping(true)
    handleSubmit(e)
    setIsTyping(false)
  }

  return (
    <div className="flex flex-col min-h-full">
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-12"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-4"
              >
                <h1 className="text-4xl font-bold">
                  What can I help with?
                </h1>
                <p className="text-gray-400">Ask me anything - I'm here to assist you</p>
              </motion.div>
              <div className="w-full max-w-2xl p-4 rounded-2xl shadow-xl">
                <form onSubmit={onSubmit} className="relative flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Message ChatGPT..."
                      className="w-full rounded-xl pr-12 min-h-[60px] resize-none min-w-[600px] focus:border-gray-600 transition-all"
                      rows={1}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="p-1.5"
                      >
                        <Mic className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="p-1.5"
                      >
                        <Paperclip className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="p-1.5"
                      >
                        <Globe className="w-5 h-5" />
                      </motion.button>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="submit"
                          variant="outline"
                          className="p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed max-h-10 align-middle hover:bg-muted"
                          disabled={!input.trim()}
                        >
                          <motion.div
                            animate={{ rotate: input.trim() ? [0, 12, 0] : 0 }}
                            transition={{ duration: 0.5, repeat: 0 }}
                          >
                            <Send className="w-5 h-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </form>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-center text-gray-500 mt-4"
                >
                  AI can make mistakes. Check important info.
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-3xl space-y-6 flex-1 overflow-y-auto py-6"
            >
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-2xl p-4 max-w-[80%] shadow-lg ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'
                        }`}
                    >
                      {m.content}
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

