"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sendChatMessage } from "@/actions/recommendation-chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Recommend a film matching my current mood.",
  "Which movies will help stamp my Cinema Passport?",
  "Recommend a critically-acclaimed hidden gem.",
];

export default function RecommendationChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your TaleDen Cinema AI Concierge. I have analyzed your Taste Signature, current mood state, and Cinema Passport. What kind of cinematic journey are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = [...messages, userMessage];
      const result = await sendChatMessage(history);
      if (result.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.reply! }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.error || "Sorry, I had trouble processing that request." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please check your connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/recommendations">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
            AI Cinema Concierge
          </h1>
          <p className="text-xs text-muted-foreground">
            Personalized curation chat aligned with your cinema intelligence score.
          </p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/40 backdrop-blur-sm flex flex-col h-[600px] overflow-hidden">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-primary" />
            Cinema Expert Assistant
          </CardTitle>
          <CardDescription className="text-xs">
            Ask for movie recommendations, passport analysis, or specific genres.
          </CardDescription>
        </CardHeader>

        {/* Messages Feed */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((msg, index) => {
            const isAI = msg.role === "assistant";
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isAI
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                    isAI
                      ? "bg-card border border-border text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-primary/10 text-primary border-primary/20">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-card border border-border text-foreground rounded-2xl px-4 py-3 text-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card/20 space-y-3">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSubmit(prompt)}
                  className="text-xs bg-muted/60 hover:bg-muted border border-border/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations, passport tips, or genre suggestions..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
