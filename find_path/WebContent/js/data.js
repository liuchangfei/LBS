var initData = {
    "init":"四川省成都市武侯区理想中心4栋1402号",
    "road": [
        {
            "id": "1",
            "start_name": "货主公司A",
            "start": "四川省成都市武侯区玉林生活广场",
            "end_name": "不准备",
            "end": "四川省成都市火车南站",
            "plan_time": "2017-12-11 16:02:49"
        },
        {
            "id": "2",
            "start_name": "货主公司A",
            "start": "四川省成都市天府广场",
            "end_name": "大师傅",
            "end": "北京市天安门",
            "plan_time": "2017-11-04 16:00:00"
        },
        {
            "id": "3",
            "start_name": "货主公司A",
            "start": "四川省成都市火车北站",
            "end_name": "规范",
            "end": "重庆市解放碑",
            "plan_time": "2017-12-12 17:00:00"
        },
        {
            "id": "4",
            "start_name": "货主公司A",
            "start": "四川省成都市省体育馆",
            "end_name": "规范",
            "end": "昆明市市政府",
            "plan_time": "2017-12-12 17:00:00"
        },
        {
            "id": "5",
            "start_name": "货主公司A",
            "start": "四川省成都市火车东站",
            "end_name": "规范",
            "end": "四川省乐山市公安局",
            "plan_time": "2017-12-11 17:00:00"
        },
        {
            "id": "6",
            "start_name": "货主公司A",
            "start": "四川省小金县政府",
            "end_name": "规范",
            "end": "西藏自治区区政府",
            "plan_time": "2017-12-10 12:00:00"
        }
    ],
    "car": {
        "1": "川A123451",
        "4": "川A123454"
    },
    "driver": {
        "1": "付代成",
        "4": "廖洪伟",
        "18": "任世昌",
        "22": "畢章森",
        "25": "陳子勁",
        "213": "啊啊啊123123",
        "214": "哒哒",
        "215": "哎哎哎",
        "216": "人去",
        "217": "啊啊啊1"
    }
};

var mapData = {
	mode:"normal", //normal 普通模式；clusterer 聚合模式
	mapStyle:"midnight",
	tableConfig : {
        langs:{
            "zh-cn":{
                "ajax":{
                    "loading":"加载中", //ajax loader text
                    "error":"加载错误" //ajax error text
                },
                "pagination":{
                    "first":"<<", //text for the first page button
                    "first_title":"跳转到首页", //tooltip text for the first page button
                    "last":">>",
                    "last_title":"跳转到尾页",
                    "prev":"<",
                    "prev_title":"跳转到上一页",
                    "next":">",
                    "next_title":"跳转到下一页"
                }
            }
        },//自定义语言
        locale:"zh-cn",//从自定义语言中选择当前显示的语言
        placeholder:"没有数据",
        //height:"308px",
        fitColumns:true,
        resizableColumns:false,
        history:false,
        movableColumns:false,
        tooltipsHeader:true,
        tooltips:true,
        //movableRows:true,//和cell的edit功能有冲突
        selectable:1,
        //groupBy:"gender",
        pagination:"local",//local:本地分页，remote远程分页
        columnVertAlign:"bottom", //align header contents to bottom of cell
        columns:[
            {title:"选择", field:"select", sorter:"boolean", formatter:"tickCross", editor:true, width:60, 
	        	tooltip:function(cell) {
	        	    return  cell.getValue() ? "选中" : "未选中";
	            }
            },
            {title:"编码", field:"num", width:60},
            {title:"发货点", field:"start_addr", width:175},
            {title:"收货点", field:"end_addr", width:175},
            {title:"计划时间", field:"plan_time", width:130},
        ]
    },
    data:[]
};
// --------------------------------------------------------------------------
//
// CustomData class
//
// --------------------------------------------------------------------------

