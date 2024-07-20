#include <SDL2/SDL.h>
#include <math.h>
#include <stdbool.h>

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
/// @cite https://github.com/CharlesStover/hsl2rgb-js
void hsl2rgb(float h, float s, float l, uint8_t *dest) {
  if (s == 0) {
    dest[0] = 0;
    dest[1] = 0;
    dest[2] = 0;
    return;
  }
  float q = l < 0.5 ? l * s + l : l + s - l * s;
  float p = 2 * l - q;

  // Swap dest 1 and 2 for a more vibrant image
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
  double borderLeft,
  double borderTop,
  double sideLength,
  double startRe,
  double startIm,
  double cutoff,
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
    // Credit: https://www.linas.org/art-gallery/escape/escape.html
    float betterIterations = ((float) numIterations) -
                             log(log(sqrt(squareIterationRe + squareIterationIm))) / M_LN2;
    writePixel((float) betterIterations / (float) maxIterations, 1, 0.5, x, y);
  }
}

/// Save the currently rendered image to the filesystem.
__attribute__((unused)) void saveImage() {
  // Create a surface in which to save the pixel data
  SDL_Surface *image = SDL_CreateRGBSurfaceWithFormat(
    0,
    canvasSize,
    canvasSize,
    24,
    SDL_PIXELFORMAT_RGB24
  );

  // Copy the pixel data to the surface
  memmove(image->pixels, pixels, canvasSize * canvasSize * 3);

  // Save the image to the filesystem
  SDL_SaveBMP(image, "image.bmp");

  // Free the memory allocated for the image surface
  SDL_FreeSurface(image);
}

/// Generate a fractal and save it to the pixels array.
/// @param borderLeft The real number corresponding to the left border of the render box.
/// @param borderTop The imaginary number corresponding to the top border of the render box.
/// @param sideLength The render box's simulated side length.
/// @param startRe Re(z_0)
/// @param startIm Im(z_0)
/// @param cutoff The distance from the origin at which a point should stop being iterated.
/// @param maxIterations The maximum number of iterations of a point to consider.
/// @param render Whether to display the calculated canvas on the screen.
void generateFractal(
  double borderLeft,
  double borderTop,
  double sideLength,
  double startRe,
  double startIm,
  double cutoff,
  int maxIterations,
  bool render
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
    if (render) {
      redraw(x, 0, x, canvasSize);
    }
  }
}

/// Generate a fractal and display it to the canvas.
/// @param borderLeft The real number corresponding to the left border of the render box.
/// @param borderTop The imaginary number corresponding to the top border of the render box.
/// @param sideLength The render box's simulated side length.
/// @param startRe Re(z_0)
/// @param startIm Im(z_0)
/// @param cutoff The distance from the origin at which a point should stop being iterated.
/// @param maxIterations The maximum number of iterations of a point to consider.
__attribute__((unused)) void generateRenderFractal(
  double borderLeft,
  double borderTop,
  double sideLength,
  double startRe,
  double startIm,
  double cutoff,
  int maxIterations
) {
  generateFractal(
    borderLeft,
    borderTop,
    sideLength,
    startRe,
    startIm,
    cutoff,
    maxIterations,
    true
  );
}

/// Generate and save a fractal image without displaying it.
/// @param borderLeft The real number corresponding to the left border of the render box.
/// @param borderTop The imaginary number corresponding to the top border of the render box.
/// @param sideLength The render box's simulated side length.
/// @param startRe Re(z_0)
/// @param startIm Im(z_0)
/// @param cutoff The distance from the origin at which a point should stop being iterated.
/// @param maxIterations The maximum number of iterations of a point to consider.
/// @param canvasSize_ The width/height in pixels of the fractal to generate.
__attribute__((unused)) void generateSaveFractal(
  double borderLeft,
  double borderTop,
  double sideLength,
  double startRe,
  double startIm,
  double cutoff,
  int maxIterations,
  uint16_t canvasSize_
) {
  // Save old global variables
  uint16_t oldCanvasSize = canvasSize;
  uint8_t *oldPixels = pixels;

  // Assign new global variables
  canvasSize = canvasSize_;
  pixels = malloc(canvasSize * canvasSize * 3);

  // Generate the new fractal without displaying it
  generateFractal(
    borderLeft,
    borderTop,
    sideLength,
    startRe,
    startIm,
    cutoff,
    maxIterations,
    false
  );

  // Save the image
  saveImage();

  // Free the space allocated for the new pixels array
  free(pixels);

  // Restore the values of the global variables
  canvasSize = oldCanvasSize;
  pixels = oldPixels;
}

/// Initialise the window, renderer, and pixels array.
/// @param canvasSize_ The width and height in pixels of the canvas.
__attribute__((unused)) void initialiseGraphics(uint16_t canvasSize_) {
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

  // Allocate space for the pixels array
  pixels = malloc(canvasSize * canvasSize * 3);
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
