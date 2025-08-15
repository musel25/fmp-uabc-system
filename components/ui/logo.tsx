export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-2xl font-bold text-primary">
        FMP <span className="text-muted-foreground">•</span> UABC
      </div>
    </div>
  )
}
