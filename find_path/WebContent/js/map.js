// --------------------------------------------------------------------------
//
// MapControl class
//
// --------------------------------------------------------------------------

/**
 * 构造方法 
 * @param _conId 绘制容器对象id，比如一个div 
 * @param _data 渲染配置数据
 */
var MapControl = function(_conId, _data) {
	
    if (arguments.length != 2) {
        throw new Error('传入参数个数错误,当前个数' + arguments.length + ',应传入两个参数。');
    }
    
    if (!_conId) {
        throw new Error('MapControl构造方法中传入的容器id为空。');
    }
    
	var self = this,
		polyLine = null,
	    itemMap = {};
        
    // ------------------------------
    // data
    // ------------------------------
    
    var data = _data;
    this.data = function(value){
        if (!arguments.length) return data;
        data = value;
        return this;
    };
    
    // ------------------------------
    // itemsData
    // ------------------------------
    
    this.itemsData = function(){
        return self.data() && self.data().data ? self.data().data : null;
    };
    
    // ------------------------------
    // currentPos
    // ------------------------------
    
    this.currentPos = function(){
        return self.data() && self.data().currentPos ? self.data().currentPos : null;
    };
    
    // ------------------------------
    // tableConfig
    // ------------------------------
    
    this.tableConfig = function(){
        return self.data() && self.data().tableConfig ? self.data().tableConfig : null;
    };
        
    // ------------------------------
    // mapStyle
    // ------------------------------
    
    this.mapStyle = function(){
        return self.data() && self.data().mapStyle ? self.data().mapStyle : "midnight";
    };
    
    // ------------------------------
    // mode
    // ------------------------------
    
    this.mode = function(){
        return self.data() && self.data().mode ? self.data().mode : "normal";
    };
    
    // ------------------------------
    // isShowPath
    // ------------------------------
    
    //是否处于展示搜索路径状态
    var isShowPath = false;
    this.isShowPath = function(){
        return isShowPath;
    };
    
    // ------------------------------
    // findPathData
    // ------------------------------
    
    var findPathData = null;
    this.findPathData = function(){
        return findPathData;
    };
        
    // ------------------------------
    // map
    // ------------------------------
    
    var map = new BMap.Map(_conId, {enableMapClick: !1});
    this.map = function(value){
        if (!arguments.length) return map;
        map = value;
        return this;
    };
    
	this.init = function() {
        map.centerAndZoom(new BMap.Point(116.404, 39.915), 12);
        map.enableScrollWheelZoom(true);
        map.setMapStyle({style:self.mapStyle()});
        
        self.initControl();
        self.initOverlay();
        self.addListeners();
        
        self.addStartPoint();
        self.addItems(self.itemsData());
        self.initLocation(self.itemsData());
        self.validateMode();
    };
    
    this.validateMode = function() {
        if(self.mode() === "clusterer") {
        	var items = [];
            for(var key in itemMap) {
                items.push(itemMap[key].item);
            }
            var opts = {
                data:items,
                gridSize:100,
                maxZoom:15,
                minClusterSize:2,
                isAverangeCenter:true
            };
            var markerClusterer = new BMapLib.MarkerClusterer(self.map(), opts);
        }
    };
    
    this.initLocation = function(itemsInfo) {
    	var allItemsPoints = [];
    	for(var i = 0, len = itemsInfo.length; i < len; i++) {
    		var startPos = itemsInfo[i].start_pos;
    		var endPos = itemsInfo[i].end_pos;
    		allItemsPoints.push(new BMap.Point(startPos[0], startPos[1]));
    		allItemsPoints.push(new BMap.Point(endPos[0], endPos[1]));
    	}
    	if(allItemsPoints.length > 1) {
    		map.setViewport(allItemsPoints);
    	} else if (allItemsPoints.length === 1) {
    		map.setCenter(allItemsPoints[0]);
    		map.setZoom(10);
    	} else {
            var myCity = new BMap.LocalCity();
            myCity.get(function(result) {
                var cityName = result.name;
                map.setCenter(cityName);
            });
    	}
    };
    
    this.initControl = function() {
        self.addCityListControl();
        self.addNavigationControl();
        self.addScaleControl();
        self.addMapTypeControl();
        self.addTableControl();
        
        //隐藏loading
        $('.init-loading').css({"display":"none"});
    };
    
    this.initOverlay = function() {
        
    };
    
    this.addListeners = function() {
    	window.onresize = self.resizeUI;
    };
    
    this.resizeUI = function() {
    	
    };
    
    // --------------------------------------------------------------------------
    // control
    // --------------------------------------------------------------------------
    
    this.addCityListControl = function() {
        self.cityListControl = new BMap.CityListControl({
            anchor:BMAP_ANCHOR_TOP_LEFT,
            offset:new BMap.Size(320, 10)
        });
        map.addControl(self.cityListControl);
        self.cityListControl.hide();
    };
    
    this.removeCityListControl = function() {
        map.removeControl(self.cityListControl);
    };
    
    this.addNavigationControl = function() {
        self.navigationControl = new BMap.NavigationControl({
        	type:BMAP_NAVIGATION_CONTROL_ZOOM,
            anchor:BMAP_ANCHOR_TOP_RIGHT,
            offset:new BMap.Size(10, 12)
        });
        map.addControl(self.navigationControl);
    };
    
    this.removeNavigationControl = function() {
        map.removeControl(self.navigationControl);
    };
    
    this.addScaleControl = function() {
        self.scaleControl = new BMap.ScaleControl({
            anchor:BMAP_ANCHOR_BOTTOM_RIGHT,
            offset:new BMap.Size(100, 10)
        });
        map.addControl(self.scaleControl);
    };
    
    this.removeScaleControl = function() {
        map.removeControl(self.scaleControl);
    };
    
    this.addMapTypeControl = function() {
        self.mapTypeControl = new BMap.MapTypeControl({
            anchor:BMAP_ANCHOR_BOTTOM_RIGHT,
            offset:new BMap.Size(10, 10),
            mapTypes:[BMAP_NORMAL_MAP, BMAP_HYBRID_MAP]
        });
        map.addControl(self.mapTypeControl);
    };
    
    this.removeMapTypeControl = function() {
        map.removeControl(self.mapTypeControl);
    };
    
    this.addTableControl = function() {
        self.tableControl = new TableControl(self, self.tableConfig());
        self.tableControl.init(self.itemsData());
    };
    
    this.removeTableControl = function() {
        map.removeControl(self.tableControl);
    };
    
    // --------------------------------------------------------------------------
    // overlay
    // --------------------------------------------------------------------------
    
    /* level: default:3
     * 0.province;
     * 1.province+city;
     * 2.province+city+district;
     * 3.province+city+district+street;
     * 4.province+city+district+street+streetNumber;
     * */
    var geoPosToAddr = function(point, level, fn) {
    	var geoc = new BMap.Geocoder();
    	if(isNaN(level)) {
    		level = 3;
    	} else if(level > 4) {
    		level = 4;
    	} else if(level < 0) {
            level = 0;
        }
        geoc.getLocation(point, function(rs) {
            var c = rs.addressComponents;
            var addr;
            if(level === 0) {
            	addr = c.province;
            } else if(level === 1) {
            	addr = c.city;
            } else if(level === 2) {
                addr = c.city + c.district;
            } else if(level === 3) {
                addr = c.city + c.district + c.street;
            } else {
                addr = c.city + c.district + c.street + c.streetNumber;
            }
            if(c.province !== c.city) {
            	addr = c.province + addr;
            }
            if(fn) {
            	fn.call(null, addr);
            }
        });        
    };
    
    var getInfoWindowContent = function(id, taskId, planTime, name, addr, isStart) {
        return  '<svg id="info_window_svg_' + id + '" verson="1.1" style="position:absolute;width:50px;height:200px;">' +
                    '<polyline points="0,195 25,50 50,50" style="stroke:rgba(68,123,175,0.75);stroke-width:2;fill:none;"/>' +
        		'</svg>' +
                '<div id="info_window_content_' + id + '" class="info_window_content">' +
                    '<div class="tl_border"></div>' +
                    '<div class="tr_border"></div>' +
                    '<div class="bl_border"></div>' +
                    '<div class="br_border"></div>' +
                    '<div><span style="padding-left:0px;">任务编码：</span>' + taskId + '</div>' +
                    '<div><span style="padding-left:13px;">' + (isStart ? '发货方' : '收货方') + '：</span>' + name + '</div>' +
                    '<div><span style="padding-left:26px;">地址：</span>' + addr + '</div>' +
                    '<div><span style="padding-left:0px;">计划时间：</span>' + planTime + '</div>' +
                '</div>';
    };
    
    var getItemTitle = function(id, planTime, name, addr, isStart) {
        return  '任务编码：'     + id +
                '\n' + (isStart ? '发货方' : '收货方') + '：' + name +
                '\n地址：'   	+ addr +
                '\n计划时间：'   + planTime;
    };
    
    var getItemIcon = function() {
        var iconUrl = "assets/images/item.png";
        var size = new BMap.Size(44*0.6, 54*0.6);
        var icon = new BMap.Icon(iconUrl, size);
        icon.setImageSize(size);
        return icon;
    };
    
    var playInfoWinAnimation = function(id) {
        var transition1 = d3.transition().duration(200).delay(500).ease(d3.easeExpOut);
        d3.select("#info_window_content_"+id)
            .style("opacity", 0)
            .style("transform", "translate(100px, 0px)");
        d3.select("#info_window_svg_"+id)
            .style("transform-origin", "left bottom")
            .style("transform", "scale(0, 0)")
            .transition(transition1)
            .style("transform", "scale(1, 1)")
            .on("end", function() {
                var transition2 = d3.transition().duration(200).delay(100).ease(d3.easeExpOut);
                d3.select("#info_window_content_"+id)
                    .transition(transition2)
                    .style("opacity", 1)
                    .style("transform", "translate(0px, 0px)");
            });
    };
    
    this.getValueByKey = function(key, data) {
        return data ? data[key] : null;
    };
    
    this.visibleItem = function(id, visible) {
    	var obj = self.getValueByKey(id, itemMap);
        if(!obj) {
            return;
        }
        var item = obj.item;
        if(item) {
        	visible ? item.show() : item.hide();
        	!visible && unselectItemEffect(obj);
        }
    };
    
    this.selectItem = function(itemData, isMoveCenter, isAutoZoom) {
    	if(!itemData) {
    		return;
    	}
    	//处于暂时搜索路径状态，且当前项对应的点不在搜索路径中
    	if(self.isShowPath() && !itemData.select) {
        	return;
        }
        var startObj = self.getValueByKey(itemData.startId, itemMap);
        var endObj = self.getValueByKey(itemData.endId, itemMap);
        if(!startObj || !endObj) {
            return;
        }
        
        selectItemEffect(startObj);
        selectItemEffect(endObj);
        self.initLocation([itemData]);
        self.resizeUI();
    };
    
    this.unselectItem = function(itemData) {
    	if(!itemData) {
    		return;
    	}
        var startObj = self.getValueByKey(itemData.startId, itemMap);
        var endObj = self.getValueByKey(itemData.endId, itemMap);
        if(!startObj || !endObj) {
            return;
        }
        
        unselectItemEffect(startObj);
        unselectItemEffect(endObj);
        //处于暂时搜索路径状态，且当前项对应的点不在搜索路径中
    	if(self.isShowPath()) {
    		itemData.select && findPathData && self.setViewport(findPathData.posList);
        } else {
        	self.initLocation(self.itemsData());
        }
        self.resizeUI();
    };
    
    var selectItemEffect = function(obj) {
   	 	var item = obj.item;
        var infoWindow = obj.infoWindow;
        item.setZIndex(2222222222);
        infoWindow.show();
        playInfoWinAnimation(obj.id);
    };
    
    var unselectItemEffect = function(obj) {
    	var item = obj.item;
        item.setZIndex(0);
        var infoWindow = obj.infoWindow;
        infoWindow.hide();
    };
    
    this.addItem = function(data, isPanTo, isShowInfoWin) {
    	var id = ObjectUtil.filterObj(data, "id");
    	var isUpdate = itemMap[id] ? true : false;
    	var taskId = ObjectUtil.filterObj(data, "taskId", "未知");
    	var name = ObjectUtil.filterObj(data, "name", "未知");
    	var addr = ObjectUtil.filterObj(data, "addr", "未知");
    	var planTime = ObjectUtil.filterObj(data, "planTime", "未知");
    	var isStart = data.isStart === true ? true : false;
    	var pos = data.pos;
    	var point = new BMap.Point(pos[0], pos[1]);
    	var item = isUpdate ? itemMap[id].item : new BMap.Marker();
    	item.setPosition(point);
    	//var itemIcon = getItemIcon();
    	var title = getItemTitle(taskId, planTime, name, addr, isStart);
    	item.setTitle(title);
    	//item.setIcon(itemIcon);
        if(isPanTo) {
        	map.setZoom(14);
        	map.panTo(point);
        }
        var html = getInfoWindowContent(id, taskId, planTime, name, addr, isStart);
        var infoWindow = isUpdate ? itemMap[id].infoWindow : new BMap.Label(html);
        infoWindow.setOffset(new BMap.Size(10, -185));
        infoWindow.setStyle({
        	"width":"350px",
        	"height":"200px",
        	"padding":"0px",
            "background-color":"rgba(0,0,0,0)", 
            "border-color":"rgba(0,0,0,0)", 
            "color":"#fff",
            "font-size":"13px",
            "font-family":"微软雅黑 宋体",
            "pointer-events":"none"
        });
        infoWindow.hide();
        item.setLabel(infoWindow);
        
        itemMap[id] = {item:item, data:data, infoWindow:infoWindow};
        
        if(isUpdate) {
        	infoWindow.setContent(html);
        	infoWindow.draw();
        } else {
        	if(self.mode() === "normal") {
        		map.addOverlay(item);
        	}
        	item.addEventListener("click", function(){
        		var table = $("#table");
        		var tableData = table.tabulator("getData");
        		var selectedIndex = 0;
        		var rowId = -1;
        		for(var i = 0, len = tableData.length; i < len; i++) {
        			if(tableData[i].startId === id || tableData[i].endId === id) {
        				selectedIndex = i;
        				rowId = tableData[i].id;
        				break;
        			}
        		}
        		var pageNum = Math.floor(selectedIndex/10) + 1;
        		table.tabulator("setPage", pageNum);
        		table.tabulator("selectRow", rowId); //select row with id ;
        		var selectedData = table.tabulator("getSelectedData");
        		selectedData = selectedData.length > 0 ? selectedData[0] : null;
        		self.tableControl.selectRow(selectedData);
            });
        }
        
        if(isShowInfoWin) {
        	infoWindow.show();
        	playInfoWinAnimation(id);
        }
//        $("#table").tabulator("updateData", [data]);
    };
    
    this.updateItem = function(data) {
        self.addItem(data);
    };
    
    this.removeItem = function(id) {
        var obj = itemMap[id];
        if(obj) {
        	map.removeOverlay(obj.item);
        	delete itemMap[id];
        }
    };
    
    this.addItems = function(data) {
        if(!data) {
        	return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
        	var task = data[i];
        	var startData = {
        		id:task.startId,
        		taskId:task.taskId,
        		addr:task.start_addr,
        		name:task.start_name,
        		planTime:task.plan_time,
        		pos:task.start_pos,
        		isStart:true
        	};
        	var endData = {
        		id:task.endId,
        		taskId:task.taskId,
        		addr:task.end_addr,
        		name:task.end_name,
        		planTime:task.plan_time,
        		pos:task.end_pos,
        		isStart:false
        	};
        	self.addItem(startData);
        	self.addItem(endData);
        }
    };
    
    this.updateItems = function(data) {
        if(!data) {
            return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
            self.updateItem(data[i]);
        }
    };
    
    this.removeItems = function(ids) {
        if(!ids) {
            return;
        }
        for(var i = 0, len = ids.length; i < len; i++) {
            self.removeItem(ids[i]);
        }
    };
    
    var getIcon = function(iconUrl, size, anchor) {
    	var icon;
    	if(size && size.length > 1) {
    		size = new BMap.Size(size[0], size[1]);
    		icon = new BMap.Icon(iconUrl, size);
    		icon.setImageSize(size);
    		if(anchor && anchor.length > 1) {
    			icon.setAnchor(new BMap.Size(anchor[0], anchor[1]));
    		}
    	}
        return icon;
    };
    
    this.addStartPoint = function() {
    	var startPos = self.currentPos();
    	if(!startPos) {
    		return;
    	}
        var startPoint = new BMap.Point(startPos.pos[0], startPos.pos[1]);
        var startMarker = new BMap.Marker();
        startMarker.setPosition(startPoint);
    	var startIcon = getIcon("assets/images/start_marker.png", [29, 33], [29/2, 33]);
        startMarker.setIcon(startIcon);
        map.addOverlay(startMarker);
        startMarker.setTitle("[起点]" + "\n地址：" + startPos.addr);
    };
    
    // --------------------------------------------------------------------------
    // find path codes
    // --------------------------------------------------------------------------
    
    this.continueSearch = function() {
    	//删除路径中的点
    	var posList = self.findPathData().posList;
    	//删除这些点相关的数据
    	if(posList && posList.length > 1) {
        	for(var id in itemMap) {
        		var obj = itemMap[id];
        		var taskId = obj.data.taskId;
        		var isStart = obj.data.isStart;
        		for(var pos, i = 0, len = posList.length; i < len; i++) {
        			pos = posList[i];
        			if(pos.id === taskId && pos.isStart === isStart) {
        				self.removeItem(id);
        				removeItemData(taskId);
        				break;
        			}
        		}
        	}
    	}
    	//界面上删除路径相关的内容
    	self.removeFindPath(self.findPathData());
    	//刷新任务列表
    	$("#table").tabulator("setData", self.itemsData());
    };
    
    this.showFindPath = function(data) {
    	isShowPath = true;
    	findPathData = data;
    	self.removeFindPath();
    	addPolyline(data.path);
    	var posList = data.posList;
    	hideNoSelectedPos(posList);
    	setPathPointsLabelVisible(posList, true);
    	self.setViewport(posList);
    	self.changeControlBarUI(true);
    };
    
    this.removeFindPath = function(data) {
    	removePolyline();
    	showAllPos();
    	if(data) {
    		isShowPath = false;
    		findPathData = null;
    		setPathPointsLabelVisible(data.posList, false);
    		self.initLocation(self.itemsData());
    		self.changeControlBarUI(false);
    	}
    };
    
    this.setViewport = function(posList) {
    	if(!posList) {
    		return;
    	}
    	if (posList.length === 1) {
    		map.setCenter(new BMap.Point(posList[0].lng, posList[0].lat));
    		map.setZoom(10);
    	} else if(posList.length === 0) {
            var myCity = new BMap.LocalCity();
            myCity.get(function(result) {
                var cityName = result.name;
                map.setCenter(cityName);
            });
    	} else {
    		var points = [];
        	for(var pos, i = 0, len = posList.length; i < len; i++) {
        		pos = posList[i];
        		points.push(new BMap.Point(pos.lng, pos.lat));
        	}
        	map.setViewport(points);
    	}
    };
    
    var setPathPointsLabelVisible = function(posList, visible) {
    	if(!posList || posList.length < 2) {
    		return;
    	}
    	for(var id in itemMap) {
    		var obj = itemMap[id];
    		var taskId = obj.data.taskId;
    		var isStart = obj.data.isStart;
    		for(var pos, i = 1, len = posList.length; i < len; i++) {
    			pos = posList[i];
    			if(pos.id === taskId && pos.isStart === isStart) {
    				if(visible) {
    					if(!obj.pathLabel) {
    						obj.pathLabel = new BMap.Label("", {offset:new BMap.Size(3, -20)});
    						obj.pathLabel.setStyle({color:"#fff", borderColor:"#11cbd1", backgroundColor:"rgba(68,123,175,0.75)"});
    						obj.item.setLabel(obj.pathLabel)
    					}
    					obj.pathLabel.setContent(i + "");
    					obj.pathLabel.show();
    				} else {
    					if(obj.pathLabel) {
    						obj.pathLabel.hide();
    					}
    				}
    				break;
    			}
    		}
    	}
    };
    
    var addPolyline = function(path) {
    	removePolyline();
    	
    	if(!path) {
    		return;
    	}
    	var planPoints = [];
    	var posList = path.split(";");
    	for(var posStr, pos, i = 0, len =  posList.length; i < len; i++) {
    		posStr = posList[i];
    		pos = posStr.split(",");
    		if(pos.length === 2) {
    			planPoints.push(new BMap.Point(parseFloat(pos[0]), parseFloat(pos[1])));
    		}
    	}
    	polyLine = new BMap.Polyline(planPoints, {strokeColor:'#4caf50', strokeWeight:5, strokeOpacity:0.8});//创建折线
        map.addOverlay(polyLine);
    };
    
    var removePolyline = function() {
    	if(polyLine) {
    		map.removeOverlay(polyLine);
    		polyLine = null;
    	}
    };
    
    var hideNoSelectedPos = function(posList) {
    	for(var id in itemMap) {
    		var obj = itemMap[id];
    		var taskId = obj.data.taskId;
    		var isStart = obj.data.isStart;
    		var isShow = false;
    		for(var pos, i = 0, len = posList.length; i < len; i++) {
    			pos = posList[i];
    			if(pos.id === taskId && pos.isStart === isStart) {
    				isShow = true;
    				break;
    			}
    		}
    		!isShow && self.visibleItem(id, false);
    	}
    };
    
    var showAllPos = function() {
    	for(var id in itemMap) {
    		self.visibleItem(id, true);
    	}
    };
    
    var removeItemData = function(taskId) {
    	var itemsData = self.itemsData();
    	for(var i = 0, len = itemsData.length; i < len; i++) {
    		if(itemsData[i].taskId === taskId) {
    			itemsData.splice(i, 1);
    			break;
    		}
    	}
    };
    
    // --------------------------------------------------------------------------
    // control bar
    // --------------------------------------------------------------------------
    
    this.changeControlBarUI = function(isShowPath) {
    	if(isShowPath) {
    		$("#findPathBtn").attr("class", "control_button_disabled");
            $("#sureBtn").attr("class", "control_button");
            $("#cancelBtn").attr("class", "control_button");
    	} else {
    		$("#findPathBtn").attr("class", "control_button");
            $("#sureBtn").attr("class", "control_button_disabled");
            $("#cancelBtn").attr("class", "control_button_disabled");
    	}
    };
    
    self.init();
};

