#pragma once

#include <napi.h>
#include <tiledb/tiledb>

class GroupWrapper : public Napi::ObjectWrap<GroupWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    GroupWrapper(const Napi::CallbackInfo& info);
    ~GroupWrapper();

    tiledb::Group& get_group() { return *group_; }

private:
    static Napi::FunctionReference constructor;

    // Static methods
    static Napi::Value Create(const Napi::CallbackInfo& info);
    static Napi::Value Consolidate(const Napi::CallbackInfo& info);
    static Napi::Value Vacuum(const Napi::CallbackInfo& info);

    // Instance methods
    Napi::Value Open(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);
    Napi::Value IsOpen(const Napi::CallbackInfo& info);
    Napi::Value GetUri(const Napi::CallbackInfo& info);
    Napi::Value GetQueryType(const Napi::CallbackInfo& info);

    // Membership
    Napi::Value AddMember(const Napi::CallbackInfo& info);
    Napi::Value RemoveMember(const Napi::CallbackInfo& info);
    Napi::Value GetMemberCount(const Napi::CallbackInfo& info);
    Napi::Value GetMemberByIndex(const Napi::CallbackInfo& info);

    // Metadata Support
    Napi::Value PutMetadata(const Napi::CallbackInfo& info);
    Napi::Value GetMetadata(const Napi::CallbackInfo& info);
    Napi::Value DeleteMetadata(const Napi::CallbackInfo& info);
    Napi::Value GetMetadataNum(const Napi::CallbackInfo& info);
    Napi::Value GetMetadataByIndex(const Napi::CallbackInfo& info);

    tiledb::Group* group_;
    tiledb::Context* ctx_ref_;
};
