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
        "<(module_root_dir)/tiledb-dist/tiledb.lib"
    ],
    "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
    "defines": [ "NAPI_CPP_EXCEPTIONS" ],
    "msvs_settings": {
      "VCCLCompilerTool": {
        "ExceptionHandling": 1
      }
    },
    "copies": [
      {
        "destination": "<(module_root_dir)/build/Release/",
        "files": [
          "<(module_root_dir)/tiledb-dist/tiledb.dll"
        ]
      }
    ]
  }]
}