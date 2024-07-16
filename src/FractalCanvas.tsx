import initModule, {MainModule} from './lib/a.out';
import {useRef, useState} from "react";

function FractalCanvas() {
    const [module, setModule] = useState<MainModule | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCanvas = async () => {
        // Initialise the module
        const module_ = await initModule({
            canvas: canvasRef.current,
        })
        setModule(module_)

        // Initialise the canvas
        module_._initialiseCanvas(1000)

        // Generate and render the fractal
        console.time()
        // Cool Julia set:
        module_._renderMandelbrot(
            -0.2881565845103234,
            -0.6224348096551917,
            0.04754805423665997,
            0.16,
            0.88,
            10 ** 2,
            401,
        )
        // Default Mandelbrot set:
        // module_._renderMandelbrot(
        //     -2,
        //     2,
        //     4,
        //     0,
        //     0,
        //     10 ** 2,
        //     50,
        // )
        console.timeEnd()
    }

    const saveCanvas = () => {
        if (!module) return;

        // Save the image in the virtual Emscripten file system
        module._saveImage();

        // Extract the image from the virtual file system and save it
        const blob = new Blob(
            [module.FS.readFile("image.bmp")],
            {
                type: "image/bmp"
            }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "fractal.bmp"
        a.click()
    }

    return (
        <>
            <button onClick={drawCanvas}>render</button>
            <button onClick={saveCanvas}>save</button>
            <br/>
            <canvas id="canvas" ref={canvasRef}/>
        </>
    )
}

export default FractalCanvas
