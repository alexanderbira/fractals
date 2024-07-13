#include <SDL2/SDL.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

SDL_Window *window;
SDL_Renderer *renderer;
SDL_Texture *texture;
uint8_t *pixels;

const uint16_t CANVAS_WIDTH = 1200;
const uint16_t CANVAS_HEIGHT = 1200;

/// Redraw the canvas from the pixels array
void redraw(uint16_t x, uint16_t y, uint16_t width) {
  SDL_Rect rect = {.x=x, .y=y, .h=width, .w=width};
  SDL_UpdateTexture(texture, &rect, pixels + (y * CANVAS_WIDTH + x) * 3, CANVAS_WIDTH * 3);
  SDL_RenderCopy(renderer, texture, NULL, NULL);
  SDL_RenderPresent(renderer);
}

/// Write a pixel to the the pixel array.
/// \param r The red value.
/// \param g The green value.
/// \param b The blue value.
/// \param x The x-coordinate of the pixel.
/// \param y The y-coordinate of the pixel.
void writePixel(uint8_t r, uint8_t g, uint8_t b, uint16_t x, uint16_t y) {
  int currPixel = 3 * (y * CANVAS_HEIGHT + x);
  pixels[currPixel] = r;
  pixels[currPixel + 1] = g;
  pixels[currPixel + 2] = b;
}

__attribute__((unused)) void drawMandelbrotPixel(uint16_t x, uint16_t y) {
  if (y >= CANVAS_HEIGHT || y < 0 || x >= CANVAS_WIDTH || x < 0) return;
  double iterationRe = 0;
  double iterationIm = 0;
  double cRe = x / ((float) CANVAS_WIDTH / 4) - 2;
  double cIm = y / ((float) CANVAS_HEIGHT / 4) - 2;

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
  SDL_CreateWindowAndRenderer(
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    0,
    &window,
    &renderer
  );
  texture = SDL_CreateTexture(
    renderer,
    SDL_PIXELFORMAT_RGB24,
    SDL_TEXTUREACCESS_STREAMING,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  // Initialise the pixel array and set it to white
  pixels = malloc(CANVAS_WIDTH * CANVAS_HEIGHT * 3);
  memset(pixels, 255, CANVAS_WIDTH * CANVAS_HEIGHT * 3);
  redraw(0, 0, CANVAS_WIDTH);
}

__attribute__((unused)) void cleanup(void) {
  // Free the allocated memory
  free(pixels);
  SDL_DestroyTexture(texture);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);

  SDL_Quit();
}