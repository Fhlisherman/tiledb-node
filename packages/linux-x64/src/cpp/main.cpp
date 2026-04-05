#include <napi.h>
#include "context_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return ContextWrapper::Init(env, exports);
}

NODE_API_MODULE(tiledb_bindings, InitAll)
