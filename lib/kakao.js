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

module.exports = kakao;
