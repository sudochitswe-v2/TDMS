import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App Root Flow', () => {
  it('renders application brand and navigation elements', () => {
    render(<App />)
    const brandElements = screen.getAllByText(/TDMS/i)
    expect(brandElements.length).toBeGreaterThan(0)
  })
})
