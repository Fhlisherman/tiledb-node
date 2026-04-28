#include "group_wrapper.h"
#include "context_wrapper.h"
#include "config_wrapper.h"
#include "enum_helpers.h"
#include "metadata_helpers.h"

Napi::FunctionReference GroupWrapper::constructor;

static tiledb_query_type_t get_query_type(const std::string& type_str) {
    if (type_str == "READ") return TILEDB_READ;
    if (type_str == "WRITE") return TILEDB_WRITE;
    if (type_str == "DELETE") return TILEDB_DELETE;
    if (type_str == "UPDATE") return TILEDB_UPDATE;
    if (type_str == "MODIFY_EXCLUSIVE") return TILEDB_MODIFY_EXCLUSIVE;
    throw std::invalid_argument("Unknown query type: " + type_str);
}

static std::string query_type_to_str(tiledb_query_type_t type) {
    switch (type) {
        case TILEDB_READ: return "READ";
        case TILEDB_WRITE: return "WRITE";
        case TILEDB_DELETE: return "DELETE";
        case TILEDB_UPDATE: return "UPDATE";
        case TILEDB_MODIFY_EXCLUSIVE: return "MODIFY_EXCLUSIVE";
        default: return "UNKNOWN";
    }
}

Napi::Object GroupWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Group", {
        StaticMethod("create", &GroupWrapper::Create),
        StaticMethod("consolidate", &GroupWrapper::Consolidate),
        StaticMethod("vacuum", &GroupWrapper::Vacuum),
        InstanceMethod("open", &GroupWrapper::Open),
        InstanceMethod("close", &GroupWrapper::Close),
        InstanceMethod("isOpen", &GroupWrapper::IsOpen),
        InstanceMethod("uri", &GroupWrapper::GetUri),
        InstanceMethod("queryType", &GroupWrapper::GetQueryType),
        InstanceMethod("addMember", &GroupWrapper::AddMember),
        InstanceMethod("removeMember", &GroupWrapper::RemoveMember),
        InstanceMethod("getMemberCount", &GroupWrapper::GetMemberCount),
        InstanceMethod("getMemberByIndex", &GroupWrapper::GetMemberByIndex),
        InstanceMethod("putMetadata", &GroupWrapper::PutMetadata),
        InstanceMethod("getMetadata", &GroupWrapper::GetMetadata),
        InstanceMethod("deleteMetadata", &GroupWrapper::DeleteMetadata),
        InstanceMethod("getMetadataNum", &GroupWrapper::GetMetadataNum),
        InstanceMethod("getMetadataByIndex", &GroupWrapper::GetMetadataByIndex)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Group", func);
    return exports;
}

Napi::Value GroupWrapper::Create(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        tiledb::Group::create(ctx_wrap->get_context(), uri);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::Consolidate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri[, Config config])").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        
        tiledb::Config* config = nullptr;
        if (info.Length() >= 3 && info[2].IsObject()) {
            ConfigWrapper* config_wrap = Napi::ObjectWrap<ConfigWrapper>::Unwrap(info[2].As<Napi::Object>());
            config = &config_wrap->get_config();
        }
        
        tiledb::Group::consolidate_metadata(ctx_wrap->get_context(), uri, config);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::Vacuum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri[, Config config])").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        
        tiledb::Config* config = nullptr;
        if (info.Length() >= 3 && info[2].IsObject()) {
            ConfigWrapper* config_wrap = Napi::ObjectWrap<ConfigWrapper>::Unwrap(info[2].As<Napi::Object>());
            config = &config_wrap->get_config();
        }
        
        tiledb::Group::vacuum_metadata(ctx_wrap->get_context(), uri, config);
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

GroupWrapper::GroupWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<GroupWrapper>(info) {
    Napi::Env env = info.Env();
    this->group_ = nullptr;
    this->ctx_ref_ = nullptr;

    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string uri[, string queryType])").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string uri = info[1].As<Napi::String>().Utf8Value();
        this->ctx_ref_ = &ctx_wrap->get_context();

        tiledb_query_type_t query_type = TILEDB_READ;
        if (info.Length() >= 3 && info[2].IsString()) {
            query_type = get_query_type(info[2].As<Napi::String>().Utf8Value());
        }

        this->group_ = new tiledb::Group(*this->ctx_ref_, uri, query_type);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

GroupWrapper::~GroupWrapper() {
    if (this->group_ != nullptr) {
        try {
            if (this->group_->is_open()) {
                this->group_->close();
            }
        } catch (const std::exception& e) {
            std::cerr << "Warning: Failed to close TileDB Group in destructor: " << e.what() << std::endl;
        } catch (...) {
            std::cerr << "Warning: Failed to close TileDB Group in destructor due to unknown exception." << std::endl;
        }
        delete this->group_;
        this->group_ = nullptr;
    }
}

