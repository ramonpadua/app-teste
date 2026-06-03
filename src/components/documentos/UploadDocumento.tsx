import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDocumentos } from '@/hooks/use-documentos'
import { useToast } from '@/hooks/use-toast'
import { Loader2, UploadCloud } from 'lucide-react'

export function UploadDocumento({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { upload } = useDocumentos()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) {
      setFile(null)
      return
    }

    if (selected.type !== 'application/pdf') {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive',
      })
      e.target.value = ''
      setFile(null)
      return
    }

    if (selected.size > 20 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 20MB.',
        variant: 'destructive',
      })
      e.target.value = ''
      setFile(null)
      return
    }

    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await upload(file)
      toast({ title: 'Sucesso', description: 'Documento anexado com sucesso.' })
      onOpenChange(false)
      setFile(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar documento</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo PDF. O tamanho máximo permitido é 20MB.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="arquivo">Arquivo PDF</Label>
            <Input
              id="arquivo"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              aria-label="Selecione um arquivo PDF"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UploadCloud className="mr-2 h-4 w-4" />
            Anexar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
