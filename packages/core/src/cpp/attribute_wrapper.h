#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class AttributeWrapper : public Napi::ObjectWrap<AttributeWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Attribute attr);
    AttributeWrapper(const Napi::CallbackInfo& info);
    ~AttributeWrapper();

    tiledb::Attribute& get_attribute();

private:
    static Napi::FunctionReference constructor;

    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetType(const Napi::CallbackInfo& info);
    Napi::Value GetCellValNum(const Napi::CallbackInfo& info);
    Napi::Value SetCellValNum(const Napi::CallbackInfo& info);
    Napi::Value SetNullable(const Napi::CallbackInfo& info);
    Napi::Value GetNullable(const Napi::CallbackInfo& info);
    Napi::Value SetFilterList(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Attribute* attr_;
};
