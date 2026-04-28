#include "object_wrapper.h"
#include "context_wrapper.h"

Napi::FunctionReference ObjectWrapper::constructor;

Napi::Object ObjectWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "TileDBObject", {
        StaticMethod("type", &ObjectWrapper::Type),
        StaticMethod("remove", &ObjectWrapper::Remove),
        StaticMethod("move", &ObjectWrapper::Move),
        StaticMethod("ls", &ObjectWrapper::Ls),
        StaticMethod("walk", &ObjectWrapper::Walk)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("TileDBObject", func);
    return exports;
}

ObjectWrapper::ObjectWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ObjectWrapper>(info) {
    Napi::TypeError::New(info.Env(), "TileDBObject cannot be instantiated").ThrowAsJavaScriptException();
}

ObjectWrapper::~ObjectWrapper() {}

static std::string object_type_to_string(tiledb::Object::Type type) {
    switch (type) {
        case tiledb::Object::Type::Array: return "ARRAY";
        case tiledb::Object::Type::Group: return "GROUP";
        case tiledb::Object::Type::Invalid: return "INVALID";
        default: return "UNKNOWN";
    }
}

Napi::Value ObjectWrapper::Type(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();

        tiledb::Object obj = tiledb::Object::object(ctx_wrap->get_context(), uri);
        return Napi::String::New(env, object_type_to_string(obj.type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ObjectWrapper::Remove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();

        tiledb::Object::remove(ctx_wrap->get_context(), uri);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ObjectWrapper::Move(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string old_uri, string new_uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string old_uri = info[1].As<Napi::String>().Utf8Value();
        std::string new_uri = info[2].As<Napi::String>().Utf8Value();

        tiledb::Object::move(ctx_wrap->get_context(), old_uri, new_uri);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ObjectWrapper::Ls(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();

        Napi::Array results = Napi::Array::New(env);
        uint32_t i = 0;
        
        tiledb::ObjectIter iter(ctx_wrap->get_context(), uri);
        for (const tiledb::Object& obj : iter) {
            Napi::Object item = Napi::Object::New(env);
            item.Set("type", Napi::String::New(env, object_type_to_string(obj.type())));
            item.Set("uri", Napi::String::New(env, obj.uri()));
            results.Set(i++, item);
        }

        return results;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ObjectWrapper::Walk(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri, string order)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        std::string order_str = info[2].As<Napi::String>().Utf8Value();

        tiledb_walk_order_t order = TILEDB_PREORDER;
        if (order_str == "POSTORDER") {
            order = TILEDB_POSTORDER;
        } else if (order_str != "PREORDER") {
            throw std::invalid_argument("Unknown walk order: " + order_str);
        }

        Napi::Array results = Napi::Array::New(env);
        uint32_t i = 0;
        
        tiledb::ObjectIter iter(ctx_wrap->get_context(), uri);
        if (order == TILEDB_PREORDER) {
            iter.set_recursive(tiledb_walk_order_t(TILEDB_PREORDER));
        } else {
            iter.set_recursive(tiledb_walk_order_t(TILEDB_POSTORDER));
        }
        for (const tiledb::Object& obj : iter) {
            Napi::Object item = Napi::Object::New(env);
            item.Set("type", Napi::String::New(env, object_type_to_string(obj.type())));
            item.Set("uri", Napi::String::New(env, obj.uri()));
            results.Set(i++, item);
        }

        return results;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}
