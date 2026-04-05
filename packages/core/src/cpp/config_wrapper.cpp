#include "config_wrapper.h"

Napi::FunctionReference ConfigWrapper::constructor;

Napi::Object ConfigWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Config", {
        InstanceMethod("set", &ConfigWrapper::Set),
        InstanceMethod("get", &ConfigWrapper::Get),
        InstanceMethod("unset", &ConfigWrapper::Unset),
        InstanceMethod("close", &ConfigWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Config", func);
    return exports;
}

Napi::Object ConfigWrapper::NewInstance(Napi::Env env, tiledb::Config cfg) {
    Napi::Object obj = constructor.New({});
    ConfigWrapper* wrapper = Napi::ObjectWrap<ConfigWrapper>::Unwrap(obj);
    delete wrapper->config_;
    wrapper->config_ = new tiledb::Config(cfg);
    return obj;
}

ConfigWrapper::ConfigWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ConfigWrapper>(info) {
    Napi::Env env = info.Env();
    try {
        this->config_ = new tiledb::Config();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ConfigWrapper::~ConfigWrapper() {
    if (this->config_ != nullptr) {
        delete this->config_;
        this->config_ = nullptr;
    }
}

tiledb::Config& ConfigWrapper::get_config() {
    return *this->config_;
}

Napi::Value ConfigWrapper::Set(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (string key, string value)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        std::string value = info[1].As<Napi::String>().Utf8Value();
        this->config_->set(key, value);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ConfigWrapper::Get(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string key)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        std::string value = this->config_->get(key);
        return Napi::String::New(env, value);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ConfigWrapper::Unset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string key)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        this->config_->unset(key);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ConfigWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->config_ != nullptr) {
        delete this->config_;
        this->config_ = nullptr;
    }
    return info.Env().Undefined();
}
