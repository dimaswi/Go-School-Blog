import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface OrientationWarningModalProps {
  orientation: 'landscape' | 'portrait' | 'square' | null
  onClose: () => void
}

export function OrientationWarningModal({ orientation, onClose }: OrientationWarningModalProps) {
  const open = !!orientation && orientation !== 'square'
  const isPortrait = orientation === 'portrait'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <DialogTitle>Orientasi Gambar Tidak Sesuai</DialogTitle>
          </div>
          <DialogDescription>
            Gambar <b>{isPortrait ? 'Portrait' : 'Landscape'}</b> hanya bisa digunakan untuk{' '}
            <b>{isPortrait ? 'Sidebar' : 'Banner (Slider / Footer / Artikel)'}</b>.
            Posisi telah disesuaikan otomatis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={onClose}>Mengerti</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
