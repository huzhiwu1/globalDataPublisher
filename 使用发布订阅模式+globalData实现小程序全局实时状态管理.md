## 前言

> 在小程序的中，虽然有globalData这种全局唯一数据存储，但是每个page并不能感知globalData是否发生了变化继而去更新page的data。比如A页面改变了globalData，但是B页面并不能知道globalData改变了，B页面只能在onShow这个生命周期中去重新获取globalData，并setData
>
> 甚至在同一个页面中，我改变了globalData，但页面并不知道，必须手动去setData，这样页面中的数据才会重新渲染
>
> 于是我想是不是可以使用发布订阅模式，让globalData一改变，全部页面就更新数据呢
> 当然，这个只是一个思路，并没有考虑多次setData降低性能，你在看这篇博客时，可以当作是学习发布订阅模式，哈哈，当然，如果能点个赞最好了，谢谢

## 什么是发布订阅模式？

发布订阅模式，有两个角色，一个是发布者，一个是订阅者。可以形象的比喻为老师和学生

老师在台上讲课（发布消息），学生在台下听课（接受消息）然后吸收知识（执行任务）
如果老师觉得你在开小差，他会让你滚出教室（删除订阅者）

老师觉得你反省的差不多了，他会让你进入教室（增加订阅者）

```javascript
class Teacher{
  constructor(){
    this.students=[];//用来存储学生，即是存储订阅者
  }
  add(student){
		this.students.push(studnet)
  }
  remove(student){
    this.students.forEach((item,index)=>{
      if(item==studnet){
        this.students.splice(index,1)
        return;
      }
    })
  }
  say(){//老师讲课
    this.students.forEach(item=>{
      item.listen()//要求学生们听课
    })
  }
}
class Student{
  listen(){
    console.log("我在听课")
  }
}
```

总结：

> 发布者有三个能力：
>
> 1. 增加订阅者
> 2. 删除订阅者
> 3. 通知订阅者执行某一个任务
>
> 订阅有一个能力：
>
> 1. 执行任务



## 在小程序中使用发布订阅模式

小程序目录如下

![image-20200326133153437](https://tva1.sinaimg.cn/large/00831rSTgy1gd79pm2qqxj306w07ywev.jpg)

在publisher.js中

```javascript
class Publisher {//发布者
  constructor() {
    this.observers = [];//存储订阅者
  }
  add(observer) {//增加订阅者
    this.observers.push(observer);
  }
  remove(observer) {//删除订阅者
    this.observers.forEach((item, index) => {
      if (item == observer) {
        this.observers.splice(index, 1);
        return;
      }
    });
  }
  notify() {// 向订阅者发布消息
    this.observers.forEach(item => {
      item.update();//  在每一个页面中创建一个update函数用来更新globalData并渲染
    });
  }
}
// 这个类继承Publisher并监听globalData的变化
class GlobalDataPublisher extends Publisher {
  constructor(globalData) {
    super();
    this.globalData = globalData;
    this.observers = [];
  }
  getGlobalData() {
    return this.globalData;
  }
  setGlobalData(globalData) {// globalData一旦变化，就通知订阅者
    this.globalData = globalData;
    this.notify();
  }
}
module.exports = {
  Publisher,
  GlobalDataPublisher
};

```

app.js

```javascript
//app.js
var { GlobalDataPublisher } = require('./utils/publisher');
App({
  onLaunch: function() {
    // 将这个类挂载到全局唯一实例的App上
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

```

 新建四个页面

![image-20200326133711366](https://tva1.sinaimg.cn/large/00831rSTgy1gd79v4szb0j306y0bjmxp.jpg)

```vue
// 四个页面全部一样如下
// wxml
 <view>
    <text>name:{{userInfo.name}}</text>
    <text>age:{{userInfo.age}}</text>
    <text>job:{{userInfo.job}}</text>
</view>
<view bindtap="changeName">改名字为前端小学生</view>
<view bindtap="changeJob">改职位为前端打杂</view>
```

```javascript
// js
// 这是每个页面需要执行的任务，获取globalData并setData，实现页面及时渲染
update() {
  	console.log("user页面更新")
    const app = getApp();
    const globalData = app.globalDataPublisher.getGlobalData();
    this.globalData = globalData;
    this.setData({
      ...globalData
    });
  },
```

```javascript
//j s
// 每个页面onLoad时。需要增加订阅者，
onLoad: function(options) {
    const app = getApp();
    app.globalDataPublisher.add(this);// 增加订阅者
    this.globalDataPublisher = app.globalDataPublisher;
    this.globalData = app.globalDataPublisher.getGlobalData();
    this.setData({
      ...this.globalData
    });
  },
```

```javascript
// js 业务功能
// 用来检查是不是全局实时更新
changeName() {
  	console.log("user页面更新，changeName")
    this.globalData.userInfo.name = '前端小学生';
    this.globalDataPublisher.setGlobalData(this.globalData);
  },
  changeJob() {
    console.log("user页面更新，changeJob")
    this.globalData.userInfo.job = '前端打杂';
    this.globalDataPublisher.setGlobalData(this.globalData);
  },
```

