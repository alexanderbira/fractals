#include <SDL2/SDL.h>
#include <stdbool.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

SDL_Window *window;
SDL_Renderer *renderer;
SDL_Texture *texture;
uint8_t *pixels;

const uint16_t CANVAS_WIDTH = 1000;
const uint16_t CANVAS_HEIGHT = 1000;

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


// TODO: make this only redraw some portion of the canvas

/// Redraw the canvas from the pixels array
void redraw() {
  SDL_RenderClear(renderer);
  SDL_UpdateTexture(texture, NULL, pixels, CANVAS_WIDTH * sizeof(uint8_t) * 3);
  SDL_RenderCopy(renderer, texture, NULL, NULL);
  SDL_RenderPresent(renderer);
}

/// Run the main event loop
bool handle_events() {
  // Get the event
  SDL_Event event;
  SDL_PollEvent(&event);

  if (event.type == SDL_QUIT) {
    return false;
  }

  // Draw the pixel the mouse is over
  if (event.type == SDL_MOUSEMOTION) {
    writePixel(0,0,0, event.motion.x, event.motion.y);
    redraw();
  }

  return true;
}

void callback(void) {
    handle_events();
}

void run_main_loop() {
#ifdef __EMSCRIPTEN__
  emscripten_set_main_loop(&callback, 0, true);
#else
  while (handle_events())
    ;
#endif
}

int main() {
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
    SDL_TEXTUREACCESS_STATIC,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  // Initialise the pixel array and set it to white
  pixels = malloc(CANVAS_WIDTH * CANVAS_HEIGHT * 3);
  memset(pixels, 255, CANVAS_WIDTH * CANVAS_HEIGHT * 3);

  // Start the event loop
  redraw();
  run_main_loop();

  // Free the allocated memory
  free(pixels);
  SDL_DestroyTexture(texture);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);

  SDL_Quit();
}
