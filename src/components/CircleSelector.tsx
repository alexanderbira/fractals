import styles from "./CircleSelector.module.css"
import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  TouchEvent,
  useCallback,
  useRef,
  useState,
} from "react"
import { getMousePos, isMouseOrWheelEvent } from "../lib/interactionHelpers.ts"
import { Mode } from "../lib/types.ts"

// The radius of the CircleSelector in pixels
const CIRCLE_RADIUS = 100

interface CircleSelectorProps {
  startRe: number
  setStartRe: Dispatch<SetStateAction<number>>
  startIm: number
  setStartIm: Dispatch<SetStateAction<number>>
  mode: Mode
}

const CircleSelector = ({
  startRe,
  setStartRe,
  startIm,
  setStartIm,
  mode,
}: CircleSelectorProps) => {
  // Whether the mouse is currently down over the canvas
  const [mouseDown, setMouseDown] = useState<boolean>(false)

  // Reference to the circleSelector element
  const circleSelector = useRef<HTMLDivElement | null>(null)

  /**
   * Handle a movement of a mouse or touch transformation with 1 finger.
   */
  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isMouseOrWheelEvent(e) && !mouseDown) return
      if (!circleSelector.current) return

      // Set the target of the event to the circleSelector element, since the event target may be the point element
      e.target = circleSelector.current

      const mousePos = getMousePos(e)

      const newStartRe = (mousePos.x - CIRCLE_RADIUS) / (CIRCLE_RADIUS / 2)
      const newStartIm = -(mousePos.y - CIRCLE_RADIUS) / (CIRCLE_RADIUS / 2)

      // If the point is outside the circle, don't update the state
      if (newStartRe ** 2 + newStartIm ** 2 > 4) return

      setStartRe(newStartRe)
      setStartIm(newStartIm)
    },
    [mouseDown, setStartIm, setStartRe],
  )

  return (
    <div
      className={
        styles.CircleSelector +
        " " +
        (mode === Mode.JULIA ? styles.mandelbrotBackground : "") // Use the Mandelbrot background for the Julia set
      }
      onMouseDown={() => setMouseDown(true)}
      onMouseUp={() => setMouseDown(false)}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      ref={circleSelector}
      style={{
        cursor: mouseDown ? "none" : "grab",
      }}
    >
      <div
        className={styles.point}
        style={{
          left: `${CIRCLE_RADIUS + startRe * (CIRCLE_RADIUS / 2)}px`,
          top: `${CIRCLE_RADIUS - startIm * (CIRCLE_RADIUS / 2)}px`,
        }}
      />
    </div>
  )
}

export default CircleSelector
