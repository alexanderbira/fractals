import './App.css'
import FractalCanvas from "./FractalCanvas.tsx";

function App() {
  return (
    <>
        <h1>Move your cursor around the canvas to reveal the Mandelbrot set!</h1>
        <FractalCanvas />
    </>
  )
}

export default App
