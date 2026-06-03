import { useState, useEffect } from 'react'
import type { RecordModel } from 'pocketbase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useDocumentos } from '@/hooks/use-documentos'

export function VisualizadorPDF({
  record,
  open,
  onOpenChange,
}: {
  record: RecordModel | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { gerarSignedUrl } = useDocumentos()

  useEffect(() => {
    if (open && record) {
      setLoading(true)
      gerarSignedUrl(record).then((signedUrl) => {
        setUrl(signedUrl)
        setLoading(false)
      })
    } else {
      setUrl('')
    }
  }, [open, record, gerarSignedUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row justify-between items-center shrink-0 space-y-0">
          <div className="flex-1 min-w-0 pr-4">
            <DialogTitle className="truncate" title={record?.nome_arquivo}>
              {record?.nome_arquivo}
            </DialogTitle>
            <DialogDescription className="sr-only">Visualizador de documento PDF</DialogDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 mr-8">
            <a href={url} download={record?.nome_arquivo} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </a>
          </Button>
        </DialogHeader>
        <div className="flex-1 bg-muted/30 relative flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando documento seguro...</p>
            </div>
          ) : url ? (
            <iframe src={url} className="w-full h-full border-0" title={record?.nome_arquivo} />
          ) : (
            <p className="text-muted-foreground">Não foi possível carregar o documento.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
