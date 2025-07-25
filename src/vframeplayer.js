/**
 * vFramePlayer
 *
 * https://github.com/vmllab-js/FramePlayer | Released under MIT license
 *
 * @author VML-LAB iorilp, RhineLiu
 * @since 2017-06-02
 * @version v1.0.0
 * @link http://vmllab.im20.com.cn
 */
(function (global, factory) {

	"use strict";

	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory(global, true);
	} else if (typeof define === "function" && define.amd) {
		define("vFramePlayer", [], function () {
			return factory(global);
		});
	} else {
		global.vFramePlayer = factory(global);
	}

})(typeof window !== "undefined" ? window : this, function (global, noGlobal) {

	"use strict";

	var vFramePlayer = function (options) {
		var _this = this;
		if (!options) {
			console.log("请设置参数！");
			return;
		}

		//dom
		this.dom = options.dom;
		//开始帧
		this.startFrame = 0;
		//结束帧
		this.endFrame = options.imgArr.length - 1;
		//当前帧
		this.curFrame = 0;
		//上一帧
		this.prevFrame = 0;
		//fps
		this.fps = options.fps || 25;
		//是否canvas播放
		this.useCanvas = options.useCanvas ? true : false;
		//循环播放
		this.loop = options.loop || 0;
		//正序接倒序
		this.yoyo = options.yoyo ? true : false;
		//序列图实例
		this._imgObjArr = [];
		//监听事件
		this._events = {};
		//是否png
		this._isPng = true;
		//是否播放
		this._isPlay = false;
		//循环次数
		this._times = 0;
		//是否正序播放
		this._asc = true;
		//临时变量
		this._temp = {};
		// canvas对象
		this.canvas = null;

		for (var k in options.imgArr) {
			var img = new Image();
			img.src = options.imgArr[k];
			this._imgObjArr.push(img);
		}

		this.init();

	};

	var loadImg = function (imgObj, callback) {
		if (imgObj.complete) {
			callback(imgObj);
		} else {
			imgObj.onload = function () {
				callback(imgObj);
			};
		}
	};

	vFramePlayer.prototype = {
		init: function () {
			var _this = this;
			this.dom.textContent = "";

			if (_this.useCanvas) {

				var canvas = document.createElement('canvas');
				canvas.width = canvas.height = 0;
				canvas.style.width = canvas.style.height = "100%";
				this.ctx = canvas.getContext("2d");
				this.dom.appendChild(canvas);
				this.canvas = canvas;

				loadImg(this._imgObjArr[0], function(imageObj){
					_this.setCanvasWH(imageObj)
				});

			} else {

				_this.mc = document.createElement("div");
				_this.mc.setAttribute("class", "mc");
				_this.mc.style.width = _this.mc.style.height = "100%";
				this.dom.appendChild(_this.mc);
				for (var i = 0; i < this._imgObjArr.length; i++) {
					this._imgObjArr[i].style.opacity = 0;
					this._imgObjArr[i].style.position = "absolute";
					this._imgObjArr[i].style.width = this._imgObjArr[i].style.height = "100%";
					this._imgObjArr[i].style.top = this._imgObjArr[i].style.left = 0;
					_this.mc.appendChild(this._imgObjArr[i]);
				}

			}
		},
		setCanvasWH: function (imageObj) {
			var _this = this;

			_this._isPng = /(\.png(\?|$))|(image\/png;base64)/.test(imageObj.src);
			_this.width = _this.canvas.width = imageObj.width;
			_this.height = _this.canvas.height = imageObj.height;
		},
		//设置参数
		set: function (attr, value) {
			var _temp = this._temp;
			if (arguments.length === 1 && typeof(arguments[0]) === "object") {
				for (var i in arguments[0]) {
					this[i] = arguments[0][i];
				}
			}
			if (arguments.length === 2) {
				this[arguments[0]] = arguments[1]
			}

			if (attr === "useCanvas") {
				this.init();
			}
			if (attr === "fps") {
				if (this._isPlay) {
					clearInterval(this._interval);
					this._process(_temp.onUpdate, _temp.onComplete);
				}
			}
			if (attr === "startFrame") {
				if (!this._isPlay) {
					this.curFrame = this.startFrame
				}
			}
		},
		get: function (attr) {
			return this[attr];
		},
		//播放
		play: function (start, end, options) {

			if (this._isPlay)return;

			var _this = this;
			var argumentsNum = 0;
			var onComplete, onUpdate;

			for (var i in arguments) {
				switch (typeof(arguments[i])) {
					case "number" :
						if (argumentsNum == 0) {
							_this.set("startFrame", arguments[i]);
							argumentsNum++;
						} else {
							_this.set("endFrame", arguments[i]);
						}
						break;
					case "object" :
						if (arguments[i].onComplete)onComplete = arguments[i].onComplete;
						delete arguments[i].onComplete;
						if (arguments[i].onUpdate)onUpdate = arguments[i].onUpdate;
						delete arguments[i].onUpdate;
						_this.set(arguments[i]);
						break;
				}
			}
			_this._temp.onComplete = onComplete;
			_this._temp.onUpdate = onUpdate;

			_this._asc = _this.startFrame < _this.endFrame;
			if (!_this._isPlay)this.trigger("play");

			this._process(onUpdate, onComplete);
		},
		_process: function (onUpdate, onComplete) {
			var _this = this;

			this._interval = setInterval(function () {
				if (_this._imgObjArr[_this.curFrame].complete) {

					if (_this.useCanvas) {
						_this.ctx.clearRect(0, 0, _this.width, _this.height);
						_this.ctx.drawImage(_this._imgObjArr[_this.curFrame], 0, 0, _this.width, _this.height);
					} else {
						_this.mc.childNodes[_this.prevFrame].style.opacity = 0;
						_this.mc.childNodes[_this.curFrame].style.opacity = 1;
					}

					//保存本帧为上一帧
					_this.prevFrame = _this.curFrame;

					//update回调;
					// console.log(_this.curFrame,_this._times+1,_this._asc);
					_this.trigger("update", _this.curFrame, _this._times + 1, _this._asc);
					if (onUpdate)onUpdate(_this.curFrame, _this._times + 1, _this._asc);

					//当yoyo为true时，如果当前帧等于开始或者结束帧 并且 不是第一次播放
					//当yoyo为false时，如果当前帧等于开始或者结束帧 并且 没有进入过判断
					// 防止只配置了一个图，或者 _this.startFrame == _this.endFrame 的情况出现，curFrame判断错误，导致播放其它不相关的图片
					if (
						_this.startFrame == _this.endFrame ||
						(
							(_this.curFrame == _this.endFrame || _this.curFrame == _this.startFrame)
							&& _this._isPlay
							&& !_this._temp.repeat
						)) {

						if (_this.loop && (_this._times + 1 < _this.loop || _this.loop == -1)) {
							if (_this.yoyo) {
								if (_this._asc) {
									_this.curFrame = Math.max(_this.startFrame, _this.endFrame) - 1;
								} else {
									_this.curFrame = Math.min(_this.startFrame, _this.endFrame) + 1;
								}
								_this._asc = !_this._asc;
							} else {
								_this._temp.repeat = true;
								if (_this._asc) {
									_this.curFrame = Math.min(_this.startFrame, _this.endFrame);
								} else {
									_this.curFrame = Math.max(_this.startFrame, _this.endFrame);
								}
							}
							_this._times++;
						} else {
							_this.stop();
							if (onComplete)onComplete();
						}

					} else {
						if (_this._asc) {
							_this.curFrame++;
						} else {
							_this.curFrame--;
						}
						_this._isPlay = true;
						_this._temp.repeat = false;
					}

				}
			}, 1000 / this.fps);
		},
		goto: function (id) {
			var _this = this;
			this.curFrame = id;

			var show = function (imageObj) {
				if (_this.useCanvas) {
					if (!_this.width || !_this.height) {
						_this.setCanvasWH(imageObj)
					}
					_this.ctx.clearRect(0, 0, _this.width, _this.height);
					_this.ctx.drawImage(_this._imgObjArr[_this.curFrame], 0, 0, _this.width, _this.height);
				} else {
					_this.mc.childNodes[_this.prevFrame].style.opacity = 0;
					_this.mc.childNodes[_this.curFrame].style.opacity = 1;
				}
				_this.trigger("update", _this.curFrame, _this._times + 1, _this._asc);
			};

			loadImg(this._imgObjArr[this.curFrame], show);

		},
        // 指定区间内跳跃播放
        // 由于大多数浏览器setInterval能执行的最小时间为10ms，所以一秒能播放的最大帧数也就是100帧左右，
        // 想要突破这个限制，使序列帧看起来能播放的更快，只能使用跳帧的方式模拟快速播放
        // 例：jumpPlay(0, 480, 10)，会播放0-480帧，但是只会播放第10帧，20帧，30帧，40帧，50帧...
        // 支持倒叙播放（start > end），例如：jumpPlay(480, 0, 10)会播放第480帧，470帧，460帧，450帧，440帧...
        // 注：space最小值为1
        jumpPlay: function (startIndex, endIndex, space, callback) {
            if (space < 1) return;

            let timer = null;
            let start = 0
            const temp = []
            let startPlayIndex = startIndex > endIndex ? endIndex : startIndex;
            let endPlayIndex = startIndex > endIndex ? startIndex : endIndex;

			this._isJumpPlay = true;

            for (let i = startPlayIndex; i<= endPlayIndex; i += space) {
                if (startIndex > endIndex) {
                    temp.unshift(i)
                } else {
                    temp.push(i)
                }
            }
            // 手动修正计算误差
            temp.unshift(startIndex)
            temp.push(endIndex)

            timer = setInterval(() => {
                if (start < temp.length-1) {
                    start++
                    this.goto(temp[start])
                }  else {
                    clearInterval(timer)
                    timer = null
					this._isJumpPlay = false;
					if (callback) callback()
                }
            }, 4)
        },
		pause: function () {
			this._isPlay = false;
			this.trigger("pause");
			clearInterval(this._interval);
		},
		stop: function () {
			this._isPlay = false;
			this.trigger("stop");
			this.curFrame = this.startFrame;
			clearInterval(this._interval);
			this._times = 0;
			// this.goto(this.startFrame);
		},
		on: function (events, handler) {
			events = events.split(" ");
			for (var i = 0; i < events.length; ++i) {
				if (!this._events[events[i]]) this._events[events[i]] = [];
				this._events[events[i]].unshift(handler);
			}
			//console.log("on", events, this._events)
			return this;
		},
		one: function (events, handler) {
			var _handler = function () {
				handler();
				this.off(events, _handler);
			};
			return this.on(events, _handler);
		},
		off: function (events, handler) {
			if (events) {
				events = events.split(" ");
				var _events = this._events;
				for (var i = 0; i < events.length; ++i) {
					if (!_events[events[i]]) continue;
					if (!handler) {
						_events[events[i]] = [];
					} else {
						for (var j = _events[events[i]].length - 1; j >= 0; --j) {
							if (_events[events[i]][j] == handler) _events[events[i]].splice(j, 1);
						}
					}
				}
			} else {
				this._events = {};
			}
			//console.log("off", events, this._events)
			return this;
		},
		trigger: function () {
			var events = Array.prototype.shift.call(arguments);
			events = events.split(" ");
			for (var i = 0; i < events.length; ++i) {
				if (this._events[events[i]]) {
					for (var j = this._events[events[i]].length - 1; j >= 0; --j) {
						try {
							this._events[events[i]][j].apply(this, arguments);
						} catch (e) {
							console.log(e);
						}
					}
				}
			}
			//console.log(events)
			return this;
		},
		destroy: function () {
			clearInterval(this._interval);
			this.off();
		}
	};

	return vFramePlayer;
});
