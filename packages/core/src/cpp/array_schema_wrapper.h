#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>

class ArraySchemaWrapper : public Napi::ObjectWrap<ArraySchemaWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ArraySchemaWrapper(const Napi::CallbackInfo& info);
    ~ArraySchemaWrapper();

    tiledb::ArraySchema& get_schema();

private:
    static Napi::FunctionReference constructor;

    Napi::Value SetDomain(const Napi::CallbackInfo& info);
    Napi::Value AddAttribute(const Napi::CallbackInfo& info);
    Napi::Value SetCellOrder(const Napi::CallbackInfo& info);
    Napi::Value SetTileOrder(const Napi::CallbackInfo& info);
    Napi::Value SetCapacity(const Napi::CallbackInfo& info);
    Napi::Value SetAllowsDups(const Napi::CallbackInfo& info);
    Napi::Value Check(const Napi::CallbackInfo& info);
    Napi::Value GetArrayType(const Napi::CallbackInfo& info);
    Napi::Value GetAttributeCount(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::ArraySchema* schema_;
};
