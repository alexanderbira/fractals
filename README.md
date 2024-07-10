# Fractals
An online viewer/generator for fractals using C → WASM for fast generation.

This is very much a work in progress.

## Getting Started
1. Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
2. Compile generate the WASM and JS modules
```shell
$ cd src/lib
$ <path/to/emsdk>/upstream/emscripten/emcc --bind test.c -s USE_SDL=2 -s USE_SDL_GFX=2 -s EXPORT_ES6
```
3. Run vite (from the `fractals` directory)
```bash
$ npm run dev
```