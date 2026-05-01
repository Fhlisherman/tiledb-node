#pragma once

#include <napi.h>
#include <tiledb/tiledb>

class FilterListWrapper : public Napi::ObjectWrap<FilterListWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Object NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::FilterList filter_list);
    FilterListWrapper(const Napi::CallbackInfo& info);
    ~FilterListWrapper();

    tiledb::FilterList& get_filter_list();

private:
    static Napi::FunctionReference constructor;

    Napi::Value AddFilter(const Napi::CallbackInfo& info);
    Napi::Value SetChunkSize(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);

    tiledb::FilterList* filter_list_ = nullptr;
};
