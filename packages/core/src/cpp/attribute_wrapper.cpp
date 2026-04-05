#include "attribute_wrapper.h"
#include "context_wrapper.h"
#include "filter_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference AttributeWrapper::constructor;

Napi::Object AttributeWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Attribute", {
        InstanceMethod("name", &AttributeWrapper::GetName),
        InstanceMethod("type", &AttributeWrapper::GetType),
        InstanceMethod("cellValNum", &AttributeWrapper::GetCellValNum),
        InstanceMethod("setCellValNum", &AttributeWrapper::SetCellValNum),
        InstanceMethod("setNullable", &AttributeWrapper::SetNullable),
        InstanceMethod("nullable", &AttributeWrapper::GetNullable),
        InstanceMethod("setFilterList", &AttributeWrapper::SetFilterList),
        InstanceMethod("close", &AttributeWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Attribute", func);
    return exports;
}

Napi::Object AttributeWrapper::NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Attribute attr) {
    Napi::Object obj = constructor.New({});
    AttributeWrapper* wrapper = Napi::ObjectWrap<AttributeWrapper>::Unwrap(obj);
    delete wrapper->attr_;
    wrapper->attr_ = new tiledb::Attribute(attr);
    return obj;
}

// Constructor: new Attribute(ctx, name, datatype)
AttributeWrapper::AttributeWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<AttributeWrapper>(info) {
    Napi::Env env = info.Env();

    if (info.Length() == 0) {
        this->attr_ = nullptr;
        return;
    }

    if (info.Length() < 3 || !info[1].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string name, string datatype)")
            .ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string name = info[1].As<Napi::String>().Utf8Value();
        std::string type_str = info[2].As<Napi::String>().Utf8Value();
        tiledb_datatype_t datatype = parse_datatype(type_str);
        this->attr_ = new tiledb::Attribute(ctx_wrap->get_context(), name, datatype);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

AttributeWrapper::~AttributeWrapper() {
    if (this->attr_ != nullptr) {
        delete this->attr_;
        this->attr_ = nullptr;
    }
}

tiledb::Attribute& AttributeWrapper::get_attribute() {
    return *this->attr_;
}

Napi::Value AttributeWrapper::GetName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->attr_->name());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value AttributeWrapper::GetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, datatype_to_string(this->attr_->type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value AttributeWrapper::GetCellValNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->attr_->cell_val_num()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value AttributeWrapper::SetCellValNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected (number cellValNum)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        unsigned num = info[0].As<Napi::Number>().Uint32Value();
        this->attr_->set_cell_val_num(num);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value AttributeWrapper::SetNullable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Expected (boolean nullable)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        bool nullable = info[0].As<Napi::Boolean>().Value();
        this->attr_->set_nullable(nullable);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value AttributeWrapper::GetNullable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Boolean::New(env, this->attr_->nullable());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value AttributeWrapper::SetFilterList(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (FilterList filterList)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        // We accept a native FilterList object
        // For simplicity, we'll add individual filters via separate calls
        Napi::TypeError::New(env, "Use filter list wrapper - not yet wired").ThrowAsJavaScriptException();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value AttributeWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->attr_ != nullptr) {
        delete this->attr_;
        this->attr_ = nullptr;
    }
    return info.Env().Undefined();
}
