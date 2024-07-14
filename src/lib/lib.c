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
#define CANVAS_SIZE 1500

const float borderLeft = -2;
const float borderTop = 2;
const float sideLength = 4;
const float startRe = 0;
const float startIm = 0;
const float cutoff = 10;
const int maxIterations = 100;

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
  SDL_UpdateTexture(texture, NULL, pixels + (y1 * CANVAS_SIZE + x1) * 3, CANVAS_SIZE * 3);

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
  int currPixel = 3 * (y * CANVAS_SIZE + x);
  hsl2rgb(h, s, l, &pixels[currPixel]);
}

/// Calculate the colour of a pixel in the mandelbrot set and update the pixels array.
/// @param x
/// @param y
void calculateMandelbrotPixel(uint16_t x, uint16_t y) {
  double iterationRe = startRe;
  double iterationIm = startIm;
  double cRe = borderLeft + ((x + 0.5) * (sideLength / CANVAS_SIZE));
  double cIm = borderTop - ((y + 0.5) * (sideLength / CANVAS_SIZE));

  int numIterations = 0;

  while (
    (
      (
        iterationRe < cutoff &&
        iterationRe > -cutoff
      ) ||
      (
        iterationIm < cutoff &&
        iterationIm > -cutoff
      )
    ) &&
    numIterations < maxIterations
    ) {
    double temp = iterationRe;
    iterationRe = iterationRe * iterationRe - iterationIm * iterationIm + cRe;
    iterationIm = (temp + temp) * iterationIm + cIm;
    numIterations++;
  }

  if (numIterations == maxIterations) {
    writePixel(0, 0, 0, x, y);
  } else {
    float betterIterations =
      ((float) numIterations) - log(log(sqrt(iterationRe * iterationRe + iterationIm * iterationIm))) / M_LN2;
    writePixel((float) betterIterations / (float) maxIterations, 1, 0.5, x, y);
  }
}

/// Render the Mandelbrot set.
__attribute__((unused)) void renderMandelbrot() {
  for (uint16_t x = 0; x < CANVAS_SIZE; x++) {
    for (uint16_t y = 0; y < CANVAS_SIZE; y++) {
      calculateMandelbrotPixel(x, y);
    }
    redraw(x, 0, x, CANVAS_SIZE);
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

int main() {
  SDL_Init(SDL_INIT_VIDEO);

  // Initialise the window, renderer, and texture
  window = SDL_CreateWindow(
    "Fractal Window",
    SDL_WINDOWPOS_UNDEFINED,
    SDL_WINDOWPOS_UNDEFINED,
    CANVAS_SIZE,
    CANVAS_SIZE,
    SDL_WINDOW_SHOWN
  );
  renderer = SDL_CreateRenderer(
    window,
    -1,
    SDL_RENDERER_ACCELERATED
  );

  // Free up space for the pixels array
  pixels = malloc(CANVAS_SIZE * CANVAS_SIZE * 3);
}
