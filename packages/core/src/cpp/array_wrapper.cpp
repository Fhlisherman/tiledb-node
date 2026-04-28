#include "array_wrapper.h"
#include "context_wrapper.h"
#include "config_wrapper.h"
#include "array_schema_wrapper.h"
#include "enum_helpers.h"
#include "metadata_helpers.hpp"
#include <optional>
#include <iostream>

Napi::FunctionReference ArrayWrapper::constructor;

Napi::Object ArrayWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Array", {
        StaticMethod("create", &ArrayWrapper::Create),
        StaticMethod("consolidate", &ArrayWrapper::Consolidate),
        StaticMethod("vacuum", &ArrayWrapper::Vacuum),
        InstanceMethod("open", &ArrayWrapper::Open),
        InstanceMethod("close", &ArrayWrapper::Close),
        InstanceMethod("queryType", &ArrayWrapper::GetQueryType),
        InstanceMethod("uri", &ArrayWrapper::GetUri),
        InstanceMethod("isOpen", &ArrayWrapper::IsOpen),
        InstanceMethod("schema", &ArrayWrapper::GetSchema),
        InstanceMethod("putMetadata", &ArrayWrapper::PutMetadata),
        InstanceMethod("getMetadata", &ArrayWrapper::GetMetadata),
        InstanceMethod("deleteMetadata", &ArrayWrapper::DeleteMetadata),
        InstanceMethod("getMetadataNum", &ArrayWrapper::GetMetadataNum),
        InstanceMethod("getMetadataByIndex", &ArrayWrapper::GetMetadataByIndex)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Array", func);
    return exports;
}

// ──────────────────────────────────────────────────────────────────────────────
// Non-blocking I/O via AsyncWorkers (these ARE the canonical implementations)
// ──────────────────────────────────────────────────────────────────────────────

class ArrayCreateAsyncWorker : public Napi::AsyncWorker {
public:
    ArrayCreateAsyncWorker(Napi::Env& env, std::string uri, tiledb::ArraySchema schema)
        : Napi::AsyncWorker(env), uri_(std::move(uri)), schema_(std::move(schema)),
          deferred_(Napi::Promise::Deferred::New(env)) {}

    void Execute() override {
        try {
            tiledb::Array::create(uri_, schema_);
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        deferred_.Resolve(Napi::Boolean::New(Env(), true));
    }

    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        deferred_.Reject(e.Value());
    }

    Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
    std::string uri_;
    tiledb::ArraySchema schema_;
    Napi::Promise::Deferred deferred_;
};

Napi::Value ArrayWrapper::Create(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString()) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::TypeError::New(env, "Expected (string uri, ArraySchema schema)").Value());
        return d.Promise();
    }
    try {
        std::string uri = info[0].As<Napi::String>().Utf8Value();
        ArraySchemaWrapper* schema_wrap = Napi::ObjectWrap<ArraySchemaWrapper>::Unwrap(info[1].As<Napi::Object>());
        auto* worker = new ArrayCreateAsyncWorker(env, uri, schema_wrap->get_schema());
        worker->Queue();
        return worker->GetPromise();
    } catch (const std::exception& e) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::Error::New(env, e.what()).Value());
        return d.Promise();
    }
}

class ArrayConsolidateAsyncWorker : public Napi::AsyncWorker {
public:
    ArrayConsolidateAsyncWorker(Napi::Env& env, tiledb::Context ctx, std::string uri,
                                std::optional<tiledb::Config> config)
        : Napi::AsyncWorker(env), ctx_(std::move(ctx)), uri_(std::move(uri)), config_(std::move(config)),
          deferred_(Napi::Promise::Deferred::New(env)) {}

    void Execute() override {
        try {
            if (config_) {
                tiledb::Array::consolidate(ctx_, uri_, &config_.value());
            } else {
                tiledb::Array::consolidate(ctx_, uri_);
            }
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        deferred_.Resolve(Env().Undefined());
    }

    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        deferred_.Reject(e.Value());
    }

    Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
    tiledb::Context ctx_;
    std::string uri_;
    std::optional<tiledb::Config> config_;
    Napi::Promise::Deferred deferred_;
};

