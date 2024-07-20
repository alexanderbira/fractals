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
    module_._initialiseGraphics(canvasSize)
  }

  const renderFractal = () => {
    if (!module) return

    // Generate and render the fractal
    console.time()
    module._generateRenderFractal(
      minRe,
      maxIm,
      viewSize,
      startRe,
      startIm,
      cutoff,
      maxIterations,
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
