#include "filter_list_wrapper.h"
#include "context_wrapper.h"
#include "filter_wrapper.h"

Napi::FunctionReference FilterListWrapper::constructor;

Napi::Object FilterListWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "FilterList", {
        InstanceMethod("addFilter", &FilterListWrapper::AddFilter),
        InstanceMethod("setChunkSize", &FilterListWrapper::SetChunkSize),
        InstanceMethod("close", &FilterListWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("FilterList", func);
    return exports;
}

Napi::Object FilterListWrapper::NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::FilterList filter_list) {
    Napi::Object obj = constructor.New({});
    FilterListWrapper* wrapper = Napi::ObjectWrap<FilterListWrapper>::Unwrap(obj);
    delete wrapper->filter_list_;
    wrapper->filter_list_ = new tiledb::FilterList(filter_list);
    return obj;
}

FilterListWrapper::FilterListWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<FilterListWrapper>(info) {
    Napi::Env env = info.Env();
    
    if (info.Length() == 0) {
        this->filter_list_ = nullptr;
        return;
    }

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected (Context ctx)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->filter_list_ = new tiledb::FilterList(ctx_wrap->get_context());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

FilterListWrapper::~FilterListWrapper() {
    if (this->filter_list_ != nullptr) {
        delete this->filter_list_;
        this->filter_list_ = nullptr;
    }
}

tiledb::FilterList& FilterListWrapper::get_filter_list() {
    return *this->filter_list_;
}

Napi::Value FilterListWrapper::AddFilter(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (Filter filter)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        FilterWrapper* filter_wrap = Napi::ObjectWrap<FilterWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->filter_list_->add_filter(filter_wrap->get_filter());
        return info.This();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value FilterListWrapper::SetChunkSize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected (number chunkSize)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        uint32_t chunk_size = info[0].As<Napi::Number>().Uint32Value();
        this->filter_list_->set_max_chunk_size(chunk_size);
        return info.This();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value FilterListWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->filter_list_ != nullptr) {
        delete this->filter_list_;
        this->filter_list_ = nullptr;
    }
    return info.Env().Undefined();
}
