import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoCapture } from '@/components/boulder/photo-capture'

const noop = () => {}

describe('PhotoCapture', () => {
  it('should render empty state with camera trigger', () => {
    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={false}
        error={null}
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Prendre une photo')).toBeInTheDocument()
  })

  it('should render processing state with spinner', () => {
    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={true}
        error={null}
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    expect(screen.getByText('Traitement en cours...')).toBeInTheDocument()
    expect(screen.queryByText('Prendre une photo')).not.toBeInTheDocument()
  })

  it('should render preview with delete button when photo exists', () => {
    render(
      <PhotoCapture
        previewUrl="data:image/jpeg;base64,fakedata"
        isProcessing={false}
        error={null}
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    const img = screen.getByAltText('Aperçu de la photo du bloc')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,fakedata')
    expect(screen.getByLabelText('Supprimer la photo')).toBeInTheDocument()
    expect(screen.queryByText('Prendre une photo')).not.toBeInTheDocument()
  })

  it('should call onRemove when delete button clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <PhotoCapture
        previewUrl="data:image/jpeg;base64,fakedata"
        isProcessing={false}
        error={null}
        onFileSelected={noop}
        onRemove={onRemove}
      />
    )

    await user.click(screen.getByLabelText('Supprimer la photo'))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('should display error message when provided', () => {
    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={false}
        error="Impossible de charger l'image"
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    expect(screen.getByText("Impossible de charger l'image")).toBeInTheDocument()
  })

  it('should have accessible file input with correct attributes', () => {
    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={false}
        error={null}
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    const input = screen.getByTestId('photo-input')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
    expect(input).toHaveAttribute('aria-label', 'Ajouter une photo')
  })

  it('should call onFileSelected when a file is chosen', async () => {
    const user = userEvent.setup()
    const onFileSelected = vi.fn()

    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={false}
        error={null}
        onFileSelected={onFileSelected}
        onRemove={noop}
      />
    )

    const file = new File(['pixel'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('photo-input')

    await user.upload(input, file)
    expect(onFileSelected).toHaveBeenCalledOnce()
    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it('should show optional label', () => {
    render(
      <PhotoCapture
        previewUrl={null}
        isProcessing={false}
        error={null}
        onFileSelected={noop}
        onRemove={noop}
      />
    )

    expect(screen.getByText('(optionnel)')).toBeInTheDocument()
  })
})