var CustomData = function(initUrl, pathDataUrl, keys) {
	var self = this;
	var geoc = new BMap.Geocoder();
	var mapControl;
	var pList;
	var selectCar, selectDriver, sendPathData;
	
	this.init = function(data) {
		var cloneData = data ? ObjectUtil.cloneObj(data) : ObjectUtil.cloneObj(initData);
		//初始化下拉框内容
		initSelects(cloneData);
		var road = cloneData.road;
		pList = [];
		pList.push({
			addr:cloneData.init
		});
		for(var task, i = 0, len = road.length; i < len; i++) {
	        task = road[i];
	        pList.push({
	            id:task.id,
	            addr:task.start,
	            isStart:true,
	            name:task.start_name,
	            plan_time:task.plan_time
	        }, {
	            id:task.id,
	            addr:task.end,
	            isStart:false,
	            name:task.end_name,
	            plan_time:task.plan_time
	        });
	    }
		//转换addr为经纬度信息
		parseItemAdrr(pList, 0, function() {
			createMapData();
			mapControl = new MapControl("map", mapData);
	    });
		
		//添加监听
		addListeners();
	};
	
	var addListeners = function() {
		$("#findPathBtn").on("click", function() {
    		findPath();
    	});
		$("#sureBtn").on("click", function() {
			sendPathDataRequest(sendPathData);
    	});
        $("#cancelBtn").on("click", function() {
        	mapControl.removeFindPath(mapControl.findPathData());
    	});
	};
	
	var initSelects = function(data) {
		var carList = document.getElementById("carList");
		if(carList) {
			//删除所有选项option
			carList.options.length = 0; 
			var carMap = data.car;
			if(carMap) {
				for(var id in carMap) {
					var option = document.createElement("option");
					option.setAttribute("value", id);
					option.text = carMap[id];
					carList.appendChild(option);
				}
			}
		}
		
		var driverList = document.getElementById("driverList");
		if(driverList) {
			//删除所有选项option
			driverList.options.length = 0; 
			var driverMap = data.driver;
			if(driverMap) {
				for(var id in driverMap) {
					var option = document.createElement("option");
					option.setAttribute("value", id);
					option.text = driverMap[id];
					driverList.appendChild(option);
				}
			}
		}
	};
	
	var parseItemAdrr = function(itemsInfo, i, fn) {
		if(isNaN(i)) {
			i = 0;
		}
		if(i >= itemsInfo.length) {
			if (fn) {
				fn.call();
			}
			return;
		}
		var item = itemsInfo[i];
		geoc.getPoint(item.addr, function(point) {
			if(!point) {
				alert("地址：'" + item.addr + "'无法正确解析经纬度。\n请检查地址是否准确或填写更详细地址。");
			}
			item.pos = point ? [point.lng, point.lat] : null;
			parseItemAdrr(itemsInfo, ++i, fn);
		});
	};
	
	var findPath = function() {
		sendPathData = null;
		var data = getFindPathData();
		if(!validateData(data)) {
			return;
		}
		var posList = getPosList(data);
        sendFindPathRequest(posList);
	}
	
	var validateData = function(data) {
		//验证是否选择了任务项
		if(data.road.length === 0) {
			alert("请选择任务。");
			return false;
		}
		//验证是否选择了车辆
		if(!data.car) {
			alert("请选择车辆。");
			return false;
		}
		//验证是否选择了司机
		if(!data.driver) {
			alert("请选择司机。");
			return false;
		}
		return true;
	};
	
	// --------------------------------------------------------------------------
    // create data codes
    // --------------------------------------------------------------------------
	
	var createMapData = function() {
		var data = pList.slice(1);
		mapData.currentPos = pList[0];
		mapData.data.length = 0;
		for(var task, start, end, i = 0, len = data.length; i < len; i+=2) {
			start = data[i];
			end = data[i+1];
			var num = Math.ceil(i/2)+1;
			var startId = num*2;
			var endId = startId + 1;
			task = {
				id:start.id,
				startId:startId,
				endId:endId,
				taskId:start.id,
				num:num,
				start_addr:start.addr,
				start_name:start.name,
				start_pos:start.pos,
				end_addr:end.addr,
				end_name:end.name,
				end_pos:end.pos,
				plan_time:start.plan_time,
				select:false
			};
			mapData.data.push(task);
		}
	};
	
	var getPosList = function(data) { 
	    var data;
	    try {
	    	data = Object.prototype.toString.call(arguments[0]) === "[object String]" ? 
	        		JSON.parse(arguments[0]) : arguments[0];
	    } catch(e) {
	        console.log(e);
	    }
	    
	    if(!data) {
	        return null;
	    }
	    
	    var currentPos = data.currentPos;
	    if(!currentPos) {
	    	return null;
	    }
	    
	    var posList = [];
	    posList.push({
	    	addr:currentPos.addr,
	    	lng:currentPos.lng,
            lat:currentPos.lat,
	        isStart:true
	    });
	    var road = data.road;
	    for(var task, i = 0, len = road.length; i < len; i++) {
	        task = road[i];
	        posList.push({
	            id:task.id,
	            addr:task.start_addr,
	            lng:task.start_pos[0],
	            lat:task.start_pos[1],
	            isStart:true
	        }, {
	            id:task.id,
	            addr:task.end_addr,
	            lng:task.end_pos[0],
	            lat:task.end_pos[1],
	            isStart:false
	        });
	    }
	    return posList; 
	};

	var getFindPathData = function() {
		var selectedItems = mapControl.itemsData().filter(function(item) {
			return item.select === true;
		});
		var currentPos = pList[0];
		var carList = document.getElementById("carList");
		var car, driver, index, option;
		if(carList) {
			index = carList.selectedIndex;
			if(index === -1) {
				car = null;
				selectCar = "";
			} else {
				car = {};
				option = carList.options[index];
				car[option.value] = option.text;
				selectCar = option.value;
			}
		}
		var driverList = document.getElementById("driverList");
		if(driverList) {
			index = driverList.selectedIndex;
			if(index === -1) {
				driver = null;
				selectDriver = "";
			} else {
				driver = {};
				option = driverList.options[index];
				driver[option.value] = option.text;
				selectDriver = option.value;
			}
		}
		return {
			currentPos:{
				addr:currentPos.addr,
				lng:currentPos.pos[0],
				lat:currentPos.pos[1]
			},
			road:selectedItems,
			car:car,
			driver:driver
		};
	};

	var getSendPathData = function(d) {
		var data = ObjectUtil.cloneObj(d);
		data.car = selectCar;
		data.driver = selectDriver;
		data.ukey = params.ukey;
		if(data.posList && data.posList.length > 1) {
			data.postList = data.posList.slice(1);
		}
		delete data.posList;
		return data;
	};
	
	var getQueryString = function(name) {
	     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
	     var r = window.location.search.substr(1).match(reg);
	     if(r != null)
	    	 return  unescape(r[2]); 
	     return null;
	};
	
	var getUrlParams = function(keys) {
		var params = {};
		if(!keys || !keys.length) {
			return params;
		}
		for(var key, value, i = 0, len = keys.length; i < len; i++) {
			key = keys[i];
			value = getQueryString(key);
			if(value !== null) {
				params[key] = value;
			}
		}
		return params;
	};
	
	// --------------------------------------------------------------------------
    // url request codes
    // --------------------------------------------------------------------------
	
	var sendInitRequest = function(params) {
	    $.post(initUrl, params, function (res) {
            if(res.status != undefined && res.status == 1){
	            self.init(res.data);
            } else {
            	alert("获取初始化数据失败！"); 
            }
            $('.init-loading').css({"display":"none"});
        },'json'); 
	};
	
	var sendFindPathRequest = function(posList) {
		//显示loading
        $('.init-loading').css({"display":"block", "background-color":"rgba(0,0,0,0.4)"});
	    $.ajax({ 
	        type: "POST", 
	        url: "findPath", 
	        contentType: "application/json; charset=utf-8", 
	        data: JSON.stringify({posList:posList}), 
	        dataType: "json", 
	        success: function (data) { 
	            sendPathData = getSendPathData(data);
	            mapControl.showFindPath(data);
	            $('.init-loading').css({"display":"none"});
	        }, 
	        error: function (data) { 
	        	alert("获取路径数据失败！"); 
	            $('.init-loading').css({"display":"none"});
	        } 
	    }); 
	};
	
	var sendPathDataRequest = function(data) {
		console.log({data:data});
		$('.init-loading').css({"display":"block", "background-color":"rgba(0,0,0,0.4)"});
		$.ajax({ 
	        type: "POST", 
	        url: pathDataUrl, 
//	        contentType: "application/json; charset=utf-8", 
	        data: {data:data}, 
	        dataType: "json", 
	        success: function (res) { 
	        	if(res.status != undefined && res.status == 1){
	            	console.log(res.data);
	            	//跳转到搜索界面继续搜索操作
		            mapControl.continueSearch();
	            } else {
	            	alert("发送路径数据失败！"); 
	            }
	        	$('.init-loading').css({"display":"none"});
	        }, 
	        error: function () { 
	        	alert("发送路径数据失败！"); 
	            $('.init-loading').css({"display":"none"});
	        } 
	    }); 
	};
	
	// --------------------------------------------------------------------------
    // send init request action
    // --------------------------------------------------------------------------
	
	var params = getUrlParams(keys);
	sendInitRequest(params);
	
};