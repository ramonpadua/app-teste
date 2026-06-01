import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Square, Plus, Loader2, FileText, Calendar as CalendarIcon } from 'lucide-react'
import { useBriefings } from '@/hooks/use-briefings'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { briefings, addBriefing } = useBriefings()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleToggleRecording = () => {
    if (isRecording) {
      // Stop recording and start transcribing
      setIsRecording(false)
      setIsTranscribing(true)

      // Simulate transcription delay
      timerRef.current = setTimeout(() => {
        setIsTranscribing(false)
        const mockTranscription =
          ' [Transcrição de áudio: O foco principal será a nova estratégia de Q4, visando aumentar o engajamento e a retenção de usuários. Precisamos alinhar os prazos com o time de engenharia até sexta-feira.]'
        setContent((prev) => prev + mockTranscription)
        toast({
          title: 'Áudio transcrito com sucesso!',
          description: 'O texto foi adicionado ao seu briefing.',
        })
      }, 2500)
    } else {
      // Start recording
      setIsRecording(true)
    }
  }

  const handleAddBriefing = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o conteúdo da reunião.',
        variant: 'destructive',
      })
      return
    }

    addBriefing({
      title,
      content,
      summary: content.length > 80 ? content.substring(0, 80) + '...' : content,
    })

    setTitle('')
    setContent('')
    toast({
      title: 'Briefing salvo',
      description: 'Suas notas foram adicionadas com sucesso.',
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Novo Briefing</h2>
          <p className="text-muted-foreground">Capture notas ou grave o áudio da sua reunião.</p>
        </div>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Título da Reunião (ex: Alinhamento Semanal)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium bg-white"
            />

            <div className="relative">
              {isTranscribing ? (
                <div className="min-h-[150px] p-4 rounded-md border bg-slate-50 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Processando áudio e transcrevendo...
                  </p>
                  <div className="space-y-2 w-full max-w-md mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[90%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder="Escreva suas anotações aqui..."
                  className="min-h-[150px] resize-y bg-white text-base leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant={isRecording ? 'destructive' : 'secondary'}
                onClick={handleToggleRecording}
                disabled={isTranscribing}
                className={isRecording ? 'animate-pulse-red' : ''}
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4 fill-current" /> Parar Gravação
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" /> Gravar Áudio
                  </>
                )}
              </Button>

              <Button onClick={handleAddBriefing} disabled={isRecording || isTranscribing}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Briefing
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Histórico de Briefings</h3>
          <p className="text-sm text-muted-foreground">Suas reuniões e anotações recentes.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefings.map((briefing) => (
            <Link key={briefing.id} to={`/briefings/${briefing.id}`}>
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md bg-white cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {briefing.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {briefing.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {briefing.summary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {briefings.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>Nenhum briefing encontrado.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
