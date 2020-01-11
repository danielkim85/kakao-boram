const kakao = require('./kakao');

const allowedUsers = {
  1255050703 : true,  // danny
  1255961938 : true,  // danny test
  1255150518 : true   // boram
};

const socket =  function(http,server){
  const io = require('socket.io')(http);
  io.listen(server);

  io.on('connection', function(socket){

    socket.on('join',async function(data){
      const profile = await kakao.me(data.accessToken);
      if(profile.id !== data.userId ||
         !allowedUsers[profile.id]){
        return;
      }
      //either token never set, or token changed
      if(allowedUsers[profile.id] === true || allowedUsers[profile.id] !== data.accessToken){
        allowedUsers[profile.id] = data.accessToken;
      }
      socket.join('main');
      socket.emit('socketRdy');
    });

    socket.on('msg',function(data){
      if(!allowedUsers[data.profile.userId] ||
        allowedUsers[data.profile.userId] !== data.profile.accessToken){
        //accessToken no longer valid, force refresh on client
        socket.leave('main');
        socket.emit('refresh');
        return;
      }
      delete data.profile.accessToken;
      io.to('main').emit('msg',{
        profile : data.profile,
        msg : data.msg,
        timestamp : new Date()
      });
    });

    socket.on('disconnect', function() {
      socket.leave('main');
    });
  });

  return io;
};

module.exports = socket;
