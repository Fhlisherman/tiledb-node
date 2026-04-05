#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class ArrayWrapper : public Napi::ObjectWrap<ArrayWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ArrayWrapper(const Napi::CallbackInfo& info);
    ~ArrayWrapper();

private:
    static Napi::FunctionReference constructor;

    // Static method
    static Napi::Value Create(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value Open(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);
    Napi::Value GetQueryType(const Napi::CallbackInfo& info);
    Napi::Value GetUri(const Napi::CallbackInfo& info);
    Napi::Value IsOpen(const Napi::CallbackInfo& info);
    Napi::Value GetSchema(const Napi::CallbackInfo& info);

    tiledb::Array* array_;
    tiledb::Context* ctx_ref_;
};
