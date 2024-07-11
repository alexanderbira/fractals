import initModule from './lib/a.out';
import {useEffect, useRef} from "react";

function FractalCanvas() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        initModule({
            canvas: canvasRef.current,
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
