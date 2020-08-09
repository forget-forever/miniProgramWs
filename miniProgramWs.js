// 确定收到消息的模板
const protocal = {
  A: [1],
  H: 'chathub',
  M: 'userConnected'
};
// 心跳报文的模板
const heartBeat = {
  A: [],
  H: 'chathub',
  M: 'doHeart'
}
import {
  formatTime,
  selectKeyToValue,
  deleteKeyToValue,
  audioPlay
} from 'util.js'


export class HubConnection {

  constructor() {
    // 连接状态，true连接成功，false连接断开
    this.openStatus = false;

    // 连接的实体对象
    this.connection = {};

    // ws的连接地址，可在这定义，也可在调用的new中传进来
    this.url = "";

    // 发信息的条数，自动累加
    this.invocationId = 0;
  }


  start(url, queryString) {
    // 连接前的一些准备工作，鉴权之类和一些参数的额准备的准备
    this.startSocket('');

  }

  startSocket(url) {
    
    this.connection = wx.connectSocket({
      url: url,
      // header: {
      //   'Cache-Control': 'no-cache',
      //   Pragma: 'no-cache',
      //   Cookie: 'p_token=' + p_token,
      //   Connection: 'Upgrade',
      //   Upgrade: 'websocket'
      // },
      timeout: 1000 * 10,
      method: "post"
    })

    // 保留作用域，也可以使用bind改变
    const _aa = this;
    this.connection.onOpen(res => {
      console.log(`websocket connectioned to ${this.url}`);
      _aa.timeStamp = new Date().getTime();
      if (_aa.doHeartBeatNow != true) {
        setTimeout(function () {
          doHeart();
        }, 1000 * 120)
      }
      this.openStatus = true;
      this.onOpen(res);
    });


    // 心跳函数，大部分的websocket都需要有一个轮询来确定是否还连接着
    function doHeart() {
      console.log("心跳一次")
      _aa.sendData(heartBeat);
      if (_aa.openStatus) {
        _aa.doHeartBeatNow = true
        setTimeout(function () {
          doHeart();
        }, 1000 * 120)
      } else {
        // 轮询已经停止
        _aa.doHeartBeatNow = false
      }
    }


    // 监听websocket关闭的事件
    this.connection.onClose(res => {
      wx.hideLoading()
      console.log(`websocket disconnection`);
      this.connection = null;
      this.openStatus = false;
      this.onClose(res);
    });

    this.connection.onError(res => {
      console.log(res);
      var msg = "connect error"
      // console.error(`websocket error msg: ${msg}`);
      this.close({
        reason: msg
      });
      this.onError(res)
    });

    this.connection.onMessage(res => this.receive(res));
  }


  on(method, fun) {
    // ws连接成功时的处理的函数
    
  }

  onOpen(data) {
    // ws打开时的事件
  }

  onClose(msg) {
    // ws关闭时的事件
    // this.start(urlSource, queryStringSource)
    console.log('onclose')
    if (this.listPage != undefined) {
      this.listPage.check();
    }
    if (this.chatPage != undefined) {
      this.chatPage.check();
    }
  }

  onError(msg) {
    console.log('onerror')
    if (this.listPage != undefined) {
      this.listPage.check();
    }
    if (this.chatPage != undefined) {
      this.chatPage.check();
    }
  }


  close(data) {
    if (data) {
      this.connection.close(data);
    } else {
      this.connection.close();
    }
    this.openStatus = false;
  }

  sendData(data, success, fail, complete) {
    // ws发送报文的函数
    //  data为报文的数据，success为成功的回调，fail为发送失败的回调，complete为都执行的回调


    // 以下为发送的范例，仅供参考
    
    // 第几条数据，自动累加
    data.I = this.invocationId == null ? 0 : this.invocationId

    // 发送的报文类型
    data.H = 'chathub'

    // 报文的正文
    data.M = data.M == undefined ? "sendMessage" : data.M


    this.connection.send({
      data: JSON.stringify(data), //发送的数据，ws只能发送字符串
      success: success,
      fail: fail,
      complete: complete
    });
    this.invocationId++;

    // 这两个是发送之后的一个回调
    if (this.listPage != undefined) {
      this.listPage.check();
    }
    if (this.chatPage != undefined) {
      this.chatPage.check();
    }
  }

