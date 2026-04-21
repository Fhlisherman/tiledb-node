#include "vfs_wrapper.h"
#include "context_wrapper.h"
#include "config_wrapper.h"
#include <string>

Napi::FunctionReference VFSWrapper::constructor;

Napi::Object VFSWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "VFS", {
        InstanceMethod("createBucket", &VFSWrapper::CreateBucket),
        InstanceMethod("removeBucket", &VFSWrapper::RemoveBucket),
        InstanceMethod("isBucket", &VFSWrapper::IsBucket),
        InstanceMethod("emptyBucket", &VFSWrapper::EmptyBucket),
        InstanceMethod("isEmptyBucket", &VFSWrapper::IsEmptyBucket),
        InstanceMethod("createDir", &VFSWrapper::CreateDir),
        InstanceMethod("isDir", &VFSWrapper::IsDir),
        InstanceMethod("removeDir", &VFSWrapper::RemoveDir),
        InstanceMethod("dirSize", &VFSWrapper::DirSize),
        InstanceMethod("isFile", &VFSWrapper::IsFile),
        InstanceMethod("removeFile", &VFSWrapper::RemoveFile),
        InstanceMethod("fileSize", &VFSWrapper::FileSize),
        InstanceMethod("ls", &VFSWrapper::Ls),
        InstanceMethod("moveFile", &VFSWrapper::MoveFile),
        InstanceMethod("moveDir", &VFSWrapper::MoveDir),
        InstanceMethod("copyFile", &VFSWrapper::CopyFile),
        InstanceMethod("copyDir", &VFSWrapper::CopyDir),
        InstanceMethod("touch", &VFSWrapper::Touch),
        InstanceMethod("open", &VFSWrapper::Open),
        InstanceMethod("read", &VFSWrapper::Read),
        InstanceMethod("write", &VFSWrapper::Write),
        InstanceMethod("close", &VFSWrapper::Close),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();
    exports.Set("VFS", func);
    return exports;
}

