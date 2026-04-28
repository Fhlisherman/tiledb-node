#include "stats_wrapper.h"

Napi::Object StatsWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Object statsObj = Napi::Object::New(env);
    statsObj.Set("enable", Napi::Function::New(env, StatsWrapper::Enable));
    statsObj.Set("disable", Napi::Function::New(env, StatsWrapper::Disable));
    statsObj.Set("reset", Napi::Function::New(env, StatsWrapper::Reset));
    statsObj.Set("dumpStr", Napi::Function::New(env, StatsWrapper::DumpStr));
    
    exports.Set("Stats", statsObj);
    return exports;
}

Napi::Value StatsWrapper::Enable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::Stats::enable();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value StatsWrapper::Disable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::Stats::disable();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value StatsWrapper::Reset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::Stats::reset();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value StatsWrapper::DumpStr(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        std::string stats_str;
        tiledb::Stats::dump(&stats_str);
        return Napi::String::New(env, stats_str);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}
