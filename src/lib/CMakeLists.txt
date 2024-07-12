cmake_minimum_required(VERSION 3.28)
project(lib C)

set(CMAKE_C_STANDARD 11)

add_executable(lib
        lib.c)

find_package(SDL2 REQUIRED COMPONENTS SDL2)
target_link_libraries(lib PRIVATE SDL2::SDL2)