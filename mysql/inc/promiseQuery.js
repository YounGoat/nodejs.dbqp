
function promiseQuery(conn, sql) {
	return new Promise((resolve, reject) => {
		conn.query(sql, function(err, /* results */ rows, /* fields */ columns) {
			err ? reject(err) : resolve({ rows, columns });
		});
	});
}

module.exports = promiseQuery;