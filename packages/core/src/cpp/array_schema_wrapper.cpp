#include "array_schema_wrapper.h"
#include "context_wrapper.h"
#include "domain_wrapper.h"
#include "attribute_wrapper.h"
#include <sstream>

Napi::FunctionReference ArraySchemaWrapper::constructor;

static tiledb_array_type_t parse_array_type(const std::string& type_str) {
    if (type_str == "DENSE") return TILEDB_DENSE;
    if (type_str == "SPARSE") return TILEDB_SPARSE;
    throw std::invalid_argument("Unknown array type: " + type_str + ". Use 'DENSE' or 'SPARSE'.");
}

static std::string array_type_to_string(tiledb_array_type_t type) {
    switch (type) {
        case TILEDB_DENSE: return "DENSE";
        case TILEDB_SPARSE: return "SPARSE";
        default: return "UNKNOWN";
    }
}

static tiledb_layout_t parse_layout(const std::string& layout_str) {
    if (layout_str == "ROW_MAJOR") return TILEDB_ROW_MAJOR;
    if (layout_str == "COL_MAJOR") return TILEDB_COL_MAJOR;
    if (layout_str == "GLOBAL_ORDER") return TILEDB_GLOBAL_ORDER;
    if (layout_str == "UNORDERED") return TILEDB_UNORDERED;
    if (layout_str == "HILBERT") return TILEDB_HILBERT;
    throw std::invalid_argument("Unknown layout: " + layout_str);
}

Napi::Object ArraySchemaWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ArraySchema", {
        InstanceMethod("setDomain", &ArraySchemaWrapper::SetDomain),
        InstanceMethod("addAttribute", &ArraySchemaWrapper::AddAttribute),
        InstanceMethod("setCellOrder", &ArraySchemaWrapper::SetCellOrder),
        InstanceMethod("setTileOrder", &ArraySchemaWrapper::SetTileOrder),
        InstanceMethod("setCapacity", &ArraySchemaWrapper::SetCapacity),
        InstanceMethod("setAllowsDups", &ArraySchemaWrapper::SetAllowsDups),
        InstanceMethod("check", &ArraySchemaWrapper::Check),
        InstanceMethod("arrayType", &ArraySchemaWrapper::GetArrayType),
        InstanceMethod("attributeCount", &ArraySchemaWrapper::GetAttributeCount),
        InstanceMethod("close", &ArraySchemaWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("ArraySchema", func);
    return exports;
}

// Constructor: new ArraySchema(ctx, arrayType)
// arrayType: "DENSE" or "SPARSE"
ArraySchemaWrapper::ArraySchemaWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ArraySchemaWrapper>(info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (Context ctx, string arrayType)")
            .ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string type_str = info[1].As<Napi::String>().Utf8Value();
        tiledb_array_type_t array_type = parse_array_type(type_str);
        this->schema_ = new tiledb::ArraySchema(ctx_wrap->get_context(), array_type);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ArraySchemaWrapper::~ArraySchemaWrapper() {
    if (this->schema_ != nullptr) {
        delete this->schema_;
        this->schema_ = nullptr;
    }
}

tiledb::ArraySchema& ArraySchemaWrapper::get_schema() {
    return *this->schema_;
}

Napi::Value ArraySchemaWrapper::SetDomain(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (Domain domain)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        DomainWrapper* dom_wrap = Napi::ObjectWrap<DomainWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->schema_->set_domain(dom_wrap->get_domain());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::AddAttribute(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (Attribute attr)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        AttributeWrapper* attr_wrap = Napi::ObjectWrap<AttributeWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->schema_->add_attribute(attr_wrap->get_attribute());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::SetCellOrder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string layout)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        std::string layout_str = info[0].As<Napi::String>().Utf8Value();
        this->schema_->set_cell_order(parse_layout(layout_str));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::SetTileOrder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected (string layout)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        std::string layout_str = info[0].As<Napi::String>().Utf8Value();
        this->schema_->set_tile_order(parse_layout(layout_str));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::SetCapacity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected (number capacity)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        uint64_t capacity = static_cast<uint64_t>(info[0].As<Napi::Number>().DoubleValue());
        this->schema_->set_capacity(capacity);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::SetAllowsDups(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsBoolean()) {
        Napi::TypeError::New(env, "Expected (boolean allowsDups)").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    try {
        bool allows = info[0].As<Napi::Boolean>().Value();
        this->schema_->set_allows_dups(allows);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value ArraySchemaWrapper::Check(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        this->schema_->check();
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
}

Napi::Value ArraySchemaWrapper::GetArrayType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::String::New(env, array_type_to_string(this->schema_->array_type()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArraySchemaWrapper::GetAttributeCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        return Napi::Number::New(env, static_cast<double>(this->schema_->attribute_num()));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value ArraySchemaWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->schema_ != nullptr) {
        delete this->schema_;
        this->schema_ = nullptr;
    }
    return info.Env().Undefined();
}
