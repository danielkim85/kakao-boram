const request = require('request');
let kakao = {};
kakao.me = async function(accessToken){
  return new Promise(function(resolve, reject) {
    request({
      url: 'https://kapi.kakao.com/v2/user/me',
      auth: {
        'bearer': accessToken
      }
    }, function (err, res) {
      return resolve(JSON.parse(res.body));
    });
  });
};
module.exports = kakao;
