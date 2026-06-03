import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UploadDocumento } from '@/components/documentos/UploadDocumento'
import { ListaDocumentos } from '@/components/documentos/ListaDocumentos'
import { useDocumentos } from '@/hooks/use-documentos'
import { useRealtime } from '@/hooks/use-realtime'
import type { RecordModel } from 'pocketbase'

export default function Documents() {
  const { listar, loading } = useDocumentos()
  const [documentos, setDocumentos] = useState<RecordModel[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)

  const loadDocs = async () => {
    try {
      const docs = await listar()
      setDocumentos(docs)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  useRealtime('documentos', () => {
    loadDocs()
  })

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Anexar documento
        </Button>
      </div>

      <ListaDocumentos documentos={documentos} loading={loading} />

      <UploadDocumento open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}
