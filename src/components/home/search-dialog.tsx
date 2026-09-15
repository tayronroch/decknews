'use client'

import { FileText, Search, Tag, Terminal } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function SearchDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: SearchDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled && setControlledOpen) {
        setControlledOpen(value)
      } else {
        setInternalOpen(value)
      }
    },
    [isControlled, setControlledOpen]
  )

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, setOpen])

  return (
    <>
      {trigger ? (
        trigger
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-transparent"
          aria-label="Buscar posts e tópicos"
        >
          <Search className="size-4" />
        </Button>
      )}

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca rápida no Decknews"
        description="Pesquise por artigos, notas técnicas ou tópicos de infraestrutura"
      >
        <CommandInput placeholder="Digite para buscar artigos, comandos ou tópicos..." />
        <CommandList className="max-h-[340px] font-sans">
          <CommandEmpty className="text-muted-foreground py-6 text-center font-mono text-sm">
            Nenhum resultado encontrado.
          </CommandEmpty>
          <CommandGroup heading="Artigos recentes">
            <CommandItem
              onSelect={() => {
                setOpen(false)
                window.location.hash = '#posts'
              }}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <FileText className="text-accent-editorial size-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Boas práticas para monitoramento de redes com Zabbix
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  12 SET 2026 · REDES
                </span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false)
                window.location.hash = '#posts'
              }}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <FileText className="text-accent-editorial size-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Estruturando um projeto Next.js para longo prazo
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  10 SET 2026 · DESENVOLVIMENTO
                </span>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false)
                window.location.hash = '#posts'
              }}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <FileText className="text-accent-editorial size-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  BGP e Engenharia de Tráfego: Princípios de Roteamento
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  28 AGO 2026 · INFRAESTRUTURA
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Tópicos de engenharia">
            <CommandItem
              onSelect={() => setOpen(false)}
              className="flex cursor-pointer items-center gap-2 font-mono text-xs"
            >
              <Tag className="text-muted-foreground size-3.5" />
              <span>redes-e-telecom</span>
            </CommandItem>
            <CommandItem
              onSelect={() => setOpen(false)}
              className="flex cursor-pointer items-center gap-2 font-mono text-xs"
            >
              <Tag className="text-muted-foreground size-3.5" />
              <span>infraestrutura-como-codigo</span>
            </CommandItem>
            <CommandItem
              onSelect={() => setOpen(false)}
              className="flex cursor-pointer items-center gap-2 font-mono text-xs"
            >
              <Terminal className="text-muted-foreground size-3.5" />
              <span>observabilidade-e-metricas</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
