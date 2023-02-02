import { IBaseQueries, ContextValue, QueryBuilder, NSDatabase } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

/** write your queries here go fetch desired data. This queries are just examples copied from SQLite driver */

const describeTable: IBaseQueries["describeTable"] = queryFactory`
SELECT * FROM ${(p) => p.database}.INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_CATALOG = '${(p) => p.database}'
  AND TABLE_SCHEMA  = '${(p) => p.schema}'
  AND TABLE_NAME    = '${(p) => p.label}'
`;

const fetchColumns: IBaseQueries["fetchColumns"] = queryFactory`
SELECT
  C.COLUMN_NAME AS label,
  C.TABLE_NAME AS "table",
  C.TABLE_SCHEMA AS schema,
  C.TABLE_CATALOG AS database,
  C.DATA_TYPE AS dataType,
  CAST(C.COLUMN_DEFAULT AS VARCHAR) AS defaultValue,
  CASE WHEN C.IS_NULLABLE = 'YES' THEN TRUE ELSE FALSE END AS isNullable,
  FALSE AS isPk,
  FALSE AS isFk,
  '${ContextValue.COLUMN}' as type
FROM ${(p) => p.database}.INFORMATION_SCHEMA.COLUMNS AS C
WHERE TABLE_CATALOG = '${(p) => p.database}'
AND   TABLE_SCHEMA  = '${(p) => p.schema}'
AND   TABLE_NAME    = '${(p) => p.label}'
ORDER BY ORDINAL_POSITION ASC
`;

const fetchRecords: IBaseQueries["fetchRecords"] = queryFactory`
SELECT *
FROM ${(p) => p.table.label || p.table}
LIMIT ${(p) => p.limit || 50}
OFFSET ${(p) => p.offset || 0};
`;

const countRecords: IBaseQueries["countRecords"] = queryFactory`
SELECT count(1) AS total
FROM ${(p) => p.table.label || p.table};
`;

const fetchTablesAndViews = (
  type: ContextValue
): IBaseQueries["fetchTables"] => queryFactory`
SELECT table_catalog AS database,
       TABLE_SCHEMA AS schema,
       TABLE_NAME  AS label,
       '${type}' AS type,
       ${type === ContextValue.VIEW ? "TRUE" : "FALSE"} AS isView
FROM ${(p) => p.database}.INFORMATION_SCHEMA.TABLES
WHERE TABLE_CATALOG = '${(p) => p.database}'
AND   TABLE_SCHEMA  = '${(p) => p.schema}'
AND   TABLE_TYPE = ${type === ContextValue.TABLE ? `'BASE TABLE'` : `'VIEW'`}
ORDER BY TABLE_NAME
`;

const fetchTables: IBaseQueries["fetchTables"] = fetchTablesAndViews(
  ContextValue.TABLE
);
const fetchViews: IBaseQueries["fetchTables"] = fetchTablesAndViews(
  ContextValue.VIEW
);

const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT
  TABLE_NAME AS label,
  TABLE_SCHEMA AS schema,
  CASE
    WHEN TABLE_TYPE='BASE TABLE'
    THEN 'TABLE'
    ELSE 'VIEW'
  END AS type
FROM INFORMATION_SCHEMA.TABLES
WHERE TRUE
${(p) => p.schema ? `AND lower(TABLE_SCHEMA) = '${p.schema.toLowerCase()}'` : ""}
ORDER BY TABLE_NAME
LIMIT 20
`;

const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT C.COLUMN_NAME AS label,
       C.TABLE_NAME AS "table",
       C.DATA_TYPE AS dataType,
       CASE WHEN C.IS_NULLABLE = 'YES' THEN TRUE ELSE FALSE END AS isNullable,
       FALSE AS isPk,
       '${ContextValue.COLUMN}' as type
FROM INFORMATION_SCHEMA.COLUMNS C
WHERE 1 = 1
AND LOWER(C.COLUMN_NAME) like '%${p => p.search.toLowerCase()}%'
${(p) =>
  p.tables.filter((t) => !!t.label).length
    ? `AND LOWER(C.TABLE_SCHEMA) IN (${
      p.tables
        .filter((t) => !!t.database)
        .map((t) => `'${t.database}'`.toLowerCase())
        .join(", ")
      })`
    : ""
}
${(p) =>
  p.tables.filter((t) => !!t.label).length
    ? `AND LOWER(C.TABLE_NAME) IN (${
      p.tables
        .filter((t) => !!t.label)
        .map((t) => `'${t.label}'`.toLowerCase())
        .join(", ")
      })`
    : ""
}
ORDER BY C.COLUMN_NAME ASC, C.ORDINAL_POSITION ASC
LIMIT ${(p) => p.limit || 20}
`;

const fetchSchemas: IBaseQueries["fetchSchemas"] = queryFactory`
SELECT
  SCHEMA_NAME AS label,
  SCHEMA_NAME AS schema,
  '${ContextValue.SCHEMA}' AS type
FROM INFORMATION_SCHEMA.SCHEMATA
LIMIT 20
`;

const searchSchemas: QueryBuilder<{ search: string }, NSDatabase.ISchema> = queryFactory`
SELECT
  SCHEMA_NAME AS label,
  SCHEMA_NAME AS schema,
  '${ContextValue.SCHEMA}' AS type
FROM
  INFORMATION_SCHEMA.SCHEMATA
WHERE
  LOWER("schema_name") LIKE '%${p => p.search.toLowerCase()}%'
LIMIT 20
`

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchViews,
  fetchSchemas,
  searchTables,
  searchColumns,
  searchSchemas,
};
