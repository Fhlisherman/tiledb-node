#ifndef TILEDB_NODE_QUERY_WRAPPER_H
#define TILEDB_NODE_QUERY_WRAPPER_H

#include <napi.h>
#include <tiledb/tiledb>
#include <vector>
#include "context_wrapper.h"
#include "array_wrapper.h"
#include "subarray_wrapper.h"
#include "query_condition_wrapper.h"

class QueryWrapper : public Napi::ObjectWrap<QueryWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    QueryWrapper(const Napi::CallbackInfo& info);
    ~QueryWrapper();

    static Napi::FunctionReference constructor;

private:
    Napi::Value SetLayout(const Napi::CallbackInfo& info);
    Napi::Value SetSubarray(const Napi::CallbackInfo& info);
    Napi::Value SetCondition(const Napi::CallbackInfo& info);
    Napi::Value SetDataBuffer(const Napi::CallbackInfo& info);
    Napi::Value Submit(const Napi::CallbackInfo& info);
    Napi::Value SubmitAsync(const Napi::CallbackInfo& info);
    Napi::Value QueryStatus(const Napi::CallbackInfo& info);
    Napi::Value ResultBufferElements(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Query* query_;
    std::vector<Napi::Reference<Napi::Value>> pinned_buffers_;
};

#endif
