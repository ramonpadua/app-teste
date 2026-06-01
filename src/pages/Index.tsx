import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  Square,
  Plus,
  Loader2,
  FileText,
  Calendar as CalendarIcon,
  LogOut,
} from 'lucide-react'
import { getBriefings, createBriefing, Briefing } from '@/services/briefings'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { toast } = useToast()
  const { user, signOut } = useAuth()

  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = async () => {
    try {
      const items = await getBriefings()
      setBriefings(items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('briefings', () => {
    loadData()
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setIsTranscribing(true)

      timerRef.current = setTimeout(() => {
        setIsTranscribing(false)
        const mockTranscription =
          ' [Transcrição de áudio: O foco principal será a nova estratégia de Q4, visando aumentar o engajamento e a retenção de usuários. Precisamos alinhar os prazos com o time de engenharia até sexta-feira.]'
        setContent((prev) => prev + mockTranscription)
        toast({
          title: 'Áudio transcrito',
          description: 'O texto foi adicionado ao seu briefing.',
        })
      }, 2500)
    } else {
      setIsRecording(true)
    }
  }

  const handleAddBriefing = async () => {
    if (!content.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o conteúdo da reunião.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const defaultTitle = `New Briefing - ${new Intl.DateTimeFormat('pt-BR').format(new Date())}`
      const finalTitle = title.trim() || defaultTitle

      await createBriefing({
        title: finalTitle,
        content,
        meeting_date: new Date().toISOString(),
        input_type: isTranscribing || content.includes('[Transcrição de áudio') ? 'audio' : 'text',
        user: user.id,
      })

      setTitle('')
      setContent('')
      toast({
        title: 'Briefing salvo',
        description: 'Suas notas foram adicionadas com sucesso.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o briefing. Verifique sua conexão.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (isoDate: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(isoDate))
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Novo Briefing</h2>
          <p className="text-muted-foreground">Capture notas ou grave o áudio da sua reunião.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <Card className="border-slate-200 shadow-subtle">
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Título da Reunião (ex: Alinhamento Semanal)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium bg-white"
            disabled={isSaving}
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
                disabled={isSaving}
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant={isRecording ? 'destructive' : 'secondary'}
              onClick={handleToggleRecording}
              disabled={isTranscribing || isSaving}
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

            <Button
              onClick={handleAddBriefing}
              disabled={isRecording || isTranscribing || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Adicionar Briefing
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Histórico de Briefings</h3>
          <p className="text-sm text-muted-foreground">Suas reuniões e anotações recentes.</p>
        </div>

        {loadingList ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-40">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
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
                      {formatDate(briefing.meeting_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {briefing.content.substring(0, 100) +
                        (briefing.content.length > 100 ? '...' : '')}
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
        )}
      </section>
    </div>
  )
}
