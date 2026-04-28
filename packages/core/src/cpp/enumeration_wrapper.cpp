#include "enumeration_wrapper.h"
#include "context_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference EnumerationWrapper::constructor;

Napi::Object EnumerationWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Enumeration", {
        InstanceMethod("name", &EnumerationWrapper::Name),
        InstanceMethod("type", &EnumerationWrapper::Type),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    Napi::Object obj = Napi::Object::New(env);
    obj.Set("create", Napi::Function::New(env, EnumerationWrapper::Create));
    exports.Set("Enumeration", obj); // Export static factories + class prototype mapped via constructor manually in ts if needed, or we just pass the wrapper

    // Better: We just export the class and attach static methods
    func.Set("create", Napi::Function::New(env, EnumerationWrapper::Create));
    exports.Set("Enumeration", func);

    return exports;
}

EnumerationWrapper::EnumerationWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<EnumerationWrapper>(info) {
}

EnumerationWrapper::~EnumerationWrapper() {}

tiledb::Enumeration EnumerationWrapper::get_enumeration() const {
    return *enumeration_;
}

// factory: Enumeration.create(ctx, name, datatype, valuesArray)
Napi::Value EnumerationWrapper::Create(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 4 || !info[0].IsObject() || !info[1].IsString() || !info[2].IsString() || !info[3].IsArray()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string name, string datatype, Array values)").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string name = info[1].As<Napi::String>().Utf8Value();
        tiledb_datatype_t type = parse_datatype(info[2].As<Napi::String>().Utf8Value());
        Napi::Array values = info[3].As<Napi::Array>();
        uint32_t len = values.Length();

        tiledb::Enumeration enmr = tiledb::Enumeration::create_empty(ctx_wrap->get_context(), name, type, tiledb_datatype_size(type));

        if (type == TILEDB_STRING_ASCII || type == TILEDB_STRING_UTF8 || type == TILEDB_CHAR) {
            std::vector<std::string> str_vals;
            str_vals.reserve(len);
            for (uint32_t i = 0; i < len; i++) {
                str_vals.push_back(values.Get(i).As<Napi::String>().Utf8Value());
            }
            enmr = tiledb::Enumeration::create(ctx_wrap->get_context(), name, str_vals);
        } else if (type == TILEDB_INT32) {
            std::vector<int32_t> int_vals;
            int_vals.reserve(len);
            for (uint32_t i = 0; i < len; i++) {
                int_vals.push_back(values.Get(i).As<Napi::Number>().Int32Value());
            }
            enmr = tiledb::Enumeration::create(ctx_wrap->get_context(), name, int_vals);
        } else if (type == TILEDB_FLOAT64) {
            std::vector<double> dbl_vals;
            dbl_vals.reserve(len);
            for (uint32_t i = 0; i < len; i++) {
                dbl_vals.push_back(values.Get(i).As<Napi::Number>().DoubleValue());
            }
            enmr = tiledb::Enumeration::create(ctx_wrap->get_context(), name, dbl_vals);
        } else {
            Napi::TypeError::New(env, "Unsupported datatype for JS wrapper enumeration creation").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Object obj = constructor.New({});
        EnumerationWrapper* wrap = Napi::ObjectWrap<EnumerationWrapper>::Unwrap(obj);
        wrap->enumeration_ = std::make_unique<tiledb::Enumeration>(enmr);
        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value EnumerationWrapper::Name(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, enumeration_->name());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value EnumerationWrapper::Type(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        auto t = enumeration_->type();
        return Napi::Number::New(env, static_cast<double>(t));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}
