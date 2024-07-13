import initModule from './lib/a.out';
import { useRef } from "react";

function FractalCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCanvas = async () => {
        const module = await initModule({
            canvas: canvasRef.current,
        })

        const csize = 1500;

        for (let x = 0; x < csize; x ++) {
            for (let y = 0; y < csize; y ++) {
                module._drawMandelbrotPixel(x, y)
            }
            module._redraw(x, 0, x, csize)
        }
    }

    return (
        <>
            <button onClick={drawCanvas}>render</button>
            <canvas id="canvas" ref={canvasRef}/>
        </>
    )
}

export default FractalCanvas
