import { useState, useEffect } from 'react'
import type { RecordModel } from 'pocketbase'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Eye, Trash2, Image as ImageIcon, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { VisualizadorPDF } from './VisualizadorPDF'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDocumentos } from '@/hooks/use-documentos'
import { useToast } from '@/hooks/use-toast'

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function DocumentCard({
  doc,
  onView,
  onDelete,
}: {
  doc: RecordModel
  onView: (doc: RecordModel) => void
  onDelete: (doc: RecordModel) => void
}) {
  const [url, setUrl] = useState<string>('')
  const { gerarSignedUrl } = useDocumentos()

  useEffect(() => {
    gerarSignedUrl(doc).then((signedUrl) => {
      setUrl(signedUrl)
    })
  }, [doc, gerarSignedUrl])

  const ext = doc.nome_arquivo.split('.').pop()?.toLowerCase() || ''
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
  const isPdf = ext === 'pdf'

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow overflow-hidden group">
      <div className="aspect-video w-full bg-muted/30 border-b relative flex items-center justify-center overflow-hidden">
        {!url ? (
          <Skeleton className="w-full h-full rounded-none" />
        ) : isImage ? (
          <img
            src={url}
            alt={doc.nome_arquivo}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : isPdf ? (
          <div className="w-full h-full relative overflow-hidden bg-white">
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              className="absolute top-0 left-0 w-[200%] h-[200%] pointer-events-none border-0 origin-top-left scale-50"
              tabIndex={-1}
              title={`Preview ${doc.nome_arquivo}`}
            />
            <div className="absolute inset-0 z-10 bg-transparent" />
          </div>
        ) : (
          <File className="h-16 w-16 text-muted-foreground/30" />
        )}
      </div>

      <CardContent className="p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            {isImage ? (
              <ImageIcon className="h-5 w-5 text-primary" />
            ) : isPdf ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <File className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate" title={doc.nome_arquivo}>
              {doc.nome_arquivo}
            </h3>
            <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
              <span>{formatSize(doc.tamanho_bytes)}</span>
              <span>{format(new Date(doc.created), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
        <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => onView(doc)}>
          <Eye className="mr-2 h-3.5 w-3.5" />
          Visualizar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={() => onDelete(doc)}
          aria-label="Excluir documento"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

export function ListaDocumentos({
  documentos,
  loading,
  filtro = 'todos',
}: {
  documentos: RecordModel[]
  loading: boolean
  filtro?: string
}) {
  const [docToView, setDocToView] = useState<RecordModel | null>(null)
  const [docToDelete, setDocToDelete] = useState<RecordModel | null>(null)
  const { deletar } = useDocumentos()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!docToDelete) return
    setIsDeleting(true)
    try {
      await deletar(docToDelete.id)
      toast({ title: 'Documento excluído', description: 'O documento foi removido com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDocToDelete(null)
    }
  }

  if (loading && documentos.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex flex-col overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <CardContent className="p-4 flex-1 mt-2">
              <div className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-8" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (documentos.length === 0) {
    const emptyMessage =
      filtro === 'todos'
        ? 'Nenhum documento anexado ainda'
        : filtro === 'imagens'
          ? 'Nenhuma imagem encontrada'
          : filtro === 'pdf'
            ? 'Nenhum PDF encontrado'
            : 'Nenhum documento de texto encontrado'

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {filtro === 'todos'
            ? 'Faça upload de seus PDFs e documentos para mantê-los organizados.'
            : 'Tente alterar o filtro ou faça upload de um novo arquivo deste tipo.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documentos.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onView={setDocToView} onDelete={setDocToDelete} />
        ))}
      </div>

      <VisualizadorPDF
        record={docToView}
        open={!!docToView}
        onOpenChange={(open) => !open && setDocToView(null)}
      />

      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{docToDelete?.nome_arquivo}"? Esta ação não pode ser
              desfeita e o arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
