'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Search, X, MapPin, Mountain } from 'lucide-react'
import { useSearchStore } from '@/stores/search-store'
import type { SearchResult } from '@/lib/search'

interface SearchBarProps {
  /** Called when a search result is selected */
  onSelect: (result: SearchResult) => void
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { query, results, isOpen, highlightedIndex, setQuery, setOpen, setHighlightedIndex, clear } =
    useSearchStore()

  /** Handle result selection */
  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect(result)
      clear()
      inputRef.current?.blur()
    },
    [onSelect, clear]
  )

  /** Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(
            highlightedIndex < results.length - 1 ? highlightedIndex + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(
            highlightedIndex > 0 ? highlightedIndex - 1 : results.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            handleSelect(results[highlightedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          clear()
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, results, highlightedIndex, setHighlightedIndex, handleSelect, clear]
  )

  /** Close dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setOpen])

  return (
    <div className="relative w-full">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un bloc ou secteur…"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm text-foreground shadow-md placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={
            highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
          }
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
        >
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.name}-${index}`}
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                index === highlightedIndex
                  ? 'bg-accent text-foreground'
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              {/* Type icon */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                {result.type === 'sector' ? (
                  <MapPin className="h-4 w-4 text-primary" />
                ) : (
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                )}
              </span>

              {/* Name and detail */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{result.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {result.detail}
                </div>
              </div>

              {/* Type badge */}
              <span className="shrink-0 text-xs text-muted-foreground">
                {result.type === 'sector' ? 'Secteur' : 'Bloc'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-background p-4 shadow-lg"
        >
          <p className="text-center text-sm text-muted-foreground">
            Aucun résultat pour « {query} »
          </p>
        </div>
      )}
    </div>
  )
}
