import { useState } from 'react'
import type { RecordModel } from 'pocketbase'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Eye, Trash2 } from 'lucide-react'
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

export function ListaDocumentos({
  documentos,
  loading,
}: {
  documentos: RecordModel[]
  loading: boolean
}) {
  const [docToView, setDocToView] = useState<RecordModel | null>(null)
  const [docToDelete, setDocToDelete] = useState<RecordModel | null>(null)
  const { deletar } = useDocumentos()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardHeader>
            <CardFooter className="mt-auto pt-4 gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-10" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum documento anexado ainda</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Faça upload de seus PDFs para mantê-los organizados e acessíveis durante suas reuniões.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentos.map((doc) => (
          <Card key={doc.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-medium text-base truncate" title={doc.nome_arquivo}>
                    {doc.nome_arquivo}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <span>{formatSize(doc.tamanho_bytes)}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(doc.created), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 mt-auto flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setDocToView(doc)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDocToDelete(doc)}
                aria-label="Excluir documento"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
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
