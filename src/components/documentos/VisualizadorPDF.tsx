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
import { Download, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useDocumentos } from '@/hooks/use-documentos'
import { useToast } from '@/hooks/use-toast'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

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
  const { toast } = useToast()

  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  useEffect(() => {
    if (open && record) {
      setLoading(true)
      gerarSignedUrl(record)
        .then((signedUrl) => {
          setUrl(signedUrl)
          setLoading(false)
          setPageNumber(1)
          setScale(1.0)
        })
        .catch((err) => {
          console.error(err)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar a URL do documento.',
            variant: 'destructive',
          })
          setLoading(false)
        })
    } else {
      setUrl('')
      setNumPages(undefined)
      setPageNumber(1)
      setScale(1.0)
    }
  }, [open, record, gerarSignedUrl, toast])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function onDocumentLoadError(error: Error) {
    console.error(error)
    toast({
      title: 'Erro ao carregar PDF',
      description: 'Ocorreu um erro ao tentar processar o documento. A URL pode ter expirado.',
      variant: 'destructive',
    })
  }

  const isPDF = record?.nome_arquivo.toLowerCase().endsWith('.pdf')
  const isImage = record?.nome_arquivo.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row justify-between items-center shrink-0 space-y-0">
          <div className="flex-1 min-w-0 pr-4">
            <DialogTitle className="truncate" title={record?.nome_arquivo}>
              {record?.nome_arquivo}
            </DialogTitle>
            <DialogDescription className="sr-only">Visualizador de arquivo</DialogDescription>
          </div>

          <div className="flex items-center space-x-2 shrink-0 mr-8">
            {isPDF && !loading && url && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium whitespace-nowrap min-w-[5rem] text-center">
                  {numPages ? `Pág. ${pageNumber} de ${numPages}` : 'Pág. 1'}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
                  disabled={!numPages || pageNumber >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-2" />
              </>
            )}

            <Button variant="outline" size="sm" asChild>
              <a href={url} download={record?.nome_arquivo} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-muted/30 relative flex items-center justify-center overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Carregando documento seguro...</p>
            </div>
          ) : url ? (
            isImage ? (
              <img
                src={url}
                alt={record?.nome_arquivo}
                className="max-w-full max-h-full object-contain"
              />
            ) : isPDF ? (
              <div className="max-w-full flex justify-center">
                <Document
                  file={url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p>Renderizando PDF...</p>
                    </div>
                  }
                  className="max-w-full flex justify-center drop-shadow-md"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="w-full h-full flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    }
                  />
                </Document>
              </div>
            ) : (
              <iframe
                src={url}
                className="w-full h-full border-0 bg-white"
                title={record?.nome_arquivo}
              />
            )
          ) : (
            <p className="text-muted-foreground">Não foi possível carregar o documento.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