Napi::Value ArrayWrapper::Consolidate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::TypeError::New(env, "Expected (Context ctx, string uri[, Config config])").Value());
        return d.Promise();
    }
    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        std::optional<tiledb::Config> config;
        if (info.Length() >= 3 && info[2].IsObject()) {
            ConfigWrapper* config_wrap = Napi::ObjectWrap<ConfigWrapper>::Unwrap(info[2].As<Napi::Object>());
            config = config_wrap->get_config();
        }
        auto* worker = new ArrayConsolidateAsyncWorker(env, ctx_wrap->get_context(), uri, std::move(config));
        worker->Queue();
        return worker->GetPromise();
    } catch (const std::exception& e) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::Error::New(env, e.what()).Value());
        return d.Promise();
    }
}

class ArrayVacuumAsyncWorker : public Napi::AsyncWorker {
public:
    ArrayVacuumAsyncWorker(Napi::Env& env, tiledb::Context ctx, std::string uri,
                           std::optional<tiledb::Config> config)
        : Napi::AsyncWorker(env), ctx_(std::move(ctx)), uri_(std::move(uri)), config_(std::move(config)),
          deferred_(Napi::Promise::Deferred::New(env)) {}

    void Execute() override {
        try {
            if (config_) {
                tiledb::Array::vacuum(ctx_, uri_, &config_.value());
            } else {
                tiledb::Array::vacuum(ctx_, uri_);
            }
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        deferred_.Resolve(Env().Undefined());
    }

    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        deferred_.Reject(e.Value());
    }

    Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
    tiledb::Context ctx_;
    std::string uri_;
    std::optional<tiledb::Config> config_;
    Napi::Promise::Deferred deferred_;
};

Napi::Value ArrayWrapper::Vacuum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::TypeError::New(env, "Expected (Context ctx, string uri[, Config config])").Value());
        return d.Promise();
    }
    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        std::optional<tiledb::Config> config;
        if (info.Length() >= 3 && info[2].IsObject()) {
            ConfigWrapper* config_wrap = Napi::ObjectWrap<ConfigWrapper>::Unwrap(info[2].As<Napi::Object>());
            config = config_wrap->get_config();
        }
        auto* worker = new ArrayVacuumAsyncWorker(env, ctx_wrap->get_context(), uri, std::move(config));
        worker->Queue();
        return worker->GetPromise();
    } catch (const std::exception& e) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::Error::New(env, e.what()).Value());
        return d.Promise();
    }
}

class ArrayOpenAsyncWorker : public Napi::AsyncWorker {
public:
    ArrayOpenAsyncWorker(Napi::Env& env, tiledb::Array* array, tiledb_query_type_t query_type)
        : Napi::AsyncWorker(env), array_(array), query_type_(query_type),
          deferred_(Napi::Promise::Deferred::New(env)) {}

    void Execute() override {
        try {
            array_->open(query_type_);
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        deferred_.Resolve(Env().Undefined());
    }

    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        deferred_.Reject(e.Value());
    }

    Napi::Promise GetPromise() { return deferred_.Promise(); }

private:
    tiledb::Array* array_;
    tiledb_query_type_t query_type_;
    Napi::Promise::Deferred deferred_;
};

