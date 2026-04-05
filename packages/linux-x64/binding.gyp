{
  "targets": [{
    "target_name": "tiledb_bindings",
    "sources": [
      "src/cpp/main.cpp",
      "src/cpp/context_wrapper.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "<(module_root_dir)/tiledb-dist"
    ],
    "libraries": [ 
        "-L<(module_root_dir)/tiledb-dist",
        "-ltiledb" 
    ],
    "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
    "defines": [ "NAPI_CPP_EXCEPTIONS" ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "ldflags": [
      "-Wl,-rpath,'$$ORIGIN/../../tiledb-dist'"
    ]
  }]
}