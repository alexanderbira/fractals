import initModule from './lib/a.out';
import {useRef} from "react";

function FractalCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCanvas = async () => {
        const module = await initModule({
            canvas: canvasRef.current,
        })

        module._initialiseCanvas(1000)

        console.time()
        module._renderMandelbrot(
            -2,
            2,
            4,
            0,
            0,
            10,
            100,
        )
        console.timeEnd()
    }

    return (
        <>
            <button onClick={drawCanvas}>render</button>
            <canvas id="canvas" ref={canvasRef}/>
        </>
    )
}

export default FractalCanvas
