angular.module("app", ['ngSanitize','ngCookies']).controller("BoramCtrl", function($scope,$timeout) {

  $scope.DEFAULT_PROFILE_IMG = 'http://www.downeastyachting.com/wp/wp-content/uploads/downeastyachting.com/2005/09/default-profile.png';
  $scope.title='보람톡!';

  const host =  window.location.hostname;
  const port =  host === 'localhost' ? '3003' : '443';
  const protocol = host === 'localhost' ? 'http://' : 'https://';

  const LOCAL_STORAGE_NAME = 'boram.config';

  //function to detect mobile
  const isMobile = function(){
    if( navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i)
    ){
      return true;
    }
    else {
      return false;
    }
  };

  let socket;
  let unreadCount = 0;
  let config = {};

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
      userId : $scope.profile.userId,
      isMobile : isMobile()
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
          //login successful
          if(!socket) {
            socket = io.connect(protocol + host + ':' + port, {
              'reconnection': true,
              'reconnectionDelay': 500,
              'reconnectionAttempts': 10
            });
            registerSocketEvent();
          }
          else {
            join();
          }
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
      $timeout(function(){
        $scope.$apply();
      });
    }
    if(!$scope.registration.getNotifications){
      return;
    }
    $scope.registration.getNotifications().then(function(notifications){
      notifications.forEach(function(notification){
        notification.close()
      });
    });
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

  $scope.debug = function(){
    console.info('debug called');
    socket.emit('debug');
  };

  $scope.logout = function(){
    Kakao.Auth.logout(function(){
      $scope.isLoggedIn = false;
      $scope.$apply();
      socket.emit('logout',$scope.profile.userId);
      window.location.reload();
    });
  };

  $scope.unlink = function(){
    Kakao.API.request({
      url: '/v1/user/unlink',
      success: function(res) {
        $scope.logout();
      }
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

  const registerSocketEvent = function(){
    socket.on('debug',function(debug){
      console.info(debug);
    });

    socket.on('connect', function(){
      if($scope.profile.accessToken){
        join();
      }
    });

    socket.on('errorMsg',function(err){
      alert(err);
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

    socket.on('kakaoNotify',function(data){
      //tried doing this in server side, but didn't work. letting client handle it.
      Kakao.API.request({
        url: '/v1/api/talk/friends/message/default/send',
        data: {
          receiver_uuids: data.uuid,
          template_object: {
            "object_type":"text",
            "text":data.msg,
            "link":{
              "web_url":"https://boram.sooda.io"
            }
          }
        },
        success: function(res) {
          //do nothing
        }
      });
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

      //send push notification
      if(data.userId === $scope.profile.userId){
        return;
      }
      if(data.thumbnailImage && data.thumbnailImage.substring(0,5) === 'http:'){
        data.thumbnailImage = data.thumbnailImage.substring(5);
      }
      socket.emit('push',$scope.subscription,{
        title:$scope.profile.nickname,
        msg:data.message,
        icon:data.thumbnailImage
      });
    });
  };

  $('html').click(function(){
    resetUnreadCounter();
  });

  $('.theme-icons').click(function(){
    const theme = $(this).attr('name');
    config.theme = theme;
    localStorage.setItem(LOCAL_STORAGE_NAME,JSON.stringify(config));

    $('html').attr('class','');
    if(theme !== 'default'){
      $('html').addClass(theme);
    }
    scroll();
  });

  $('.font-size').click(function(){
    const fontSize = $(this).attr('font-size');
    if(fontSize === 'large'){
      $('.msg-box').removeClass('small');
    }
    else{
      $('.msg-box').removeClass('large');
    }
    $('.msg-box').addClass(fontSize);
    config.fontSize = fontSize;
    localStorage.setItem(LOCAL_STORAGE_NAME,JSON.stringify(config));
  });

  config = JSON.parse(localStorage.getItem('boram.config'));
  if(!config){
    config = {};
  }

  if(config.theme){
    $('html').addClass(config.theme);
  }
  if(config.fontSize === 'small'){
    $('.msg-box').removeClass('large');
    $('.msg-box').addClass(config.fontSize);
  }

  //web push
  const publicVapidKey = 'BFs9AKOyH5DXrCKdmIfFdpu1xabkUT35gnGwjRigG7OxyCp9iivmxoW0AUteRVQd_SCap-AWdtn4fiYQ7n5jM9E';

  const urlBase64ToUint8Array = function(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if ('serviceWorker' in navigator) {
    run().catch(error => console.error(error));
  }

  async function run() {
    $scope.registration = await navigator.serviceWorker.
    register('/javascripts/worker.js?v=1.0.1', {scope: '/javascripts/'});
    if(!$scope.registration.pushManager){
      console.warn('safari does not support web push.');
      return;
    }
    $scope.subscription = await $scope.registration.pushManager.
    subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
  }
});
