// --------------------------------------------------------------------------
//
// MapControl class
//
// --------------------------------------------------------------------------

/**
 * 构造方法 
 * @param _conId 绘制容器对象id，比如一个div 
 * @param _data 渲染配置数据
 * @param __url 跳转url
 */
var MapControl = function(_conId, _data, _url) {
	
    if (arguments.length != 3) {
        throw new Error('传入参数个数错误,当前个数' + arguments.length + ',应传入三个参数。');
    }
    
    if (!_conId) {
        throw new Error('MapControl构造方法中传入的容器id为空。');
    }
    
	var self = this,
	    selectedZoom = 14,
	    itemMap = {};
        
    // ------------------------------
    // data
    // ------------------------------
    
    var data = _data;
//    for(var i = 0; i < 2; i++) {
//    	data.data = data.data.concat(ObjectUtil.cloneObj(data.data));
//    }
//    for(var i = 0, len = data.data.length; i < len; i++) {
//    	var item = data.data[i];
//       item.id = i + 1;
//       item.pos[0] = item.pos[0] + 0.3*Math.random();
//       item.pos[1] = item.pos[1] + 0.3*Math.random();
//    }
    this.data = function(value){
        if (!arguments.length) return data;
        data = value;
        return this;
    };
    
    // ------------------------------
    // transportList
    // ------------------------------
    
    var transportList = [];
    this.transportList = function(){
        if (!arguments.length) return transportList;
        transportList = value;
        return this;
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
    // map
    // ------------------------------
    
    var map = new BMap.Map(_conId, {enableMapClick: !1});
    this.map = function(value){
        if (!arguments.length) return map;
        map = value;
        return this;
    };
    
    var createData = function() {
        transportList.length = 0;
        var list = ObjectUtil.cloneObj(self.data());
        for(var td, tdList, orderId, order, i = 0, len = list.length; i < len; i++) {
            order = list[i];
            orderId = order.id;
            tdList = order.transportList;
            for(var j = 0, len1 = tdList.length; j < len1; j++) {
                td = tdList[j];
                td.pos = td.currentPos && td.currentPos.pos ? td.currentPos.pos : null;
                if(!td.pos) {
                	continue;
                }
                td.time = td.currentPos.time;
                td.addr = td.currentPos.address;
                td.orderId = orderId;
                transportList.push(td);
            }
        }
    };
    
	this.init = function() {
		createData();
		
        map.centerAndZoom(new BMap.Point(116.404, 39.915), 12);
        map.enableScrollWheelZoom(true);
        map.setMapStyle({style:self.mapStyle()});
        
        self.initControl();
        self.initOverlay();
        self.addListeners();
        
        self.addItems(self.transportList());
        self.initLocation(self.transportList());
        self.validateMode();
        
        //隐藏loading
        $('.init-loading').css({"display":"none"});
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
    		var pos = itemsInfo[i].pos;
    		allItemsPoints.push(new BMap.Point(pos[0], pos[1]));
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
        self.addOrderTableControl();
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
    
    this.addOrderTableControl = function() {
        self.orderTableControl = new OrderTableControl(self);
        self.orderTableControl.init(self.data());
    };
    
    this.removeOrderTableControl = function() {
        map.removeControl(self.orderTableControl);
    };
    
    this.addTransportTableControl = function(data, callBack) {
    	if(data) {
    		var transportList = ObjectUtil.cloneObj(data.transportList);
    		var orderId = data.id;
    		for(var i = 0, len = transportList.length; i < len; i++) {
    			transportList[i].orderId = orderId;
    		}
    		if(!self.transportTableControl) {
    			self.transportTableControl = new TransportTableControl(self, transportList, callBack);
                map.addControl(self.transportTableControl);
    		} else {
    			self.transportTableControl.setContent(transportList, false, callBack);
    		}
    	}
    };
    
    this.removeTransportTableControl = function() {
    	if(self.transportTableControl) {
    		map.removeControl(self.transportTableControl);
    		self.transportTableControl = null;
    	}
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
    
    var getInfoWindowContent = function(id, carNumber) {
        return  '<svg id="info_window_svg_' + id + '" verson="1.1" style="position:absolute;width:50px;height:200px;">' +
                    '<polyline points="0,195 25,65 50,65" style="stroke:rgba(68,123,175,0.75);stroke-width:2;fill:none;"/>' +
        		'</svg>' +
                '<div id="info_window_content_' + id + '" class="info_window_content">' +
                    '<div class="tl_border"></div>' +
                    '<div class="tr_border"></div>' +
                    '<div class="bl_border"></div>' +
                    '<div class="br_border"></div>' +
                    '<div><span style="padding-left:26px;">订单编号：</span>' + id + '</div>' +
                    '<div><span style="padding-left:26px;">车牌：</span>' + carNumber + '</div>' +
                    '<div><a class="link" target="_blank" href="' + _url + id + '"><span class="link_span" style="padding-left:26px;pointer-events:all;">点击查看</span><a></div>' +
                '</div>';
    };
    
    var getInfoLabelContent = function(carNumber) {
        return  '<div class="info_label_content">' +
                    '<div><span>车牌：</span>' + carNumber + '</div>' +
                '</div>';
    };
    
    var getItemTitle = function(id, carNumber) {
        return  '订单编号：'    + id +
                '\n车牌：'     + carNumber;
    };
    
    var getCarIcon = function(status) {
        var name;
        switch(status) {
           case "离线":
                name = "othertypeoffline";
                break;
            case "静止":
                name = "othertypestatic";
                break;
            default:
                name = "othertype";
                break;
        }
        var iconUrl = "assets/images/" + name + ".png";
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
        }
    };
    
    this.selectItem = function(id, isMoveCenter, isAutoZoom) {
        var obj = self.getValueByKey(id, itemMap);
        if(!obj) {
            return;
        }
        
        var item = obj.item;
        var infoLabel = obj.infoLabel;
        infoLabel.hide();
        var infoWindow = obj.infoWindow;
        item.setZIndex(2222222222);
        infoWindow.show();
        item.setLabel(infoWindow);
        playInfoWinAnimation(id);
        
        var data = obj.data;
        var pos = data.pos;
        if(!pos) {
        	return;
        }
        var point = new BMap.Point(pos[0], pos[1]);
        if(isAutoZoom) {
            map.setZoom(selectedZoom);
        }
        if(isMoveCenter) {
            map.panTo(point);
        }
        
        self.resizeUI();
    };
    
    this.unselectItem = function(id) {
        var obj = self.getValueByKey(id, itemMap);
        if(!obj) {
            return;
        }
        
        var item = obj.item;
        item.setZIndex(0);
        var infoWindow = obj.infoWindow;
        infoWindow.hide();
        var infoLabel = obj.infoLabel;
        infoLabel.show();
        item.setLabel(infoLabel);
    };
    
    this.addItem = function(data, isPanTo, isShowInfoWin) {
    	var id = ObjectUtil.filterObj(data, "id");
    	var isUpdate = itemMap[id] ? true : false;
    	id = ObjectUtil.filterObj(data, "id", "未知");
    	var orderId = ObjectUtil.filterObj(data, "orderId", "未知");
    	var carNumber = ObjectUtil.filterObj(data, "carNumber", "未知");
    	var pos = data.pos;
    	var point = new BMap.Point(pos[0], pos[1]);
    	var item = isUpdate ? itemMap[id].item : new BMap.Marker();
    	item.setPosition(point);
    	var itemIcon = getCarIcon(status);
    	var title = getItemTitle(orderId, carNumber);
    	item.setTitle(title);
    	item.setIcon(itemIcon);
        if(isPanTo) {
        	map.setZoom(selectedZoom);
        	map.panTo(point);
        }
        var html = getInfoWindowContent(orderId, carNumber);
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
        
        html = getInfoLabelContent(carNumber);
        var infoLabel = isUpdate ? itemMap[id].infoLabel : new BMap.Label(html);
        infoLabel.setOffset(new BMap.Size(10, 10));
        infoLabel.setStyle({
            "padding":"0px",
            "background-color":"rgba(0,0,0,0)", 
            "border-color":"rgba(0,0,0,0)", 
            "color":"#fff",
            "font-size":"12px",
            "font-family":"微软雅黑 宋体",
            "pointer-events":"none"
        });
        
        item.setLabel(infoLabel);
        
        itemMap[id] = {item:item, data:data, infoWindow:infoWindow, infoLabel:infoLabel};
        
        if(isUpdate) {
        	infoWindow.setContent(html);
        	infoWindow.draw();
        } else {
        	if(self.mode() === "normal") {
        		map.addOverlay(item);
        	}
        	item.addEventListener("click", function(){
        		//select order list table item
        		var table = $("#table");
        		var tableData = table.tabulator("getData");
        		var orderSelectedIndex = 0;
        		var transportSelectedIndex = 0;
        		var orderId, tpList;
        		start:for(var tp, order, tpList, i = 0, len = tableData.length; i < len; i++) {
        			order = tableData[i];
        			tpList = order.transportList;
        			for(var j = 0, len1 = tpList.length; j < len1; j++) {
        				if(tpList[j].id === id) {
                            orderSelectedIndex = i;
                            transportSelectedIndex = j;
                            orderId = order.id;
                            tpList = order.transportList;
                            break start;
                        }
        			}
        		}
        		var pageNum = Math.floor(orderSelectedIndex/10) + 1;
        		table.tabulator("setPage", pageNum);
        		table.tabulator("selectRow", orderId); //select row with orderId ;
        		var selectedData = table.tabulator("getSelectedData");
        		selectedData = selectedData.length > 0 ? selectedData[0] : null;
        		self.orderTableControl.selectRow(selectedData, function() {
        			//select transport list table item
                    var transportTable = $("#transportTable");
                    tableData = transportTable.tabulator("getData");
                    transportTable.tabulator("selectRow", id);
                    self.transportTableControl.selectRow(tpList[transportSelectedIndex]);
        		});
            });
        }
        
        if(isShowInfoWin) {
        	infoWindow.show();
        	playInfoWinAnimation(id);
        }
        $("#table").tabulator("updateData", [data]);
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
        	self.addItem(data[i]);
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
    
    self.init();
};

// --------------------------------------------------------------------------
//
// OrderTableControl class
//
// --------------------------------------------------------------------------

var OrderTableControl = function(mapControl) {
	var isShowTable = true;
	var selectedItem = null;
	
	// ------------------------------
    // tableConfig
    // ------------------------------
    
    var tableConfig = {
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
//        groupBy:"orderId",
        pagination:"local",//local:本地分页，remote远程分页
        columnVertAlign:"bottom", //align header contents to bottom of cell
        columns:[
            {title:"序号", field:"num", width:60},
            {title:"订单编号", field:"id"}
        ]
    };
    this.tableConfig = function() {
        return tableConfig;
    };
	
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
        //添加序号
        for(var i = 0, len = tableData.length; i < len; i++) {
        	tableData[i].num = i + 1;
        }
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
    
    this.selectRow = function(rowData, callBack) {
        if(!selectedItem) {//第一次选
            selectedItem = rowData;
        } else if(selectedItem && selectedItem.id !== rowData.id) {//选中不同项
            selectedItem = rowData;
        }
        mapControl.addTransportTableControl(selectedItem, callBack);
    };
    
    this.unselectRow = function(rowData) {
    	selectedItem = null;
    	mapControl.removeTransportTableControl();
    };
};

// --------------------------------------------------------------------------
//
// TransportTableControl class
//
// --------------------------------------------------------------------------

var TransportTableControl = function(_mapControl, _data, _callBack) {
    var self = this;
    // 默认停靠位置和偏移量
    this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
    this.defaultOffset = new BMap.Size(15, 370);
    
    // ------------------------------
    // mapControl
    // ------------------------------
    
    var mapControl = _mapControl;
    this.mapControl = function(value){
        if (!arguments.length) return mapControl;
        mapControl = value;
        return this;
    };
    
    // ------------------------------
    // contentDiv
    // ------------------------------
    
    var contentDiv = null;
    this.contentDiv = function(value){
        if (!arguments.length) return contentDiv;
        contentDiv = value;
        return this;
    };
    
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
    // callBack
    // ------------------------------
    
    var callBack = _callBack;
    this.callBack = function(value){
        if (!arguments.length) return callBack;
        callBack = value;
        return this;
    };
    
    // ------------------------------
    // selectedItem
    // ------------------------------
    
    var selectedItem = null;
    this.selectedItem = function(value){
        if (!arguments.length) return selectedItem;
        selectedItem = value;
        return this;
    };
    
    // ------------------------------
    // tableConfig
    // ------------------------------
    
    var tableConfig = {
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
        columnVertAlign:"bottom", //align header contents to bottom of cell
        columns:[
            {title:"运单编号", field:"id"}
        ]
    };
    this.tableConfig = function() {
        return tableConfig;
    };
    
};

// 通过JavaScript的prototype属性继承于BMap.Control
TransportTableControl.prototype = new BMap.Control();

// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
TransportTableControl.prototype.initialize = function(map) {
    var self = this;
    // 添加DOM元素到地图中
    var div = self.setContent(self.data(), true, self.callBack());
    $(div).on("mousewheel", function(event){
        event.stopPropagation();//阻止tree control冒泡
    });
    map.getContainer().appendChild(div);
    return div;
};

TransportTableControl.prototype.setContent = function(d, isInit, callBack) {
    var self = this;
    self.data(d);
    var contentDiv = self.contentDiv();
    if(!contentDiv) {
        // 创建一个DOM元素
        contentDiv = document.createElement("div");
        contentDiv.setAttribute("id", "transportTable_control")
        contentDiv.style.border = "1px solid rgba(20,255,255,0.15)";
        contentDiv.style.color = "#fff";
        contentDiv.style.backgroundColor = "rgba(68,123,175,0.75)";
        contentDiv.style.padding = "5px 5px 5px 5px";
        contentDiv.style.width = "290px";
        self.contentDiv(contentDiv);
        
        var htmlStr = 
       '<div class="tl_border"></div>' +
       '<div class="tr_border"></div>' +
       '<div class="bl_border"></div>' +
       '<div class="br_border"></div>' +
       '<div id="transportTable"></div>';
       
        contentDiv.innerHTML = htmlStr;
    }
    
    var timer1 = setInterval(function() {
    	if(document.getElementById("transportTable")) {
    		clearInterval(timer1);
    		if(self.data()) {
                if(isInit === true) {
                    self.addEventListeners();
                    $("#transportTable").tabulator(self.tableConfig());
                }
                $("#transportTable").tabulator("setData", self.data());
            } else {
                $("#transportTable").tabulator("setData", []);
            }
            if(callBack) {
            	callBack.apply(null);
            }
    	}
    }, 10);
    
    self.mapControl().resizeUI();
    contentDiv.style.display = self.data() ? "block" : "none";
    
    if(d && d.length > 0) {
        var timer = setTimeout(function(){
            clearTimeout(timer);
            self.scrollToCheckPoint(0);
        }, 100);
    }
    
    return contentDiv;
};

TransportTableControl.prototype.addEventListeners = function() {
    var self = this, data = self.data();
    self.tableConfig().rowClick = function(e, row) {
        var selectedData = $("#transportTable").tabulator("getSelectedData");
        selectedData = selectedData.length > 0 ? selectedData[0] : null;
        if(selectedData) {
            self.selectRow(row.getData());
        } else {
            self.unselectRow(row.getData());
        }
    };
};

TransportTableControl.prototype.selectRow = function(rowData) {
	var self = this;
    if(!self.selectedItem()) {//第一次选
        self.selectedItem(rowData);
    } else if(self.selectedItem() && self.selectedItem().id !== rowData.id) {//选中不同项
        self.mapControl().unselectItem(self.selectedItem().id);
        self.selectedItem(rowData);
    }
    self.mapControl().selectItem(self.selectedItem().id, true, true);
};
    
TransportTableControl.prototype.unselectRow = function(rowData) {
	var self = this;
    self.selectedItem(null);
    self.mapControl().unselectItem(rowData.id);
};

TransportTableControl.prototype.scrollToCheckPoint = function(index) {
	return;
    try {
        var cps = $("#transportTable .play_icon");
        if(index < 0) {
            index = 0;
        } else if(index > cps.length - 1) {
            index = cps.length - 1;
        }
        for(var i = 0, len = cps.length; i < len; i++) {
            if(i === index) {
                cps[i].setAttribute("class", "play_icon check_point_arrow");
            } else {
                cps[i].setAttribute("class", "play_icon check_point_arrow_hide");
            }
        }
        s = cps.eq(index).offset().top - cps.eq(0).offset().top;
        if(s > 0) {
            s += 10;
        }
        $("#transportTable").animate({scrollTop:s}, 200);
    } catch(e){
        console.log(e);
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
