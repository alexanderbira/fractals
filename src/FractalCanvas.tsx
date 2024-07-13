import initModule, {MainModule} from './lib/a.out';
import {useEffect, useRef, useState} from "react";

function FractalCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [module, setModule] = useState<MainModule>();

    useEffect(() => {
        initModule({
            canvas: canvasRef.current,
        }).then(Module => {
            setModule(Module)
        });
    }, [canvasRef])

    return (
        <canvas id="canvas" width={800} height={800} ref={canvasRef} onMouseMove={(e) => {
            //@ts-expect-error: getBoundingClientRect exists on the event target
            const rect = e.target.getBoundingClientRect()
            const ex = e.clientX - rect.left //x position within the element.
            const ey = e.clientY - rect.top  //y position within the element.

            const cursorSize = 50;

            if (!module) return

            for (let x = ex - cursorSize; x < ex + cursorSize; x++) {
                for (let y = ey - cursorSize; y < ey + cursorSize; y++) {
                    if ((ex - x) ** 2 + (ey - y) ** 2 > cursorSize ** 2) continue
                    module._drawMandelbrotPixel(x, y)
                }
            }

            module._redraw(Math.max(ex - cursorSize, 0), Math.max(ey - cursorSize, 0), cursorSize * 2)

        }}/>
    )
}

export default FractalCanvas
