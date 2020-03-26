//app.js
var { GlobalDataPublisher } = require('./utils/publisher');
App({
  onLaunch: function() {
    this.globalDataPublisher = new GlobalDataPublisher(this.globalData);
  },
  globalData: {
    userInfo: {
      name: '胡志武',
      age: 18,
      job: '前端攻城狮'
    }
  }
});
