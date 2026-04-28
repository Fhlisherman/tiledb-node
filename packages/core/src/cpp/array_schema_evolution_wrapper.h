#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>
#include <tiledb/tiledb_experimental>
#include <tiledb/array_schema_evolution.h>
#include <memory>
#include "attribute_wrapper.h"
#include "enumeration_wrapper.h"

class ArraySchemaEvolutionWrapper : public Napi::ObjectWrap<ArraySchemaEvolutionWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ArraySchemaEvolutionWrapper(const Napi::CallbackInfo& info);
    ~ArraySchemaEvolutionWrapper();

    static Napi::FunctionReference constructor;

private:
    std::unique_ptr<tiledb::ArraySchemaEvolution> evolution_;

    Napi::Value AddAttribute(const Napi::CallbackInfo& info);
    Napi::Value DropAttribute(const Napi::CallbackInfo& info);
    Napi::Value AddEnumeration(const Napi::CallbackInfo& info);
    Napi::Value DropEnumeration(const Napi::CallbackInfo& info);
    Napi::Value ExtendEnumeration(const Napi::CallbackInfo& info);
    Napi::Value ArrayEvolve(const Napi::CallbackInfo& info);
};
