#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class ObjectWrapper : public Napi::ObjectWrap<ObjectWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ObjectWrapper(const Napi::CallbackInfo& info);
    ~ObjectWrapper();

private:
    static Napi::FunctionReference constructor;

    // Static methods corresponding to tiledb::Object
    static Napi::Value Type(const Napi::CallbackInfo& info);
    static Napi::Value Remove(const Napi::CallbackInfo& info);
    static Napi::Value Move(const Napi::CallbackInfo& info);
    static Napi::Value Ls(const Napi::CallbackInfo& info);
    static Napi::Value Walk(const Napi::CallbackInfo& info);
};