VFSWrapper::VFSWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<VFSWrapper>(info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected Context object").ThrowAsJavaScriptException();
        return;
    }

    auto ctx_wrapper = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
    
    try {
        if (info.Length() > 1 && !info[1].IsUndefined() && !info[1].IsNull()) {
            if (!info[1].IsObject()) {
                 Napi::TypeError::New(env, "Expected Config object as second argument").ThrowAsJavaScriptException();
                 return;
            }
            auto config_wrapper = Napi::ObjectWrap<ConfigWrapper>::Unwrap(info[1].As<Napi::Object>());
            vfs_ = std::make_unique<tiledb::VFS>(ctx_wrapper->GetContext(), config_wrapper->GetConfig());
        } else {
            vfs_ = std::make_unique<tiledb::VFS>(ctx_wrapper->GetContext());
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

VFSWrapper::~VFSWrapper() {
    if (fh_ != nullptr) {
        try {
            const tiledb::Context& ctx = vfs_->context();
            tiledb_vfs_close(ctx.ptr().get(), fh_);
        } catch (...) {}
        fh_ = nullptr;
    }
}

#define VFS_STRING_METHOD(MethodName, VfsFunc) \
Napi::Value VFSWrapper::MethodName(const Napi::CallbackInfo& info) { \
    Napi::Env env = info.Env(); \
    if (info.Length() < 1 || !info[0].IsString()) { \
        Napi::TypeError::New(env, "Expected uri string").ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
    std::string uri = info[0].As<Napi::String>().Utf8Value(); \
    try { \
        vfs_->VfsFunc(uri); \
    } catch (const std::exception& e) { \
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException(); \
    } \
    return env.Undefined(); \
}

#define VFS_STRING_METHOD_BOOL(MethodName, VfsFunc) \
Napi::Value VFSWrapper::MethodName(const Napi::CallbackInfo& info) { \
    Napi::Env env = info.Env(); \
    if (info.Length() < 1 || !info[0].IsString()) { \
        Napi::TypeError::New(env, "Expected uri string").ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
    std::string uri = info[0].As<Napi::String>().Utf8Value(); \
    try { \
        bool res = vfs_->VfsFunc(uri); \
        return Napi::Boolean::New(env, res); \
    } catch (const std::exception& e) { \
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
}

#define VFS_STRING_METHOD_SIZE(MethodName, VfsFunc) \
Napi::Value VFSWrapper::MethodName(const Napi::CallbackInfo& info) { \
    Napi::Env env = info.Env(); \
    if (info.Length() < 1 || !info[0].IsString()) { \
        Napi::TypeError::New(env, "Expected uri string").ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
    std::string uri = info[0].As<Napi::String>().Utf8Value(); \
    try { \
        uint64_t res = vfs_->VfsFunc(uri); \
        return Napi::Number::New(env, static_cast<double>(res)); \
    } catch (const std::exception& e) { \
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
}

#define VFS_DOUBLE_STRING_METHOD(MethodName, VfsFunc) \
Napi::Value VFSWrapper::MethodName(const Napi::CallbackInfo& info) { \
    Napi::Env env = info.Env(); \
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) { \
        Napi::TypeError::New(env, "Expected 2 uri strings").ThrowAsJavaScriptException(); \
        return env.Null(); \
    } \
    std::string uri1 = info[0].As<Napi::String>().Utf8Value(); \
    std::string uri2 = info[1].As<Napi::String>().Utf8Value(); \
    try { \
        vfs_->VfsFunc(uri1, uri2); \
    } catch (const std::exception& e) { \
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException(); \
    } \
    return env.Undefined(); \
}

VFS_STRING_METHOD(CreateBucket, create_bucket)
VFS_STRING_METHOD(RemoveBucket, remove_bucket)
VFS_STRING_METHOD_BOOL(IsBucket, is_bucket)
VFS_STRING_METHOD(EmptyBucket, empty_bucket)
VFS_STRING_METHOD_BOOL(IsEmptyBucket, is_empty_bucket)

VFS_STRING_METHOD(CreateDir, create_dir)
VFS_STRING_METHOD_BOOL(IsDir, is_dir)
VFS_STRING_METHOD(RemoveDir, remove_dir)
VFS_STRING_METHOD_SIZE(DirSize, dir_size)

VFS_STRING_METHOD_BOOL(IsFile, is_file)
VFS_STRING_METHOD(RemoveFile, remove_file)
VFS_STRING_METHOD_SIZE(FileSize, file_size)

VFS_DOUBLE_STRING_METHOD(MoveFile, move_file)
VFS_DOUBLE_STRING_METHOD(MoveDir, move_dir)
VFS_DOUBLE_STRING_METHOD(CopyFile, copy_file)
VFS_DOUBLE_STRING_METHOD(CopyDir, copy_dir)

VFS_STRING_METHOD(Touch, touch)

Napi::Value VFSWrapper::Ls(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected uri string").ThrowAsJavaScriptException();
        return env.Null();
    }
    std::string uri = info[0].As<Napi::String>().Utf8Value();
    try {
        std::vector<std::string> children = vfs_->ls(uri);
        Napi::Array js_children = Napi::Array::New(env, children.size());
        for (size_t i = 0; i < children.size(); ++i) {
            js_children.Set(i, Napi::String::New(env, children[i]));
        }
        return js_children;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

tiledb_vfs_mode_t str_to_vfs_mode(const std::string& mode) {
    if (mode == "read" || mode == "READ") return TILEDB_VFS_READ;
    if (mode == "write" || mode == "WRITE") return TILEDB_VFS_WRITE;
    if (mode == "append" || mode == "APPEND") return TILEDB_VFS_APPEND;
    throw std::invalid_argument("Invalid VFS mode: " + mode + " (expected 'read', 'write', or 'append')");
}

Napi::Value VFSWrapper::Open(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected uri(string) and mode(string)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string uri = info[0].As<Napi::String>().Utf8Value();
    std::string mode_str = info[1].As<Napi::String>().Utf8Value();
    
    try {
        if (fh_ != nullptr) {
            Napi::TypeError::New(env, "A file is already open on this VFS instance").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        tiledb_vfs_mode_t mode = str_to_vfs_mode(mode_str);
        
        const tiledb::Context& ctx = vfs_->context();
        tiledb_ctx_t* c_ctx = ctx.ptr().get();
        tiledb_vfs_t* c_vfs = vfs_->ptr().get();
        
        int rc = tiledb_vfs_open(c_ctx, c_vfs, uri.c_str(), mode, &fh_);
        if (rc != TILEDB_OK) {
            throw std::runtime_error("Failed to open file via VFS");
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value VFSWrapper::Read(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected offset(number) and size(number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint64_t offset = info[0].As<Napi::Number>().Int64Value();
    uint64_t size = info[1].As<Napi::Number>().Int64Value();
    
    if (fh_ == nullptr) {
        Napi::Error::New(env, "No file is currently open in this VFS instance").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        const tiledb::Context& ctx = vfs_->context();
        tiledb_ctx_t* c_ctx = ctx.ptr().get();

        Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, size);
        
        int rc = tiledb_vfs_read(c_ctx, fh_, offset, buffer.Data(), size);
        if (rc != TILEDB_OK) {
            throw std::runtime_error("Failed to read file via VFS");
        }
        return buffer;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value VFSWrapper::Write(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Expected buffer").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
    
    if (fh_ == nullptr) {
        Napi::Error::New(env, "No file is currently open in this VFS instance").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        const tiledb::Context& ctx = vfs_->context();
        tiledb_ctx_t* c_ctx = ctx.ptr().get();
        int rc = tiledb_vfs_write(c_ctx, fh_, buffer.Data(), buffer.Length());
        if (rc != TILEDB_OK) {
            throw std::runtime_error("Failed to write to file via VFS");
        }
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    
    return env.Undefined();
}

Napi::Value VFSWrapper::Close(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (fh_ != nullptr) {
        try {
            const tiledb::Context& ctx = vfs_->context();
            tiledb_ctx_t* c_ctx = ctx.ptr().get();
            tiledb_vfs_close(c_ctx, fh_);
            fh_ = nullptr;
        } catch (const std::exception& e) {
            Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        }
    }
    return env.Undefined();
}
