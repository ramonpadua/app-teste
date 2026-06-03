import { useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export function useDocumentos() {
  const [loading, setLoading] = useState(false)

  const listar = useCallback(async () => {
    setLoading(true)
    try {
      const records = await pb.collection('documentos').getFullList({
        sort: '-created',
      })
      return records
    } finally {
      setLoading(false)
    }
  }, [])

  const deletar = useCallback(async (id: string) => {
    await pb.collection('documentos').delete(id)
  }, [])

  const gerarSignedUrl = useCallback(async (record: RecordModel) => {
    try {
      if (typeof pb.files.getToken === 'function') {
        const token = await pb.files.getToken()
        return pb.files.getUrl(record, record.arquivo, { token })
      }
      return pb.files.getUrl(record, record.arquivo) + '?token=' + pb.authStore.token
    } catch {
      return pb.files.getUrl(record, record.arquivo) + '?token=' + pb.authStore.token
    }
  }, [])

  const upload = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('nome_arquivo', file.name)
    formData.append('tamanho_bytes', file.size.toString())
    if (pb.authStore.record?.id) {
      formData.append('user', pb.authStore.record.id)
    }

    return await pb.collection('documentos').create(formData)
  }, [])

  return { listar, deletar, gerarSignedUrl, upload, loading }
}
