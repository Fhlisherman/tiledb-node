#pragma once

#ifndef NAPI_CPP_EXCEPTIONS
#define NAPI_CPP_EXCEPTIONS 1
#endif

#include <napi.h>
#include <tiledb/tiledb>
#include <tiledb/consolidation_plan_experimental.h>
#include <memory>
#include "array_wrapper.h"

class ConsolidationPlanWrapper : public Napi::ObjectWrap<ConsolidationPlanWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    ConsolidationPlanWrapper(const Napi::CallbackInfo& info);
    ~ConsolidationPlanWrapper();

    static Napi::FunctionReference constructor;

private:
    std::unique_ptr<tiledb::ConsolidationPlan> plan_;

    Napi::Value NumNodes(const Napi::CallbackInfo& info);
    Napi::Value NumFragments(const Napi::CallbackInfo& info);
    Napi::Value FragmentUri(const Napi::CallbackInfo& info);
    Napi::Value Dump(const Napi::CallbackInfo& info);
};
