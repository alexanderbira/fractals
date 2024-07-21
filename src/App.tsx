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

  const canvasSize = 500

  return (
    <div style={{ display: "flex", flexFlow: "row wrap", gap: "25px" }}>
      <div>
        <p>minRe: {minRe}</p>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.0001}
          value={minRe}
          onChange={(e) => setMinRe(parseFloat(e.target.value))}
          onMouseOver={(e) => e.preventDefault()}
        />
        <p>maxIm: {maxIm}</p>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.0001}
          value={maxIm}
          onChange={(e) => setMaxIm(parseFloat(e.target.value))}
        />
        <p>viewSize: {viewSize}</p>
        <input
          type="range"
          min={0}
          max={4}
          step={0.0001}
          value={viewSize}
          onChange={(e) => setViewSize(parseFloat(e.target.value))}
        />
        <p>startRe: {startRe}</p>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.0001}
          value={startRe}
          onChange={(e) => setStartRe(parseFloat(e.target.value))}
        />
        <p>startIm: {startIm}</p>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.0001}
          value={startIm}
          onChange={(e) => setStartIm(parseFloat(e.target.value))}
        />
        <p>cutoff: {cutoff}</p>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cutoff}
          onChange={(e) => setCutoff(parseFloat(e.target.value))}
        />
        <p>maxIterations: {maxIterations}</p>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={maxIterations}
          onChange={(e) => setMaxIterations(parseFloat(e.target.value))}
        />
      </div>
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
    </div>
  )
}

export default App
