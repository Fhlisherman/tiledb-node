#ifndef TILEDB_NODE_QUERY_CONDITION_WRAPPER_H
#define TILEDB_NODE_QUERY_CONDITION_WRAPPER_H

#include <napi.h>
#include <tiledb/tiledb>
#include "context_wrapper.h"

class QueryConditionWrapper : public Napi::ObjectWrap<QueryConditionWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    QueryConditionWrapper(const Napi::CallbackInfo& info);
    ~QueryConditionWrapper();

    static Napi::FunctionReference constructor;

    tiledb::QueryCondition& get_condition() { return *condition_; }
    void set_condition(tiledb::QueryCondition& cond) {
        if (this->condition_ != nullptr) {
            delete this->condition_;
        }
        this->condition_ = new tiledb::QueryCondition(cond);
    }

private:
    Napi::Value InitCondition(const Napi::CallbackInfo& info);
    Napi::Value Combine(const Napi::CallbackInfo& info);
    Napi::Value Negate(const Napi::CallbackInfo& info);

    tiledb::QueryCondition* condition_;
    ContextWrapper* ctx_ref_;
};

#endif
