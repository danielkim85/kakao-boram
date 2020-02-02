const request = require('request');
let kakao = {};

//gets profile from kakao api
kakao.me = async function(accessToken){
  return new Promise(function(resolve, reject) {
    request({
      url: 'https://kapi.kakao.com/v2/user/me',
      auth: {
        'bearer': accessToken
      }
    }, function (err, res) {
      if(err){
        return reject(err);
      }
      return resolve(JSON.parse(res.body));
    });
  });
};

//validate token matching the claimed user
//if success, return profile obj
kakao.validateToken = async function(accessToken,userId) {
  const profile = await this.me(accessToken).catch(function(err){
    console.error(err);
    return false;
  });
  if(profile.id !== userId){
    console.error('mismatching accessToken to userId');
    return false;
  }
  return profile;
};

kakao.notify = function(uuid,msg,accessToken){
  /*
  request.get({
    url: 'https://kapi.kakao.com/v1/api/talk/friends',
    auth: {
      'bearer': accessToken
    },
  }, function (err, res) {
    if(err){
      console.error(err);
      return;
    }
    console.info(JSON.parse(res.body).elements[0].uuid);
    request.post({
      url: 'https://kapi.kakao.com/v1/api/talk/friends/message/default/send',
      auth: {
        'bearer': accessToken
      },
      body: {
        'receiver_uuids': [JSON.parse(res.body).elements[0].uuid],
        template_object: {
          "object_type": "text",
          "text": "test1",
          "link": {
            "web_url": "https://boram.sooda.io"
          }
        }
      },
      json:true
    }, function (err, res) {
      if(err){
        console.error(err);
      }
      console.info(res.body);
    });
  });
  */
};

module.exports = kakao;
