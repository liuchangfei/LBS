// --------------------------------------------------------------------------
//
// CustomData class
//
// --------------------------------------------------------------------------
var isMutilMode = false;
var CustomData = function(mapControl) {
	
	var self = this;
	var trackSteps = 40;
	var states = ["行驶中", "静止", "离线"];
	var geoc = new BMap.Geocoder();
	var parseTracksNum = 0;
	
	var testSingleData = {                        
        "id": "20170822001002",             //订单编号
        "status": "行驶中",                    //车辆状态 分别为"行驶中"|"静止"|"离线"
        "startPos": {                       //起点信息
            "addr": "四川省成都市双流县",          //起点地址
            "pos": []                       //起点经纬度信息(没有可以不传)
        },
        "endPos": {                         //终点点信息
            "addr": "北京市海淀区",              //终点地址
            "pos": []                       //终点经纬度信息(没有可以不传)
        },
        "addr": "解析中...",               //车辆行驶到当前点地址
        "portraitUrl": null,            //司机头像图片url
        "name": "王大三",                  //司机名称
        "tel": "13870891910",             //司机联系电话
        "driveTime": "",                //司机驾龄
        "carNumber": "川A888777",        //车牌号
        "company": "成都余氏东风货运",          //司机所属公司名称
        "consignor": "张三",              //发货人
        "consignee": "李四",              //收货人
        "transportType": "冷运",          //运输类型
        "containerTemp": "-2℃",         //容器温度
        "outdoorTemp": "38℃",           //室外温度,
        "goods": [                      //车辆运送货物信息列表
        {        
            "name": "货物1",              //货物名称
            "factory":"国药1",            //生产厂家
            "number": 1                 //货物数量
        },
        { 
            "name": "货物2",
            "factory":"国药2",
            "number": 6
        },
        {
            "name": "货物3",
            "factory":"国药3",
            "number": 5
        },
        {
            "name": "货物4",
            "factory":"国药4",
            "number": 3
        }
       ] 
    };
    
    var testMutilData = [
    	{
        	"id": "20170822001002",             //订单编号
            "status": "行驶中",                    //车辆状态 分别为"行驶中"|"静止"|"离线"
            "addr": "解析中...",                   //当前车辆位置地址
            "startPos": {                       //起点信息
                "addr": "四川省成都市双流县",          //起点地址
                "pos": []                       //起点经纬度信息(没有可以不传)
            },
            "endPos": {                         //终点点信息
                "addr": "北京市海淀区",              //终点地址
                "pos": []                       //终点经纬度信息(没有可以不传)
            }
        },
        {
            "id": "20170822001001",             //订单编号
            "status": "行驶中",                    //车辆状态 分别为"行驶中"|"静止"|"离线"
            "addr": "解析中...",                   //当前车辆位置地址
            "startPos": {                       //起点信息
                "addr": "四川省成都市武侯区",          //起点地址
                "pos": []                       //起点经纬度信息(没有可以不传)
            },
            "endPos": {                         //终点点信息
                "addr": "上海市",                  //终点地址
                "pos": []                       //终点经纬度信息(没有可以不传)
            }
        }
    ];
    
    /**
     * 加载初始化数据的方法
     * @param data 初始化数据
     * @param isMutil 是否是多项数据，若是则用车辆列表模式渲染界面；否则用单个车辆信息模式渲染界面。默认为false
     */
    this.load = function(data, isMutil) {
    	isMutilMode = isMutil === true;
    	if(Object.prototype.toString.call(data) === "[object String]") {
    		data = JSON.parse(data);
    	}
    	if(!data) {
    		data = isMutilMode ? testMutilData : testSingleData;
    	}
    	isMutilMode ? loadMutilData(data) : loadSingleData(data);
    };
    
    var loadSingleData = function(data) {
    	parseTracksNum = 0;
        self.searchWay(data, data.startPos.addr, data.endPos.addr);
         //等全部数据生成完毕后，进行地图初始化
        var timer = setInterval(function() {
            if(parseTracksNum === 1){
                clearInterval(timer);
                mapControl.init([data]);
            }
        }, 50);
    };
    
    var loadMutilData = function(data) {
    	if(Object.prototype.toString.call(data) !== "[object Array]" || data.length === 0) {
    		alert("初始化数据为空。");
    		return;
    	}
    	mapControl.init(data);
//    	parseTracksNum = 0;
//    	var n = data.length;
//    	for(var i = 0; i < n; i++) {
//    		var track = data[i];
//            self.searchWay(track, track.startPos.addr, track.endPos.addr);
//    	}
//    	//等全部数据生成完毕后，进行地图初始化
//        var timer = setInterval(function() {
//            if(parseTracksNum === n){
//                clearInterval(timer);
//                mapControl.init(data);
//            }
//        }, 50);
    };
	
	this.createCarsInfo = function(n) {
        var carsInfo = [];
        for(var i = 0; i < n; i++) {
            var carInfo = {
                id:i+1, 
                status:states[i%3],
                pos:[104.06 - 0.2*Math.random(), 30.67 - 0.2*Math.random()],
                time:new Date().Format("yyyy-MM-dd hh:mm:ss"),
                portraitUrl:null,
                name:"司机" + (i+1),
                tel:13500000000 + parseInt(Math.random()*100000),
                driveTime:parseInt(Math.random()*10+1) + "年",
                carNumber:"川A" +　(100000 + parseInt(Math.random()*900000+1))
            };
            carsInfo.push(carInfo);
        }
        return carsInfo;
    };
    
    this.createTracksInfo = function(n) {
    	if(isNaN(n)) {
    		var initData;
    		try{
    			//从本地磁盘读取初始化数据
    			var jsonStr = LocalStorageUtil.readFromDB("tracksInfo");
    			initData = jsonStr ? JSON.parse(jsonStr) : jsonData;
    		} catch(e) {
    			//若从本地磁盘读取初始化数据失败，则从js/data.js文件读取
    			initData = jsonData
    		}
    		initTempData(initData[0]);
    		setTempData();
    		mapControl.init(initData);
    		return initData;
    	}
    	parseTracksNum = 0;
    	
    	var getGoodsInfo = function(id) {
    		var goods = [];
    		var n = Math.ceil(15 * Math.random());
    		for(var i = 0; i < n; i++) {
    			goods.push({id:id+"_"+(i+1), name:"货物"+(i+1), number:Math.ceil(20 * Math.random())});
    		}
    		return goods;
    	};
    	
        var tracksInfo = [];
        for(var i = 0; i < n; i++) {
            var startPos = [104.06+12*Math.random(), 30.67+9*Math.random()];
            var endPos = [104.06+12*Math.random(), 30.67+9*Math.random()];
            var trackInfo = {
                id:i+1000001, 
                status:states[i%3],
                startPos:null,
                endPos:null,
                currentPos:null,
                portraitUrl:null,
                name:"司机" + (i+1),
                tel:13500000000 + parseInt(Math.random()*100000),
                driveTime:parseInt(Math.random()*10+1) + "年",
                carNumber:"川A" +　(100000 + parseInt(Math.random()*900000+1)),
                company:"成都余氏东风货运",//运输公司
                consignor:"LUNA",//发货人
                consignee:"LUNA",//收货人
                transportType:"冷运",//运输类型
                containerTemp:parseInt(Math.random()*5),//货柜温度
                outdoorTemp:parseInt(Math.random()*10 + 15),//室外温度
                posList:[],
                goods:getGoodsInfo(i+1000001)
            };
            self.searchWay(trackInfo, startPos, endPos);
            tracksInfo.push(trackInfo);
        }
        
        //等全部数据生成完毕后，进行地图初始化
        var timer = setInterval(function(){
        	if(parseTracksNum === n){
        		clearInterval(timer);
        		mapControl.init(tracksInfo);
        		//console.log(JSON.stringify(tracksInfo));
        		//把生成的初始化数据存入本地磁盘
        		LocalStorageUtil.saveToDB("tracksInfo", JSON.stringify(tracksInfo));
        	}
        }, 50);
        return tracksInfo;
    };
    
    this.searchWay = function(trackInfo, startPos, endPos) {
    	if(!startPos || !endPos) {
    		alert("您的起点或者终点地址有误!");
    		return;
    	}
        var driving = new BMap.DrivingRoute(mapControl.map());
        var start, end;
        if(Object.prototype.toString.call(startPos) === "[object String]" || Object.prototype.toString.call(startPos) === "[object String]") {
            geoc.getPoint(startPos, function(point){
                if (point) {
                    start = point;
                    geoc.getPoint(endPos, function(point){
                        if (point) {
                            end = point;
                            a();
                        }else{
                            alert("您的终点地址没有解析到结果!");
                        }
                    });
                }else{
                    alert("您的起点地址没有解析到结果!");
                }
            });
        } else {
        	start = new BMap.Point(startPos[0], startPos[1]);
            end = new BMap.Point(endPos[0], endPos[1]);
            a();
        }
        function a() {
        	driving.search(start, end);
        	var i = 0;
            driving.setSearchCompleteCallback(function(results){
            	//立即移除搜索路径成功响应回调，否则可能搜索一次后进入多次回调
            	driving.setSearchCompleteCallback(null);
            	
                var route = results.getPlan(0).getRoute(0);
                var stepsNum = route.getNumSteps();
                var points = [];
                for(var i = 0; i < stepsNum; i++) {
                    var step = route.getStep(i);
                    var point = step.getPosition();
                    points.push(point);
                }
                var plan = {path:[]};
                trackInfo.plan = plan;
                var path = route.getPath();
                for(var i = 0, len = path.length; i < len; i++) {
                    var p = path[i];
                    plan.path.push([p.lng, p.lat]);
                }
                var callBack = function(result) {
                    trackInfo.plan.steps = result;
                    trackInfo.startPos = result[0];
                    trackInfo.endPos = result[result.length-1];
                    var posList = getPosList(plan.path, parseInt(Math.random() * (plan.path.length-1)));
                    trackInfo.posList = posList;
                    trackInfo.currentPos = posList[posList.length-1];
                    parseTracksNum++;
                }
                parseLocaltion(points, callBack);
            });
        }
    };
    
    this.updateTracks = function(time) {
    	setInterval(function(){
            for(var i = 0, len = tracksData.length; i < len; i++) {
                var data = tracksData[i];
                if(data.status === "行驶中") {
                    var nextNum = data.posList.length + 1;
                    if(nextNum >= trackSteps) {
                        nextNum = trackSteps
                    }
                    if(data.posList.length < data.plan.path.length) {
                        var list = getPosList(data.plan.path, data.posList.length+1);
                        var current = list[list.length-1];
                        data.currentPos = current;
                        mapControl.updateTrack(data);
                        data.posList.push(current);
                        mapControl.selectTrack(data.id, true);
                    } else {
                        continue;
                    }
                }
            }
        }, isNaN(time) ? 1000 : time);
    };
    
    this.updateCars = function(time) {
    	setInterval(function(){
            for(var i = 0, len = carsData.length; i < len; i++) {
                var data = carsData[i];
                if(data.status === "行驶中") {
                    data.pos[0] += 0.0001;
                    data.pos[1] += 0.0001;
                    mapControl.updateCar(data);
                }
            }
        }, isNaN(time) ? 1000 : time);
    }
    
    var parseLocaltion = function(points, fn) {
        var self = this;
        if(!points || points.length === 0) {
            return;
        }
        var result = [];
        var index = 0;
        var getLocation = function(pts, i) {
            if(i >= pts.length) {
                if(fn) {
                    fn.call(null, result);
                }
                return;
            }
            geoc.getLocation(pts[i], function(rs) {
                var c = rs.addressComponents;
                var addr = c.city + c.district + c.street;
                if(c.province !== c.city) {
                    addr = c.province + addr;
                }
                //去除重名地址
                if(result.length === 0 || addr !== result[result.length-1].addr) {
                	var p = pts[i];
                    result.push({addr:addr, pos:[p.lng, p.lat]});
                }
                getLocation(pts, ++i);
            });
        };
        getLocation(points, index);
    };
    
    var getPosList = function(path, num) {
        if(num < 1) {
            num = 1;
        }
        var posList = [];
        var date = new Date();
        var time = date.getTime();
        var total = path.length;
        for(var i = 0; i < total; i++) {
            date.setTime(time-100000*(total-i-1));
            var pos = {
                pos:path[i],
                time:date.Format("yyyy-MM-dd hh:mm:ss")
            };
            if(i < num) {
        		posList.push(pos);
            } else {
            	break;
            }
        }
        return posList;
    };
};

