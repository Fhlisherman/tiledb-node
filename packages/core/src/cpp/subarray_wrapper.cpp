#include "subarray_wrapper.h"

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

SubarrayWrapper::SubarrayWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SubarrayWrapper>(info), subarray_(nullptr), array_ref_(nullptr) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
        Napi::TypeError::New(env, "Expected (Context ctx, Array array)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        ArrayWrapper* array_wrap = Napi::ObjectWrap<ArrayWrapper>::Unwrap(info[1].As<Napi::Object>());
        this->array_ref_ = &array_wrap->get_array();
        this->subarray_ = new tiledb::Subarray(ctx_wrap->get_context(), *this->array_ref_);
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
        
        tiledb_datatype_t dim_type = this->array_ref_->schema().domain().dimension(dim_name).type();

        if (info[1].IsString() && info[2].IsString()) {
             std::string start = info[1].As<Napi::String>().Utf8Value();
             std::string end = info[2].As<Napi::String>().Utf8Value();
             this->subarray_->add_range(dim_name, start, end);
        } else if (info[1].IsNumber() && info[2].IsNumber()) {
             switch (dim_type) {
                 case TILEDB_INT32: {
                     int32_t start = info[1].As<Napi::Number>().Int32Value();
                     int32_t end = info[2].As<Napi::Number>().Int32Value();
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 case TILEDB_FLOAT64: {
                     double start = info[1].As<Napi::Number>().DoubleValue();
                     double end = info[2].As<Napi::Number>().DoubleValue();
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 case TILEDB_FLOAT32: {
                     float start = info[1].As<Napi::Number>().FloatValue();
                     float end = info[2].As<Napi::Number>().FloatValue();
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 case TILEDB_INT16: {
                     int16_t start = static_cast<int16_t>(info[1].As<Napi::Number>().Int32Value());
                     int16_t end = static_cast<int16_t>(info[2].As<Napi::Number>().Int32Value());
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 case TILEDB_UINT32: {
                     uint32_t start = info[1].As<Napi::Number>().Uint32Value();
                     uint32_t end = info[2].As<Napi::Number>().Uint32Value();
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 default:
                     Napi::TypeError::New(env, "Unsupported dimension datatype for numeric range").ThrowAsJavaScriptException();
                     return env.Undefined();
             }
        } else if (info[1].IsBigInt() && info[2].IsBigInt()) {
             bool lossless;
             switch (dim_type) {
                 case TILEDB_INT64: {
                     int64_t start = info[1].As<Napi::BigInt>().Int64Value(&lossless);
                     int64_t end = info[2].As<Napi::BigInt>().Int64Value(&lossless);
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 case TILEDB_UINT64: {
                     uint64_t start = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
                     uint64_t end = info[2].As<Napi::BigInt>().Uint64Value(&lossless);
                     this->subarray_->add_range(dim_name, start, end);
                     break;
                 }
                 default:
                     Napi::TypeError::New(env, "Unsupported dimension datatype for BigInt range").ThrowAsJavaScriptException();
                     return env.Undefined();
             }
        } else {
             Napi::TypeError::New(env, "Range limits must be both Strings, both Numbers, or both BigInts").ThrowAsJavaScriptException();
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
