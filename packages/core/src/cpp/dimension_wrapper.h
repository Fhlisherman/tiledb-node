#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class DimensionWrapper : public Napi::ObjectWrap<DimensionWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Dimension dim);
    DimensionWrapper(const Napi::CallbackInfo& info);
    ~DimensionWrapper();

    tiledb::Dimension& get_dimension();

private:
    static Napi::FunctionReference constructor;

    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetType(const Napi::CallbackInfo& info);
    Napi::Value GetDomain(const Napi::CallbackInfo& info);
    Napi::Value GetTileExtent(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Dimension* dim_;
};
