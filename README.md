#	dbqp
__A sync tool for MySQL database schema__

##  Description

__dbqp__ may help you dump database schema, diff (even sychronise directly) schemas of two databases.

Name *dbqp* is made up of abbreviation word *db* and its reflection *qp*.

![dbqp](./docs/dbqp.png)

##  Declarations and Attentions

*   The author will be NOT responsible for any damage caused by __dbqp__  on your database or data. Please do backup before using __dbqp__.
*   Until now, ONLY MySQL is supported.
*   Until now, ONLY TABLES are manipulated.
*   Until now, NO DROP opertaion is supported.

##	ToC

*	[Get Started](#get-started)
    *   [CLI Mode](#cli-mode)
    *   [API Mode](#api-mode)
    *   [Standalone API Mode](#standalone-api-mode)
*	[API](#api)
    *   [dbqp.Connection](#dbqpconnection)
    *   [dbqp/mysql/dump](#dbqpmysqldump)
    *   [dbqp/mysql/diff](#dbqpmysqldiff)
    *   [dbqp/mysql/sync](#dbqpmysqlsync)
*   [Examples](#examples)
*	[CHANGE LOG](./CHANGELOG.md)
*	[Homepage](https://github.com/YounGoat/nodejs.dbqp)

##	Get Started

__dbqp__ offers both API and CLI.

### CLI Mode

When installed globally, __dbqp__ generates a homonymic command help you to manage database schema in command line.

```bash
# Install globally.
npm install -g dbqp

# Dump schema of database "employees".
dbqp dump --host localhost --user root --password root --database employees
```

Run `dbqp help` for entire manual.

### API Mode

Of course, you can require __dbqp__ into your Node.js program.

```javascript
const dbqp = require('dbqp');

let conn = new dbqp.Connection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
});

conn.dump('employees', (err, metaJson) => {
    // ...
});

conn.diff('employeesCopy', 'employees', (err, SQLs) => {
    // ...
});
```

### Standalone API Mode

Sub module of __dbqp__ may be required as standalone module for specified task.

```javascript
const dump = require('dbqp/mysql/dump');

const conn = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
}；
dump(conn, 'employees', (err, metaJson) => {
    // ...
});
```

## API

###  dbqp.Connection

```javascript
const Connection = require('dbqp').Connection;
```

*   class dbqp.Connection( Object *connOptions* )
*   Promise __\<conn\>.dump__( string *dbName* )
*   Promise __\<conn\>.diff__( string *refererDbName*, string *refereeDbName* )
*   Promise __\<conn\>.sync__( string *refererDbName*, string *refereeDbName* )
*   void __\<conn\>.dump__( string *dbName*, Function *callback* )
*   void __\<conn\>.diff__( string *refererDbName*, string *refereeDbName*, Function *callback* )
*   void __\<conn\>.sync__( string *refererDbName*, string *refereeDbName*, Function *callback* )
*   void __\<conn\>.destroy__()

See also [API Parameters](#api-parameters).

###  dbqp/mysql/dump

```javascript
const dump = require('dbqp/mysql/dump');
```

*   Promise __\<conn\>.dump__( Object *connOptions*, string *dbName* )
*   void __\<conn\>.dump__( Object *connOptions*, string *dbName*, Function *callback* )

See also [API Parameters](#api-parameters), [dbqp Dump for MySQL](./docs/dump.md).

###  dbqp/mysql/diff

```javascript
const diff = require('dbqp/mysql/diff');
```

*   Promise __\<conn\>.diff__( Object *connOptions*, string *refererDbName*, string *refereeDbName* )
*   void __\<conn\>.diff__( Object *connOptions*, string *refererDbName*, string *refereeDbName*, Function *callback* )

See also [API Parameters](#api-parameters), [dbqp Diff for MySQL](./docs/diff.md).

###  dbqp/mysql/sync

```javascript
const sync = require('dbqp/mysql/sync');
```

*   Promise __\<conn\>.sync__( Object *connOptions*, string *refererDbName*, string *refereeDbName* )
*   void __\<conn\>.sync__( Object *connOptions*, string *refererDbName*, string *refereeDbName*, Function *callback* )

See also [API Parameters](#api-parameters).

###  API Parameters

*   __connOptions__ Object  
    Contains necessary parameters required to connect to a MySQL server.
    ```javascript
    {
        host, /* string DEFAULT 'localhost' */
        port, /* number DEFAULT 3306 */
        user, /* string */
        password, /* string */
    }
    ```

*   __callback__ Function(Error, any)

##  Examples

### Release Database Design

Suppose that you are in charge of maintaining an application which depending on a database. 

In first edition v1.0, a SQL file `1.0.sql` offered to initialize the database.

In second edition v2.0, something changed in database. A new SQL file `2.0.sql` offered to initialize the database. However, to help early users of v1.0 to upgrade their existing databases, another `upgrade-from-1.0.sql` is necessary.

In third edition v3.0, more changes happened. You have to offer following SQL files:
*   `3.0.sql` for new users.
*   `uprade-from-2.0.sql` for early users of v2.0.
*   `uprade-from-1.0.sql` for early users of v1.0.

When more and more editions released, it is really difficult to maintain more and more SQL files. 

---- __It can be easy with *dbqp*.__ ----

*   __If you are developer__, use `dbqp dump` to create `schema.json` which will be delivered to your users.
*   __If you are user__, whatever a new user or early user, use `dbqp sync` to make your database ready. Of course, you should create an empty database if it not exists.
