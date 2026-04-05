#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class ContextWrapper : public Napi::ObjectWrap<ContextWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ContextWrapper(const Napi::CallbackInfo& info);
    ~ContextWrapper();

private:
    static Napi::FunctionReference constructor;

    // TileDB bindings
    Napi::Value GetVersion(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Context* ctx_;
};
