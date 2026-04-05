#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class DomainWrapper : public Napi::ObjectWrap<DomainWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Domain domain);
    DomainWrapper(const Napi::CallbackInfo& info);
    ~DomainWrapper();

    tiledb::Domain& get_domain();

private:
    static Napi::FunctionReference constructor;

    Napi::Value AddDimension(const Napi::CallbackInfo& info);
    Napi::Value GetType(const Napi::CallbackInfo& info);
    Napi::Value GetNDim(const Napi::CallbackInfo& info);
    Napi::Value GetDimensions(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Domain* domain_;
};
