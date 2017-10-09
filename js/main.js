//定义两个对象数据
//分别是drops下落物体对象
//和反弹物体bounces对象
var drops = [],
	bounces = [];
//这里设定重力加速度为0.2/一帧
var gravity = 0.2;
var speed_x_x,
	//横向加速度
	speed_x_y,
	//纵向加速度
	wind_anger;
//风向//画布的像素宽高
var canvasWidth, canvasHeight;
//创建drop的几率
var drop_chance;
//配置对象
var OPTS;
//判断是否有requestAnimationFrame方法，如果有则使用，没有则大约一秒30帧
window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
	window.setTimeout(callback, 1000 / 30);
};


var Vector = function(x, y) {
	//私有属性  横向速度x ,纵向速度y
	this.x = x || 0;
	this.y = y || 0;
};
//公有方法- add : 速度改变函数,根据参数对速度进行增加
//由于业务需求，考虑的都是下落加速的情况，故没有减速的，后期可拓展
/*
 * @param v  object || string  
 */
Vector.prototype.add = function(v) {
	if (v.x != null && v.y != null) {
		this.x += v.x;
		this.y += v.y;
	} else {
		this.x += v;
		this.y += v;
	}
	return this;
};
//公有方法- copy : 复制一个vector，来用作保存之前速度节点的记录
Vector.prototype.copy = function() {
	//返回一个同等速度属性的Vector实例
	return new Vector(this.x, this.y);
};



//构造函数 Drop

var Drop = function() {
	//随机设置drop的初始坐标 
	//首先随机选择下落对象是从从哪一边
	var randomEdge = Math.random() * 2;
	if (randomEdge > 1) {
		this.pos = new Vector(-80 + Math.random() * canvas.width, 80);
	} else {
		this.pos = new Vector(canvas.width, Math.random() * canvas.height);
	}

	//设置下落元素的大小
	//通过调用的OPTS函数的半径范围进行随机取值
	this.radius = (OPTS.size_range[0] + Math.random() * OPTS.size_range[1]) * DPR;

	//获得drop初始速度
	//通过调用的OPTS函数的速度范围进行随机取值
	this.speed = (OPTS.speed[0] + Math.random() * OPTS.speed[1]) * DPR;

	this.prev = this.pos;
	//将角度乘以 0.017453293 （2PI/360）即可转换为弧度。
	var eachAnger = 0.017453293;
	//获得风向的角度
	wind_anger = OPTS.wind_direction * eachAnger;
	//获得横向加速度 
	speed_x = this.speed * Math.cos(wind_anger);
	//获得纵向加速度
	speed_y = -this.speed * Math.sin(wind_anger);

	//绑定一个速度实例
	this.vel = new Vector(1, 1);

};

Drop.prototype.update = function() {

	this.prev = this.pos.copy();
	//如果是有重力的情况，则纵向速度进行增加
	if (OPTS.hasGravity) {
		this.vel.y += gravity;
	}
	//
	this.pos.add(this.vel);
};


Drop.prototype.draw = function() {

	ctx.beginPath();
	ctx.moveTo(this.pos.x, this.pos.y);
	//目前只分为两种情况，一种是rain  即贝塞尔曲线
	if (OPTS.type == "rain") {
		ctx.moveTo(this.prev.x, this.prev.y);
		var ax = Math.abs(this.radius * Math.cos(wind_anger));
		var ay = Math.abs(this.radius * Math.sin(wind_anger));
		ctx.bezierCurveTo(this.pos.x + ax, this.pos.y + ay, this.prev.x + ax, this.prev.y + ay, this.pos.x, this.pos.y);
		ctx.stroke();

		//另一种是snow--即圆形     
	} else {
		ctx.moveTo(this.pos.x, this.pos.y);
		ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
	}
};

var Bounce = function(x, y) {

	var dist = Math.random() * 7;
	var angle = Math.PI + Math.random() * Math.PI;

	this.pos = new Vector(x, y);
	this.radius = 0.2 + Math.random() * 0.8;
	this.vel = new Vector(
		Math.cos(angle) * dist,
		Math.sin(angle) * dist
	);
};

Bounce.prototype.update = function() {

	this.vel.y += gravity;

	this.vel.x *= 0.95;
	this.vel.y *= 0.95;

	this.pos.add(this.vel);
};

Bounce.prototype.draw = function() {

	ctx.beginPath();
	ctx.arc(this.pos.x, this.pos.y, this.radius * DPR, 0, Math.PI * 2);
	ctx.fill();

};



function update() {

	var d = new Date;
	for(var i=0;i<1;i++){
		var obj = new Drop();
		drops.push(obj);
	};
	//清理画图
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	

	var i = drops.length;
	console.log(i);
	while (i--) {

		var drop = drops[i];

		drop.update();
		//如果drop实例下降到底部，则需要在drops数组中清楚该实例对象
		if (drop.pos.y >= canvas.height) {
			//如果需要回弹，则在bouncess数组中加入bounce实例
			if (OPTS.hasBounce) {
				var n = Math.round(4 + Math.random() * 4);
				while (n--)
					bounces.push(new Bounce(drop.pos.x, canvas.height));
			}
			//如果drop实例下降到底部，则需要在drops数组中清楚该实例对象
			drops.splice(i, 1);
		}

		drop.draw();
	}
	//如果需要回弹
	if (OPTS.hasBounce) {
		var i = bounces.length;
		while (i--) {
			var bounce = bounces[i];
			bounce.update();
			bounce.draw();
			if (bounce.pos.y > canvas.height) bounces.splice(i, 1);
		}
	}
	//每次产生的数量
	if (drops.length < OPTS.maxNum) {
		if (Math.random() < drop_chance) {
			var i = 0,
				len = OPTS.numLevel;
			for (; i < len; i++) {
				drops.push(new Drop());
			}
		}

	}
	//不断循环update
	requestAnimFrame(update);
}


function init(opts) {
	OPTS = opts;

	canvas = document.getElementById(opts.id);
	ctx = canvas.getContext("2d");

	////兼容高清屏幕，canvas画布像素也要相应改变
	DPR = window.devicePixelRatio;

	//canvas画板像素大小， 需兼容高清屏幕，故画板canvas长宽应该乘于DPR
	canvasWidth = canvas.clientWidth * DPR;
	canvasHeight = canvas.clientHeight * DPR;

	//设置画板宽高
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	update();
	drop_chance = 0.4;
	//设置样式
	setStyle();
}

function setStyle() {
	if (OPTS.type == "rain") {
		ctx.lineWidth = 1 * DPR;
		ctx.strokeStyle = 'rgba(223,223,223,0.6)';
		ctx.fillStyle = 'rgba(223,223,223,0.6)';

	} else {
		ctx.lineWidth = 2 * DPR;
		ctx.strokeStyle = 'rgba(254,254,254,0.8)';
		ctx.fillStyle = 'rgba(254,254,254,0.8)';
	}
}