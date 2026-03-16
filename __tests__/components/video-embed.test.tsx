import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoEmbed } from '@/components/boulder/video-embed'

describe('VideoEmbed', () => {
  it('renders iframe with correct YouTube embed src', () => {
    render(<VideoEmbed videoUrl="https://www.youtube.com/watch?v=abc123" />)
    const iframe = screen.getByTitle('Vidéo du bloc')
    expect(iframe).toBeInTheDocument()
    expect(iframe.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc123')
  })

  it('renders iframe with correct Vimeo embed src', () => {
    render(<VideoEmbed videoUrl="https://vimeo.com/123456789" />)
    const iframe = screen.getByTitle('Vidéo du bloc')
    expect(iframe.getAttribute('src')).toBe('https://player.vimeo.com/video/123456789')
  })

  it('renders nothing for invalid URL', () => {
    const { container } = render(<VideoEmbed videoUrl="https://dailymotion.com/video/abc" />)
    expect(container.innerHTML).toBe('')
  })

  it('has sandbox and allow attributes for security', () => {
    render(<VideoEmbed videoUrl="https://youtu.be/abc123" />)
    const iframe = screen.getByTitle('Vidéo du bloc')
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin')
    expect(iframe.getAttribute('allow')).toBe('fullscreen; encrypted-media')
  })

  it('has responsive aspect-video wrapper', () => {
    render(<VideoEmbed videoUrl="https://youtu.be/abc123" />)
    const wrapper = screen.getByTestId('video-embed')
    expect(wrapper.className).toContain('aspect-video')
  })

  it('uses lazy loading', () => {
    render(<VideoEmbed videoUrl="https://youtu.be/abc123" />)
    const iframe = screen.getByTitle('Vidéo du bloc')
    expect(iframe.getAttribute('loading')).toBe('lazy')
  })
})
