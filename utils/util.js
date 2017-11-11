function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function error(msg) {
  wx.showModal({
    title: '错误',
    content: msg,
    showCancel: false,
    confirmColor: '#0076FF'
  })
}

String.prototype.json = String.prototype.json || function() {
  return JSON.parse(this);
}


let lastTime = 0;
const requestAnimationFrame = 
  requestAnimationFrame || function(callback, element) {
    let currTime = new Date().getTime();
    let timeToCall = Math.max(0, 16 - (currTime - lastTime));
    let id = setTimeout(function() { callback(currTime + timeToCall); }, 
      timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };

const cancelAnimationFrame =  cancelAnimationFrame || function(id) {
  clearTimeout(id);
}

function omit(obj, keys) {
  if (typeof obj === 'undefined' || obj === null
   || !(typeof obj === 'object' || typeof obj === 'function')) {
     return result;
  }

  keys = [].concat.apply([], [].slice.call(arguments, 1));
  var last = keys[keys.length - 1];
  var res = {}, fn;

  if (typeof last === 'function') {
    fn = keys.pop();
  }

  var isFunction = typeof fn === 'function';
  if (!keys.length && !isFunction) {
    return obj;
  }

  var hasOwn = Object.prototype.hasOwnProperty;
  for (var key in obj) {
    if (hasOwn.call(obj, key) && keys.indexOf(key) === -1) {
      if (!isFunction) {
        res[key] = obj[key];
      } else if (fn(obj[key], key, obj)) {
        res[key] = obj[key];
      }
    }
  }
  return res;
}

module.exports = {
  formatTime: formatTime,
  omit,
  MessageBox: {
    error,
  },
  requestAnimationFrame,
  cancelAnimationFrame
}
