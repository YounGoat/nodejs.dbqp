*	https://github.com/dlevsha/compalex

*	https://stackoverflow.com/questions/2389468/compare-structures-of-two-databases
	```sql
	SET @database_current = '<production>';
	SET @database_dev = '<development>';
	-- column and datatype comparison
	SELECT a.TABLE_NAME, a.COLUMN_NAME, a.DATA_TYPE, a.CHARACTER_MAXIMUM_LENGTH,
		b.COLUMN_NAME, b.DATA_TYPE, b.CHARACTER_MAXIMUM_LENGTH
	FROM information_schema.COLUMNS a
		LEFT JOIN information_schema.COLUMNS b ON b.COLUMN_NAME = a.COLUMN_NAME
			AND b.TABLE_NAME = a.TABLE_NAME
			AND b.TABLE_SCHEMA = @database_current
	WHERE a.TABLE_SCHEMA = @database_dev
		AND (
			b.COLUMN_NAME IS NULL
			OR b.COLUMN_NAME != a.COLUMN_NAME
			OR b.DATA_TYPE != a.DATA_TYPE
			OR b.CHARACTER_MAXIMUM_LENGTH != a.CHARACTER_MAXIMUM_LENGTH
		);
	-- table comparison    
	SELECT a.TABLE_SCHEMA, a.TABLE_NAME, b.TABLE_NAME
	FROM information_schema.TABLES a
		LEFT JOIN information_schema.TABLES b ON b.TABLE_NAME = a.TABLE_NAME
			AND b.TABLE_SCHEMA = @database_current
	WHERE a.TABLE_SCHEMA = @database_dev
		AND (
			b.TABLE_NAME IS NULL
			OR b.TABLE_NAME != a.TABLE_NAME
		);
	```

*	http://docs.sequelizejs.com

*	MySQL——约束  
	https://segmentfault.com/a/1190000006671061

*	Relationship between catalog, schema, user, and database instance  
	https://stackoverflow.com/questions/7942520/relationship-between-catalog-schema-user-and-database-instance

*	CONSTRAIN, INDEX and KEY  
	约束，索引和键的关系
	*	CONSTRAINT + INDEX = KEY
	*	INDEX - MUL = CONSTRAINT - FK = PRI + Unique  
	*	information_schema.TABLE_CONSTRAINTS = includes CONSTRAINT only (no details)
	*	information_schema.REFERENTIAL_CONSTRAINTS = includes FK only
	*	information_schema.KEY_COLUMN_USAGE = includes CONSTRAINT only
	*	information_schema.STATISTICS = includes INDEX only
	*	SHOW INDEX FROM ... = includes INDEX only

*	外键  
	在建立外键之前，所有相关字段必须先建立索引。
	如果当前表的相关字段未建立索引，则创建外键时会自动创建一个。所以：
	```sql
	ALTER TABLE t1 ADD
		-- symbol 才是 FK 的名字。
		-- 如果表内索引尚未建立，symbol 也将作为自动创建索引的名字。
		CONSTRAINT symbol 

		-- index_name 是自动创建的索引的名字。
		-- 但是，麻烦的是，如果同时指定了 symbol，那么 index_name 将被忽略。
		FOREIGN KEY index_name (c1, c2)
		
		REFERENCES  t2 (c3, c4)
		;
	```
