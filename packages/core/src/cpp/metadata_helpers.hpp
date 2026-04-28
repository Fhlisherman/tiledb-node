#pragma once

#include <napi.h>
#include <tiledb/tiledb>

/**
 * Converts TileDB metadata values to Napi::Value.
 * Shared between ArrayWrapper and GroupWrapper to avoid code duplication.
 */
inline Napi::Value convert_metadata_to_napi(Napi::Env env, tiledb_datatype_t type, uint32_t value_num, const void* value) {
    if (value == nullptr) return env.Null();

    if (type == TILEDB_STRING_UTF8 || type == TILEDB_STRING_ASCII || type == TILEDB_CHAR) {
        return Napi::String::New(env, static_cast<const char*>(value), value_num);
    }

    if (value_num == 1) {
        switch (type) {
            case TILEDB_INT32: return Napi::Number::New(env, *static_cast<const int32_t*>(value));
            case TILEDB_FLOAT64: return Napi::Number::New(env, *static_cast<const double*>(value));
            case TILEDB_FLOAT32: return Napi::Number::New(env, *static_cast<const float*>(value));
            case TILEDB_INT64: return Napi::BigInt::New(env, *static_cast<const int64_t*>(value));
            case TILEDB_UINT64: return Napi::BigInt::New(env, *static_cast<const uint64_t*>(value));
            case TILEDB_INT8: return Napi::Number::New(env, *static_cast<const int8_t*>(value));
            case TILEDB_UINT8: return Napi::Number::New(env, *static_cast<const uint8_t*>(value));
            case TILEDB_INT16: return Napi::Number::New(env, *static_cast<const int16_t*>(value));
            case TILEDB_UINT16: return Napi::Number::New(env, *static_cast<const uint16_t*>(value));
            case TILEDB_UINT32: return Napi::Number::New(env, *static_cast<const uint32_t*>(value));
            default: return env.Undefined();
        }
    }
    return env.Undefined();
}
