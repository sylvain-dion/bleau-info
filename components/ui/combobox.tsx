'use client'

import { useState, useRef, useEffect } from 'react'
import { Command } from 'cmdk'
import * as Popover from '@radix-ui/react-popover'

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  label?: string
  id?: string
  error?: string
}

/**
 * Combobox with free text input + autocomplete suggestions.
 *
 * Uses cmdk for keyboard navigation and radix popover for positioning.
 * Allows typing any value — suggestions are optional helpers.
 */
export function Combobox({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  id,
  error,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  )

  const showSuggestions = open && filtered.length > 0 && value.length > 0

  // Close popover when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <Popover.Root open={showSuggestions} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              error ? 'border-destructive' : 'border-input'
            }`}
          />
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-border bg-popover shadow-md"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <Command.List className="max-h-40 overflow-y-auto p-1">
                {filtered.map((suggestion) => (
                  <Command.Item
                    key={suggestion}
                    value={suggestion}
                    onSelect={(val) => {
                      onChange(val)
                      setOpen(false)
                    }}
                    className="cursor-pointer rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted aria-selected:bg-muted"
                  >
                    {suggestion}
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
