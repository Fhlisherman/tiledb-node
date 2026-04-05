#include "array_wrapper.h"
#include "context_wrapper.h"
#include "array_schema_wrapper.h"

Napi::FunctionReference ArrayWrapper::constructor;

static tiledb_query_type_t parse_query_type(const std::string& type_str) {
    if (type_str == "READ") return TILEDB_READ;
    if (type_str == "WRITE") return TILEDB_WRITE;
    if (type_str == "DELETE") return TILEDB_DELETE;
    if (type_str == "MODIFY_EXCLUSIVE") return TILEDB_MODIFY_EXCLUSIVE;
    throw std::invalid_argument("Unknown query type: " + type_str + ". Use 'READ', 'WRITE', 'DELETE', or 'MODIFY_EXCLUSIVE'.");
}

static std::string query_type_to_string(tiledb_query_type_t type) {
    switch (type) {
        case TILEDB_READ: return "READ";
        case TILEDB_WRITE: return "WRITE";
        case TILEDB_DELETE: return "DELETE";
        case TILEDB_MODIFY_EXCLUSIVE: return "MODIFY_EXCLUSIVE";
        default: return "UNKNOWN";
    }
}

Napi::Object ArrayWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Array", {
        StaticMethod("create", &ArrayWrapper::Create),
        InstanceMethod("open", &ArrayWrapper::Open),
        InstanceMethod("close", &ArrayWrapper::Close),
        InstanceMethod("queryType", &ArrayWrapper::GetQueryType),
        InstanceMethod("uri", &ArrayWrapper::GetUri),
        InstanceMethod("isOpen", &ArrayWrapper::IsOpen),
        InstanceMethod("schema", &ArrayWrapper::GetSchema)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Array", func);
    return exports;
}

// Static method: Array.create(ctx, uri, schema)
Napi::Value ArrayWrapper::Create(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string uri, ArraySchema schema)")
            .ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string uri = info[0].As<Napi::String>().Utf8Value();
        ArraySchemaWrapper* schema_wrap = Napi::ObjectWrap<ArraySchemaWrapper>::Unwrap(info[1].As<Napi::Object>());
        
        tiledb::Array::create(uri, schema_wrap->get_schema());
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

// Constructor: new Array(ctx, uri, queryType)
// OR: new Array(ctx, uri) — defaults to closed/uninitialized for later open()
ArrayWrapper::ArrayWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ArrayWrapper>(info) {
    Napi::Env env = info.Env();
    this->array_ = nullptr;
    this->ctx_ref_ = nullptr;

    if (info.Length() < 2 || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri[, string queryType])")
            .ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        this->ctx_ref_ = &ctx_wrap->get_context();

        if (info.Length() >= 3 && info[2].IsString()) {
            std::string type_str = info[2].As<Napi::String>().Utf8Value();
            tiledb_query_type_t query_type = parse_query_type(type_str);
            this->array_ = new tiledb::Array(*this->ctx_ref_, uri, query_type);
        } else {
            // Open for reading by default
            this->array_ = new tiledb::Array(*this->ctx_ref_, uri, TILEDB_READ);
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ArrayWrapper::~ArrayWrapper() {
    if (this->array_ != nullptr) {
        try {
            if (this->array_->is_open()) {
                this->array_->close();
            }
        } catch (...) {}
        delete this->array_;
        this->array_ = nullptr;
    }
}

Napi::Value ArrayWrapper::Open(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string queryType)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        std::string type_str = info[0].As<Napi::String>().Utf8Value();
        tiledb_query_type_t query_type = parse_query_type(type_str);
        this->array_->open(query_type);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArrayWrapper::Close(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        if (this->array_ != nullptr && this->array_->is_open()) {
            this->array_->close();
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArrayWrapper::GetQueryType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, query_type_to_string(this->array_->query_type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::GetUri(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->array_->uri());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::IsOpen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Boolean::New(env, this->array_->is_open());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
}

Napi::Value ArrayWrapper::GetSchema(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::ArraySchema schema = this->array_->schema();
        
        Napi::Object result = Napi::Object::New(env);
        result.Set("arrayType", Napi::String::New(env,
            schema.array_type() == TILEDB_DENSE ? "DENSE" : "SPARSE"));
        result.Set("capacity", Napi::Number::New(env, static_cast<double>(schema.capacity())));
        result.Set("attributeCount", Napi::Number::New(env, static_cast<double>(schema.attribute_num())));
        
        // Get domain info
        tiledb::Domain domain = schema.domain();
        Napi::Object domain_obj = Napi::Object::New(env);
        domain_obj.Set("ndim", Napi::Number::New(env, static_cast<double>(domain.ndim())));
        
        auto dims = domain.dimensions();
        Napi::Array dims_arr = Napi::Array::New(env, dims.size());
        for (size_t i = 0; i < dims.size(); i++) {
            Napi::Object dim_info = Napi::Object::New(env);
            dim_info.Set("name", Napi::String::New(env, dims[i].name()));
            dims_arr.Set(i, dim_info);
        }
        domain_obj.Set("dimensions", dims_arr);
        result.Set("domain", domain_obj);
        
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}
