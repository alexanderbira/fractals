#include <SDL2/SDL.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

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

/// Write a pixel to the the pixel array.
/// \param r The red value.
/// \param g The green value.
/// \param b The blue value.
/// \param x The x-coordinate of the pixel.
/// \param y The y-coordinate of the pixel.
void writePixel(uint8_t r, uint8_t g, uint8_t b, uint16_t x, uint16_t y) {
  int currPixel = 3 * (y * CANVAS_SIZE + x);
  pixels[currPixel] = r;
  pixels[currPixel + 1] = g;
  pixels[currPixel + 2] = b;
}

/// Update the pixels array with a pixel's Mandelbrot colour.
__attribute__((unused)) void drawMandelbrotPixel(uint16_t x, uint16_t y) {
  double iterationRe = 0;
  double iterationIm = 0;
  double cRe = x / ((float) CANVAS_SIZE / 4) - 2;
  double cIm = y / ((float) CANVAS_SIZE / 4) - 2;

  int numIterations = 0;

  const int MAX_ITERATIONS = 50;

  while (((iterationRe < 1 && iterationRe > -1) || (iterationIm < 1 && iterationIm > -1)) &&
         numIterations < MAX_ITERATIONS) {
    double temp = iterationRe;
    iterationRe = iterationRe * iterationRe - iterationIm * iterationIm + cRe;
    iterationIm = (temp + temp) * iterationIm + cIm;
    numIterations++;
  }

  if (numIterations == MAX_ITERATIONS) {
    writePixel(0, 0, 0, x, y);
  } else {
    switch (numIterations % 3) {
      case 0:
        writePixel(255, 0, 0, x, y);
        break;
      case 1:
        writePixel(0, 255, 0, x, y);
        break;
      case 2:
        writePixel(0, 0, 255, x, y);
        break;
    }
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
