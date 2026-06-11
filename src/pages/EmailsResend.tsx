import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

import {
  getUsuariosResend,
  createUsuarioResend,
  updateUsuarioResend,
  deleteUsuarioResend,
  notificarNovoCadastro,
  UsuarioResend,
} from '@/services/usuarios_resend'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
})

export default function EmailsResend() {
  const [users, setUsers] = useState<UsuarioResend[]>([])
  const [loading, setLoading] = useState(true)
  const [openNewUser, setOpenNewUser] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getUsuariosResend()
      setUsers(data)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('usuarios_resend', () => {
    loadData()
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    let newRecord: UsuarioResend | null = null

    try {
      newRecord = await createUsuarioResend({
        nome: values.nome,
        email: values.email,
        status_envio: 'pendente',
      })

      setOpenNewUser(false)
      form.reset()

      toast({
        title: 'Usuário cadastrado',
        description: 'Notificando o administrador...',
      })

      const result = await notificarNovoCadastro({ nome: values.nome, email: values.email })

      await updateUsuarioResend(newRecord.id, {
        status_envio: 'enviado',
        resend_email_id: result.id,
      })

      toast({
        title: 'Sucesso',
        description: 'Email enviado com sucesso!',
      })
    } catch (error: any) {
      console.error(error)
      const fieldErrors = extractFieldErrors(error)

      if (error?.status === 429) {
        toast({
          title: 'Atenção',
          description: 'Limite de envio atingido. Aguarde alguns segundos.',
          variant: 'destructive',
        })
      } else if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast({
          title: 'Erro no envio',
          description: error.message || 'Falha ao enviar o email.',
          variant: 'destructive',
        })
      }

      if (newRecord) {
        try {
          await updateUsuarioResend(newRecord.id, { status_envio: 'falhou' })
        } catch (e) {
          console.error('Failed to update status to falhou', e)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async (user: UsuarioResend) => {
    try {
      toast({
        title: 'Reenviando...',
        description: `Tentando notificar administrador sobre ${user.email}`,
      })

      await updateUsuarioResend(user.id, { status_envio: 'pendente' })
      const retryId = Date.now()

      const result = await notificarNovoCadastro({ nome: user.nome, email: user.email, retryId })

      await updateUsuarioResend(user.id, {
        status_envio: 'enviado',
        resend_email_id: result.id,
      })

      toast({
        title: 'Sucesso',
        description: 'Email reenviado com sucesso!',
      })
    } catch (error: any) {
      console.error(error)
      await updateUsuarioResend(user.id, { status_envio: 'falhou' })
      if (error?.status === 429) {
        toast({
          title: 'Atenção',
          description: 'Limite de envio atingido. Aguarde alguns segundos.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Erro ao reenviar',
          description: error.message || 'Falha ao reenviar o email.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUsuarioResend(id)
      toast({
        title: 'Excluído',
        description: 'Usuário removido com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover usuário.',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
      case 'falhou':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Falhou</Badge>
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: users.length,
    enviados: users.filter((u) => u.status_envio === 'enviado').length,
    falhas: users.filter((u) => u.status_envio === 'falhou').length,
    pendentes: users.filter((u) => u.status_envio === 'pendente').length,
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Envio de Emails com Resend</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários e monitore os envios de boas-vindas.
          </p>
        </div>

        <Dialog open={openNewUser} onOpenChange={setOpenNewUser}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário. Um email de boas-vindas será enviado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Ex: maria@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Total de Cadastros</span>
          <span className="text-3xl font-bold">{stats.total}</span>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Emails Enviados</span>
          <span className="text-3xl font-bold text-green-600">{stats.enviados}</span>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Falhas de Envio</span>
          <span className="text-3xl font-bold text-red-600">{stats.falhas}</span>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Pendentes</span>
          <span className="text-3xl font-bold text-yellow-600">{stats.pendentes}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data de cadastro</TableHead>
              <TableHead>Status do envio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.created ? format(new Date(user.created), 'dd/MM/yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status_envio)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Reenviar email"
                        onClick={() => handleResend(user)}
                        disabled={user.status_envio === 'pendente'}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Excluir usuário">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Deseja realmente excluir este usuário?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O usuário será permanentemente
                              removido da base de dados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
