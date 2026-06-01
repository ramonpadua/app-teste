import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, FileText, Loader2, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { getBriefing, Briefing } from '@/services/briefings'
import { useToast } from '@/hooks/use-toast'

export default function BriefingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getBriefing(id)
        .then(setBriefing)
        .catch(() => {
          toast({
            title: 'Briefing não encontrado',
            description: 'O briefing que você tentou acessar não existe.',
            variant: 'destructive',
          })
          navigate('/')
        })
        .finally(() => setLoading(false))
    } else {
      navigate('/')
    }
  }, [id, navigate, toast])

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!briefing) return null

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(briefing.meeting_date))

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{briefing.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
            {briefing.input_type === 'audio' && (
              <>
                <span className="mx-1">•</span>
                <Mic className="h-4 w-4" />
                <span>Transcrição de Áudio</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileText className="h-4 w-4 text-primary" />
            Conteúdo da Reunião
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="prose prose-slate max-w-none prose-p:leading-relaxed">
            {briefing.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="text-slate-700 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
