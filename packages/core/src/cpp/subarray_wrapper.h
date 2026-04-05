#ifndef TILEDB_NODE_SUBARRAY_WRAPPER_H
#define TILEDB_NODE_SUBARRAY_WRAPPER_H

#include <napi.h>
#include <tiledb/tiledb>
#include "context_wrapper.h"
#include "array_wrapper.h"

class SubarrayWrapper : public Napi::ObjectWrap<SubarrayWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    SubarrayWrapper(const Napi::CallbackInfo& info);
    ~SubarrayWrapper();

    static Napi::FunctionReference constructor;
    
    tiledb::Subarray& get_subarray() { return *subarray_; }

private:
    Napi::Value AddRange(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Subarray* subarray_;
};

#endif
