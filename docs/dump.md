#   dbqp Dump for MySQL

`dbqp/mysql/dump` is used to retrieve the skeleton of a database. The output is a JSON looks like:
```javascript
{
    "tables": {
        /* string <tableName> : TableMeta <meta>, ... */
    },
    "foreignKeys": {
        /* string <keyName> :  ForeignKeyMeta <meta>,  ... */
    }
}
```

##  TableMeta

A `TableMeta` looks like:
```javascript
{
    name, /* string */
    engine, /* string */
    autoIncrement, /* number : auto_increment cursor */
    comment, /* string */
    collation, /* string */
    type, /* string */
    "columns": {
        /* string <columnName> : ColumnMeta <meta>, ... */
    },
    "keys": {
        /* string <keyName> : KeyMeta <meta>, ... */
    },
}
```

##  ColumnMeta

A `ColumnMeta` looks like:
```javascript
{
    type, /* string */
    null, /* boolean */
    default,
    orinial, /* number */
    autoIncrement, /* boolean */
}
```

##  KeyMeta

A `KeyMeta` looks like:
```javascript
{
    type, /* string */
    columns, /* string[] */
    comment, /* string */
}
```

##  ForeignKeyMeta

A `ForeignKeyMeta` looks like: 
```javascript
{
    /* Left side of foreign key reference. */
    "referer": {
        table, /* string */
        columns /* string[] */
    },

    /* Right side of foreign key reference. */
    "referee": {
        table, /* string */
        columns /* string[] */
    },

    onDelete, /* string */
    onUpdate, /* string */
}
```