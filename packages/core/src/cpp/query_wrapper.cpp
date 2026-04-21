#include "query_wrapper.h"
#include "enum_helpers.h"
#include <tiledb/tiledb_experimental>

Napi::FunctionReference QueryWrapper::constructor;

Napi::Object QueryWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Query", {
        InstanceMethod("setLayout", &QueryWrapper::SetLayout),
        InstanceMethod("setSubarray", &QueryWrapper::SetSubarray),
        InstanceMethod("setCondition", &QueryWrapper::SetCondition),
        InstanceMethod("setDataBuffer", &QueryWrapper::SetDataBuffer),
        InstanceMethod("setOffsetsBuffer", &QueryWrapper::SetOffsetsBuffer),
        InstanceMethod("setValidityBuffer", &QueryWrapper::SetValidityBuffer),
        InstanceMethod("addUpdateValue", &QueryWrapper::AddUpdateValue),
        InstanceMethod("submit", &QueryWrapper::Submit),
        InstanceMethod("submitAsync", &QueryWrapper::SubmitAsync),
        InstanceMethod("queryStatus", &QueryWrapper::QueryStatus),
        InstanceMethod("resultBufferElements", &QueryWrapper::ResultBufferElements),
        InstanceMethod("close", &QueryWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Query", func);
    return exports;
}

QueryWrapper::QueryWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<QueryWrapper>(info), query_(nullptr) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, Array array, string queryType)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        ArrayWrapper* array_wrap = Napi::ObjectWrap<ArrayWrapper>::Unwrap(info[1].As<Napi::Object>());
        std::string queryTypeStr = info[2].As<Napi::String>().Utf8Value();
        tiledb_query_type_t qt = parse_query_type(queryTypeStr);

        this->query_ = new tiledb::Query(ctx_wrap->get_context(), array_wrap->get_array(), qt);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

QueryWrapper::~QueryWrapper() {
    if (this->query_ != nullptr) {
        delete this->query_;
        this->query_ = nullptr;
    }
    // Cleanup pinned buffers
    for(auto& kv : pinned_buffers_) {
        kv.second.Reset();
    }
    pinned_buffers_.clear();
}

