import { useState, useRef, useEffect } from 'react'
import { Bot, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import pb from '@/lib/pocketbase/client'
import { streamAgentChat } from '@/lib/skipAi'
import { cn } from '@/lib/utils'

const parseMarkdown = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;') // escape html
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground flex items-center gap-2">$1</h3>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-bold mt-6 mb-4 text-foreground flex items-center gap-2 border-b pb-2">$1</h2>',
    )
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(
      /`(.*?)`/g,
      '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-medium">$1</code>',
    )
    .replace(/^---/gim, '<hr class="my-6 border-border" />')
    .replace(
      /^\s*-\s+(.*)/gim,
      '<li class="ml-5 list-disc marker:text-primary/70 mb-2 pl-1 leading-relaxed">$1</li>',
    )
    .replace(/\n/g, '<br />')
    .replace(/(?:<br \/>\s*)+<li/g, '<li') // clean up br before li
    .replace(/<\/li>\s*(?:<br \/>)+/g, '</li>')
}

export function ReportAssistant() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateReport = async () => {
    setLoading(true)
    setError('')
    setContent('')

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/system-reporter/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({
            message:
              'Por favor, gere um relatório com o total de briefings, documentos/imagens e e-mails enviados.',
            conversation_id: conversationId,
          }),
          signal: abortControllerRef.current.signal,
        },
      )

      const result = await streamAgentChat(res, {
        onChunk: (_, full) => setContent(full),
        signal: abortControllerRef.current.signal,
      })

      setConversationId(res.headers.get('X-Conversation-Id') ?? result.conversation_id)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Falha ao gerar o relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && !content && !loading && !error) {
      generateReport()
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            'fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105',
            open && 'scale-0 opacity-0',
          )}
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Assistente de Relatórios
          </SheetTitle>
          <SheetDescription>Resumo organizado das atividades e uso da sua conta.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {loading && !content && (
            <div className="flex flex-col space-y-6 py-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
              <div className="space-y-3 mt-4">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-destructive animate-in fade-in">
              <div className="p-4 bg-destructive/10 rounded-full">
                <Bot className="h-8 w-8" />
              </div>
              <p className="text-center text-sm">{error}</p>
              <Button variant="outline" onClick={generateReport} size="sm">
                Tentar novamente
              </Button>
            </div>
          )}

          {content && (
            <div
              className="text-[15px] text-foreground/90 space-y-1 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          )}
        </ScrollArea>

        <div className="p-6 border-t bg-muted/10">
          <Button
            className="w-full shadow-sm"
            variant="default"
            onClick={generateReport}
            disabled={loading}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            {loading ? 'Gerando...' : 'Atualizar Relatório'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
