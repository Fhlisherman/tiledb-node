#include "dimension_wrapper.h"
#include "context_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference DimensionWrapper::constructor;

Napi::Object DimensionWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Dimension", {
        InstanceMethod("name", &DimensionWrapper::GetName),
        InstanceMethod("type", &DimensionWrapper::GetType),
        InstanceMethod("domain", &DimensionWrapper::GetDomain),
        InstanceMethod("tileExtent", &DimensionWrapper::GetTileExtent),
        InstanceMethod("close", &DimensionWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Dimension", func);
    return exports;
}

Napi::Object DimensionWrapper::NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Dimension dim) {
    Napi::Object obj = constructor.New({});
    DimensionWrapper* wrapper = Napi::ObjectWrap<DimensionWrapper>::Unwrap(obj);
    delete wrapper->dim_;
    wrapper->dim_ = new tiledb::Dimension(dim);
    return obj;
}

// Constructor: new Dimension(ctx, name, datatype, domainLow, domainHigh, tileExtent)
DimensionWrapper::DimensionWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<DimensionWrapper>(info) {
    Napi::Env env = info.Env();

    // Allow internal zero-arg construction for NewInstance
    if (info.Length() == 0) {
        this->dim_ = nullptr;
        return;
    }

    if (info.Length() < 6) {
        Napi::TypeError::New(env, "Expected (Context, string name, string datatype, number domainLow, number domainHigh, number tileExtent)")
            .ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string name = info[1].As<Napi::String>().Utf8Value();
        std::string type_str = info[2].As<Napi::String>().Utf8Value();
        tiledb_datatype_t datatype = parse_datatype(type_str);

        if (datatype == TILEDB_STRING_ASCII || datatype == TILEDB_STRING_UTF8) {
            // Variable-length string dimension (no domain or tile extent)
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create(ctx_wrap->get_context(), name, datatype, nullptr, nullptr)
            );
        } else if (datatype == TILEDB_INT32) {
            int32_t low = info[3].As<Napi::Number>().Int32Value();
            int32_t high = info[4].As<Napi::Number>().Int32Value();
            int32_t extent = info[5].As<Napi::Number>().Int32Value();
            std::array<int32_t, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<int32_t>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else if (datatype == TILEDB_INT64) {
            int64_t low = static_cast<int64_t>(info[3].As<Napi::Number>().DoubleValue());
            int64_t high = static_cast<int64_t>(info[4].As<Napi::Number>().DoubleValue());
            int64_t extent = static_cast<int64_t>(info[5].As<Napi::Number>().DoubleValue());
            std::array<int64_t, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<int64_t>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else if (datatype == TILEDB_FLOAT32) {
            float low = info[3].As<Napi::Number>().FloatValue();
            float high = info[4].As<Napi::Number>().FloatValue();
            float extent = info[5].As<Napi::Number>().FloatValue();
            std::array<float, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<float>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else if (datatype == TILEDB_FLOAT64) {
            double low = info[3].As<Napi::Number>().DoubleValue();
            double high = info[4].As<Napi::Number>().DoubleValue();
            double extent = info[5].As<Napi::Number>().DoubleValue();
            std::array<double, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<double>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else if (datatype == TILEDB_UINT32) {
            uint32_t low = info[3].As<Napi::Number>().Uint32Value();
            uint32_t high = info[4].As<Napi::Number>().Uint32Value();
            uint32_t extent = info[5].As<Napi::Number>().Uint32Value();
            std::array<uint32_t, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<uint32_t>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else if (datatype == TILEDB_UINT64) {
            uint64_t low = static_cast<uint64_t>(info[3].As<Napi::Number>().DoubleValue());
            uint64_t high = static_cast<uint64_t>(info[4].As<Napi::Number>().DoubleValue());
            uint64_t extent = static_cast<uint64_t>(info[5].As<Napi::Number>().DoubleValue());
            std::array<uint64_t, 2> domain = {{low, high}};
            this->dim_ = new tiledb::Dimension(
                tiledb::Dimension::create<uint64_t>(ctx_wrap->get_context(), name, domain, extent)
            );
        } else {
            Napi::TypeError::New(env, "Unsupported datatype for Dimension: " + type_str)
                .ThrowAsJavaScriptException();
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

DimensionWrapper::~DimensionWrapper() {
    if (this->dim_ != nullptr) {
        delete this->dim_;
        this->dim_ = nullptr;
    }
}

tiledb::Dimension& DimensionWrapper::get_dimension() {
    return *this->dim_;
}

Napi::Value DimensionWrapper::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->dim_->name());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DimensionWrapper::GetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, datatype_to_string(this->dim_->type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DimensionWrapper::GetDomain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->dim_->domain_to_str());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DimensionWrapper::GetTileExtent(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->dim_->tile_extent_to_str());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DimensionWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->dim_ != nullptr) {
        delete this->dim_;
        this->dim_ = nullptr;
    }
    return info.Env().Undefined();
}
