import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import { useBriefings } from '@/hooks/use-briefings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useEffect } from 'react'

export default function BriefingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getBriefing } = useBriefings()

  const briefing = id ? getBriefing(id) : undefined

  useEffect(() => {
    if (!briefing && id) {
      navigate('/')
    }
  }, [briefing, id, navigate])

  if (!briefing) return null

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
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{briefing.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>{briefing.date}</span>
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
