# 使用发布订阅模式+globalData实现小程序全局实时状态管理
## 前言

> 在小程序的中，虽然有globalData这种全局唯一数据存储，但是每个page并不能感知globalData是否发生了变化继而去更新page的data。比如A页面改变了globalData，但是B页面并不能知道globalData改变了，B页面只能在onShow这个生命周期中去重新获取globalData，并setData
>
> 甚至在同一个页面中，我改变了globalData，但页面并不知道，必须手动去setData，这样页面中的数据才会重新渲染
>
> 于是我想是不是可以使用观察者模式，让globalData一改变，全部页面就更新数据呢
> 当然，这个只是一个思路，并没有考虑多次setData降低性能，你在看这篇博客时，可以当作是学习观察者模式，哈哈，当然，如果能点个赞最好了，谢谢
>
> 二更，修bug。小程序每个页面的js文件都是Page(对象)，使用Reflect和Proxy对（对象）进行代理，使得只有路由栈在当前页面才setData，并且减少耦合

## 什么是观察者模式？
>经评论区指正，改正了用词，感谢
>![one](https://user-gold-cdn.xitu.io/2020/3/26/171168cf2cd15f81?w=285&h=406&f=jpeg&s=21156)

观察者模式，有两个角色，一个是目标，一个是观察者。可以形象的比喻为老师和学生

老师在台上讲课（发布消息，触发事件），学生在台下听课（接受消息）然后吸收知识（执行任务）
如果老师觉得你在开小差，他会让你滚出教室（删除观察者）

老师觉得你反省的差不多了，他会让你进入教室（增加观察者）

```javascript
class Teacher{
  constructor(){
    this.students=[];//用来存储学生，即是存储观察者
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

> 目标有三个能力：
>
> 1. 增加观察者
> 2. 删除观察者
> 3. 通知观察者执行某一个任务
>
> 观察者有一个能力：
>
> 1. 执行任务



## 在小程序中使用观察者模式

小程序目录如下

![image-20200326133153437](https://user-gold-cdn.xitu.io/2020/3/26/171157ba12d8d74b?w=248&h=286&f=jpeg&s=14593)

在publisher.js中

```javascript
class Publisher {//发布者
  constructor() {
    this.observers = [];//存储观察者
  }
  add(observer) {//增加观察者
    this.observers.push(observer);
  }
  remove(observer) {//删除观察者
    this.observers.forEach((item, index) => {
      if (item == observer) {
        this.observers.splice(index, 1);
        return;
      }
    });
  }
  notify() {// 向观察者发布消息
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
  setGlobalData(globalData) {// globalData一旦变化，就通知观察者
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

![image-20200326133711366](https://user-gold-cdn.xitu.io/2020/3/26/171157ba15f0b903?w=250&h=415&f=jpeg&s=17671)

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
// 每个页面onLoad时。需要增加观察者，
onLoad: function(options) {
    const app = getApp();
    app.globalDataPublisher.add(this);// 增加观察者
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

![a901b08c-1a46-453c-b463-d20c7fc86008](https://user-gold-cdn.xitu.io/2020/3/26/171157ba15a5858d?w=648&h=500&f=gif&s=10022079)

先点击四个tabBar页面实现注册观察者，然后点击修改名字，会发现其他页面也更新了globalData并setData



## 二更，使用Reflect和 Proxy对page进行代理

如果每个页面都需要去添加注册观察者的代码，和update函数就太麻烦了。

我们可以发现小程序每个页面都是Page(对象)， 我们可以对(对象)进行代理和反射，将我们需要的代码加上去，

```javascript
function createProxyPage(objProps){
  Reflect.set(objProps,"update",function(){
    ...代码同上面的
  })
  return objProps
}
Page(createProxyPage{
     data:{}
		...
})
```

这样就可以用createProxyPage让每个页面轻松添加上来update函数

那onLoad生命周期中的代码我要怎么添加呢，还不能覆盖原来的onLoad

```javascript
function createProxyPage(objProxy) {
  Reflect.set(...)
  const proxyPage = new Proxy(objProxy, {
    get(target, prop) {
      if (prop === 'onLoad') {
        // 对onLoad函数进行代理
        Reflect.set(
          target,
          prop,
          new Proxy(target[prop], {
            //onLoad一执行，就会调用下面的代理
            apply(target, thisArgument, argumentsList) {
              //thisArgument就是调用onLoad函数的page对象
              const app = getApp();
              app.globalDataPublisher.add(thisArgument);
              thisArgument.globalDataPublisher = app.globalDataPublisher;
              thisArgument.globalData = app.globalDataPublisher.getGlobalData();
              thisArgument.setData({
                ...thisArgument.globalData
              });
              //执行完注册观察者代码后，再去执行每个页面onLoad中原有的代码
              //即是不会覆盖每个页面的onLoad函数，onLoad函数照常执行
              return Reflect.apply(target, thisArgument, argumentsList);
            }
          })
        );
      }
    }
  });
}

```

完整代码如下

```javascript
function createProxyPage(objProps) {
  Reflect.set(objProps, 'update', function() {
    console.log('update更新数据');
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    if (this === page) {
      const app = getApp();
      const globalData = app.globalDataPublisher.getGlobalData();
      this.globalData = globalData;
      this.setData({
        ...globalData
      });
    }
  });
  const proxyPage = new Proxy(
    objProps,

    {
      get(target, prop) {
        if (prop === 'onShow') {
          Reflect.set(
            target,
            prop,
            new Proxy(target[prop], {
              apply(target, thisArgument, argumentsList) {
                const app = getApp();
                thisArgument.globalData = app.globalDataPublisher.getGlobalData();
                thisArgument.setData({
                  ...thisArgument.globalData
                });
                console.log('onShow更新数据');
                return Reflect.apply(target, thisArgument, argumentsList);
              }
            })
          );
          if (prop === 'onLoad') {
            Reflect.set(
              target,
              prop,
              new Proxy(target[prop], {
                apply(target, thisArgument, argumentsList) {
                  const app = getApp();
                  app.globalDataPublisher.add(thisArgument);
                  thisArgument.globalDataPublisher = app.globalDataPublisher;
                  thisArgument.globalData = app.globalDataPublisher.getGlobalData();
                  thisArgument.setData({
                    ...thisArgument.globalData
                  });
                  return Reflect.apply(target, thisArgument, argumentsList);
                }
              })
            );
          }
        }
        return Reflect.get(target, prop);
      }
    }
  );
  return proxyPage;
}
module.exports.createProxyPage = createProxyPage;

```



具体代码在下面链接中：

https://github.com/huzhiwu1/globalDataPublisher

## 结语

作者：胡志武

时间：2020/03/26

如果有错漏处，请指正。看官们点个赞吧
