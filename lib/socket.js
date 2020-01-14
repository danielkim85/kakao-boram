const kakao = require('./kakao');
const mysql = require('./mysql');

const allowedUsers = {
  1255050703 : true,  // danny
  1255961938 : true,  // danny test
  1255150518 : true   // boram
};

let debug = false;

const socket =  function(http,server){
  const io = require('socket.io')(http);
  io.listen(server);

  io.on('connection', function(socket){
    socket.on('join',async function(data){

      const profile = await kakao.me(data.accessToken);

      //debug code -> remove later
      //debug = profile.id === 1255961938;

      if(profile.id !== data.userId ||
         !allowedUsers[profile.id]){
        socket.emit('logout');
        return;
      }
      //either token never set, or token changed
      if(allowedUsers[profile.id] === true || allowedUsers[profile.id] !== data.accessToken){
        allowedUsers[profile.id] = data.accessToken;
        mysql.updateUser(profile.id,profile.properties.nickname,profile.properties.thumbnail_image);
      }
      socket.join('main');
      const messages = await mysql.getMessages();
      socket.emit('socketRdy',messages);
    });

    socket.on('msg',function(data){

      if(!allowedUsers[data.profile.userId] ||
        allowedUsers[data.profile.userId] !== data.profile.accessToken ||
        debug){
        //accessToken no longer valid, force refresh on client
        socket.emit('refresh');
        return;
      }
      mysql.insertMessage(data.profile.userId,data.msg);
      delete data.profile.accessToken;
      io.to('main').emit('msg',{
        userId : data.profile.userId,
        nickname : data.profile.nickname,
        thumbnailImage : data.profile.thumbnailImage,
        message : data.msg,
        timestamp : new Date()
      });
    });

    /*
      auto leaving on disconnect may be problematic due to
      no auto join logic on connect
    no auto joiin logic on reconnect
    socket.on('disconnect', function() {
      socket.leave('main');
    });
    */
  });

  return io;
};

module.exports = socket;
