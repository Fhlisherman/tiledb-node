{
  "variables": {
    "core_src": "<(module_root_dir)/../core/src/cpp"
  },
  "targets": [{
    "target_name": "tiledb_bindings",
    "sources": [
      "<(core_src)/main.cpp",
      "<(core_src)/context_wrapper.cpp",
      "<(core_src)/config_wrapper.cpp",
      "<(core_src)/filter_wrapper.cpp",
      "<(core_src)/dimension_wrapper.cpp",
      "<(core_src)/domain_wrapper.cpp",
      "<(core_src)/attribute_wrapper.cpp",
      "<(core_src)/array_schema_wrapper.cpp",
      "<(core_src)/array_wrapper.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "<(module_root_dir)/tiledb-dist",
      "<(core_src)"
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