#include <napi.h>
#include "context_wrapper.h"
#include "config_wrapper.h"
#include "filter_wrapper.h"
#include "filter_list_wrapper.h"
#include "dimension_wrapper.h"
#include "domain_wrapper.h"
#include "attribute_wrapper.h"
#include "array_schema_wrapper.h"
#include "array_wrapper.h"
#include "subarray_wrapper.h"
#include "query_condition_wrapper.h"
#include "query_wrapper.h"
#include "object_wrapper.h"
#include "group_wrapper.h"
#include "vfs_wrapper.h"
#include "stats_wrapper.h"
#include "fragment_info_wrapper.h"
#include "enumeration_wrapper.h"
#include "array_schema_evolution_wrapper.h"
#include "consolidation_plan_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    ContextWrapper::Init(env, exports);
    ConfigWrapper::Init(env, exports);
    FilterWrapper::Init(env, exports);
    FilterListWrapper::Init(env, exports);
    DimensionWrapper::Init(env, exports);
    DomainWrapper::Init(env, exports);
    AttributeWrapper::Init(env, exports);
    ArraySchemaWrapper::Init(env, exports);
    ArrayWrapper::Init(env, exports);
    SubarrayWrapper::Init(env, exports);
    QueryConditionWrapper::Init(env, exports);
    QueryWrapper::Init(env, exports);
    ObjectWrapper::Init(env, exports);
    GroupWrapper::Init(env, exports);
    VFSWrapper::Init(env, exports);
    StatsWrapper::Init(env, exports);
    FragmentInfoWrapper::Init(env, exports);
    EnumerationWrapper::Init(env, exports);
    ArraySchemaEvolutionWrapper::Init(env, exports);
    ConsolidationPlanWrapper::Init(env, exports);
    return exports;
}

NODE_API_MODULE(tiledb_bindings, InitAll)
