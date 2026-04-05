#include "domain_wrapper.h"
#include "context_wrapper.h"
#include "dimension_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference DomainWrapper::constructor;

Napi::Object DomainWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Domain", {
        InstanceMethod("addDimension", &DomainWrapper::AddDimension),
        InstanceMethod("type", &DomainWrapper::GetType),
        InstanceMethod("ndim", &DomainWrapper::GetNDim),
        InstanceMethod("dimensions", &DomainWrapper::GetDimensions),
        InstanceMethod("close", &DomainWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Domain", func);
    return exports;
}

Napi::Object DomainWrapper::NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Domain domain) {
    Napi::Object obj = constructor.New({});
    DomainWrapper* wrapper = Napi::ObjectWrap<DomainWrapper>::Unwrap(obj);
    delete wrapper->domain_;
    wrapper->domain_ = new tiledb::Domain(domain);
    return obj;
}

// Constructor: new Domain(ctx)
DomainWrapper::DomainWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<DomainWrapper>(info) {
    Napi::Env env = info.Env();

    if (info.Length() == 0) {
        this->domain_ = nullptr;
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->domain_ = new tiledb::Domain(ctx_wrap->get_context());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

DomainWrapper::~DomainWrapper() {
    if (this->domain_ != nullptr) {
        delete this->domain_;
        this->domain_ = nullptr;
    }
}

tiledb::Domain& DomainWrapper::get_domain() {
    return *this->domain_;
}

Napi::Value DomainWrapper::AddDimension(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (Dimension dim)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        DimensionWrapper* dim_wrap = Napi::ObjectWrap<DimensionWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->domain_->add_dimension(dim_wrap->get_dimension());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value DomainWrapper::GetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, datatype_to_string(this->domain_->type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DomainWrapper::GetNDim(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->domain_->ndim()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DomainWrapper::GetDimensions(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        auto dims = this->domain_->dimensions();
        Napi::Array result = Napi::Array::New(env, dims.size());
        for (size_t i = 0; i < dims.size(); i++) {
            Napi::Object dim_obj = Napi::Object::New(env);
            dim_obj.Set("name", Napi::String::New(env, dims[i].name()));
            dim_obj.Set("type", Napi::String::New(env, datatype_to_string(dims[i].type())));
            dim_obj.Set("domain", Napi::String::New(env, dims[i].domain_to_str()));
            dim_obj.Set("tileExtent", Napi::String::New(env, dims[i].tile_extent_to_str()));
            result.Set(i, dim_obj);
        }
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value DomainWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->domain_ != nullptr) {
        delete this->domain_;
        this->domain_ = nullptr;
    }
    return info.Env().Undefined();
}
