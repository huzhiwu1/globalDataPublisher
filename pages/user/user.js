// pages/user/user.js
Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const app = getApp();
    app.globalDataPublisher.add(this);
    this.globalDataPublisher = app.globalDataPublisher;
    this.globalData = app.globalDataPublisher.getGlobalData();
    this.setData({
      ...this.globalData
    });
  },
  update() {
    console.log('user页面更新');
    const app = getApp();
    const globalData = app.globalDataPublisher.getGlobalData();
    this.globalData = globalData;
    this.setData({
      ...globalData
    });
  },
  changeName() {
    this.globalData.userInfo.name = '前端小学生';
    this.globalDataPublisher.setGlobalData(this.globalData);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    const app = getApp();
    console.log(app.globalData, 'globalData');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {}
});
