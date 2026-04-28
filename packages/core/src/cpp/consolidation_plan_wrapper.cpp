#include "consolidation_plan_wrapper.h"
#include "context_wrapper.h"

Napi::FunctionReference ConsolidationPlanWrapper::constructor;

Napi::Object ConsolidationPlanWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "ConsolidationPlan", {
        InstanceMethod("numNodes", &ConsolidationPlanWrapper::NumNodes),
        InstanceMethod("numFragments", &ConsolidationPlanWrapper::NumFragments),
        InstanceMethod("fragmentUri", &ConsolidationPlanWrapper::FragmentUri),
        InstanceMethod("dump", &ConsolidationPlanWrapper::Dump),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("ConsolidationPlan", func);
    return exports;
}

ConsolidationPlanWrapper::ConsolidationPlanWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<ConsolidationPlanWrapper>(info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsObject() || !info[1].IsObject() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Expected (Context ctx, Array array, fragment_size)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        ArrayWrapper* array_wrap = Napi::ObjectWrap<ArrayWrapper>::Unwrap(info[1].As<Napi::Object>());
        uint64_t fragment_size = info[2].As<Napi::Number>().Int64Value();

        plan_ = std::make_unique<tiledb::ConsolidationPlan>(ctx_wrap->get_context(), array_wrap->get_array(), fragment_size);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

ConsolidationPlanWrapper::~ConsolidationPlanWrapper() {}

Napi::Value ConsolidationPlanWrapper::NumNodes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        uint64_t nodes = plan_->num_nodes();
        return Napi::Number::New(env, static_cast<double>(nodes));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value ConsolidationPlanWrapper::NumFragments(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected node index number").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        uint64_t node_idx = info[0].As<Napi::Number>().Int64Value();
        uint64_t num_frags = plan_->num_fragments(node_idx);
        return Napi::Number::New(env, static_cast<double>(num_frags));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value ConsolidationPlanWrapper::FragmentUri(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (node_idx, frag_idx)").ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        uint64_t node_idx = info[0].As<Napi::Number>().Int64Value();
        uint64_t frag_idx = info[1].As<Napi::Number>().Int64Value();
        std::string uri = plan_->fragment_uri(node_idx, frag_idx);
        return Napi::String::New(env, uri);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value ConsolidationPlanWrapper::Dump(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        std::string dumped = plan_->dump();
        return Napi::String::New(env, dumped);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}
