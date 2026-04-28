#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>
#include <tiledb/tiledb_experimental>
#include <memory>

class EnumerationWrapper : public Napi::ObjectWrap<EnumerationWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    EnumerationWrapper(const Napi::CallbackInfo& info);
    ~EnumerationWrapper();

    tiledb::Enumeration get_enumeration() const;
    static Napi::FunctionReference constructor;

private:
    std::unique_ptr<tiledb::Enumeration> enumeration_;

    Napi::Value Name(const Napi::CallbackInfo& info);
    Napi::Value Type(const Napi::CallbackInfo& info);

    // Provide a static Create factory method mapped to Enumeration.create
    static Napi::Value Create(const Napi::CallbackInfo& info);
};
