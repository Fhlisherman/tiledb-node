#pragma once

#include <napi.h>
#include <tiledb/tiledb>
#include <tiledb/vfs.h>
#include <memory>

class VFSWrapper : public Napi::ObjectWrap<VFSWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    VFSWrapper(const Napi::CallbackInfo& info);
    ~VFSWrapper();

private:
    static Napi::FunctionReference constructor;

    std::unique_ptr<tiledb::VFS> vfs_;
    tiledb_vfs_fh_t* fh_ = nullptr;

    Napi::Value CreateBucket(const Napi::CallbackInfo& info);
    Napi::Value RemoveBucket(const Napi::CallbackInfo& info);
    Napi::Value IsBucket(const Napi::CallbackInfo& info);
    Napi::Value EmptyBucket(const Napi::CallbackInfo& info);
    Napi::Value IsEmptyBucket(const Napi::CallbackInfo& info);

    Napi::Value CreateDir(const Napi::CallbackInfo& info);
    Napi::Value IsDir(const Napi::CallbackInfo& info);
    Napi::Value RemoveDir(const Napi::CallbackInfo& info);
    Napi::Value DirSize(const Napi::CallbackInfo& info);

    Napi::Value IsFile(const Napi::CallbackInfo& info);
    Napi::Value RemoveFile(const Napi::CallbackInfo& info);
    Napi::Value FileSize(const Napi::CallbackInfo& info);

    Napi::Value Ls(const Napi::CallbackInfo& info);

    Napi::Value MoveFile(const Napi::CallbackInfo& info);
    Napi::Value MoveDir(const Napi::CallbackInfo& info);
    Napi::Value CopyFile(const Napi::CallbackInfo& info);
    Napi::Value CopyDir(const Napi::CallbackInfo& info);
    Napi::Value Touch(const Napi::CallbackInfo& info);

    Napi::Value Open(const Napi::CallbackInfo& info);
    Napi::Value Read(const Napi::CallbackInfo& info);
    Napi::Value Write(const Napi::CallbackInfo& info);
    Napi::Value Close(const Napi::CallbackInfo& info);
};
