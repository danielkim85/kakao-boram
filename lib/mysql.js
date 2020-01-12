const mysql_ = require('mysql');
let mysql = {};

mysql.config = {
  host: "localhost",
  user: "boram_user",
  password : 'boram_user',
  database: 'boram'
};

mysql.getMessages = async function(){
  const sql = 'select u.userId,u.nickname,u.thumbnailImage,m.message,\n' +
    'lower(date_format(m.timestamp,\'%h:%i %p\')) as timestamp from messages m\n' +
    'join users u on m.userId = u.userId\n';
  const con = mysql_.createConnection(this.config);
  return new Promise(function(resolve, reject) {
    con.connect(function (err) {
      if (err) console.error(err);
      con.query(sql, function (err, result) {
        if (err) return reject(err);
        return resolve(result);
      });
    });
  });
};

mysql.insertMessage = function(userId,message){
  const sql = 'insert into messages(userId,message) values(?,?)';
  const con = mysql_.createConnection(this.config);
  con.connect(function (err) {
    if (err) console.error(err);
    con.query(sql, [userId,message], function (err, result) {
      if (err) return console.error(err);
    });
  });
};

mysql.updateUser = function(userId,nickname,thumbnailImage){
  const sql = 'insert into users(userId,nickname,thumbnailImage)\n' +
    'values(?,?,?)on duplicate key update\n' +
    'nickname = ?,\n' +
    'thumbnailImage = ?';
  const con = mysql_.createConnection(this.config);
  con.connect(function (err) {
    if (err) console.error(err);
    con.query(sql, [
      userId,
      nickname,
      thumbnailImage,
      nickname,
      thumbnailImage], function (err, result) {
      if (err) return console.error(err);
    });
  });
};

module.exports = mysql;