Napi::Value QueryWrapper::SetLayout(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string layout").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string reqLayout = info[0].As<Napi::String>().Utf8Value();
        tiledb_layout_t layout = parse_layout(reqLayout);
        this->query_->set_layout(layout);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::SetSubarray(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Subarray object").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        SubarrayWrapper* sub_wrap = Napi::ObjectWrap<SubarrayWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->query_->set_subarray(sub_wrap->get_subarray());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::SetCondition(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (QueryCondition condition)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        QueryConditionWrapper* cond_wrap = Napi::ObjectWrap<QueryConditionWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->query_->set_condition(cond_wrap->get_condition());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::SetDataBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsTypedArray()) {
        Napi::TypeError::New(env, "Expected (string attribute, TypedArray buffer)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string attr = info[0].As<Napi::String>().Utf8Value();
        Napi::TypedArray typed_array = info[1].As<Napi::TypedArray>();

        // Pin the TypedArray buffer to prevent V8 from garbage collecting it while the query is running/open.
        // N-API TypedArrays inherently map directly to the v8 isolates data pointer.
        pinned_buffers_["data_" + attr] = Napi::Persistent(info[1]);

        void* buffer_data = typed_array.ArrayBuffer().Data();
        size_t byte_offset = typed_array.ByteOffset();
        void* final_ptr = static_cast<char*>(buffer_data) + byte_offset;
        
        uint64_t num_elements = typed_array.ElementLength();

        this->query_->set_data_buffer(attr, final_ptr, num_elements);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::SetOffsetsBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsTypedArray()) {
        Napi::TypeError::New(env, "Expected (string attribute, BigUint64Array buffer)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string attr = info[0].As<Napi::String>().Utf8Value();
        Napi::TypedArray typed_array = info[1].As<Napi::TypedArray>();

        if (typed_array.TypedArrayType() != napi_bigint64_array && typed_array.TypedArrayType() != napi_biguint64_array) {
           Napi::TypeError::New(env, "Offsets buffer must be a BigUint64Array or BigInt64Array").ThrowAsJavaScriptException();
           return env.Undefined();
        }

        pinned_buffers_["offsets_" + attr] = Napi::Persistent(info[1]);

        void* buffer_data = typed_array.ArrayBuffer().Data();
        size_t byte_offset = typed_array.ByteOffset();
        uint64_t* final_ptr = reinterpret_cast<uint64_t*>(static_cast<char*>(buffer_data) + byte_offset);
        
        uint64_t num_elements = typed_array.ElementLength();

        this->query_->set_offsets_buffer(attr, final_ptr, num_elements);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::SetValidityBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsTypedArray()) {
        Napi::TypeError::New(env, "Expected (string attribute, Uint8Array buffer)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string attr = info[0].As<Napi::String>().Utf8Value();
        Napi::TypedArray typed_array = info[1].As<Napi::TypedArray>();

        if (typed_array.TypedArrayType() != napi_uint8_array) {
           Napi::TypeError::New(env, "Validity buffer must be a Uint8Array").ThrowAsJavaScriptException();
           return env.Undefined();
        }

        pinned_buffers_["validity_" + attr] = Napi::Persistent(info[1]);

        void* buffer_data = typed_array.ArrayBuffer().Data();
        size_t byte_offset = typed_array.ByteOffset();
        uint8_t* final_ptr = reinterpret_cast<uint8_t*>(static_cast<char*>(buffer_data) + byte_offset);
        
        uint64_t num_elements = typed_array.ElementLength();

        this->query_->set_validity_buffer(attr, final_ptr, num_elements);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::AddUpdateValue(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (string attribute, value, string datatype)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string attr = info[0].As<Napi::String>().Utf8Value();
        tiledb_datatype_t type = parse_datatype(info[2].As<Napi::String>().Utf8Value());
        Napi::Value val = info[1];
        
        switch (type) {
            case TILEDB_INT32: {
                int32_t v = val.As<Napi::Number>().Int32Value();
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(int32_t));
                break;
            }
            case TILEDB_FLOAT64: {
                double v = val.As<Napi::Number>().DoubleValue();
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(double));
                break;
            }
            case TILEDB_FLOAT32: {
                float v = val.As<Napi::Number>().FloatValue();
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(float));
                break;
            }
            case TILEDB_INT64: {
                bool lossless;
                int64_t v = val.As<Napi::BigInt>().Int64Value(&lossless);
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(int64_t));
                break;
            }
            case TILEDB_UINT64: {
                bool lossless;
                uint64_t v = val.As<Napi::BigInt>().Uint64Value(&lossless);
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(uint64_t));
                break;
            }
            case TILEDB_INT8: {
                 int8_t v = static_cast<int8_t>(val.As<Napi::Number>().Int32Value());
                 tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(int8_t));
                 break;
            }
            case TILEDB_UINT8: {
                 uint8_t v = static_cast<uint8_t>(val.As<Napi::Number>().Uint32Value());
                 tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(uint8_t));
                 break;
            }
            case TILEDB_INT16: {
                 int16_t v = static_cast<int16_t>(val.As<Napi::Number>().Int32Value());
                 tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(int16_t));
                 break;
            }
            case TILEDB_UINT16: {
                 uint16_t v = static_cast<uint16_t>(val.As<Napi::Number>().Uint32Value());
                 tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(uint16_t));
                 break;
            }
            case TILEDB_UINT32: {
                 uint32_t v = val.As<Napi::Number>().Uint32Value();
                 tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), &v, 1 * sizeof(uint32_t));
                 break;
            }
            case TILEDB_STRING_UTF8:
            case TILEDB_STRING_ASCII:
            case TILEDB_CHAR: {
                std::string v = val.As<Napi::String>().Utf8Value();
                tiledb::QueryExperimental::add_update_value_to_query(this->query_->ctx(), *this->query_, attr.c_str(), v.c_str(), v.size());
                break;
            }
            default:
                Napi::Error::New(env, "Unsupported update value type in wrapper").ThrowAsJavaScriptException();
        }

    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::Submit(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::Query::Status s = this->query_->submit();
        
        switch (s) {
            case tiledb::Query::Status::FAILED: return Napi::String::New(env, "FAILED");
            case tiledb::Query::Status::COMPLETE: return Napi::String::New(env, "COMPLETE");
            case tiledb::Query::Status::INPROGRESS: return Napi::String::New(env, "INPROGRESS");
            case tiledb::Query::Status::INCOMPLETE: return Napi::String::New(env, "INCOMPLETE");
            case tiledb::Query::Status::UNINITIALIZED: return Napi::String::New(env, "UNINITIALIZED");
            case tiledb::Query::Status::INITIALIZED: return Napi::String::New(env, "INITIALIZED");
            default: return Napi::String::New(env, "UNKNOWN");
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return Napi::String::New(env, "COMPLETE");
}

class QueryAsyncWorker : public Napi::AsyncWorker {
public:
    QueryAsyncWorker(Napi::Env& env, tiledb::Query* query)
        : Napi::AsyncWorker(env), query_(query), deferred_(Napi::Promise::Deferred::New(env)) {}

    ~QueryAsyncWorker() {}

    void Execute() override {
        try {
            if (query_->submit() != tiledb::Query::Status::COMPLETE) {
                SetError("Query did not complete normally or was INCOMPLETE.");
            }
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        deferred_.Resolve(Napi::String::New(Env(), "COMPLETE"));
    }

    void OnError(const Napi::Error& e) override {
        Napi::HandleScope scope(Env());
        deferred_.Reject(e.Value());
    }

    Napi::Promise GetPromise() {
        return deferred_.Promise();
    }

private:
    tiledb::Query* query_;
    Napi::Promise::Deferred deferred_;
};

Napi::Value QueryWrapper::SubmitAsync(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    QueryAsyncWorker* worker = new QueryAsyncWorker(env, this->query_);
    worker->Queue();
    return worker->GetPromise();
}

Napi::Value QueryWrapper::QueryStatus(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::Query::Status s = this->query_->query_status();
        switch (s) {
            case tiledb::Query::Status::FAILED: return Napi::String::New(env, "FAILED");
            case tiledb::Query::Status::COMPLETE: return Napi::String::New(env, "COMPLETE");
            case tiledb::Query::Status::INPROGRESS: return Napi::String::New(env, "INPROGRESS");
            case tiledb::Query::Status::INCOMPLETE: return Napi::String::New(env, "INCOMPLETE");
            case tiledb::Query::Status::UNINITIALIZED: return Napi::String::New(env, "UNINITIALIZED");
            case tiledb::Query::Status::INITIALIZED: return Napi::String::New(env, "INITIALIZED");
            default: return Napi::String::New(env, "UNKNOWN");
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::ResultBufferElements(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        auto result_el = this->query_->result_buffer_elements();
        Napi::Object obj = Napi::Object::New(env);
        for (const auto& kv : result_el) {
            Napi::Object pair = Napi::Object::New(env);
            pair.Set("first", Napi::Number::New(env, kv.second.first));
            pair.Set("second", Napi::Number::New(env, kv.second.second));
            obj.Set(kv.first, pair);
        }
        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->query_ != nullptr) {
        delete this->query_;
        this->query_ = nullptr;
    }
    for(auto& kv : pinned_buffers_) {
        kv.second.Reset();
    }
    pinned_buffers_.clear();
    return info.Env().Undefined();
}
