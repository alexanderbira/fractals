import { RefObject, useCallback, useState } from "react"
import initModule, { MainModule } from "../libc/a.out"

/**
 * A hook used for interacting with a WASM module.
 */
const useModule = () => {
  const [module, setModule] = useState<MainModule | null>(null)

  /**
   * Initialise a WASM module using a canvas for graphics.
   * @param canvasSize The side length in pixels to use for the canvas.
   * @param canvasRef The canvas to use for graphics.
   */
  const initialiseModule = useCallback(
    async (canvasSize: number, canvasRef: RefObject<HTMLCanvasElement>) => {
      // Initialise the module
      const module_ = await initModule({
        canvas: canvasRef.current,
      })
      setModule(module_)

      // Initialise the canvas
      module_._initialiseGraphics(canvasSize)
      // The events which Emscripten adds to the window mess with React state management, so remove them
      module_.JSEvents.removeAllEventListeners()
    },
    [],
  )

  /**
   * Save the image currently displayed on the canvas.
   */
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

  /**
   * Save an image using custom generation parameters.\
   * Note: The image will not be displayed on the canvas.
   */
  const saveGeneratedImage = useCallback(
    (
      minRe: number,
      maxIm: number,
      viewSize: number,
      startRe: number,
      startIm: number,
      cutoff: number,
      maxIterations: number,
      mode: number,
      canvasSize: number,
    ) => {
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
        mode,
        canvasSize,
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
    },
    [module],
  )

  return { module, initialiseModule, saveCanvas, saveGeneratedImage }
}

export default useModule
