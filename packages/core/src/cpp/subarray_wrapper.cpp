#include "subarray_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference SubarrayWrapper::constructor;

Napi::Object SubarrayWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Subarray", {
        InstanceMethod("addRange", &SubarrayWrapper::AddRange),
        InstanceMethod("close", &SubarrayWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Subarray", func);
    return exports;
}

SubarrayWrapper::SubarrayWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SubarrayWrapper>(info), subarray_(nullptr) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (Context ctx, Array array)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        ArrayWrapper* array_wrap = Napi::ObjectWrap<ArrayWrapper>::Unwrap(info[1].As<Napi::Object>());
        this->subarray_ = new tiledb::Subarray(ctx_wrap->get_context(), array_wrap->get_array());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

SubarrayWrapper::~SubarrayWrapper() {
    if (this->subarray_ != nullptr) {
        delete this->subarray_;
        this->subarray_ = nullptr;
    }
}

Napi::Value SubarrayWrapper::AddRange(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string dim_name, number start, number end)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string dim_name = info[0].As<Napi::String>().Utf8Value();
        
        // Dynamically type checking numbers is tricky without knowing the dimension format upfront.
        // For simplicity we will handle INT32 arrays for MVP if they pass JS numbers.
        // JS Numbers are double max 53 bit integers. 
        if (info[1].IsNumber() && info[2].IsNumber()) {
            int32_t start = info[1].As<Napi::Number>().Int32Value();
            int32_t end = info[2].As<Napi::Number>().Int32Value();
            this->subarray_->add_range(dim_name, start, end);
        } else {
             Napi::TypeError::New(env, "Types other than int32 ranges are not yet supported in this wrapper").ThrowAsJavaScriptException();
        }
        
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value SubarrayWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->subarray_ != nullptr) {
        delete this->subarray_;
        this->subarray_ = nullptr;
    }
    return info.Env().Undefined();
}
