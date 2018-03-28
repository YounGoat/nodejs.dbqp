#   dbqp Diff for MySQL

This tool will compare two databases' skeletons and return the difference which is an array of SQLs. Executing the SQLs in the referer database will make it keeping pace with the referee database. 

ATTENTION: Do not execute the returned SQLs in the referee database.