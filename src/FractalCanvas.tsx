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
  Dispatch,
  SetStateAction,
} from "react"

interface FractalProps {
  minRe: number
  setMinRe: Dispatch<SetStateAction<number>>
  maxIm: number
  setMaxIm: Dispatch<SetStateAction<number>>
  viewSize: number
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
    const touch = (e as TouchEvent<HTMLCanvasElement>).touches[0]
    x = touch.clientX - rect.left
    y = touch.clientY - rect.top
  }

  return { x, y }
}

const FractalCanvas: FC<FractalProps> = ({
  minRe,
  setMinRe,
  maxIm,
  setMaxIm,
  viewSize,
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

  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  const handleCanvasMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
      if (mouseDown) {
        if (!mousePos) return
        if (!savedState) return

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

  const handleStartCanvasMove = useCallback(
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
        onTouchStart={handleStartCanvasMove}
        onMouseDown={handleStartCanvasMove}
        onTouchEnd={() => setMouseDown(false)}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
        onMouseMove={handleCanvasMove}
        onTouchMove={handleCanvasMove}
      />
    </div>
  )
}

export default FractalCanvas
