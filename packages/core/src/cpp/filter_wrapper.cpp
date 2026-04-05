#include "filter_wrapper.h"
#include "context_wrapper.h"
#include <string>
#include <unordered_map>

Napi::FunctionReference FilterWrapper::constructor;

// Map string filter type names to TileDB enum values
static tiledb_filter_type_t parse_filter_type(const std::string& type_str) {
    static const std::unordered_map<std::string, tiledb_filter_type_t> map = {
        {"NONE", TILEDB_FILTER_NONE},
        {"GZIP", TILEDB_FILTER_GZIP},
        {"ZSTD", TILEDB_FILTER_ZSTD},
        {"LZ4", TILEDB_FILTER_LZ4},
        {"RLE", TILEDB_FILTER_RLE},
        {"BZIP2", TILEDB_FILTER_BZIP2},
        {"DOUBLE_DELTA", TILEDB_FILTER_DOUBLE_DELTA},
        {"BIT_WIDTH_REDUCTION", TILEDB_FILTER_BIT_WIDTH_REDUCTION},
        {"BITSHUFFLE", TILEDB_FILTER_BITSHUFFLE},
        {"BYTESHUFFLE", TILEDB_FILTER_BYTESHUFFLE},
        {"POSITIVE_DELTA", TILEDB_FILTER_POSITIVE_DELTA},
        {"CHECKSUM_MD5", TILEDB_FILTER_CHECKSUM_MD5},
        {"CHECKSUM_SHA256", TILEDB_FILTER_CHECKSUM_SHA256},
        {"DICTIONARY", TILEDB_FILTER_DICTIONARY},
        {"SCALE_FLOAT", TILEDB_FILTER_SCALE_FLOAT},
        {"XOR", TILEDB_FILTER_XOR},
        {"DELTA", TILEDB_FILTER_DELTA},
    };
    auto it = map.find(type_str);
    if (it == map.end()) {
        throw std::invalid_argument("Unknown filter type: " + type_str);
    }
    return it->second;
}

static std::string filter_type_to_string(tiledb_filter_type_t type) {
    switch (type) {
        case TILEDB_FILTER_NONE: return "NONE";
        case TILEDB_FILTER_GZIP: return "GZIP";
        case TILEDB_FILTER_ZSTD: return "ZSTD";
        case TILEDB_FILTER_LZ4: return "LZ4";
        case TILEDB_FILTER_RLE: return "RLE";
        case TILEDB_FILTER_BZIP2: return "BZIP2";
        case TILEDB_FILTER_DOUBLE_DELTA: return "DOUBLE_DELTA";
        case TILEDB_FILTER_BIT_WIDTH_REDUCTION: return "BIT_WIDTH_REDUCTION";
        case TILEDB_FILTER_BITSHUFFLE: return "BITSHUFFLE";
        case TILEDB_FILTER_BYTESHUFFLE: return "BYTESHUFFLE";
        case TILEDB_FILTER_POSITIVE_DELTA: return "POSITIVE_DELTA";
        case TILEDB_FILTER_CHECKSUM_MD5: return "CHECKSUM_MD5";
        case TILEDB_FILTER_CHECKSUM_SHA256: return "CHECKSUM_SHA256";
        case TILEDB_FILTER_DICTIONARY: return "DICTIONARY";
        case TILEDB_FILTER_SCALE_FLOAT: return "SCALE_FLOAT";
        case TILEDB_FILTER_XOR: return "XOR";
        case TILEDB_FILTER_DELTA: return "DELTA";
        default: return "UNKNOWN";
    }
}

Napi::Object FilterWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Filter", {
        InstanceMethod("type", &FilterWrapper::GetType),
        InstanceMethod("setOption", &FilterWrapper::SetOption),
        InstanceMethod("close", &FilterWrapper::Close)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Filter", func);
    return exports;
}

Napi::Object FilterWrapper::NewInstance(Napi::Env env, const tiledb::Context& ctx, tiledb::Filter filter) {
    Napi::Object obj = constructor.New({});
    FilterWrapper* wrapper = Napi::ObjectWrap<FilterWrapper>::Unwrap(obj);
    delete wrapper->filter_;
    wrapper->filter_ = new tiledb::Filter(filter);
    return obj;
}

FilterWrapper::FilterWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<FilterWrapper>(info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected (Context ctx, string filterType)").ThrowAsJavaScriptException();
        return;
    }

    try {
        ContextWrapper* ctx_wrap = Napi::ObjectWrap<ContextWrapper>::Unwrap(info[0].As<Napi::Object>());
        std::string type_str = info[1].As<Napi::String>().Utf8Value();
        tiledb_filter_type_t filter_type = parse_filter_type(type_str);
        this->filter_ = new tiledb::Filter(ctx_wrap->get_context(), filter_type);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
}

FilterWrapper::~FilterWrapper() {
    if (this->filter_ != nullptr) {
        delete this->filter_;
        this->filter_ = nullptr;
    }
}

tiledb::Filter& FilterWrapper::get_filter() {
    return *this->filter_;
}

Napi::Value FilterWrapper::GetType(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    try {
        tiledb_filter_type_t type = this->filter_->filter_type();
        return Napi::String::New(env, filter_type_to_string(type));
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value FilterWrapper::SetOption(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (string option, number value)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    try {
        std::string option_str = info[0].As<Napi::String>().Utf8Value();
        int32_t value = info[1].As<Napi::Number>().Int32Value();

        tiledb_filter_option_t option;
        if (option_str == "COMPRESSION_LEVEL") {
            option = TILEDB_COMPRESSION_LEVEL;
        } else if (option_str == "BIT_WIDTH_MAX_WINDOW") {
            option = TILEDB_BIT_WIDTH_MAX_WINDOW;
        } else if (option_str == "POSITIVE_DELTA_MAX_WINDOW") {
            option = TILEDB_POSITIVE_DELTA_MAX_WINDOW;
        } else if (option_str == "SCALE_FLOAT_BYTEWIDTH") {
            option = TILEDB_SCALE_FLOAT_BYTEWIDTH;
        } else if (option_str == "SCALE_FLOAT_FACTOR") {
            option = TILEDB_SCALE_FLOAT_FACTOR;
        } else if (option_str == "SCALE_FLOAT_OFFSET") {
            option = TILEDB_SCALE_FLOAT_OFFSET;
        } else {
            Napi::TypeError::New(env, "Unknown filter option: " + option_str).ThrowAsJavaScriptException();
            return env.Undefined();
        }

        this->filter_->set_option(option, &value);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
    return env.Undefined();
}

Napi::Value FilterWrapper::Close(const Napi::CallbackInfo& info) {
    if (this->filter_ != nullptr) {
        delete this->filter_;
        this->filter_ = nullptr;
    }
    return info.Env().Undefined();
}
