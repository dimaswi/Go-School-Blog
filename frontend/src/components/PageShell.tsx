import * as React from "react"

interface PageShellProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  backButton?: React.ReactNode
  footer?: React.ReactNode
}

export default function PageShell({ title, description, actions, children, backButton, footer }: PageShellProps) {
  return (
    <div className="flex flex-col flex-1 relative min-w-0 animate-fade-in">
      <div className="flex flex-col flex-1 px-4 md:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex flex-col gap-2 flex-1">
          {/* Page Header — like Go-Voting */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {backButton && (
                <div className="shrink-0">
                  {backButton}
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {children}
          </div>
        </div>
      </div>

      {footer && (
        <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t p-4 mt-auto shadow-sm">
          {footer}
        </div>
      )}
    </div>
  )
}
