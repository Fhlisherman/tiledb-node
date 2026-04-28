#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>
#include <tiledb/fragment_info.h>
#include <memory>

class FragmentInfoWrapper : public Napi::ObjectWrap<FragmentInfoWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    FragmentInfoWrapper(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;

    std::unique_ptr<tiledb::FragmentInfo> fragment_info_;

    Napi::Value Load(const Napi::CallbackInfo& info);
    Napi::Value FragmentNum(const Napi::CallbackInfo& info);
    Napi::Value FragmentUri(const Napi::CallbackInfo& info);
    Napi::Value FragmentSize(const Napi::CallbackInfo& info);
    Napi::Value TimestampRange(const Napi::CallbackInfo& info);
    Napi::Value MbrNum(const Napi::CallbackInfo& info);
};
