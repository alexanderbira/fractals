// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "./App.css"
import FractalCanvas from "./FractalCanvas.tsx"
import { useState } from "react"

function App() {
  const [minRe, setMinRe] = useState(-2)
  const [maxIm, setMaxIm] = useState(2)
  const [viewSize, setViewSize] = useState(4)
  const [startRe, setStartRe] = useState(0)
  const [startIm, setStartIm] = useState(0)
  const [cutoff, setCutoff] = useState(10 ** 2)
  const [maxIterations, setMaxIterations] = useState(250)
  const [canvasSize, setCanvasSize] = useState(500)

  return (
    <>
      <FractalCanvas
        minRe={minRe}
        maxIm={maxIm}
        viewSize={viewSize}
        startRe={startRe}
        startIm={startIm}
        cutoff={cutoff}
        maxIterations={maxIterations}
        canvasSize={canvasSize}
      />
    </>
  )
}

export default App
