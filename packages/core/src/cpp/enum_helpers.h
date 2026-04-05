#pragma once

#include <tiledb/tiledb>
#include <string>
#include <stdexcept>

// Maps string datatype names (e.g. "INT32", "FLOAT64") to tiledb_datatype_t enum values.
// Used across Dimension, Attribute, and other wrappers.
inline tiledb_datatype_t parse_datatype(const std::string& type_str) {
    if (type_str == "INT32") return TILEDB_INT32;
    if (type_str == "INT64") return TILEDB_INT64;
    if (type_str == "FLOAT32") return TILEDB_FLOAT32;
    if (type_str == "FLOAT64") return TILEDB_FLOAT64;
    if (type_str == "INT8") return TILEDB_INT8;
    if (type_str == "UINT8") return TILEDB_UINT8;
    if (type_str == "INT16") return TILEDB_INT16;
    if (type_str == "UINT16") return TILEDB_UINT16;
    if (type_str == "UINT32") return TILEDB_UINT32;
    if (type_str == "UINT64") return TILEDB_UINT64;
    if (type_str == "STRING_ASCII") return TILEDB_STRING_ASCII;
    if (type_str == "STRING_UTF8") return TILEDB_STRING_UTF8;
    if (type_str == "CHAR") return TILEDB_CHAR;
    if (type_str == "DATETIME_YEAR") return TILEDB_DATETIME_YEAR;
    if (type_str == "DATETIME_MONTH") return TILEDB_DATETIME_MONTH;
    if (type_str == "DATETIME_WEEK") return TILEDB_DATETIME_WEEK;
    if (type_str == "DATETIME_DAY") return TILEDB_DATETIME_DAY;
    if (type_str == "DATETIME_HR") return TILEDB_DATETIME_HR;
    if (type_str == "DATETIME_MIN") return TILEDB_DATETIME_MIN;
    if (type_str == "DATETIME_SEC") return TILEDB_DATETIME_SEC;
    if (type_str == "DATETIME_MS") return TILEDB_DATETIME_MS;
    if (type_str == "DATETIME_US") return TILEDB_DATETIME_US;
    if (type_str == "DATETIME_NS") return TILEDB_DATETIME_NS;
    if (type_str == "DATETIME_PS") return TILEDB_DATETIME_PS;
    if (type_str == "DATETIME_FS") return TILEDB_DATETIME_FS;
    if (type_str == "DATETIME_AS") return TILEDB_DATETIME_AS;
    if (type_str == "BLOB") return TILEDB_BLOB;
    if (type_str == "BOOL") return TILEDB_BOOL;
    if (type_str == "GEOM_WKB") return TILEDB_GEOM_WKB;
    if (type_str == "GEOM_WKT") return TILEDB_GEOM_WKT;
    throw std::invalid_argument("Unknown datatype: " + type_str);
}

inline std::string datatype_to_string(tiledb_datatype_t type) {
    switch (type) {
        case TILEDB_INT32: return "INT32";
        case TILEDB_INT64: return "INT64";
        case TILEDB_FLOAT32: return "FLOAT32";
        case TILEDB_FLOAT64: return "FLOAT64";
        case TILEDB_INT8: return "INT8";
        case TILEDB_UINT8: return "UINT8";
        case TILEDB_INT16: return "INT16";
        case TILEDB_UINT16: return "UINT16";
        case TILEDB_UINT32: return "UINT32";
        case TILEDB_UINT64: return "UINT64";
        case TILEDB_STRING_ASCII: return "STRING_ASCII";
        case TILEDB_STRING_UTF8: return "STRING_UTF8";
        case TILEDB_CHAR: return "CHAR";
        case TILEDB_DATETIME_YEAR: return "DATETIME_YEAR";
        case TILEDB_DATETIME_MONTH: return "DATETIME_MONTH";
        case TILEDB_DATETIME_WEEK: return "DATETIME_WEEK";
        case TILEDB_DATETIME_DAY: return "DATETIME_DAY";
        case TILEDB_DATETIME_HR: return "DATETIME_HR";
        case TILEDB_DATETIME_MIN: return "DATETIME_MIN";
        case TILEDB_DATETIME_SEC: return "DATETIME_SEC";
        case TILEDB_DATETIME_MS: return "DATETIME_MS";
        case TILEDB_DATETIME_US: return "DATETIME_US";
        case TILEDB_DATETIME_NS: return "DATETIME_NS";
        case TILEDB_DATETIME_PS: return "DATETIME_PS";
        case TILEDB_DATETIME_FS: return "DATETIME_FS";
        case TILEDB_DATETIME_AS: return "DATETIME_AS";
        case TILEDB_BLOB: return "BLOB";
        case TILEDB_BOOL: return "BOOL";
        case TILEDB_GEOM_WKB: return "GEOM_WKB";
        case TILEDB_GEOM_WKT: return "GEOM_WKT";
        default: return "UNKNOWN";
    }
}

inline tiledb_layout_t parse_layout(const std::string& layout_str) {
    if (layout_str == "ROW_MAJOR") return TILEDB_ROW_MAJOR;
    if (layout_str == "COL_MAJOR") return TILEDB_COL_MAJOR;
    if (layout_str == "GLOBAL_ORDER") return TILEDB_GLOBAL_ORDER;
    if (layout_str == "UNORDERED") return TILEDB_UNORDERED;
    throw std::invalid_argument("Unknown layout: " + layout_str);
}

inline tiledb_query_type_t parse_query_type(const std::string& query_type_str) {
    if (query_type_str == "READ") return TILEDB_READ;
    if (query_type_str == "WRITE") return TILEDB_WRITE;
    if (query_type_str == "DELETE") return TILEDB_DELETE;
    if (query_type_str == "UPDATE") return TILEDB_UPDATE;
    if (query_type_str == "MODIFY_EXCLUSIVE") return TILEDB_MODIFY_EXCLUSIVE;
    throw std::invalid_argument("Unknown query type: " + query_type_str);
}

inline tiledb_query_condition_op_t parse_query_condition_op(const std::string& op_str) {
    if (op_str == "LT") return TILEDB_LT;
    if (op_str == "LE") return TILEDB_LE;
    if (op_str == "GT") return TILEDB_GT;
    if (op_str == "GE") return TILEDB_GE;
    if (op_str == "EQ") return TILEDB_EQ;
    if (op_str == "NEQ") return TILEDB_NE;
    throw std::invalid_argument("Unknown query condition op: " + op_str);
}

inline tiledb_query_condition_combination_op_t parse_query_condition_combination_op(const std::string& op_str) {
    if (op_str == "AND") return TILEDB_AND;
    if (op_str == "OR") return TILEDB_OR;
    if (op_str == "NOT") return TILEDB_NOT;
    throw std::invalid_argument("Unknown query condition combination op: " + op_str);
}
