angular.module("app", []).controller("BoramCtrl", function($scope) {
  $scope.logout = function(){
    Kakao.Auth.logout(function(){
      console.info('logged out');
    });
  };
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
});
