#ifndef TILEDB_NODE_QUERY_WRAPPER_H
#define TILEDB_NODE_QUERY_WRAPPER_H

#include <napi.h>
#include <tiledb/tiledb>
#include <unordered_map>
#include <map>
#include <string>
#include <vector>
#include <memory>
#include <tiledb/tiledb_experimental>
#include <list>

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
    Napi::Value SetOffsetsBuffer(const Napi::CallbackInfo& info);
    Napi::Value SetValidityBuffer(const Napi::CallbackInfo& info);
    Napi::Value AddUpdateValue(const Napi::CallbackInfo& info);
    Napi::Value Submit(const Napi::CallbackInfo& info);
    Napi::Value SubmitAsync(const Napi::CallbackInfo& info);
    Napi::Value QueryStatus(const Napi::CallbackInfo& info);
    Napi::Value ResultBufferElements(const Napi::CallbackInfo& info);
    Napi::Value ApplyAggregate(const Napi::CallbackInfo& info);
    Napi::Value Stats(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::Query* query_ = nullptr;
    std::unordered_map<std::string, Napi::Reference<Napi::Value>> pinned_buffers_;
    std::map<std::string, std::unique_ptr<uint64_t>> buff_sizes_;
    std::vector<tiledb::ChannelOperation> pinned_operations_;
    std::list<std::string> pinned_update_values_;
};

#endif
