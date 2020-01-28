const mysql_ = require('mysql');
let mysql = {};

mysql.config = {
  host: "localhost",
  user: "boram_user",
  password : 'boram_user',
  database: 'boram'
};

mysql.pool  = mysql_.createPool({
  host: "localhost",
  user: "boram_user",
  password : 'boram_user',
  database: 'boram'
});

mysql.getMessages = async function(){
  const sql = 'select * from (\n' +
    'select u.userId,u.nickname,u.thumbnailImage,m.message,timestamp as orig_timestamp,\n' +
    'lower(date_format(m.timestamp,\'%h:%i %p\')) as timestamp from messages m\n' +
    'join users u on m.userId = u.userId\n' +
    'order by orig_timestamp desc LIMIT 100\n' +
    ') t order by orig_timestamp asc';

  return new Promise(function(resolve, reject) {
    mysql.pool.getConnection(function(err, con) {
      if (err) reject(err.message);
      con.query(sql, function (err, result) {
        if (err) return reject(err.message);
        return resolve(result);
      });
    });
  });
};

mysql.insertMessage = function(userId,message){
  const sql = 'insert into messages(userId,message) values(?,?)';

  mysql.pool.getConnection(function(err, con) {
    if (err) console.error(err);
    con.query(sql, [userId,message], function (err, result) {
      if (err) console.error(err);
    });
  });
};

mysql.updateUser = function(userId,nickname,thumbnailImage){
  const sql = 'insert into users(userId,nickname,thumbnailImage)\n' +
    'values(?,?,?)on duplicate key update\n' +
    'nickname = ?,\n' +
    'thumbnailImage = ?';

  mysql.pool.getConnection(function(err, con) {
    if (err) console.error(err);
    con.query(sql, [
      userId,
      nickname,
      thumbnailImage,
      nickname,
      thumbnailImage], function (err, result) {
      if (err) console.error(err);
    });
  });
};

module.exports = mysql;
