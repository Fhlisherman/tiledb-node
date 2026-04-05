#include <napi.h>
#include "context_wrapper.h"
#include "config_wrapper.h"
#include "filter_wrapper.h"
#include "dimension_wrapper.h"
#include "domain_wrapper.h"
#include "attribute_wrapper.h"
#include "array_schema_wrapper.h"
#include "array_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    ContextWrapper::Init(env, exports);
    ConfigWrapper::Init(env, exports);
    FilterWrapper::Init(env, exports);
    DimensionWrapper::Init(env, exports);
    DomainWrapper::Init(env, exports);
    AttributeWrapper::Init(env, exports);
    ArraySchemaWrapper::Init(env, exports);
    ArrayWrapper::Init(env, exports);
    return exports;
}

NODE_API_MODULE(tiledb_bindings, InitAll)
