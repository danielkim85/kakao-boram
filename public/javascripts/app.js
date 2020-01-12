angular.module("app", []).controller("BoramCtrl", function($scope) {

  const socket = io();
  $scope.DEFAULT_PROFILE_IMG = 'https://www.downeastyachting.com/wp/wp-content/uploads/downeastyachting.com/2005/09/default-profile.png';
  Kakao.init('72ec3baa9e089759a3d2618025dfc1f8');

  $scope.profile = {
    userId : undefined,
    nickname : undefined,
    thumbnailImage : undefined,
    accessToken : undefined
  };

  Kakao.Auth.createLoginButton({
    container: '#kakao-login-btn',
    scope: 'profile,friends,talk_message',
    success: function(authObj) {
      $scope.profile.accessToken = authObj.access_token;
      getStatusInfo();
    },
    fail: function(err) {
      console.error(err);
    }
  });

  const getStatusInfo = function (){
    Kakao.Auth.getStatusInfo(function(statusObj){
      $scope.isLoggedIn = statusObj.status === 'connected';
      if($scope.isLoggedIn){
        //loadTestData();
        loadProfile(statusObj.user);
        if(!$scope.profile.accessToken){
          $scope.profile.accessToken = Kakao.Auth.getAccessToken();
        }
        socket.emit('join',{
          accessToken : $scope.profile.accessToken,
          userId : $scope.profile.userId
        });
        $scope.$apply();
      }
      $('.login-btn').show();
    });
  };

  const loadProfile = function(user){
    $scope.profile.userId = user.id;
    $scope.profile.nickname = user.properties.nickname;
    $scope.profile.thumbnailImage = user.properties.thumbnail_image;
  };

  const loadTestData = function(){
    $scope.chats = [
      {
        profile : {
          nickname : 'Danny',
          thumbnailImage : 'http://k.kakaocdn.net/dn/beFkCV/btquxpiy2wH/lO3QFHRqmIk08mIHsiWxa0/img_110x110.jpg'
        },
        msg : 'test msg'
      }
    ];
  };

  getStatusInfo();

  $scope.logout = function(){
    Kakao.Auth.logout(function(){
      $scope.isLoggedIn = false;
      $scope.$apply();
    });
  };

  $scope.send = function(msg) {
    if(msg === ''){
      return;
    }
    socket.emit('msg',{
      profile : $scope.profile,
      msg : msg
    });
    $scope.msg = '';
  };

  socket.on('refresh',function(){
    window.location.reload();
  });

  socket.on('socketRdy',function(messages){
    console.info(messages);
    $scope.chats = messages;
    $scope.isSocketRdy = true;
    $scope.$apply();
    scroll();
  });

  socket.on('msg',function(data){
    if(!data.thumbnailImage){
      data.thumbnailImage = $scope.DEFAULT_PROFILE_IMG;
    }

    data.timestamp = moment(data.timestamp).format('h:mm a');
    $scope.chats.push(data);
    $scope.$apply();
    scroll();
  });

  const scroll = function(){
    $('.msg-box').scrollTop(1000000);
  };
  /*
  $scope.friends = function(){
    Kakao.API.request({
      url: '/v1/api/talk/friends',
      success: function(res) {
        console.info(res);
      },
      fail: function(error) {
        console.error(error);
      }
    });
  };

  $scope.message = function(){
    Kakao.API.request({
      url: '/v2/api/talk/memo/default/send',
      data: {
        template_object: {
          "object_type":"text",
          "text":"텍스트 영역입니다. 최대 200자 표시 가능합니다.",
          "link":{
            "web_url":"http://dev.kakao.com",
            "mobile_web_url":"http://dev.kakao.com"
          },
          "button_title":""
        }
      },
      success: function(res) {
        alert('메시지 전송이 완료되었습니다.');
      }
    });

    Kakao.API.request({
      url: '/v1/api/talk/friends',
      success: function(res) {
        // 친구 중에 첫 번째 친구에게 메시지를 보냅니다. API 호출 시 메시지가 전송됨으로 테스트 시 주의해주세요.
        console.info('message sending to');
        console.info(res.elements[0]);
        Kakao.API.request({
          url: '/v1/api/talk/friends/message/default/send',
          data: {
            receiver_uuids: [res.elements[0].uuid],
            template_object: {
              "object_type":"text",
              "text":"test message.",
            }
          },
          success: function(res) {
            alert('메시지 전송이 완료되었습니다.');
          }
        });
      }
    });
  };
  */
});