// --------------------------------------------------------------------------
//
// Temp class
//
// --------------------------------------------------------------------------

var Temp = function() {
	var self = this;
	var tempData = [];
    var tempPage = 0;
    var tempPageNum = 24;
    var tempTotalPage = 0;
	var parseDateTime = d3.timeParse('%Y-%m-%d %H:%M:%S');
    var lineConfig = {
        percentWidth:100,
        percentHeight:100,
        type:"chart",
        xFocusLine:{visible:true},
        background:{fill:"#030f1d", "fill-opacity":0},
        legend:{
            xPos:"center",
            yPos:5,
            keyPath:"data",
            key:"type",
            labelFormat:"{#d.name#}",
            itemGap:5,
            colors:["#20f6fe", "#fe0312"],
            icons:[
                {shape:"circle", iconWidth:8, iconHeight:8, gap:4, style:{fill:"#20f6fe", r:3}},
                {shape:"circle", iconWidth:8, iconHeight:8, gap:4, style:{fill:"#fe0312", r:3}}
            ],
            labels:[
                {"font-size":12, "font-family":"Microsoft YaHei", "fill":"white", "maxLength":4},
                {"font-size":12, "font-family":"Microsoft YaHei", "fill":"white", "maxLength":4}
            ],
            domain:[0.5],
            visible:true
        },
        axis:{
            xAxis:[
                {
                    type:"time", 
                    position:"bottom",
                    keyPath:"data",
                    key:"time",
                    tick:{
                        tickFormat:function(d) {
                            return d3.timeFormat('%H:%M')(d.getTime());
                        },
                        tickArguments:[4],
                        tickSizeInner:1, 
                        tickSizeOuter:1, 
                        style:{stroke:"rgba(255,255,255,0.5)", visibility:"hidden"}
                    },
                    tickLabel:{attr:{y:10}, style:{fontSize:"12px", fill:"white", "font-family":"Microsoft YaHei"}},
                    padding:{top:20, left:40, bottom:20, right:20}
                }
            ],
            yAxis:[
                {
                    type:"value", 
                    position:"left",
                    keyPath:"data",
                    key:"value",
                    tick:{
                        tickFormat:function(d) {
                            return d + "℃";
                        },
                        tickArguments:[5], 
                        tickSizeInner:1, 
                        tickSizeOuter:1, 
                        style:{stroke:"rgba(255,255,255,0.5)", visibility:"hidden"}
                    },
                    gridLine:{
                        tickLine:{show:true, style:{stroke:"rgba(255,255,255,0.5)", strokeWidth:1, strokeDasharray:"4,4"}}
                    },
                    tickLabel:{attr:{x:-10}, style:{fontSize:"12px", fill:"white", "font-family":"Microsoft YaHei"}},
                    padding:{top:20, left:40, bottom:20, right:20}
                }
            ]
        },
        toolTip:{
            trigger:"xAxis",//触发条件，值可为xAxis|yAxis|item
            labelFormat:{
                xAxisFormat:"时间:{#d3.timeFormat('%Y-%m-%d %H:%M')(d.time)#}",//标签x轴对应数据内容相关格式
                yAxisFormat:"{#d.name#}:{#d.value#}℃"//标签y轴对应数据内容相关格式
            }
        },
        series:[
            {
                type:"line",
                scaleType:-1,
                dragable:false,
                percentWidth:100,
                percentHeight:100,
                tension:0.5,//范围0-1,1为折线，其他为曲线，越接近0曲率越大
                nodeShow:false,
                layout:{type:"scatterlayout"},
                data:[
                ]
            },
            {
                type:"line",
                scaleType:-1,
                dragable:false,
                percentWidth:100,
                percentHeight:100,
                tension:0.5,//范围0-1,1为折线，其他为曲线，越接近0曲率越大
                nodeShow:false,
                layout:{type:"scatterlayout"},
                data:[
                ]
            }
        ]
    };
    
    // --------------------------------------------------------------------------
    //
    // Attributes
    //
    // --------------------------------------------------------------------------

    // ------------------------------
    // lineConfig
    // ------------------------------
        
    this.lineConfig = function(value) {
        if (!arguments.length) return lineConfig;
        lineConfig = value;
        return this;
    };
    
    // ------------------------------
    // tempPage
    // ------------------------------
        
    this.tempPage = function(value) {
        if (!arguments.length) return tempPage;
        tempPage = value;
        return this;
    };
    
    // ------------------------------
    // tempTotalPage
    // ------------------------------
        
    this.tempTotalPage = function(value) {
        if (!arguments.length) return tempTotalPage;
        tempTotalPage = value;
        return this;
    };
    
    // --------------------------------------------------------------------------
    //
    // public functions
    //
    // --------------------------------------------------------------------------
    
    this.create = function(data) {
    	initTempData(data);
        setTempData();
        data.tempIns = this;
    };
    
    this.getPrePageTempData = function() {
        return getTempData(--tempPage);
    };
    
    this.getNextPageTempData = function() {
        return getTempData(++tempPage);
    };
    
    var initTempData = function(trackData) {
        tempData.length = 0;
        tempData.push(createTempData(trackData, 3, 5, "货柜温度", 0));
        tempData.push(createTempData(trackData, 20, 30, "室外温度", 1));
    };
    
    // --------------------------------------------------------------------------
    //
    // private functions
    //
    // --------------------------------------------------------------------------
    
    var setTempData = function() {
        if(tempData.length === 0) {
            return;
        }
        var totalNum = tempData[0].length;
        tempTotalPage = Math.floor(totalNum / tempPageNum);
        var data = getTempData(tempTotalPage);
        for(var i = 0, len = data.length; i < len; i++) {
            lineConfig.series[i].data = data[i];
        }
    };
    
    var createTempData = function(trackData, minValue, maxValue, name, type) {
        var data = [];
        var parseDateTime = d3.timeParse('%Y-%m-%d %H:%M:%S');
        var formatDateTime = d3.timeFormat('%Y-%m-%d %H:%M:%S');
        var startTime = parseDateTime(trackData.posList[0].time).getTime();
        var endTime = parseDateTime(trackData.currentPos.time).getTime();
        var gap = endTime - startTime;
        var interval = 60 * 60 * 1000;
        var n = Math.ceil(gap / interval);
        for(var i = 0; i < n; i++) {
            var obj = {
                time:formatDateTime(startTime + interval * i), 
                value:minValue + Math.floor(Math.random() * (maxValue - minValue)),
                name:name,
                type:type
            }
            data.push(obj);
        }
        return data;
    };
    
    var getTempData = function(page) {
        var result = [];
        if(tempData.length === 0) {
            return result;
        }
        if(isNaN(tempPageNum)) {
            tempPageNum = 24;
        }
        var totalNum = tempData[0].length;
        tempTotalPage = Math.floor(totalNum / tempPageNum);
        if(page < 0) {
            page = 0;
        } else if(page > tempTotalPage) {
            page = tempTotalPage;
        }
        var startIndex, endIndex;
        if(totalNum <= tempPageNum) {
            startIndex = 0;
            endIndex = totalNum - 1;
            tempPage = 0;
        } else {
            startIndex = page * tempPageNum;
            endIndex = startIndex + tempPageNum - 1;
            if(endIndex > totalNum - 1) {
                endIndex = totalNum - 1;
                startIndex = endIndex - tempPageNum + 1;
            }
            tempPage = page;
        }
        for(var i = 0, len = tempData.length; i < len; i++) {
            var d = tempData[i];
            var r = [];
            for(var j = startIndex; j <= endIndex; j++) {
                r.push(d[j]);
            }
            result.push(ObjectUtil.cloneObj(r));
        }
        return result;
    };
};
