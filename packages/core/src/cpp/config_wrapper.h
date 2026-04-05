#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class ConfigWrapper : public Napi::ObjectWrap<ConfigWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, tiledb::Config cfg);
    ConfigWrapper(const Napi::CallbackInfo& info);
    ~ConfigWrapper();

    tiledb::Config& get_config();

private:
    static Napi::FunctionReference constructor;

    Napi::Value Set(const Napi::CallbackInfo& info);
    Napi::Value Get(const Napi::CallbackInfo& info);
    Napi::Value Unset(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Config* config_;
};