Napi::Value ArrayWrapper::Open(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::TypeError::New(env, "Expected (string queryType)").Value());
        return d.Promise();
    }
    try {
        std::string type_str = info[0].As<Napi::String>().Utf8Value();
        tiledb_query_type_t query_type = parse_query_type(type_str);
        if (this->array_ == nullptr) {
            this->array_ = new tiledb::Array(*this->ctx_ref_, this->uri_, query_type);
            auto d = Napi::Promise::Deferred::New(env);
            d.Resolve(env.Undefined());
            return d.Promise();
        } else {
            auto* worker = new ArrayOpenAsyncWorker(env, this->array_, query_type);
            worker->Queue();
            return worker->GetPromise();
        }
    } catch (const std::exception& e) {
        auto d = Napi::Promise::Deferred::New(env);
        d.Reject(Napi::Error::New(env, e.what()).Value());
        return d.Promise();
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
        this->uri_ = uri;
        this->ctx_ref_ = &ctx_wrap->get_context();

        if (info.Length() >= 3 && info[2].IsString()) {
            std::string type_str = info[2].As<Napi::String>().Utf8Value();
            tiledb_query_type_t query_type = parse_query_type(type_str);
            this->array_ = new tiledb::Array(*this->ctx_ref_, uri, query_type);
        } else {
            // Delay instantiation until Open is called
            this->array_ = nullptr;
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
        } catch (const std::exception& e) {
            std::cerr << "Warning: Failed to close TileDB Array in destructor: " << e.what() << std::endl;
        } catch (...) {
            std::cerr << "Warning: Failed to close TileDB Array in destructor due to unknown exception." << std::endl;
        }
        delete this->array_;
        this->array_ = nullptr;
    }
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
        if (this->array_ == nullptr) {
            return Napi::String::New(env, "CLOSED");
        }
        return Napi::String::New(env, query_type_to_string(this->array_->query_type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::GetUri(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        if (this->array_ != nullptr) {
            return Napi::String::New(env, this->array_->uri());
        }
        return Napi::String::New(env, this->uri_);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::IsOpen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        if (this->array_ == nullptr) {
            return Napi::Boolean::New(env, false);
        }
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

Napi::Value ArrayWrapper::PutMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (string key, string datatype, value)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        tiledb_datatype_t type = parse_datatype(info[1].As<Napi::String>().Utf8Value());
        Napi::Value val = info[2];

        switch (type) {
            case TILEDB_INT32: {
                int32_t v = val.As<Napi::Number>().Int32Value();
                this->array_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_FLOAT64: {
                double v = val.As<Napi::Number>().DoubleValue();
                this->array_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_FLOAT32: {
                float v = val.As<Napi::Number>().FloatValue();
                this->array_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_INT64: {
                bool lossless;
                int64_t v = val.As<Napi::BigInt>().Int64Value(&lossless);
                if (!lossless) {
                    Napi::RangeError::New(env, "BigInt value exceeds int64 range").ThrowAsJavaScriptException();
                    return env.Undefined();
                }
                this->array_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_UINT64: {
                bool lossless;
                uint64_t v = val.As<Napi::BigInt>().Uint64Value(&lossless);
                if (!lossless) {
                    Napi::RangeError::New(env, "BigInt value exceeds uint64 range").ThrowAsJavaScriptException();
                    return env.Undefined();
                }
                this->array_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_INT8: {
                 int8_t v = static_cast<int8_t>(val.As<Napi::Number>().Int32Value());
                 this->array_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT8: {
                 uint8_t v = static_cast<uint8_t>(val.As<Napi::Number>().Uint32Value());
                 this->array_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_INT16: {
                 int16_t v = static_cast<int16_t>(val.As<Napi::Number>().Int32Value());
                 this->array_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT16: {
                 uint16_t v = static_cast<uint16_t>(val.As<Napi::Number>().Uint32Value());
                 this->array_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT32: {
                 uint32_t v = val.As<Napi::Number>().Uint32Value();
                 this->array_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_STRING_UTF8:
            case TILEDB_STRING_ASCII:
            case TILEDB_CHAR: {
                std::string v = val.As<Napi::String>().Utf8Value();
                this->array_->put_metadata(key, type, static_cast<uint32_t>(v.size()), v.c_str());
                break;
            }
            default:
                Napi::Error::New(env, "Unsupported metadata type").ThrowAsJavaScriptException();
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}



Napi::Value ArrayWrapper::GetMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string key)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        tiledb_datatype_t type;
        uint32_t value_num;
        const void* value;
        this->array_->get_metadata(key, &type, &value_num, &value);
        return convert_metadata_to_napi(env, type, value_num, value);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::DeleteMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string key)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        this->array_->delete_metadata(key);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArrayWrapper::GetMetadataNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->array_->metadata_num()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArrayWrapper::GetMetadataByIndex(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected (number index)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        uint64_t index = info[0].As<Napi::Number>().Int64Value();
        std::string key;
        tiledb_datatype_t type;
        uint32_t value_num;
        const void* value;
        this->array_->get_metadata_from_index(index, &key, &type, &value_num, &value);

        Napi::Object result = Napi::Object::New(env);
        result.Set("key", Napi::String::New(env, key));
        result.Set("type", Napi::String::New(env, datatype_to_string(type)));
        result.Set("value", convert_metadata_to_napi(env, type, value_num, value));
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}
