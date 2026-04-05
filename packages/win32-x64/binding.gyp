{
  "targets": [{
    "target_name": "tiledb_bindings",
    "sources": [
      "src/cpp/main.cpp",
      "src/cpp/context_wrapper.cpp",
      "src/cpp/config_wrapper.cpp",
      "src/cpp/filter_wrapper.cpp",
      "src/cpp/dimension_wrapper.cpp",
      "src/cpp/domain_wrapper.cpp",
      "src/cpp/attribute_wrapper.cpp",
      "src/cpp/array_schema_wrapper.cpp",
      "src/cpp/array_wrapper.cpp",
      "src/cpp/subarray_wrapper.cpp",
      "src/cpp/query_condition_wrapper.cpp",
      "src/cpp/query_wrapper.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "<(module_root_dir)/tiledb-dist",
      "src/cpp"
    ],
    "libraries": [ 
        "-L<(module_root_dir)/tiledb-dist",
        "-ltiledb" 
    ],
    "dependencies": [ "<!(node -p \"require('node-addon-api').gyp\")" ],
    "defines": [ "NAPI_CPP_EXCEPTIONS" ],
    "msvs_settings": {
      "VCCLCompilerTool": {
        "ExceptionHandling": "1"
      }
    },
    "xcode_settings": {
      "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
    }
  }]
}