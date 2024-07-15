#include <SDL2/SDL.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

// Constants for the hue2rgb function
#define ONE_SIXTH 0.16666666666666666
#define TWO_THIRDS 0.6666666666666666
#define ONE_THIRD 0.3333333333333333

/// The width/height of the canvas.
uint16_t canvasSize;

/// The window.
SDL_Window *window;
/// The renderer.
SDL_Renderer *renderer;
/// An array of 8-bit integers. Each group of 3 integers represents the RGB values of a single pixel on the screen.
uint8_t *pixels;

/// Redraw a region on the canvas, using data from the pixels array.
/// @param x1 The x-value of the first point in the region.
/// @param y1 The y-value of the first point in the region.
/// @param x2 The x-value of the second point in the region.
/// @param y2 The y-value of the second point in the region.
void redraw(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2) {
  // Calculate width and height including the end point
  uint16_t w = x2 - x1 + 1;
  uint16_t h = y2 - y1 + 1;

  // Create a new texture for the region to render
  SDL_Texture *texture = SDL_CreateTexture(
    renderer,
    SDL_PIXELFORMAT_RGB24,
    SDL_TEXTUREACCESS_STREAMING,
    w,
    h
  );

  // Update the new texture with the data from the pixels array
  SDL_UpdateTexture(texture, NULL, pixels + (y1 * canvasSize + x1) * 3, canvasSize * 3);

  SDL_Rect destRect = {.x = x1, .y = y1, .w = w, .h = h};

  // Copy the texture to the rendering target
  SDL_RenderCopy(renderer, texture, NULL, &destRect);

  // Render the new texture
  SDL_RenderPresent(renderer);

  // Destroy the texture
  SDL_DestroyTexture(texture);
}

// Helper function for the hsl2rgb function
float hue2rgb(float p, float q, float t) {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < ONE_SIXTH) {
    return p + (q - p) * 6 * t;
  }
  if (t < 0.5) {
    return q;
  }
  if (t < TWO_THIRDS) {
    return p + (q - p) * (TWO_THIRDS - t) * 6;
  }
  return p;
}

/// Convert a HSL colour to an RGB value.
/// @param h The hue value.
/// @param s The saturation value.
/// @param l The luminance value.
/// @param dest The destination byte array to write the 8-bit r, g, and b values.
void hsl2rgb(float h, float s, float l, uint8_t *dest) {
  if (s == 0) {
    dest[0] = 0;
    dest[1] = 0;
    dest[2] = 0;
    return;
  }
  float q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  float p = 2 * l - q;
  dest[0] = hue2rgb(p, q, h + ONE_THIRD) * 255;
  dest[1] = hue2rgb(p, q, h) * 255;
  dest[2] = hue2rgb(p, q, h - ONE_THIRD) * 255;
}

/// Write a pixel to the the pixel array.
/// @param h The hue.
/// @param s The saturation.
/// @param l The luminance.
/// @param x The x-coordinate of the pixel.
/// @param y The y-coordinate of the pixel.
void writePixel(float h, float s, float l, uint16_t x, uint16_t y) {
  int currPixel = 3 * (y * canvasSize + x);
  hsl2rgb(h, s, l, &pixels[currPixel]);
}

/// Calculate the colour of a pixel in the mandelbrot set and update the pixels array.
/// @param x The pixel column (0 is the leftmost column).
/// @param y The pixel row (0 is the topmost row).
/// @param borderLeft The real number corresponding to the left border of the render box.
/// @param borderTop The imaginary number corresponding to the top border of the render box.
/// @param sideLength The render box's simulated side length.
/// @param startRe Re(z_0)
/// @param startIm Im(z_0)
/// @param cutoff The distance from the origin at which a point should stop being iterated.
/// @param maxIterations The maximum number of iterations of a point to consider.
void calculateMandelbrotPixel(
  uint16_t x,
  uint16_t y,
  float borderLeft,
  float borderTop,
  float sideLength,
  float startRe,
  float startIm,
  float cutoff,
  int maxIterations
) {
  const double scale = sideLength / canvasSize;

  double iterationRe = startRe;
  double iterationIm = startIm;
  double cRe = borderLeft + ((x + 0.5) * scale);
  double cIm = borderTop - ((y + 0.5) * scale);

  int numIterations = 0;

  double squareIterationRe = iterationRe * iterationRe;
  double squareIterationIm = iterationIm * iterationIm;

  while (
    squareIterationRe + squareIterationIm < cutoff &&
    numIterations < maxIterations
    ) {
    double temp = iterationRe;
    iterationRe = squareIterationRe - squareIterationIm + cRe;
    iterationIm = 2 * temp * iterationIm + cIm;

    squareIterationRe = iterationRe * iterationRe;
    squareIterationIm = iterationIm * iterationIm;

    numIterations++;
  }

  if (numIterations == maxIterations) {
    writePixel(0, 0, 0, x, y);
  } else {
    float betterIterations = ((float) numIterations) -
                             log(log(sqrt(squareIterationRe + squareIterationIm))) / M_LN2;
    writePixel((float) betterIterations / (float) maxIterations, 1, 0.5, x, y);
  }
}

/// Render the Mandelbrot set.
/// @param borderLeft The real number corresponding to the left border of the render box.
/// @param borderTop The imaginary number corresponding to the top border of the render box.
/// @param sideLength The render box's simulated side length.
/// @param startRe Re(z_0)
/// @param startIm Im(z_0)
/// @param cutoff The distance from the origin at which a point should stop being iterated.
/// @param maxIterations The maximum number of iterations of a point to consider.
__attribute__((unused)) void renderMandelbrot(
  float borderLeft,
  float borderTop,
  float sideLength,
  float startRe,
  float startIm,
  float cutoff,
  int maxIterations
) {
  for (uint16_t x = 0; x < canvasSize; x++) {
    for (uint16_t y = 0; y < canvasSize; y++) {
      calculateMandelbrotPixel(
        x,
        y,
        borderLeft,
        borderTop,
        sideLength,
        startRe,
        startIm,
        cutoff,
        maxIterations
      );
    }
    redraw(x, 0, x, canvasSize);
  }
}

/// Free allocated memory and quit SDL.
__attribute__((unused)) void cleanup(void) {
  // Free the window, renderer, and pixels
  SDL_DestroyWindow(window);
  SDL_DestroyRenderer(renderer);
  free(pixels);

  // Quit SDL
  SDL_Quit();
}

/// Initialise the window, renderer, and pixels array.
/// @param canvasSize_ The width and height in pixels of the canvas.
__attribute__((unused)) void initialiseCanvas(uint16_t canvasSize_) {
  SDL_Init(SDL_INIT_VIDEO);

  canvasSize = canvasSize_;

  // Initialise the window, renderer, and texture
  window = SDL_CreateWindow(
    "Fractal Window",
    SDL_WINDOWPOS_UNDEFINED,
    SDL_WINDOWPOS_UNDEFINED,
    canvasSize,
    canvasSize,
    SDL_WINDOW_SHOWN
  );
  renderer = SDL_CreateRenderer(
    window,
    -1,
    SDL_RENDERER_ACCELERATED
  );

  // Free up space for the pixels array
  pixels = malloc(canvasSize * canvasSize * 3);
}
