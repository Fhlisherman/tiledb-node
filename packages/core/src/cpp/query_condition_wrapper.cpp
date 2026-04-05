#include "query_condition_wrapper.h"
#include "enum_helpers.h"

Napi::FunctionReference QueryConditionWrapper::constructor;

Napi::Object QueryConditionWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "QueryCondition", {
        InstanceMethod("init", &QueryConditionWrapper::InitCondition),
        InstanceMethod("combine", &QueryConditionWrapper::Combine),
        InstanceMethod("negate", &QueryConditionWrapper::Negate)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("QueryCondition", func);
    return exports;
}

QueryConditionWrapper::QueryConditionWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<QueryConditionWrapper>(info), condition_(nullptr), ctx_ref_(nullptr) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected (Context ctx)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ctx_ref_ = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        this->condition_ = new tiledb::QueryCondition(ctx_ref_->get_context());
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

QueryConditionWrapper::~QueryConditionWrapper() {
    if (this->condition_ != nullptr) {
        delete this->condition_;
        this->condition_ = nullptr;
    }
}

Napi::Value QueryConditionWrapper::InitCondition(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsTypedArray() || !info[2].IsString()) {
        Napi::TypeError::New(env, "Expected (string attribute, TypedArray value, string op)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string attribute = info[0].As<Napi::String>().Utf8Value();
        Napi::TypedArray typed_array = info[1].As<Napi::TypedArray>();
        std::string op_str = info[2].As<Napi::String>().Utf8Value();
        
        tiledb_query_condition_op_t op = parse_query_condition_op(op_str);

        void* buffer_data = typed_array.ArrayBuffer().Data();
        size_t byte_offset = typed_array.ByteOffset();
        void* final_ptr = static_cast<char*>(buffer_data) + byte_offset;
        size_t element_byte_length = typed_array.ByteLength();

        this->condition_->init(attribute, final_ptr, element_byte_length, op);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryConditionWrapper::Combine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (QueryCondition qc, string combination_op)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        QueryConditionWrapper* rhs_wrap = Napi::ObjectWrap<QueryConditionWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string comb_op_str = info[1].As<Napi::String>().Utf8Value();
        tiledb_query_condition_combination_op_t comb_op = parse_query_condition_combination_op(comb_op_str);

        tiledb::QueryCondition combined_qc = this->condition_->combine(rhs_wrap->get_condition(), comb_op);
        
        // Create new wrapped JS object
        Napi::Object obj = constructor.New({ info[0].As<Napi::Object>() }); // fake context wrap
        QueryConditionWrapper* combined_wrap = Napi::ObjectWrap<QueryConditionWrapper>::Unwrap(obj);
        combined_wrap->set_condition(combined_qc);

        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value QueryConditionWrapper::Negate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb::QueryCondition negated_qc = this->condition_->negate();
        
        // Instantiate using the fake context wrap pattern 
        // We'll just pass a null stub because we overwrite condition immediately
        Napi::Object obj = constructor.New({ Napi::Object::New(env) }); 
        QueryConditionWrapper* negated_wrap = Napi::ObjectWrap<QueryConditionWrapper>::Unwrap(obj);
        negated_wrap->set_condition(negated_qc);

        return obj;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}
