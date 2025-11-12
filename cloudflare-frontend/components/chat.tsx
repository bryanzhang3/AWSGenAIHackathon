"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  role: "user" | "assistant"
  content: string
}

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vibecad-ai-agent.your-subdomain.workers.dev'

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleClearConversation = async () => {
    if (!conversationId) {
      setMessages([])
      return
    }

    try {
      await fetch(`${API_URL}/api/conversation/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error("Error clearing conversation:", error)
    }

    setMessages([])
    setConversationId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)
    setStreamingContent("")

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.content && !data.done) {
                accumulatedContent += data.content
                setStreamingContent(accumulatedContent)
              } else if (data.done) {
                // Finalize the message
                if (accumulatedContent) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: accumulatedContent },
                  ])
                }

                // Save conversation ID
                if (data.conversationId) {
                  setConversationId(data.conversationId)
                }

                setStreamingContent("")
              } else if (data.error) {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error calling API:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
        },
      ])
      setStreamingContent("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center py-12">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Start Designing with AI</h2>
                <p className="text-muted-foreground mb-6">Describe what you want to build in plain English</p>
                <div className="space-y-2 text-left max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground">Try examples like:</p>
                  <div className="space-y-1">
                    <p className="text-sm bg-muted px-3 py-2 rounded-md">
                      "Create a simple gear with 15 teeth"
                    </p>
                    <p className="text-sm bg-muted px-3 py-2 rounded-md">
                      "Design a bracket to mount a 5-inch monitor"
                    </p>
                    <p className="text-sm bg-muted px-3 py-2 rounded-md">
                      "Make a phone stand with a 45 degree angle"
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-6">
                  Powered by Cloudflare Workers AI (Llama 3.3)
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background prose-pre:text-foreground prose-code:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-muted text-foreground rounded-lg px-4 py-3">
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background prose-pre:text-foreground prose-code:text-foreground inline-block">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1 align-bottom" />
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <p className="text-sm text-muted-foreground">Generating with Llama 3.3...</p>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what you want to build..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
              {messages.length > 0 && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleClearConversation}
                  disabled={isLoading}
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</p>
        </form>
      </div>
    </div>
  )
}
