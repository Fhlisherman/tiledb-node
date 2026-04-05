#include "context_wrapper.h"

Napi::FunctionReference ContextWrapper::constructor;

Napi::Object ContextWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Context", {
        InstanceMethod("getVersion", &ContextWrapper::GetVersion),
        InstanceMethod("close", &ContextWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Context", func);
    return exports;
}

ContextWrapper::ContextWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ContextWrapper>(info) {
    Napi::Env env = info.Env();

    try {
        // Initialize a default TileDB context
        this->ctx_ = new tiledb::Context();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ContextWrapper::~ContextWrapper() {
    if (this->ctx_ != nullptr) {
        delete this->ctx_;
        this->ctx_ = nullptr;
    }
}

Napi::Value ContextWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->ctx_ != nullptr) {
        delete this->ctx_;
        this->ctx_ = nullptr;
    }
    return info.Env().Undefined();
}

Napi::Value ContextWrapper::GetVersion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    std::tuple<int, int, int> version = tiledb::version();
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("major", Napi::Number::New(env, std::get<0>(version)));
    result.Set("minor", Napi::Number::New(env, std::get<1>(version)));
    result.Set("patch", Napi::Number::New(env, std::get<2>(version)));
    
    return result;
}
