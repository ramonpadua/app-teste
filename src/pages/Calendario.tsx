import { useState, useEffect } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import { getEvents, createEvent, updateEvent, CalendarEvent } from '@/services/calendar'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Calendario() {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  })

  const { toast } = useToast()

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await getEvents()
      setEvents(res.items)
      if (!res.google_sync) {
        toast({
          title: 'Aviso',
          description: 'Google Calendar não autenticado. Operando em modo local.',
          variant: 'default',
        })
      }
    } catch (err) {
      toast({
        title: 'Erro ao carregar eventos',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const openNewEvent = () => {
    setSelectedEvent(null)
    const now = new Date()
    const later = new Date()
    later.setHours(now.getHours() + 1)
    setFormData({
      title: '',
      description: '',
      start_date: now.toISOString(),
      end_date: later.toISOString(),
    })
    setIsModalOpen(true)
  }

  const openEditEvent = (evt: CalendarEvent) => {
    setSelectedEvent(evt)
    setFormData({
      title: evt.title,
      description: evt.description || '',
      start_date: evt.start_date,
      end_date: evt.end_date,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, formData)
        toast({ title: 'Sucesso', description: 'Evento atualizado com sucesso' })
      } else {
        await createEvent(formData)
        toast({ title: 'Sucesso', description: 'Evento criado com sucesso' })
      }
      setIsModalOpen(false)
      loadEvents()
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const getDays = () => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate))
      const end = endOfWeek(endOfMonth(currentDate))
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate)
      const end = endOfWeek(currentDate)
      return eachDayOfInterval({ start, end })
    }
  }

  const days = getDays()

  const parseLocalToISO = (val: string) => {
    if (!val) return ''
    try {
      return new Date(val).toISOString()
    } catch {
      return ''
    }
  }

  const formatISOToLocal = (val: string) => {
    if (!val) return ''
    try {
      return format(parseISO(val), "yyyy-MM-dd'T'HH:mm")
    } catch {
      return ''
    }
  }

  return (
    <div className="container mx-auto p-6 h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">Gerencie seus eventos e integrações</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v: 'month' | 'week') => setView(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="week">Semanal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openNewEvent}>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-[600px] shadow-sm">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between space-y-0 bg-card">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>
              Hoje
            </Button>
          </div>
          <CardTitle className="text-lg font-medium capitalize">
            {view === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
              : `${format(startOfWeek(currentDate), "d 'de' MMM", { locale: ptBR })} - ${format(endOfWeek(currentDate), "d 'de' MMM yyyy", { locale: ptBR })}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-7 gap-px bg-border overflow-y-auto">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div
                  key={day}
                  className="bg-muted/50 p-2 text-center text-sm font-semibold text-muted-foreground border-b border-border"
                >
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                const dayEvents = events.filter((e) => {
                  try {
                    return isSameDay(parseISO(e.start_date), day)
                  } catch {
                    return false
                  }
                })
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={idx}
                    className={`bg-background min-h-[120px] p-2 flex flex-col gap-1 transition-colors ${!isCurrentMonth && view === 'month' ? 'opacity-50 bg-muted/20' : ''}`}
                  >
                    <div className="flex justify-end mb-1">
                      <div
                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                      {dayEvents.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => openEditEvent(e)}
                          className="text-xs bg-secondary/80 hover:bg-secondary cursor-pointer p-1.5 rounded truncate transition-colors border border-border/50 text-secondary-foreground"
                          title={e.title}
                        >
                          <span className="font-semibold mr-1">
                            {format(parseISO(e.start_date), 'HH:mm')}
                          </span>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Evento</Label>
              <Input
                id="title"
                placeholder="Ex: Reunião de Alinhamento"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Início</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formatISOToLocal(formData.start_date)}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: parseLocalToISO(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Término</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formatISOToLocal(formData.end_date)}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: parseLocalToISO(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                placeholder="Detalhes adicionais..."
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