// --------------------------------------------------------------------------
//
// TableControl class
//
// --------------------------------------------------------------------------

var TableControl = function(mapControl, tableConfig) {
	var isShowTable = true;
	var selectedItem = null;
	
	this.init = function(tableData) {
		var self = this;
        tableConfig.rowClick = function(e, row) {
            var selectedData = $("#table").tabulator("getSelectedData");
            selectedData = selectedData.length > 0 ? selectedData[0] : null;
            if(selectedData) {
                self.selectRow(row.getData());
            } else {
                self.unselectRow(row.getData());
            }
        };
        $("#table").tabulator(tableConfig);
        $("#table").tabulator("setData", tableData);
        $("#table").tabulator("setPageSize", 10);
        $("#table").tabulator("setPage", 1);
        
        var tableHeader = document.getElementById("tableHeader");
        tableHeader.onmousedown = function() {
            var tableOpenIcon = document.getElementById("tableOpenIcon");
            if(isShowTable) {
                tableOpenIcon.textContent = "∨";
                $("#table").animate({height:"0px"}, 200);
            } else {
                tableOpenIcon.textContent = "∧";
                $("#table").animate({height:"308px"}, 200);
            }
            isShowTable = !isShowTable;
        };
    };
    
    this.selectRow = function(rowData) {
        if(!selectedItem) {//第一次选
            selectedItem = rowData;
        } else if(selectedItem && selectedItem.id !== rowData.id) {//选中不同项
        	mapControl.unselectItem(selectedItem);
            selectedItem = rowData;
        }
        mapControl.selectItem(selectedItem, true, true);
    };
    
    this.unselectRow = function(rowData) {
    	selectedItem = null;
    	mapControl.unselectItem(rowData);
    };
};

