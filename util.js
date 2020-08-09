var sMD5 = require("MD5.js");

const formatTime = (date, str) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join(str) + ' ' + [hour, minute, second].map(formatNumber).join(':')
}


// 完成sql那样的对应key等于某一个值
const selectKeyToValue = (arr, obj) => {
  var newArr = [];
  var ii = 0;
  for (let i = 0; i < arr.length; i++) {
    var flag = true;
    for (let key in obj) {
      if (arr[i][key] != obj[key] && obj[key] != '') {
        flag = false;
      }
    }
    if (flag) {
      newArr[ii++] = arr[i]
    }
  }
  return newArr;
}
// 完成sql那样的对应key删除某一个值
const deleteKeyToValue = (arr, obj) => {
  var newArr = [];
  var ii = 0;
  for (let i = 0; i < arr.length; i++) {
    // var flag = true;
    for (let key in obj) {
      if (arr[i][key] != obj[key]) {
        newArr[ii++] = arr[i]
        break
      }
    }
    // if (!flag) {

    // }
  }
  return newArr;
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const timeGap = (time) => {
  var date = new Date();
  var now = formatTime(date, '/')
  return ((new Date(now).getTime()) - (new Date(time).getTime()));
}

function md5(filePath) {
  return new Promise(
    function (resolve, reject) {
      wx.getFileSystemManager().readFile({
        filePath: filePath, //选择图片返回的相对路径
        // encoding: 'binary', //编码格式
        success: res => {
          //成功的回调
          // console.log('data:image/png;base64,', res)
          // console.log(res.data)
          var spark = new sMD5.ArrayBuffer();
          spark.append(res.data);
          var hexHash = spark.end(false);
          console.log(hexHash)
          resolve(hexHash);
        }
      })
    }
  )

}

// 计算距离
function getDistance(lat1, lng1, lat2, lng2) {
  var radLat1 = lat1 * Math.PI / 180.0;
  var radLat2 = lat2 * Math.PI / 180.0;
  var a = radLat1 - radLat2;
  var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
  s = s * 6378.137; // EARTH_RADIUS;
  s = (Math.round(s * 10000) / 10).toFixed(2);
  return s;
}


// 放消息提示音
function audioPlay() {
  const innerAudioContext = wx.createInnerAudioContext();
  innerAudioContext.autoplay = true;
  innerAudioContext.src = '/audio/12604.mp3';//链接到音频的地址
  innerAudioContext.onPlay(() => { });
  innerAudioContext.onError((res) => {//打印错误
    console.log(res)
    console.log(res.errMsg);
    console.log(res.errCode);
  })
}

//用户定位
const getLoca = new Promise(function (resolve, reject) {
  wx.getLocation({
    type: 'wgs84', //wgs84 返回 gps 坐标
    success: (res) => {
      return resolve({
        userLatitude: res.latitude,
        userLongitude: res.longitude
      })
    },
    fail: (res) => { //用户拒绝授权位置信息，再次请求
      wx.getLocation({
        type: 'wgs84',
        success: (res) => {
          return resolve({
            userLatitude: res.latitude,
            userLongitude: res.longitude
          })
        },
        fail: (res) => { //再次请求仍然拒绝，取默认值
          res.latitude = '25.859043'
          res.longitude = '114.913843'
          return resolve({
            userLatitude: res.latitude,
            userLongitude: res.longitude
          })
        }
      })
    }
  })
})

function makeQuery(queryObject) {
  const query = Object.entries(queryObject)
    .reduce((result, entry) => {
      result.push(entry.join('='))
      return result
    }, []).join('&')
  return `${query}`
}

// 判断obj是不是空对象
function objHaveItem(obj) {
  for (var i in obj) { // 如果不为空，则会执行到这一步，返回true
    return true
  }
  return false // 如果为空,返回false
}

module.exports = {
  formatTime: formatTime,
  timeGap: timeGap,
  md5: md5,
  Update: Update,
  selectKeyToValue: selectKeyToValue,
  deleteKeyToValue: deleteKeyToValue,
  getDistance: getDistance,
  audioPlay: audioPlay,
  objHaveItem: objHaveItem
}