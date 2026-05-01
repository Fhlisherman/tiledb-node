#pragma once

#include <napi.h>
#include <tiledb/tiledb>

class ArrayWrapper : public Napi::ObjectWrap<ArrayWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ArrayWrapper(const Napi::CallbackInfo& info);
    ~ArrayWrapper();

    tiledb::Array& get_array() {
        if (array_ == nullptr) {
            throw std::runtime_error("Array has been closed");
        }
        return *array_;
    }

private:
    static Napi::FunctionReference constructor;

    // Static methods (all async / non-blocking)
    static Napi::Value Create(const Napi::CallbackInfo& info);
    static Napi::Value Consolidate(const Napi::CallbackInfo& info);
    static Napi::Value Vacuum(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value Open(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);
    Napi::Value GetQueryType(const Napi::CallbackInfo& info);
    Napi::Value GetUri(const Napi::CallbackInfo& info);
    Napi::Value IsOpen(const Napi::CallbackInfo& info);
    Napi::Value GetSchema(const Napi::CallbackInfo& info);

    // Metadata methods
    Napi::Value PutMetadata(const Napi::CallbackInfo& info);
    Napi::Value GetMetadata(const Napi::CallbackInfo& info);
    Napi::Value DeleteMetadata(const Napi::CallbackInfo& info);
    Napi::Value GetMetadataNum(const Napi::CallbackInfo& info);
    Napi::Value GetMetadataByIndex(const Napi::CallbackInfo& info);

    tiledb::Array* array_ = nullptr;
    tiledb::Context* ctx_ref_ = nullptr;
    std::string uri_;
};
