import { MouseEvent, TouchEvent } from "react"

export interface MousePos {
  x: number
  y: number
}

export const getTouchPos = (e: TouchEvent, touchIndex: number) => {
  const touch = e.touches[touchIndex]
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  }
}
// Returns true iff the event passed into it was a React MouseEvent.
const isMouseOrWheelEvent = (
  e: MouseEvent | TouchEvent | WheelEvent,
): e is MouseEvent | WheelEvent => (e as MouseEvent).clientX !== undefined
// Get the current mouse position relative to the target canvas element.
export const getMousePos = (
  e: MouseEvent | TouchEvent | WheelEvent,
): MousePos => {
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  let x: number, y: number

  if (isMouseOrWheelEvent(e)) {
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  } else {
    return getTouchPos(e, 0)
  }

  return { x, y }
}
