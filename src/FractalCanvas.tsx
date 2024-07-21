import initModule, { MainModule } from "./lib/a.out"
import {
  Fragment,
  useRef,
  useState,
  FC,
  useEffect,
  useCallback,
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

const getMousePos = (e: MouseEvent): MousePos => {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
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
    // The events which Emscripten adds to the window mess with React state management, so remove them.
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
        onMouseDown={(e) => {
          setMouseDown(true)
          setMousePos(getMousePos(e))
          setSavedState({
            minRe,
            maxIm,
          })
        }}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
        onMouseMove={(e) => {
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
        }}
      />
    </div>
  )
}

export default FractalCanvas
