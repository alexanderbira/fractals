import {
  Dispatch,
  FC,
  Fragment,
  MouseEvent,
  SetStateAction,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import useStartupAnimation from "./hooks/useStartupAnimation.ts"
import { getMousePos, getTouchPos, MousePos } from "./lib/interactionHelpers.ts"
import useModule from "./hooks/useModule.ts"

interface FractalProps {
  minRe: number
  setMinRe: Dispatch<SetStateAction<number>>
  maxIm: number
  setMaxIm: Dispatch<SetStateAction<number>>
  viewSize: number
  setViewSize: Dispatch<SetStateAction<number>>
  startRe: number
  startIm: number
  cutoff: number
  maxIterations: number
  setMaxIterations: Dispatch<SetStateAction<number>>
  mode: number
  canvasSize: number
}

interface ViewboxPos {
  minRe: number
  maxIm: number
}

const FractalCanvas: FC<FractalProps> = ({
  minRe,
  setMinRe,
  maxIm,
  setMaxIm,
  viewSize,
  setViewSize,
  startRe,
  startIm,
  cutoff,
  maxIterations,
  setMaxIterations,
  mode,
  canvasSize,
}) => {
  // Whether the mouse is currently down over the canvas
  const [mouseDown, setMouseDown] = useState<boolean>(false)

  // The mouse position within the canvas at the start of a transformation
  const [startMousePos, setStartMousePos] = useState<MousePos | null>(null)

  // The position of the viewbox in the fractal at the start of a transformation
  const [startViewboxPos, setStartViewboxPos] = useState<ViewboxPos | null>(
    null,
  )

  // The view size at the start of a transformation
  const [startViewSize, setStartViewSize] = useState<number | null>(null)

  // The pinch distance at the start of a transformation
  const [startPinchDistance, setStartPinchDistance] = useState<number | null>(
    null,
  )

  // Whether a frame is currently being generated
  const [generating, setGenerating] = useState<boolean>(false)

  // The reference to the canvas element which is on the page
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Use the module hook to obtain and interact with the WASM module
  const { module, initialiseModule, saveCanvas, saveGeneratedImage } =
    useModule()

  /**
   * Save an image using the current generation parameters but with a higher resolution.
   */
  const saveCanvasHighRes = useCallback(() => {
    saveGeneratedImage(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
      mode,
      canvasSize * 5,
    )
  }, [
    saveGeneratedImage,
    minRe,
    maxIm,
    viewSize,
    startRe,
    startIm,
    cutoff,
    maxIterations,
    canvasSize,
    mode,
  ])

  // Add an animation to the canvas when it loads
  useStartupAnimation(module, setMaxIterations, maxIterations)

  // Redraw the fractal whenever one of its generation parameters changes
  useEffect(() => {
    if (!module) return

    requestAnimationFrame(() => {
      if (generating) return
      setGenerating(true)
      module._generateRenderFractal(
        minRe,
        maxIm,
        viewSize,
        startRe,
        startIm,
        cutoff,
        maxIterations,
        mode,
      )
      setGenerating(false)
    })
  }, [
    minRe,
    maxIm,
    viewSize,
    startRe,
    startIm,
    cutoff,
    maxIterations,
    module,
    generating,
    mode,
  ])

  /**
   * Handle the start of a mouse or touch transformation.
   */
  const handleMoveStart = useCallback(
    (e: MouseEvent | TouchEvent) => {
      setMouseDown(true)
      setStartMousePos(getMousePos(e))
      setStartViewboxPos({
        minRe,
        maxIm,
      })
    },
    [minRe, maxIm],
  )

  /**
   * Handle a movement of a mouse or touch transformation with 1 finger.
   */
  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!mouseDown) return
      if (generating) return
      if (!startMousePos) return
      if (!startViewboxPos) return

      const newMousePos = getMousePos(e)
      const dx = newMousePos.x - startMousePos.x
      const dy = newMousePos.y - startMousePos.y

      const scaleFactor = viewSize / canvasSize

      setMinRe(startViewboxPos.minRe - dx * scaleFactor)
      setMaxIm(startViewboxPos.maxIm + dy * scaleFactor)
    },
    [
      mouseDown,
      generating,
      startMousePos,
      startViewboxPos,
      viewSize,
      canvasSize,
      setMinRe,
      setMaxIm,
    ],
  )

  /**
   * Handle the end of a mouse transformation.
   */
  const handleMoveEnd = useCallback(() => setMouseDown(false), [])

  /**
   * Handle the start of a touch transformation.
   */
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // One finger on the screen is the same as dragging with the mouse
        handleMoveStart(e)
      } else if (e.touches.length === 2) {
        // Start a pinch zoom

        // Get the positions of the 2 touches within the canvas
        const touch1Pos = getTouchPos(e, 0)
        const touch2Pos = getTouchPos(e, 1)

        // Calculate the distance between the two touches
        const dx = touch1Pos.x - touch2Pos.x
        const dy = touch1Pos.y - touch2Pos.y
        const pinchDistance = Math.sqrt(dx * dx + dy * dy)

        // Calculate the midpoint of the two fingers
        const midpoint = {
          x: (touch1Pos.x + touch2Pos.x) / 2,
          y: (touch1Pos.y + touch2Pos.y) / 2,
        }

        setStartPinchDistance(pinchDistance)
        setStartMousePos(midpoint)
        setStartViewboxPos({
          minRe,
          maxIm,
        })
        setStartViewSize(viewSize)
      }
    },
    [handleMoveStart, maxIm, minRe, viewSize],
  )

  /**
   * Handle a movement of a touch transformation.
   */
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // One finger on the screen is the same as dragging with the mouse
        handleMove(e)
      } else {
        // Two fingers on the screen is a pinch zoom

        // The way the pinch zoom works is by moving the midpoint of the two fingers so that it stays the midpoint
        // The view size is scaled based on the distance between the two fingers compared to the start distance between them
        if (generating) return
        if (!startPinchDistance) return
        if (!startViewSize) return
        if (!startViewboxPos) return
        if (!startMousePos) return

        // Get the positions of the 2 touches within the canvas
        const touch1Pos = getTouchPos(e, 0)
        const touch2Pos = getTouchPos(e, 1)

        // Calculate the distance between the two touches
        const dx = touch1Pos.x - touch2Pos.x
        const dy = touch1Pos.y - touch2Pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Update the view size based on the current pinch distance relative to the start pinch distance
        const scaleFactor = startPinchDistance / distance
        const newViewSize = startViewSize * scaleFactor

        // Calculate the midpoint of the two fingers
        const midX = (touch1Pos.x + touch2Pos.x) / 2
        const midY = (touch1Pos.y + touch2Pos.y) / 2

        const midRe =
          startViewboxPos.minRe + (startMousePos.x / canvasSize) * startViewSize
        const midIm =
          startViewboxPos.maxIm - (startMousePos.y / canvasSize) * startViewSize

        // Calculate the new minRe and maxIm based on the midpoint of the two fingers
        const newMinRe = midRe - (midX / canvasSize) * newViewSize
        const newMaxIm = midIm + (midY / canvasSize) * newViewSize

        setViewSize(newViewSize)
        setMinRe(newMinRe)
        setMaxIm(newMaxIm)
      }
    },
    [
      canvasSize,
      generating,
      handleMove,
      startPinchDistance,
      startMousePos,
      startViewboxPos,
      startViewSize,
      setMaxIm,
      setMinRe,
      setViewSize,
    ],
  )

  /**
   * Handle the end of a touch transformation.
   */
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        // If there are still touches on the screen, start a new transformation with them
        handleTouchStart(e)
      } else {
        setMouseDown(false)
      }
    },
    [handleTouchStart],
  )

  /**
   * Handle the zooming of the fractal with the mouse wheel.
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!module) return

      e.preventDefault()

      if (generating) return

      // By how much to slow down the zooming
      const wheelDamping = 100
      // The maximum factor by which the view size can be scaled
      const maxScaleFactor = 1.3

      // Calculate the new view size based on how much the wheel was scrolled
      let scaleFactor = Math.min(
        1 + Math.abs(e.deltaY / wheelDamping),
        maxScaleFactor,
      )
      if (e.deltaY < 0) {
        // Zoom out if the wheel was scrolled up
        scaleFactor = 1 / scaleFactor
      }

      // Calculate the new view size based
      const newViewSize = viewSize * scaleFactor

      // Zoom in with the mouse position as the center of the zoom
      const currMousePos = getMousePos(e)

      const re = minRe + (currMousePos.x / canvasSize) * viewSize
      const im = maxIm - (currMousePos.y / canvasSize) * viewSize

      const newMinRe = re + (minRe - re) * scaleFactor
      const newMaxIm = im + (maxIm - im) * scaleFactor

      setViewSize(newViewSize)
      setMinRe(newMinRe)
      setMaxIm(newMaxIm)
    },
    [
      canvasSize,
      generating,
      maxIm,
      minRe,
      module,
      setMaxIm,
      setMinRe,
      setViewSize,
      viewSize,
    ],
  )

  // Add the wheel event listener to the canvas
  // This is done in a useEffect hook to make the event listener not passive
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current as HTMLElement
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [canvasRef, handleWheel])

  return (
    <div>
      {!module ? (
        <button onClick={() => initialiseModule(canvasSize, canvasRef)}>
          Initialise
        </button>
      ) : (
        <Fragment>
          <button onClick={saveCanvas}>Save</button>
          <button onClick={saveCanvasHighRes}>Save (Hi-Res)</button>
        </Fragment>
      )}
      <br />
      <canvas
        id="canvas"
        className={mouseDown ? "grabbing" : "grab"}
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onMouseDown={handleMoveStart}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMoveEnd}
        onMouseLeave={handleMoveEnd}
        onMouseMove={handleMove}
        onTouchMove={handleTouchMove}
      />
    </div>
  )
}

export default FractalCanvas
