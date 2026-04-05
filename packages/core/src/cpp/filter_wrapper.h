#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class FilterWrapper : public Napi::ObjectWrap<FilterWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Filter filter);
    FilterWrapper(const Napi::CallbackInfo& info);
    ~FilterWrapper();

    tiledb::Filter& get_filter();

private:
    static Napi::FunctionReference constructor;

    Napi::Value GetType(const Napi::CallbackInfo& info);
    Napi::Value SetOption(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Filter* filter_;
};
