import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UploadDocumento } from '@/components/documentos/UploadDocumento'
import { ListaDocumentos } from '@/components/documentos/ListaDocumentos'
import { useDocumentos } from '@/hooks/use-documentos'
import { useRealtime } from '@/hooks/use-realtime'
import type { RecordModel } from 'pocketbase'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Documents() {
  const { listar, loading } = useDocumentos()
  const [documentos, setDocumentos] = useState<RecordModel[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [filtro, setFiltro] = useState<string>('todos')

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

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const ext = doc.nome_arquivo.split('.').pop()?.toLowerCase() || ''
      if (filtro === 'todos') return true
      if (filtro === 'imagens') return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
      if (filtro === 'pdf') return ext === 'pdf'
      if (filtro === 'doc') return ['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)
      return true
    })
  }, [documentos, filtro])

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Anexar documento
        </Button>
      </div>

      <Tabs value={filtro} onValueChange={setFiltro} className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="imagens">Imagens</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="doc">Doc</TabsTrigger>
        </TabsList>
      </Tabs>

      <ListaDocumentos documentos={documentosFiltrados} loading={loading} filtro={filtro} />

      <UploadDocumento open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}
