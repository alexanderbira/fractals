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
import useStartupAnimation from "./useStartupAnimation.ts"
import { getMousePos, getTouchPos, MousePos } from "./interactionHelpers.ts"
import useModule from "./useModule.ts"

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

  const canvasRef = useRef(null)

  const { module, initialiseModule, saveCanvas, saveGeneratedImage } =
    useModule()

  const saveCanvasHighRes = useCallback(() => {
    saveGeneratedImage(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
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
  ])

  useStartupAnimation(module, setMaxIterations)

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
  ])

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (mouseDown) {
        if (generating) return
        if (!startMousePos) return
        if (!startViewboxPos) return

        const newMousePos = getMousePos(e)
        const dx = newMousePos.x - startMousePos.x
        const dy = newMousePos.y - startMousePos.y

        const scaleFactor = viewSize / canvasSize

        setMinRe(startViewboxPos.minRe - dx * scaleFactor)
        setMaxIm(startViewboxPos.maxIm + dy * scaleFactor)
      }
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

  const handleResize = useCallback(
    (e: WheelEvent) => {
      if (!module) return

      e.preventDefault()

      if (generating) return

      let scaleFactor = Math.min(1 + Math.abs(e.deltaY / 100), 1.3)
      if (e.deltaY < 0) {
        scaleFactor = 1 / scaleFactor
      }

      const currMousePos = getMousePos(e)

      const newViewSize = viewSize * scaleFactor

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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMouseMove(e)
      } else {
        if (generating) return

        if (!startPinchDistance) return
        if (!startViewSize) return
        if (!startViewboxPos) return
        if (!startMousePos) return

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const scaleFactor = startPinchDistance / distance
        const newViewSize = startViewSize * scaleFactor

        const midX = (getTouchPos(e, 0).x + getTouchPos(e, 1).x) / 2
        const midY = (getTouchPos(e, 0).y + getTouchPos(e, 1).y) / 2

        const midRe =
          startViewboxPos.minRe + (startMousePos.x / canvasSize) * startViewSize
        const midIm =
          startViewboxPos.maxIm - (startMousePos.y / canvasSize) * startViewSize

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
      handleMouseMove,
      startPinchDistance,
      startMousePos,
      startViewboxPos,
      startViewSize,
      setMaxIm,
      setMinRe,
      setViewSize,
    ],
  )

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMoveStart(e)
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const midpoint = {
          x: (getTouchPos(e, 0).x + getTouchPos(e, 1).x) / 2,
          y: (getTouchPos(e, 0).y + getTouchPos(e, 1).y) / 2,
        }

        setStartPinchDistance(distance)
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

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleTouchStart(e)
      } else {
        setMouseDown(false)
      }
    },
    [handleTouchStart],
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current as HTMLElement
    canvas.addEventListener("wheel", handleResize, { passive: false })

    return () => {
      canvas.removeEventListener("wheel", handleResize)
    }
  }, [canvasRef, handleResize])

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
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      />
    </div>
  )
}

export default FractalCanvas
