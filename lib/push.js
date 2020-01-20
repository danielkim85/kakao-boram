const webpush = require('web-push');

const publicVapidKey = 'BFs9AKOyH5DXrCKdmIfFdpu1xabkUT35gnGwjRigG7OxyCp9iivmxoW0AUteRVQd_SCap-AWdtn4fiYQ7n5jM9E';
const privateVapidKey = '6W5ZLgqE_8uWQAGlTAEUhycWsMNLv0VVdjSA8ztrJ8s';
webpush.setVapidDetails('mailto:danielkim@soulkast.com', publicVapidKey, privateVapidKey);

let push = {};

push.send = function(subscription,data){
  const payload = JSON.stringify(data);
  webpush.sendNotification(subscription, payload).catch(error => {
    console.error(error.stack);
  });
};

module.exports = push;
