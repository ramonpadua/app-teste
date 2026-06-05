import pb from '@/lib/pocketbase/client'

export interface UsuarioResend {
  id: string
  nome: string
  email: string
  status_envio: 'pendente' | 'enviado' | 'falhou'
  resend_email_id?: string
  created: string
  updated: string
}

export const getUsuariosResend = () =>
  pb.collection<UsuarioResend>('usuarios_resend').getFullList({ sort: '-created' })

export const createUsuarioResend = (data: Partial<UsuarioResend>) =>
  pb.collection<UsuarioResend>('usuarios_resend').create(data)

export const updateUsuarioResend = (id: string, data: Partial<UsuarioResend>) =>
  pb.collection<UsuarioResend>('usuarios_resend').update(id, data)

export const deleteUsuarioResend = (id: string) => pb.collection('usuarios_resend').delete(id)

export const sendWelcomeEmail = (data: { nome: string; email: string; retryId?: number }) =>
  pb.send<{ id: string }>('/backend/v1/enviar-email-boas-vindas', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
