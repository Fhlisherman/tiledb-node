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