Napi::Value GroupWrapper::Open(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string queryType)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        std::string type_str = info[0].As<Napi::String>().Utf8Value();
        tiledb_query_type_t query_type = get_query_type(type_str);
        this->group_->open(query_type);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value GroupWrapper::Close(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        if (this->group_ != nullptr && this->group_->is_open()) {
            this->group_->close();
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value GroupWrapper::IsOpen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Boolean::New(env, this->group_->is_open());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
}

Napi::Value GroupWrapper::GetUri(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, this->group_->uri());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::GetQueryType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, query_type_to_str(this->group_->query_type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

// Membership Methods
Napi::Value GroupWrapper::AddMember(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string uri[, boolean relative[, string name]])").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    try {
        std::string uri = info[0].As<Napi::String>().Utf8Value();
        bool relative = false;
        std::string name = "";

        if (info.Length() >= 2 && info[1].IsBoolean()) {
            relative = info[1].As<Napi::Boolean>().Value();
        }
        if (info.Length() >= 3 && info[2].IsString()) {
            name = info[2].As<Napi::String>().Utf8Value();
            this->group_->add_member(uri, relative, name);
        } else {
            this->group_->add_member(uri, relative);
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value GroupWrapper::RemoveMember(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string name_or_uri)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        this->group_->remove_member(info[0].As<Napi::String>().Utf8Value());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value GroupWrapper::GetMemberCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->group_->member_count()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::GetMemberByIndex(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected (number index)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        uint64_t index = info[0].As<Napi::Number>().Int64Value();
        tiledb::Object obj = this->group_->member(index);
        
        Napi::Object result = Napi::Object::New(env);
        result.Set("uri", Napi::String::New(env, obj.uri()));
        
        std::string type_str = "UNKNOWN";
        if (obj.type() == tiledb::Object::Type::Array) type_str = "ARRAY";
        else if (obj.type() == tiledb::Object::Type::Group) type_str = "GROUP";
        else type_str = "INVALID";
        
        result.Set("type", Napi::String::New(env, type_str));
        
        if (obj.name().has_value()) {
            result.Set("name", Napi::String::New(env, obj.name().value()));
        } else {
            result.Set("name", env.Null());
        }
        
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

// Metadata Methods
Napi::Value GroupWrapper::PutMetadata(const Napi::CallbackInfo& info) {
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
                this->group_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_FLOAT64: {
                double v = val.As<Napi::Number>().DoubleValue();
                this->group_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_FLOAT32: {
                float v = val.As<Napi::Number>().FloatValue();
                this->group_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_INT64: {
                bool lossless;
                int64_t v = val.As<Napi::BigInt>().Int64Value(&lossless);
                if (!lossless) {
                    Napi::RangeError::New(env, "BigInt value exceeds int64 range").ThrowAsJavaScriptException();
                    return env.Undefined();
                }
                this->group_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_UINT64: {
                bool lossless;
                uint64_t v = val.As<Napi::BigInt>().Uint64Value(&lossless);
                if (!lossless) {
                    Napi::RangeError::New(env, "BigInt value exceeds uint64 range").ThrowAsJavaScriptException();
                    return env.Undefined();
                }
                this->group_->put_metadata(key, type, 1, &v);
                break;
            }
            case TILEDB_INT8: {
                 int8_t v = static_cast<int8_t>(val.As<Napi::Number>().Int32Value());
                 this->group_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT8: {
                 uint8_t v = static_cast<uint8_t>(val.As<Napi::Number>().Uint32Value());
                 this->group_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_INT16: {
                 int16_t v = static_cast<int16_t>(val.As<Napi::Number>().Int32Value());
                 this->group_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT16: {
                 uint16_t v = static_cast<uint16_t>(val.As<Napi::Number>().Uint32Value());
                 this->group_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_UINT32: {
                 uint32_t v = val.As<Napi::Number>().Uint32Value();
                 this->group_->put_metadata(key, type, 1, &v);
                 break;
            }
            case TILEDB_STRING_UTF8:
            case TILEDB_STRING_ASCII:
            case TILEDB_CHAR: {
                std::string v = val.As<Napi::String>().Utf8Value();
                this->group_->put_metadata(key, type, static_cast<uint32_t>(v.size()), v.c_str());
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


Napi::Value GroupWrapper::GetMetadata(const Napi::CallbackInfo& info) {
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
        this->group_->get_metadata(key, &type, &value_num, &value);
        return convert_metadata_to_napi(env, type, value_num, value);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::DeleteMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string key)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string key = info[0].As<Napi::String>().Utf8Value();
        this->group_->delete_metadata(key);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value GroupWrapper::GetMetadataNum(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->group_->metadata_num()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value GroupWrapper::GetMetadataByIndex(const Napi::CallbackInfo& info) {
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
        this->group_->get_metadata_from_index(index, &key, &type, &value_num, &value);

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
