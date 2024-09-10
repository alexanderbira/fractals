import "./App.css"
import FractalCanvas from "./FractalCanvas.tsx"
import { useCallback, useState } from "react"
import { Mode } from "./lib/types.ts"

/**
 * Get a search parameter from the URL or return a default value.
 * @param param The name of the search parameter.
 * @param defaultValue The default value to return if the parameter is not found.
 */
const searchParamOrDefault = (param: string, defaultValue: number) => {
  const urlParams = new URLSearchParams(window.location.search)
  const paramValue = urlParams.get(param)
  return paramValue ? parseFloat(paramValue) : defaultValue
}

function App() {
  const [minRe, setMinRe] = useState(searchParamOrDefault("minRe", -2))
  const [maxIm, setMaxIm] = useState(searchParamOrDefault("maxIm", 2))
  const [viewSize, setViewSize] = useState(searchParamOrDefault("viewSize", 4))
  const [startRe, setStartRe] = useState(searchParamOrDefault("startRe", 0))
  const [startIm, setStartIm] = useState(searchParamOrDefault("startIm", 0))
  const [cutoff, setCutoff] = useState(searchParamOrDefault("cutoff", 10 ** 2))
  const [maxIterations, setMaxIterations] = useState(
    searchParamOrDefault("maxIterations", 250),
  )
  const [mode, setMode] = useState(Mode.MANDELBROT)

  const canvasSize = 400

  /**
   * Export the current generation parameters to the URL.
   */
  const exportParams = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search)
    urlParams.set("minRe", minRe.toString())
    urlParams.set("maxIm", maxIm.toString())
    urlParams.set("viewSize", viewSize.toString())
    urlParams.set("startRe", startRe.toString())
    urlParams.set("startIm", startIm.toString())
    urlParams.set("cutoff", cutoff.toString())
    urlParams.set("maxIterations", maxIterations.toString())
    urlParams.set("mode", mode.toString())
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams}`,
    )
  }, [cutoff, maxIm, maxIterations, minRe, startIm, startRe, viewSize, mode])

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
        <p>
          mode:{" "}
          <select
            value={mode}
            onChange={(e) => setMode(parseFloat(e.target.value))}
          >
            <option value={Mode.MANDELBROT}>mandelbrot</option>
            <option value={Mode.JULIA}>julia</option>
          </select>
        </p>
        <br />
        <button onClick={exportParams}>Export Params</button>
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
        mode={mode}
        canvasSize={canvasSize}
      />
    </div>
  )
}

export default App
