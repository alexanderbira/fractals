import initModule from './lib/a.out';
import { useRef } from "react";

function FractalCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCanvas = async () => {
        const module = await initModule({
            canvas: canvasRef.current,
        })

        module._renderMandelbrot()
    }

    return (
        <>
            <button onClick={drawCanvas}>render</button>
            <canvas id="canvas" ref={canvasRef}/>
        </>
    )
}

export default FractalCanvas
