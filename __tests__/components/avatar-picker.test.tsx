import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AvatarPicker } from '@/components/profile/avatar-picker'
import { AVATAR_PRESETS } from '@/lib/validations/profile'

describe('AvatarPicker', () => {
  it('should render all 8 avatar options', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="" onChange={onChange} />)

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(8)
  })

  it('should render each avatar with accessible label', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="" onChange={onChange} />)

    for (const preset of AVATAR_PRESETS) {
      expect(screen.getByLabelText(preset.label)).toBeInTheDocument()
    }
  })

  it('should mark selected avatar as checked', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="rock" onChange={onChange} />)

    const selectedRadio = screen.getByLabelText('Rocher')
    expect(selectedRadio).toHaveAttribute('aria-checked', 'true')
  })

  it('should mark non-selected avatars as unchecked', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="rock" onChange={onChange} />)

    const unselectedRadio = screen.getByLabelText('Grimpeur')
    expect(unselectedRadio).toHaveAttribute('aria-checked', 'false')
  })

  it('should call onChange when an avatar is clicked', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="" onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Montagne'))
    expect(onChange).toHaveBeenCalledWith('mountain')
  })

  it('should have radiogroup role', () => {
    const onChange = vi.fn()
    render(<AvatarPicker value="" onChange={onChange} />)

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('should display emoji for each preset', () => {
    const onChange = vi.fn()
    const { container } = render(<AvatarPicker value="" onChange={onChange} />)

    // Check that each emoji is present in the rendered output
    for (const preset of AVATAR_PRESETS) {
      expect(container.textContent).toContain(preset.emoji)
    }
  })
})
