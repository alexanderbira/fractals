import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react"
import { MainModule } from "./lib/a.out"

// The duration of the animation in milliseconds
const ANIMATION_DURATION = 500

// The value of the maximum number of iterations after the animation finishes
const FINAL_MAX_ITERATIONS = 100

/**
 * A hook used to add an animation to the canvas associated with a module when it first loads.
 * @param module The module whose canvas to animate.
 * @param setMaxIterations The function to set the max iterations of the fractal.
 */
const useStartupAnimation = (
  module: MainModule | null,
  setMaxIterations: Dispatch<SetStateAction<number>>,
) => {
  // The start time of the animation
  const [start, setStart] = useState(0)

  const startupAnimation = useCallback(
    (time: number) => {
      if (!module) return

      // Set the start time of the animation to now if it hasn't been set
      if (!start) setStart(time)

      const elapsed = time - start

      if (elapsed < ANIMATION_DURATION) {
        // Update the max iterations and run again with another animation frame
        setMaxIterations(
          Math.ceil(elapsed / (ANIMATION_DURATION / FINAL_MAX_ITERATIONS)),
        )
        requestAnimationFrame(startupAnimation)
      } else {
        // Make sure the max iterations always ends at its final value
        setMaxIterations(FINAL_MAX_ITERATIONS)
      }
    },
    [module, setMaxIterations, start],
  )

  useEffect(() => {
    if (!module) return

    // Run the animation when the module loads
    startupAnimation(0)
  }, [module, startupAnimation])
}

export default useStartupAnimation
