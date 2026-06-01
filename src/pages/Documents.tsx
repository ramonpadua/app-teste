import { Folder, HardDrive } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function Documents() {
  return (
    <div className="container mx-auto p-6 h-full flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md border-dashed border-2 shadow-none bg-slate-50/50">
        <CardContent className="pt-10 pb-10 text-center flex flex-col items-center gap-4">
          <div className="relative">
            <Folder className="h-16 w-16 text-slate-300" />
            <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1.5 shadow-sm">
              <HardDrive className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Em Breve</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              O gerenciador de documentos integrados será liberado em breve para organizar seus
              arquivos de reunião.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
