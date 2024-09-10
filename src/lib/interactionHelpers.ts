import { MouseEvent, TouchEvent } from "react"

export interface MousePos {
  x: number
  y: number
}

/**
 * Get the position of the touch with a given index relative to the target element.
 * @param e The touch event from which to get the positions.
 * @param touchIndex The index of the touch for which to get the position.
 */
export const getTouchPos = (e: TouchEvent, touchIndex: number): MousePos => {
  const touch = e.touches[touchIndex]
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  }
}

/**
 * Return true iff the event was a React MouseEvent.
 * @param e The event to check.
 */
export const isMouseOrWheelEvent = (
  e: MouseEvent | TouchEvent | WheelEvent,
): e is MouseEvent | WheelEvent => (e as MouseEvent).clientX !== undefined

/**
 * Get the position of the mouse relative to the target element.
 * @param e The event to check.
 */
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
