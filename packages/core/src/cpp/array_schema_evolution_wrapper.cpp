#include "array_schema_evolution_wrapper.h"
#include "context_wrapper.h"
#include "attribute_wrapper.h"
#include "enumeration_wrapper.h"

Napi::FunctionReference ArraySchemaEvolutionWrapper::constructor;

Napi::Object ArraySchemaEvolutionWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ArraySchemaEvolution", {
        InstanceMethod("addAttribute", &ArraySchemaEvolutionWrapper::AddAttribute),
        InstanceMethod("dropAttribute", &ArraySchemaEvolutionWrapper::DropAttribute),
        InstanceMethod("addEnumeration", &ArraySchemaEvolutionWrapper::AddEnumeration),
        InstanceMethod("dropEnumeration", &ArraySchemaEvolutionWrapper::DropEnumeration),
        InstanceMethod("extendEnumeration", &ArraySchemaEvolutionWrapper::ExtendEnumeration),
        InstanceMethod("arrayEvolve", &ArraySchemaEvolutionWrapper::ArrayEvolve),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("ArraySchemaEvolution", func);
    return exports;
}

ArraySchemaEvolutionWrapper::ArraySchemaEvolutionWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ArraySchemaEvolutionWrapper>(info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Context object").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        evolution_ = std::make_unique<tiledb::ArraySchemaEvolution>(ctx_wrap->get_context());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ArraySchemaEvolutionWrapper::~ArraySchemaEvolutionWrapper() {}

Napi::Value ArraySchemaEvolutionWrapper::AddAttribute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Attribute object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        AttributeWrapper* attr_wrap = Napi::ObjectWrap<AttributeWrapper>::Unwrap(info[0].As<Napi::Object>());
        evolution_->add_attribute(attr_wrap->get_attribute());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaEvolutionWrapper::DropAttribute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected attribute name string").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        std::string attr_name = info[0].As<Napi::String>().Utf8Value();
        evolution_->drop_attribute(attr_name);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaEvolutionWrapper::AddEnumeration(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Enumeration object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        auto enmr_wrap = Napi::ObjectWrap<EnumerationWrapper>::Unwrap(info[0].As<Napi::Object>());
        evolution_->add_enumeration(enmr_wrap->get_enumeration());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaEvolutionWrapper::DropEnumeration(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected enumeration name string").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        std::string enmr_name = info[0].As<Napi::String>().Utf8Value();
        evolution_->drop_enumeration(enmr_name);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaEvolutionWrapper::ExtendEnumeration(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Enumeration object").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        auto enmr_wrap = Napi::ObjectWrap<EnumerationWrapper>::Unwrap(info[0].As<Napi::Object>());
        evolution_->extend_enumeration(enmr_wrap->get_enumeration());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaEvolutionWrapper::ArrayEvolve(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected array URI string").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        std::string uri = info[0].As<Napi::String>().Utf8Value();
        evolution_->array_evolve(uri);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}
