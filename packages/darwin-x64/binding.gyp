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
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
      "OTHER_LDFLAGS": [
        "-Wl,-rpath,@loader_path/../../tiledb-dist"
      ]
    }
  }]
}