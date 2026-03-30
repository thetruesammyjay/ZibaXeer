import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-6">
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin duration-700"></div>
                <Loader2 className="h-8 w-8 animate-[spin_2s_linear_infinite] text-primary/70" />
            </div>
            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-sm animate-pulse">
                Syncing Blockchain Data
            </p>
        </div>
    )
}
