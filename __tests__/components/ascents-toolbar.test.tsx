import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AscentsToolbar } from '@/components/profile/ascents-toolbar'
import type { AscentFilters, AscentSortKey } from '@/lib/ascents-hub'

interface RenderOptions {
  filters?: AscentFilters
  sortKey?: AscentSortKey
  totalCount?: number
  filteredCount?: number
}

function setup(opts: RenderOptions = {}) {
  const onFiltersChange = vi.fn()
  const onSortChange = vi.fn()
  render(
    <AscentsToolbar
      filters={opts.filters ?? {}}
      sortKey={opts.sortKey ?? 'date-desc'}
      onFiltersChange={onFiltersChange}
      onSortChange={onSortChange}
      totalCount={opts.totalCount ?? 0}
      filteredCount={opts.filteredCount ?? 0}
    />,
  )
  return { onFiltersChange, onSortChange }
}

describe('AscentsToolbar', () => {
  it('renders the search input, style toggles, grade range, and sort selector', () => {
    setup({ totalCount: 5, filteredCount: 5 })
    expect(screen.getByTestId('ascents-search')).toBeInTheDocument()
    expect(screen.getByTestId('style-toggle-flash')).toBeInTheDocument()
    expect(screen.getByTestId('style-toggle-a_vue')).toBeInTheDocument()
    expect(screen.getByTestId('style-toggle-travaille')).toBeInTheDocument()
    expect(screen.getByTestId('min-grade-select')).toBeInTheDocument()
    expect(screen.getByTestId('max-grade-select')).toBeInTheDocument()
    expect(screen.getByTestId('sort-select')).toBeInTheDocument()
  })

  it('forwards search input changes', () => {
    const { onFiltersChange } = setup({ totalCount: 1, filteredCount: 1 })
    fireEvent.change(screen.getByTestId('ascents-search'), {
      target: { value: 'marie' },
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ search: 'marie' })
  })

  it('toggles a style on/off', () => {
    const { onFiltersChange } = setup({
      filters: { styles: [] },
      totalCount: 1,
      filteredCount: 1,
    })
    fireEvent.click(screen.getByTestId('style-toggle-flash'))
    expect(onFiltersChange).toHaveBeenCalledWith({ styles: ['flash'] })
  })

  it('removes an active style when clicked again', () => {
    const { onFiltersChange } = setup({
      filters: { styles: ['flash'] },
      totalCount: 1,
      filteredCount: 1,
    })
    fireEvent.click(screen.getByTestId('style-toggle-flash'))
    expect(onFiltersChange).toHaveBeenCalledWith({ styles: [] })
  })

  it('forwards sort changes', () => {
    const { onSortChange } = setup({ totalCount: 1, filteredCount: 1 })
    fireEvent.change(screen.getByTestId('sort-select'), {
      target: { value: 'grade-desc' },
    })
    expect(onSortChange).toHaveBeenCalledWith('grade-desc')
  })

  it('shows "X sur Y" when filters are active', () => {
    setup({
      filters: { search: 'a' },
      totalCount: 10,
      filteredCount: 3,
    })
    expect(screen.getByText('3 sur 10 ascensions')).toBeInTheDocument()
  })

  it('shows "X ascensions" when no filter narrows the list', () => {
    setup({ totalCount: 4, filteredCount: 4 })
    expect(screen.getByText('4 ascensions')).toBeInTheDocument()
  })

  it('uses the singular form for one ascent', () => {
    setup({ totalCount: 1, filteredCount: 1 })
    expect(screen.getByText('1 ascension')).toBeInTheDocument()
  })

  it('clears the grade filter when "—" option is selected', () => {
    const { onFiltersChange } = setup({
      filters: { minGrade: '6a' },
      totalCount: 1,
      filteredCount: 1,
    })
    fireEvent.change(screen.getByTestId('min-grade-select'), {
      target: { value: '' },
    })
    expect(onFiltersChange).toHaveBeenCalledWith({ minGrade: null })
  })
})
