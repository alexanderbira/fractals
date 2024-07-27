import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import { MainModule } from "./lib/a.out"

const useStartupAnimation = (
  module: MainModule | null,
  setMaxIterations: Dispatch<SetStateAction<number>>,
) => {
  const [start, setStart] = useState(0)

  const startupAnimation = useCallback(
    (time: number) => {
      if (!start) setStart(time)

      const elapsed = time - start

      if (!module) return
      if (elapsed < 500) {
        // after 500 milliseconds, maxIterations will be 100
        setMaxIterations(Math.ceil(elapsed / 5))
        requestAnimationFrame(startupAnimation)
      } else {
        setMaxIterations(100)
      }
    },
    [module, setMaxIterations, start],
  )

  useEffect(() => {
    if (!module) return

    startupAnimation(0)
  }, [module, startupAnimation])
}

export default useStartupAnimation
