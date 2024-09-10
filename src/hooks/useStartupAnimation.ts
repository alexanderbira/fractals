import { Dispatch, SetStateAction, useCallback, useEffect } from "react"
import { MainModule } from "../libc/a.out"

// The duration of the animation in milliseconds
const ANIMATION_DURATION = 500

// The maximum number of iterations after the animation finishes
let finalMaxIterations = 100

// The start time of the animation
let start: number | null = null

/**
 * A hook used to add an animation to the canvas associated with a module when it first loads.
 * @param module The module whose canvas to animate.
 * @param setMaxIterations The function to set the max iterations of the fractal.
 * @param maxIterations The maximum number of iterations after the animation finishes.
 */
const useStartupAnimation = (
  module: MainModule | null,
  setMaxIterations: Dispatch<SetStateAction<number>>,
  maxIterations: number,
) => {
  const startupAnimation = useCallback(
    (time: number) => {
      // Set the start time of the animation to now if it hasn't been set
      if (start === null) {
        start = time
      }

      const elapsed = time - start

      if (elapsed < ANIMATION_DURATION) {
        // Update the max iterations and run again with another animation frame
        setMaxIterations(
          Math.ceil(elapsed / (ANIMATION_DURATION / finalMaxIterations)),
        )
        requestAnimationFrame(startupAnimation)
      } else {
        // Make sure the max iterations always ends at its final value
        setMaxIterations(finalMaxIterations)
      }
    },
    [setMaxIterations],
  )

  // Run the animation when the module loads
  useEffect(() => {
    if (!module) return
    finalMaxIterations = maxIterations
    setMaxIterations(0)

    // Run the animation when the module loads
    requestAnimationFrame(startupAnimation)
  }, [module])
}

export default useStartupAnimation
