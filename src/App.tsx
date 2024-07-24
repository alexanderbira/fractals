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

  const canvasSize = 400

  return (
    <div
      style={{
        display: "flex",
        flexFlow: "row wrap",
        gap: "25px",
        width: "100%",
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <p>minRe: {minRe}</p>
        <input
          type="range"
          min={-6}
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
          max={6}
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
          max={5000}
          step={1}
          value={maxIterations}
          onChange={(e) => setMaxIterations(parseFloat(e.target.value))}
        />
      </div>
      <FractalCanvas
        minRe={minRe}
        setMinRe={setMinRe}
        maxIm={maxIm}
        setMaxIm={setMaxIm}
        viewSize={viewSize}
        setViewSize={setViewSize}
        startRe={startRe}
        startIm={startIm}
        cutoff={cutoff}
        maxIterations={maxIterations}
        setMaxIterations={setMaxIterations}
        canvasSize={canvasSize}
      />
    </div>
  )
}

export default App
