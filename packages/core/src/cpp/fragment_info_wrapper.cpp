#include "fragment_info_wrapper.h"
#include "context_wrapper.h"

Napi::FunctionReference FragmentInfoWrapper::constructor;

Napi::Object FragmentInfoWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "FragmentInfo", {
        InstanceMethod("load", &FragmentInfoWrapper::Load),
        InstanceMethod("fragmentNum", &FragmentInfoWrapper::FragmentNum),
        InstanceMethod("fragmentUri", &FragmentInfoWrapper::FragmentUri),
        InstanceMethod("fragmentSize", &FragmentInfoWrapper::FragmentSize),
        InstanceMethod("timestampRange", &FragmentInfoWrapper::TimestampRange),
        InstanceMethod("mbrNum", &FragmentInfoWrapper::MbrNum),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("FragmentInfo", func);
    return exports;
}

FragmentInfoWrapper::FragmentInfoWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<FragmentInfoWrapper>(info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected Context object and array_uri string").ThrowAsJavaScriptException();
        return;
    }

    auto ctx_wrapper = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
    std::string array_uri = info[1].As<Napi::String>().Utf8Value();

    try {
        fragment_info_ = std::make_unique<tiledb::FragmentInfo>(ctx_wrapper->get_context(), array_uri);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

Napi::Value FragmentInfoWrapper::Load(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        fragment_info_->load();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value FragmentInfoWrapper::FragmentNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        uint32_t num = fragment_info_->fragment_num();
        return Napi::Number::New(env, static_cast<double>(num));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value FragmentInfoWrapper::FragmentUri(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected fragment index (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    uint32_t fid = info[0].As<Napi::Number>().Uint32Value();
    try {
        std::string uri = fragment_info_->fragment_uri(fid);
        return Napi::String::New(env, uri);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value FragmentInfoWrapper::FragmentSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected fragment index (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    uint32_t fid = info[0].As<Napi::Number>().Uint32Value();
    try {
        uint64_t size = fragment_info_->fragment_size(fid);
        return Napi::Number::New(env, static_cast<double>(size));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value FragmentInfoWrapper::TimestampRange(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected fragment index (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    uint32_t fid = info[0].As<Napi::Number>().Uint32Value();
    try {
        auto range = fragment_info_->timestamp_range(fid);
        Napi::Array arr = Napi::Array::New(env, 2);
        arr.Set(static_cast<uint32_t>(0), Napi::Number::New(env, static_cast<double>(range.first)));
        arr.Set(static_cast<uint32_t>(1), Napi::Number::New(env, static_cast<double>(range.second)));
        return arr;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value FragmentInfoWrapper::MbrNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected fragment index (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    uint32_t fid = info[0].As<Napi::Number>().Uint32Value();
    try {
        uint64_t num = fragment_info_->mbr_num(fid);
        return Napi::Number::New(env, static_cast<double>(num));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}
