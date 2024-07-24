import initModule, { MainModule } from "./lib/a.out"

import {
  Fragment,
  useRef,
  useState,
  FC,
  useEffect,
  useCallback,
  TouchEvent,
  MouseEvent,
  WheelEvent,
  Dispatch,
  SetStateAction,
} from "react"

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
  canvasSize: number
}

interface MousePos {
  x: number
  y: number
}

interface SavedState {
  minRe: number
  maxIm: number
}

const getTouchPos = (e: TouchEvent<HTMLCanvasElement>, touchIndex: number) => {
  const touch = e.touches[touchIndex]
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  }
}

// Returns true iff the event passed into it was a React MouseEvent.
const isMouseEvent = (
  e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
): e is MouseEvent<HTMLCanvasElement> =>
  (e as MouseEvent<HTMLCanvasElement>).clientX !== undefined

// Get the current mouse position relative to the target canvas element.
const getMousePos = (
  e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>,
): MousePos => {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  let x: number, y: number

  if (isMouseEvent(e)) {
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  } else {
    return getTouchPos(e, 0)
  }

  return { x, y }
}

// The time between frames in milliseconds. Here, we're aiming for 30fps.
const timeBetweenFrames = 1000 / 30
// The time of the last frame in milliseconds.
let lastTime = 0

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
  canvasSize,
}) => {
  const [module, setModule] = useState<MainModule | null>(null)
  const [mouseDown, setMouseDown] = useState<boolean>(false)
  const [mousePos, setMousePos] = useState<MousePos | null>(null)
  const [savedState, setSavedState] = useState<SavedState | null>(null)
  const [savedViewSize, setSavedViewSize] = useState<number | null>(null)
  const [initialPinchDistance, setInitialPinchDistance] = useState<
    number | null
  >(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    lastTime = Date.now()
  }, [])

  const initialise = useCallback(async () => {
    // Initialise the module
    const module_ = await initModule({
      canvas: canvasRef.current,
    })
    setModule(module_)

    // Initialise the canvas
    module_._initialiseGraphics(canvasSize)
    // The events which Emscripten adds to the window mess with React state management, so remove them
    module_.JSEvents.removeAllEventListeners()
  }, [canvasSize])

  const saveCanvas = useCallback(() => {
    if (!module) return

    // Save the image in the virtual Emscripten file system
    module._saveImage()

    // Extract the image from the virtual file system and save it
    const blob = new Blob([module.FS.readFile("image.bmp")], {
      type: "image/bmp",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fractal.bmp"
    a.click()
  }, [module])

  const saveCanvasHighRes = useCallback(async () => {
    if (!module) return

    // Generate and save the fractal to the virtual filesystem
    console.time()
    module._generateSaveFractal(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
      canvasSize * 5,
    )
    console.timeEnd()

    // Extract the image from the virtual file system and save it
    const blob = new Blob([module.FS.readFile("image.bmp")], {
      type: "image/bmp",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fractal.bmp"
    a.click()
  }, [
    minRe,
    maxIm,
    viewSize,
    startRe,
    startIm,
    cutoff,
    maxIterations,
    canvasSize,
    module,
  ])

  const handleMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      if (mouseDown) {
        if (!mousePos) return
        if (!savedState) return
        if (Date.now() < lastTime + timeBetweenFrames) return
        lastTime = Date.now()

        const newMousePos = getMousePos(e)
        const dx = newMousePos.x - mousePos.x
        const dy = newMousePos.y - mousePos.y

        const scaleFactor = viewSize / canvasSize

        setMinRe(savedState.minRe - dx * scaleFactor)
        setMaxIm(savedState.maxIm + dy * scaleFactor)
      }
    },
    [viewSize, canvasSize, setMaxIm, setMinRe, mouseDown, mousePos, savedState],
  )

  const handleStartMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      setMouseDown(true)
      setMousePos(getMousePos(e))
      setSavedState({
        minRe,
        maxIm,
      })
    },
    [minRe, maxIm],
  )

  const handleResize = useCallback(
    (e: WheelEvent<HTMLCanvasElement>) => {
      if (!module) return

      e.preventDefault()

      if (Date.now() < lastTime + timeBetweenFrames) return
      lastTime = Date.now()

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
    (e: TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 1) {
        handleMove(e)
      } else {
        if (Date.now() < lastTime + timeBetweenFrames) return
        lastTime = Date.now()

        if (!initialPinchDistance) return
        if (!savedViewSize) return
        if (!savedState) return
        if (!mousePos) return

        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const scaleFactor = initialPinchDistance / distance
        const newViewSize = savedViewSize * scaleFactor

        const midX = (getTouchPos(e, 0).x + getTouchPos(e, 1).x) / 2
        const midY = (getTouchPos(e, 0).y + getTouchPos(e, 1).y) / 2

        const midRe =
          savedState.minRe + (mousePos.x / canvasSize) * savedViewSize
        const midIm =
          savedState.maxIm - (mousePos.y / canvasSize) * savedViewSize

        const newMinRe = midRe - (midX / canvasSize) * newViewSize
        const newMaxIm = midIm + (midY / canvasSize) * newViewSize

        setViewSize(newViewSize)
        setMinRe(newMinRe)
        setMaxIm(newMaxIm)
      }
    },
    [
      canvasSize,
      handleMove,
      initialPinchDistance,
      mousePos,
      savedState,
      savedViewSize,
      setMaxIm,
      setMinRe,
      setViewSize,
    ],
  )

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 1) {
        handleStartMove(e)
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

        setInitialPinchDistance(distance)
        setMousePos(midpoint)
        setSavedState({
          minRe,
          maxIm,
        })
        setSavedViewSize(viewSize)
      }
    },
    [handleStartMove, maxIm, minRe, viewSize],
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length > 0) {
        handleTouchStart(e)
      } else {
        setMouseDown(false)
      }
    },
    [handleTouchStart],
  )

  useEffect(() => {
    if (!module) return

    module._generateRenderFractal(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
    )
  }, [minRe, maxIm, viewSize, startRe, startIm, cutoff, maxIterations, module])

  return (
    <div>
      {!module ? (
        <button onClick={initialise}>Initialise</button>
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
        onMouseDown={handleStartMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
        onMouseMove={handleMove}
        onTouchMove={handleTouchMove}
        onWheel={handleResize}
      />
    </div>
  )
}

export default FractalCanvas
