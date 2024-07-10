// @ts-expect-error: auto-generated
import initModule from './lib/a.out.js';
import {useEffect, useRef} from "react";




function FractalCanvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        initModule({
            canvas: canvasRef.current,
            // @ts-expect-error: it exists
        }).then(Module => {
            console.log(Module)
        });
    }, [canvasRef])

    return (
        <>
            <canvas id="canvas" width={800} height={800} ref={canvasRef} />
        </>
    )
}

export default FractalCanvas
