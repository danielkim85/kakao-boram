angular.module("app", ['ngSanitize','ngCookies']).controller("BoramCtrl", function($scope,$timeout,$cookieStore) {

  $scope.DEFAULT_PROFILE_IMG = 'https://www.downeastyachting.com/wp/wp-content/uploads/downeastyachting.com/2005/09/default-profile.png';
  $scope.title='보람톡!';

  const host =  window.location.hostname;
  const port =  '3003';
  const protocol = 'http://';

  const socket = io.connect(protocol + host + ':' + port, {
    'reconnection': true,
    'reconnectionDelay': 500,
    'reconnectionAttempts': 10
  });

  let unreadCount = 0;

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
      alert(err);
    }
  });

  const join = function(){
    socket.emit('join',{
      accessToken : $scope.profile.accessToken,
      userId : $scope.profile.userId
    });
  };

  const getStatusInfo = function (){
    $scope.isLoading = true;
    try {
      Kakao.Auth.getStatusInfo(function (statusObj) {
        $scope.isLoggedIn = statusObj.status === 'connected';
        if ($scope.isLoggedIn) {
          loadProfile(statusObj.user);
          if (!$scope.profile.accessToken) {
            $scope.profile.accessToken = Kakao.Auth.getAccessToken();
          }
          join();
          $scope.$apply();
        }
        $scope.isLoading = false;
        $timeout(function(){
          $scope.$apply();
        });
        $('.login-btn').show();
      });
    } catch(err){
      console.error(err);
    }
  };

  const loadProfile = function(user){
    $scope.profile.userId = user.id;
    $scope.profile.nickname = user.properties.nickname;
    $scope.profile.thumbnailImage = user.properties.thumbnail_image;
  };

  const scroll = function(){
    $('.msg-box').scrollTop(10000000);
  };

  const resetUnreadCounter = function(){
    if(unreadCount > 0) {
      unreadCount = 0;
      $scope.title = '보람톡!';
    }
  };

  //emoticon stuff
  const regExp = /\(([^)]+)\)/g;
  const emoticonsMap = {
    "(쪽)" : 'kiss'
  };
  const transformEmoticons = function(msg){
    const matches = msg.match(regExp);
    for(const i in matches){
      const match = matches[i];
      if(emoticonsMap[match]){
        const replace = '<img class="emoticons" src="images/emoticons/' + emoticonsMap[match] + '.png" \>';
        msg = msg.split(match).join(replace);
      };
    }
    return msg;
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
    resetUnreadCounter();
  };

  socket.on('connect', function(){
    if($scope.profile.accessToken){
      join();
    }
  });

  socket.on('refresh',function(){
    window.location.reload();
  });

  socket.on('logout',function(){
    $scope.logout();
  });

  socket.on('socketRdy',function(chats){
    $scope.isLoading = false;
    for(const i in chats){
      chats[i].message = transformEmoticons(chats[i].message);
    }
    $scope.chats = chats;
    $scope.isSocketRdy = true;
    $scope.$apply();
    scroll();
  });


  socket.on('msg',function(data){
    if(!data.thumbnailImage){
      data.thumbnailImage = $scope.DEFAULT_PROFILE_IMG;
    }
    data.message = transformEmoticons(data.message);
    data.timestamp = moment(data.timestamp).format('h:mm a');
    $scope.chats.push(data);
    if($scope.profile.userId !== data.userId) {
      unreadCount++;
      $scope.title = '(' + unreadCount + ')보람톡!';
    }
    $scope.$apply();
    scroll();
  });

  $('html').click(function(){
    resetUnreadCounter();
  });

  $('.theme-icons').click(function(){
    const theme = $(this).attr('name');
    $cookieStore.put('theme',theme);
    $('html').attr('class','');
    if(theme !== 'default'){
      $('html').addClass(theme);
    }
  });

  const curTheme = $cookieStore.get('theme');
  if(curTheme){
    $('html').addClass(curTheme);
  }

});
