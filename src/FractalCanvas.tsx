import initModule, { MainModule } from "./lib/a.out"
import { Fragment, useRef, useState, FC } from "react"

interface FractalProps {
  minRe: number
  maxIm: number
  viewSize: number
  startRe: number
  startIm: number
  cutoff: number
  maxIterations: number
  canvasSize: number
}

const FractalCanvas: FC<FractalProps> = ({
  minRe,
  maxIm,
  viewSize,
  startRe,
  startIm,
  cutoff,
  maxIterations,
  canvasSize,
}) => {
  const [module, setModule] = useState<MainModule | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const initialise = async () => {
    // Initialise the module
    const module_ = await initModule({
      canvas: canvasRef.current,
    })
    setModule(module_)

    // Initialise the canvas
    module_._initialiseCanvas(canvasSize)
  }

  const renderFractal = () => {
    if (!module) return

    // Generate and render the fractal
    console.time()
    module._renderMandelbrot(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
      1, // render=true
    )
    console.timeEnd()
  }

  const saveCanvas = () => {
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
  }

  const saveCanvasHighRes = async () => {
    // Initialise a new module
    const module_ = await initModule({
      canvas: canvasRef.current,
    })

    // Initialise a new canvas
    module_._initialiseCanvas(canvasSize * 5)

    // Generate the fractal
    console.time()
    module_._renderMandelbrot(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
      0, // render=false
    )
    console.timeEnd()

    // Save the image in the virtual Emscripten file system
    module_._saveImage()

    // Extract the image from the virtual file system and save it
    const blob = new Blob([module_.FS.readFile("image.bmp")], {
      type: "image/bmp",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "fractal.bmp"
    a.click()

    try {
      // Clean up the memory allocated for the new module
      // TODO: this does not run properly
      module_._cleanup()
    } finally {
      // The module has been destroyed by the cleanup function
      setModule(null)
      // TODO: make the window separate from the pixels and renderer so as to not
      //  have to destroy the window on a high-res save.
    }
  }

  return (
    <>
      {!module ? (
        <button onClick={initialise}>Initialise</button>
      ) : (
        <Fragment>
          <button onClick={renderFractal}>Render</button>
          <button onClick={saveCanvas}>Save</button>
          <button onClick={saveCanvasHighRes}>Save (Hi-Res)</button>
        </Fragment>
      )}
      <br />
      <canvas id="canvas" ref={canvasRef} />
    </>
  )
}

export default FractalCanvas
