import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { TimeSelect, parse24To12, format12To24 } from '../components/TimeSelect'

describe('TimeSelect utility functions', () => {
  it('correctly converts 24h to 12h representation', () => {
    expect(parse24To12('09:00')).toEqual({ hour12: 9, minute: '00', period: 'AM' })
    expect(parse24To12('17:30')).toEqual({ hour12: 5, minute: '30', period: 'PM' })
    expect(parse24To12('12:00')).toEqual({ hour12: 12, minute: '00', period: 'PM' })
    expect(parse24To12('00:00')).toEqual({ hour12: 12, minute: '00', period: 'AM' })
    expect(parse24To12('23:45')).toEqual({ hour12: 11, minute: '45', period: 'PM' })
    expect(parse24To12('')).toEqual({ hour12: 9, minute: '00', period: 'AM' })
  })

  it('correctly converts 12h representation back to canonical 24h', () => {
    expect(format12To24(9, '00', 'AM')).toBe('09:00')
    expect(format12To24(5, '30', 'PM')).toBe('17:30')
    expect(format12To24(12, '00', 'PM')).toBe('12:00')
    expect(format12To24(12, '00', 'AM')).toBe('00:00')
    expect(format12To24(11, '45', 'PM')).toBe('23:45')
  })
})

describe('TimeSelect Component', () => {
  it('renders hour, minute, and segmented AM/PM selector with correct active state', () => {
    const handleChange = vi.fn()
    render(<TimeSelect value="17:00" onChange={handleChange} ariaLabelPrefix="Start" />)

    const hourSelect = screen.getByLabelText('Start Hour') as HTMLSelectElement
    const minuteSelect = screen.getByLabelText('Start Minute') as HTMLSelectElement
    const amButton = screen.getByRole('button', { name: 'Start AM' })
    const pmButton = screen.getByRole('button', { name: 'Start PM' })

    expect(hourSelect.value).toBe('5')
    expect(minuteSelect.value).toBe('00')
    expect(amButton).toHaveAttribute('aria-pressed', 'false')
    expect(pmButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to AM when clicking AM button and emits 24-hour time string', () => {
    const handleChange = vi.fn()
    render(<TimeSelect value="17:00" onChange={handleChange} ariaLabelPrefix="Start" />)

    const amButton = screen.getByRole('button', { name: 'Start AM' })
    fireEvent.click(amButton)

    expect(handleChange).toHaveBeenCalledWith('05:00')
  })

  it('switches hour and emits updated 24-hour time string', () => {
    const handleChange = vi.fn()
    render(<TimeSelect value="09:00" onChange={handleChange} ariaLabelPrefix="Start" />)

    const hourSelect = screen.getByLabelText('Start Hour')
    fireEvent.change(hourSelect, { target: { value: '11' } })

    expect(handleChange).toHaveBeenCalledWith('11:00')
  })

  it('supports dropdown variant for AM/PM selector', () => {
    const handleChange = vi.fn()
    render(<TimeSelect value="09:00" onChange={handleChange} variant="dropdown" ariaLabelPrefix="Start" />)

    const ampmSelect = screen.getByLabelText('Start AM/PM selector') as HTMLSelectElement
    expect(ampmSelect.value).toBe('AM')

    fireEvent.change(ampmSelect, { target: { value: 'PM' } })
    expect(handleChange).toHaveBeenCalledWith('21:00')
  })
})