// --------------------------------------------------------------------------
//
// LocalStorageUtil class
//
// --------------------------------------------------------------------------

var LocalStorageUtil = {
	saveToDB: function (key, content) {
        //添加key-value 数据到 sessionStorage
		try {
			localStorage.setItem(key, content);
			alert("保存数据成功");
		} catch(e) {
            alert("保存数据失败");
        }
    },
    readFromDB: function readFromDB(key) {
        //通过key来获取value
    	try {
    		var content = localStorage.getItem(key);
    	} catch(e) {
            alert("读取数据失败");
        }
        return content;
    },
    clearDB: function() {
        //清空所有的key-value数据。
        try {
            localStorage.clear();
            alert("清除数据成功");
        } catch(e) {
            alert("清除数据失败");
        }
    }
};

// --------------------------------------------------------------------------
//
// ObjectUtil class
//
// --------------------------------------------------------------------------

var ObjectUtil = {
	/**
     * 深度克隆对象
     * @param obj 要克隆的对象
     * @return 返回克隆对象
     */
    cloneObj: function(obj) {
        var str, newobj = obj.constructor === Array ? [] : {};
        if(typeof obj !== 'object') {
            return;
        } else if(window.JSON) {
            str = JSON.stringify(obj), //序列化对象
            newobj = JSON.parse(str); //还原
        } else {
            for(var i in obj) {
                newobj[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i]; 
            }
        }
        return newobj;
    },
    /**
     * 获取入口url中的参数值
     * @param key 参数名称字符串
     * @return 返回对应的参数值
     */
    getQueryString: function(key) {
        var reg = new RegExp("(^|&)"+ key +"=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if(r != null)
            return unescape(r[2]); 
        return null;
    },
    /**
     * 获取指定key的值，若没有key则返回设置的默认字符串，若没有设置默认字符串，则返回空字符串
     * @param data 要获取参数值的对象
     * @param key 参数名称字符串
     * @param defaultValue 参数值置默认字符串
     * @return 返回对应的参数值
     */
    filterObj: function(data, key, defaultValue) {
        if(defaultValue === undefined) {
            defaultValue = "";
        }
        if(!data) {
        	return defaultValue;
        }
        var value = data[key];
        return value === undefined || value === null ? defaultValue : value;
    }
};

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function(fmt) {  
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
