#pragma once

#include <napi.h>
#include <tiledb/tiledb>

class StatsWrapper {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

private:
    static Napi::Value Enable(const Napi::CallbackInfo& info);
    static Napi::Value Disable(const Napi::CallbackInfo& info);
    static Napi::Value Reset(const Napi::CallbackInfo& info);
    static Napi::Value DumpStr(const Napi::CallbackInfo& info);
};
