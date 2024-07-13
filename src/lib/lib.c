#include <SDL2/SDL.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define ONE_SIXTH 0.16666666666666666
#define TWO_THIRDS 0.6666666666666666
#define ONE_THIRD 0.3333333333333333

SDL_Window *window;
SDL_Renderer *renderer;
uint8_t *pixels;

const uint16_t CANVAS_SIZE = 1500;

/// Redraw the canvas from the pixels array.
void redraw(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2) {
  // Calculate width and height including the end point
  uint16_t w = x2 - x1 + 1;
  uint16_t h = y2 - y1 + 1;

  // Create a texture with the correct dimensions
  SDL_Texture *texture = SDL_CreateTexture(
    renderer,
    SDL_PIXELFORMAT_RGB24,
    SDL_TEXTUREACCESS_STREAMING,
    w,
    h
  );

  SDL_UpdateTexture(texture, NULL, pixels + (y1 * CANVAS_SIZE + x1) * 3, CANVAS_SIZE * 3);
  SDL_Rect destRect = {.x = x1, .y = y1, .w = w, .h = h};
  SDL_RenderCopy(renderer, texture, NULL, &destRect);
  SDL_RenderPresent(renderer);
  SDL_DestroyTexture(texture);
}

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
/// \param H The hue.
/// \param S The saturation.
/// \param L The luminance.
/// \param x The x-coordinate of the pixel.
/// \param y The y-coordinate of the pixel.
void writePixel(float H, float S, float L, uint16_t x, uint16_t y) {
  int currPixel = 3 * (y * CANVAS_SIZE + x);
  hsl2rgb(H, S, L, &pixels[currPixel]);
}

/// Update the pixels array with a pixel's Mandelbrot colour.
__attribute__((unused)) void drawMandelbrotPixel(uint16_t x, uint16_t y) {
  double iterationRe = 0;
  double iterationIm = 0;
  double cRe = (x + 0.5) / ((float) CANVAS_SIZE / 4) - 2;
  double cIm = (y + 0.5) / ((float) CANVAS_SIZE / 4) - 2;

  int numIterations = 0;

  const int MAX_ITERATIONS = 100;

  while (((iterationRe < 10 && iterationRe > -10) || (iterationIm < 10 && iterationIm > -10)) &&
         numIterations < MAX_ITERATIONS) {
    double temp = iterationRe;
    iterationRe = iterationRe * iterationRe - iterationIm * iterationIm + cRe;
    iterationIm = (temp + temp) * iterationIm + cIm;
    numIterations++;
  }

  if (numIterations == MAX_ITERATIONS) {
    writePixel(0, 0, 0, x, y);
  } else {
    float betterIterations =
      ((float) numIterations) - log(log(sqrt(iterationRe * iterationRe + iterationIm * iterationIm))) / M_LN2;
    writePixel((float) betterIterations / (float) MAX_ITERATIONS, 1, 0.5, x, y);
  }
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

  pixels = malloc(CANVAS_SIZE * CANVAS_SIZE * 3);
}

__attribute__((unused)) void cleanup(void) {
  // Free the allocated memory
  free(pixels);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);
  SDL_Quit();
}