  delOneValue(arr, value) {
    var newArr = []
    var j = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] != value) {
        newArr[j++] = arr[i]
      }
    }
    return newArr;
  }

  // 显示消息的
  displayMsg(data) {
    if (this.app.pageNow.data.openStatus == undefined) {
      var page = this.app.pageNow;
      if (page.data.msgNotice == undefined || page.data.msgNotice.displayNoticeNow == false) {
        data.displayNoticeNow = true
        page.setData({
          msgNotice: data
        })

        setTimeout(() => {
          page.data.msgNotice.displayNoticeNow = false
          page.setData({
            msgNotice: page.data.msgNotice
          })
        }, 3000)
      }else{
        data.displayNoticeNow = true
        page.setData({
          msgNotice: data
        })
      }
    }
  }

  // 监听收到消息的事件
  receive(data) {
    this.timeStamp = new Date().getTime();

    // 收到消息之后发送确认收到的请求
    if (this.invocationId == 0) {
      this.sendData(protocal);
    }
    // ws都为字符串，所以要js来json序列化
    data.data = JSON.parse(data.data)


    // 以下为本人做的聊天软件的收到消息的处理方式，进攻参考
    if (data.data.R != undefined && data.data.R.Result != undefined && data.data.R.Result.OfflineMsgs == undefined && data.data.R.Result.UserName != undefined) {
      if (this.chatPage != undefined && this.chatPage.data.shopCode == data.data.R.Result.ShopCode) {
        this.chatPage.data.msgStatus.shopSender = data.data.R.Result.UserName
        this.chatPage.setData({
          msgStatus: this.chatPage.data.msgStatus,
          online: data.data.R.Result.IsOnline
        })
      }
      if (this.openStatus && this.listPage != undefined && this.hatPage != undefined) {
        this.listPage.check();
        this.chatPage.check();
      }
    }
    // 这是收到了消息的
    if (data.data.M != undefined && data.data.M.length > 0 && data.data.M[0].A[0].ShopCode != undefined) {
      console.log(data)

      // 给列表的数据
      var chatList = wx.getStorageSync('chatList') ? wx.getStorageSync('chatList') : []
      chatList = deleteKeyToValue(chatList, {
        shopCode: data.data.M[0].A[0].ShopCode
      })
      var recData = {};
      recData.shopCode = data.data.M[0].A[0].ShopCode;
      recData.shopName = data.data.M[0].A[0].ShopName;
      recData.shopSender = data.data.M[0].A[0].Sender;
      recData.Avatar = data.data.M[0].A[0].SendAvatar;
      chatList.unshift(recData);
      if (chatList.length > 20) {
        for (let i = 20; i < chatList.length; i++) {
          wx.removeStorageSync('Msg' + chatList[i].shopCode);
        }
      }
      wx.setStorageSync('chatList', chatList.slice(0, 20));

      // 聊天记录的
      var chatMsg = wx.getStorageSync('Msg' + data.data.M[0].A[0].ShopCode) ? wx.getStorageSync('Msg' + data.data.M[0].A[0].ShopCode) : []
      chatMsg.push({
        value: data.data.M[0].A[0].Content,
        time: formatTime(new Date(data.data.M[0].A[0].Timestamp), '-'),
        type: 0
      })
      // chatMsg = this.cutArray(chatMsg);
      chatMsg = chatMsg.slice(-200, chatMsg.length)
      wx.setStorageSync('Msg' + data.data.M[0].A[0].ShopCode, chatMsg)
      this.sendData({
        A: [
          [data.data.M[0].A[0].MsgId]
        ],
        M: "RecMsgs"
      })
      audioPlay();
      this.displayMsg(data.data.M[0].A[0])
    }
    // 这是未读消息的
    if (data.data.R != undefined && data.data.R.Result != undefined && data.data.R.Result.OfflineMsgs != undefined && data.data.R.Result.OfflineMsgs.length > 0) {
      console.log(data)
      var item = data.data.R.Result.OfflineMsgs
      var msgList = [];
      for (let i = 0; i < item.length; i++) {

        // 列表的数据
        var chatList = wx.getStorageSync('chatList') ? wx.getStorageSync('chatList') : []
        chatList = deleteKeyToValue(chatList, {
          shopCode: item[i].ShopCode
        })
        var recData = {};
        recData.shopCode = item[i].ShopCode;
        recData.shopName = item[i].ShopName;
        recData.shopSender = item[i].Sender;
        recData.Avatar = item[i].SendAvatar;
        chatList.unshift(recData);
        if (chatList.length > 20) {
          for (let i = 20; i < chatList.length; i++) {
            wx.removeStorageSync('Msg' + chatList[i].shopCode);
          }
        }
        wx.setStorageSync('chatList', chatList.slice(0, 20));

        // 聊天记录的
        var chatMsg = wx.getStorageSync('Msg' + item[i].ShopCode) ? wx.getStorageSync('Msg' + item[i].ShopCode) : [];
        chatMsg.push({
          value: item[i].Content,
          time: formatTime(new Date(item[i].Timestamp), '-'),
          type: 0
        })
        chatMsg = chatMsg.slice(-200, chatMsg.length)
        wx.setStorageSync('Msg' + item[i].ShopCode, chatMsg)
        msgList[i] = item[i].MsgId
      }
      this.sendData({
        A: [msgList],
        M: "RecMsgs"
      })
      audioPlay();
    }
    // if(data.data != {}){
    //   console.log("aaaa")
    //   console.log(data.data)
    if (data.data.R != undefined || data.data.M != undefined || data.data.I != undefined) {
      if (this.listPage != undefined) {
        this.listPage.check();
      }
      if (this.chatPage != undefined) {
        this.chatPage.check();
      }
    }
  }

  // 发送消息的函数
  send(arg) {
    this.sendData(arg.data, arg.success, arg.fail, arg.complete);

  }

}