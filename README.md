# Fractals

An online viewer/generator for fractals using C → WASM for fast generation.

This is very much a work in progress. You can view the current version at [https://alexbr.dev/fractals](https://alexbr.dev/fractals)

## Building

1. Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) and add `emcc` to your `$PATH`
2. Build the project

```shell
$ npm run build
```

## Developing

**Prerequisite**: Install [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) and add `emcc` to your `$PATH`

- Start the Vite development server with `npm run dev`
- Re-compile the lib to WASM with `npm run build-lib`
- Lib can be built directly with [CMake](https://cmake.org/download). Make sure you have [SDL2](https://github.com/libsdl-org/SDL/releases/latest) installed.

## Deploying

- Deploy with `npm run deploy`
