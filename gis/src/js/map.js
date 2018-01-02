// --------------------------------------------------------------------------
//
// MapControl class
//
// --------------------------------------------------------------------------

var MapControl = function(_isAdmin, _mapStyle) {
	var self = this,
	    carMap = {},
        trackMap = {},
        chartMap = {};
        
    // ------------------------------
    // isAdmin
    // ------------------------------
    
    var isAdmin = _isAdmin === true;
    this.isAdmin = function(value){
        if (!arguments.length) return isAdmin;
        isAdmin = value;
        return this;
    };
    
    // ------------------------------
    // mapStyle
    // ------------------------------
    
    var mapStyle = _mapStyle ? _mapStyle : "midnight";
    this.mapStyle = function(value){
        if (!arguments.length) return mapStyle;
        mapStyle = value;
        return this;
    };
        
    // ------------------------------
    // map
    // ------------------------------
    
    var map = new BMap.Map("map", {enableMapClick: !1});
    this.map = function(value){
        if (!arguments.length) return map;
        map = value;
        return this;
    };
    
    // ------------------------------
    // tracksInfo
    // ------------------------------
    
    var tracksInfo = {};
    this.tracksInfo = function(value){
        if (!arguments.length) return tracksInfo;
        tracksInfo = value;
        return this;
    };
    
    // ------------------------------
    // trackMap
    // ------------------------------
    
    this.trackMap = function(){
        return trackMap;
    };
    
    // ------------------------------
    // geoc
    // ------------------------------
    
    var geoc = new BMap.Geocoder();
    this.geoc = function(value){
        if (!arguments.length) return geoc;
        geoc = value;
        return this;
    };
    
    this.parseAddr = function(addrList, i, tracksInfo) {
        self.geoc().getPoint(addrList[i].addr, function(pt) {
        	if(addrList[i].posObj) {
        		addrList[i].posObj.pos = [pt.lng, pt.lat];
        	}
        	i++;
        	//判断是否解析完毕
        	if(i >= addrList.length) {
        		//初始化内容
        		self.initContent(tracksInfo);
        		return;
        	}
        	self.parseAddr(addrList, i, tracksInfo);
        });
    };
    
    this.parseAddrList = function(addrList, tracksInfo) {
    	self.parseAddr(addrList, 0, tracksInfo);
    };
    
    this.init = function(tracksInfo) {
    	var addrList = [];
    	//解析数据，生成正确的数据结构
    	for(var sections, pos, i = 0, len = tracksInfo.length; i < len; i++) {
            //替换id中的特殊字符
            var t = tracksInfo[i];
            var tId = t.id;
            if(tId &&　tId.indexOf("@")) {
                t.id = tId.replace("@", "_");
            }
            //解析Pos，并且把sections中的数据拼装到运单对象中，用来生成轨迹和车辆数据
            var currentTime;
            if(t.currentPos) {
            	currentTime = t.currentPos.time;
                pos = t.currentPos.pos;
                if(pos && pos.length === 2) {
                    pos[0] = parseFloat(pos[0]);
                    pos[1] = parseFloat(pos[1]);
                }
            }
            sections = t.dispatchData;
            if(sections) {
            	var isFindSection = false;
            	t.posList = [];
                for(var j = 0, len1 = sections.length; j < len1; j++) {
                    var section = sections[j];
                    pos = section.startPos.pos;
                    if(pos && pos.length === 2) {
                        pos[0] = parseFloat(pos[0]);
                        pos[1] = parseFloat(pos[1]);
                    } else {
                    	addrList.push({addr:section.startPos.address, posObj:section.startPos});
                    }
                    //取第一段的起点
                    if(j === 0) {
                    	t.startPos = section.startPos;
                    }
                    //取最后一段的终点
                    if(j === len1 - 1) {
                    	t.endPos = section.endPos;
                    }
                    pos = section.endPos.pos;
                    if(pos && pos.length === 2) {
                        pos[0] = parseFloat(pos[0]);
                        pos[1] = parseFloat(pos[1]);
                    } else {
                        addrList.push({addr:section.endPos.address, posObj:section.endPos});
                    }
                    var posList = section.posList;
                    if(posList) {
                    	var posObj, time, nextTime, nextIndex;
                        for(var k = 0, len2 = posList.length; k < len2; k++) {
                        	posObj = posList[k];
                        	if(!isFindSection) {
                        		time = posObj.time;
                                nextIndex = k + 1;
                                nextTime = nextIndex > len2 - 1 ? posList[len2 - 1].time : posList[nextIndex].time;
                                if(currentTime >= time && currentTime <= nextTime) {
                                    t.portraitUrl = section.portraitUrl;
                                    t.name = section.name;
                                    t.tel = section.tel;
                                    t.driveTime = section.driveTime;
                                    t.carNumber = section.carNumber;
                                    t.company = section.company;
                                    t.consignor = section.consignor;
                                    t.consignee = section.consignee;
                                    t.containerTemp = section.containerTemp;
                                    t.outdoorTemp = section.outdoorTemp;
                                    t.sectionId = section.id;
                                    t.isTemp = section.isTemp;
                                    isFindSection = true;
                                }
                        	}
                            pos = posObj.pos;
                            if(pos && pos.length === 2) {
                                pos[0] = parseFloat(pos[0]);
                                pos[1] = parseFloat(pos[1]);
                            }
                            t.posList.push(posObj);
                        }
                    }
                }
            }
        }
        
        //解析起点终点地址为经纬度
        if(addrList.length > 0) {
        	self.parseAddrList(addrList, tracksInfo);
        } else {//初始化内容
        	self.initContent(tracksInfo);
        }
    };
	
	this.initContent = function(tracksInfo) {
		self.tracksInfo(tracksInfo);
        map.centerAndZoom(new BMap.Point(116.404, 39.915), 12);
        map.enableScrollWheelZoom(true);
        map.setMapStyle({style:self.mapStyle()});
        
        self.initControl(tracksInfo);
        self.initOverlay();
        self.addListeners();
        
        self.addCars(tracksInfo);
        self.initLocation(tracksInfo);
        
        var timer = setTimeout(function(){
        	clearTimeout(timer);
        	$('.init-loading').css("display", "none");
        	$('#map').animate({"opacity":1});
            $('#tableCon').animate({"opacity":1});
        }, 1000);
    };

    this.initLocation = function(tracksInfo) {
    	var allCarsPoints = [];
    	for(var i = 0, len = tracksInfo.length; i < len; i++) {
    		var track = tracksInfo[i];
    		if(!track.currentPos || !track.currentPos.pos || track.currentPos.pos.length !== 2) {
    			continue;
    		}
    		var pos = track.currentPos.pos;
    		allCarsPoints.push(new BMap.Point(pos[0], pos[1]));
    	}
    	if(allCarsPoints.length > 1) {
    		map.setViewport(allCarsPoints);
    	} else if (allCarsPoints.length === 1) {
    		map.setCenter(allCarsPoints[0]);
    		map.setZoom(10);
    	} else {
            var myCity = new BMap.LocalCity();
            myCity.get(function(result) {
                var cityName = result.name;
                map.setCenter(cityName);
            });
    	}
    };
    
    this.initControl = function(tracksInfo) {
        self.addCityListControl();
        self.addNavigationControl();
        self.addScaleControl();
        self.addMapTypeControl();
        self.addInfoControl();
        self.addRouteControl();
        self.addTableControl(tracksInfo);
        self.addTreeControl();
    };
    
    this.initOverlay = function() {
        
    };
    
    this.addListeners = function() {
    	window.addEventListener("resize", self.resizeUI);
    	//window.onresize = self.resizeUI;
    }
    
    this.resizeUI = function() {
//    	var rc = self.routeControl;
//        if(rc) {
//            var moveHeight = isMutilMode ? (self.isAdmin() ? 480 : 405) : (self.isAdmin() ? 170 : 95);
//            var mapHeight = $("#map").outerHeight(true);
//            var maxHeight = mapHeight - moveHeight < 0 ? 0 : mapHeight - moveHeight;
//            $("#drive_result_con").css("maxHeight", maxHeight + "px");
//        }
    	var tree = self.treeControl;
    	if(tree) {
    		var mapHeight = $("#map").outerHeight(true) - 20;
    		var y = 380;
    		var maxHeight = mapHeight - y < 0 ? 0 : mapHeight - y;
    		$("#tree_control").css("height", maxHeight + "px");
    		$("#sectionsTree").css("height", (maxHeight - 30) + "px");
    		tree.setOffset(BMap.Size(15, y));
    	}
    }
    
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
    
    this.addInfoControl = function() {
        self.infoControl = new InfoControl();
        map.addControl(self.infoControl);
        self.infoControl.hide();
    };
    
    this.removeInfoControl = function() {
        map.removeControl(self.infoControl);
    };
    
    this.addRouteControl = function() {
        self.routeControl = new RouteControl(self, null, self.isAdmin());
        map.addControl(self.routeControl);
        self.routeControl.hide();
    };
    
    this.removeRouteControl = function() {
        map.removeControl(self.routeControl);
    };
    
    this.addTableControl = function(tracksInfo) {
        self.tableControl = new TableControl(self);
        self.tableControl.init(tracksInfo);
        if(!isMutilMode) {
        	self.tableControl.selectRow(tracksInfo[0]);
        }
    };
    
    this.removeTableControl = function() {
        
    };
    
    this.addTreeControl = function(tracksInfo) {
        self.treeControl = new TreeControl(this);
        map.addControl(self.treeControl);
    };
    
    this.removeTreeControl = function() {
        map.removeControl(self.treeControl);
        self.treeControl = null;
    };
    
    this.addTempControl = function(id) {
    	if(!self.tempControl) {
    		 self.tempControl = new TempControl(id, this);
    		 map.addControl(self.tempControl);
    	}
    };
    
    this.removeTempControl = function() {
    	if(self.tempControl) {
        	map.removeControl(self.tempControl);
            self.tempControl = null;
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
    
    var getInfoWindowContent = function(id, sectionId, status, addr, point, time, containerTemp, outdoorTemp, isTemp) {
        return  '<svg id="info_window_svg_' + id + '" verson="1.1" style="position:absolute;width:50px;height:200px;pointer-events:none;">' +
                    '<polyline points="0,195 25,50 50,50" style="stroke:rgba(68,123,175,0.75);stroke-width:2;fill:none;"/>' +
        		'</svg>' +
                '<div id="info_window_content_' + id + '" class="info_window_content">' +
                    '<div class="tl_border"></div>' +
                    '<div class="tr_border"></div>' +
                    '<div class="bl_border"></div>' +
                    '<div class="br_border"></div>' +
                    '<div><span style="padding-left:0px;">运单编号：</span>' + ObjectUtil.getOrinId(id) + '</div>' +
                    '<div><span style="padding-left:0px;">装车单号：</span>' + sectionId + '</div>' +
                    '<div><span style="padding-left:26px;">状态：</span>' + status + '</div>' +
                    '<div><span style="padding-left:0px;">当前位置：</span>' + addr + '</div>' +
                    '<div><span style="padding-left:0px;">当前定位：</span>' + (point.join ? point.join(" , ") : point) + '</div>' +
                    '<div><span style="padding-left:0px;">当前时间：</span>' + time + '</div>' +
                '</div>' + (isTemp === true ? 
                ('<svg id="temp_window_svg_' + id + '" verson="1.1" style="position:absolute;width:50px;height:100px;top:200px;pointer-events:none;">' +
                    '<polyline points="0,0 25,45 50,45" style="stroke:rgba(68,123,175,0.75);stroke-width:2;fill:none;"/>' +
                '</svg>' +
                '<div id="temp_window_content_' + id + '" class="temp_window_content">' +
                    '<div class="tl_border"></div>' +
                    '<div class="tr_border"></div>' +
                    '<div class="bl_border"></div>' +
                    '<div class="br_border"></div>' +
//                    '<div><span style="padding-left:0px;">货柜温度：</span>' + containerTemp + '</div>' +
//                    '<div><span style="padding-left:0px;">室外温度：</span>' + outdoorTemp + '</div>' +
                    '<div id="temp_chart_' + id + '" class="chart" title="点击查看具体信息"></div>' +
                    '<div id="temp_chart_con_' + id + '" style="display:block;width:200px;height:60px;margin-left:20px;"></div>' +
                    '<div id="temp_chart_pre_' + id + '" class="chartPreBtn" title="向前查看"></div>' +
                    '<div id="temp_chart_next_' + id + '" class="chartNextBtn" title="向后查看"></div>' +
                '</div>') : '');
    };
    
    var getCarTitle = function(id, sectionId, status, addr, time, orderTime, consignor, startAddr, consignee, endAddr, transportType, containerTemp, outdoorTemp, isTemp) {
        return  '运单编号：' + ObjectUtil.getOrinId(id) +
                '\n装车单号：' + sectionId +
                '\n状态：' + status +
                '\n当前位置：' + addr +
                '\n当前时间：' + time +
                '\n运单时间：' + orderTime + 
                '\n发货人：' + consignor + 
                '\n发货地址：' + startAddr + 
                '\n收货人：' + consignee + 
                '\n收货地址：' + endAddr + 
                '\n运输类型：' + transportType +
                (isTemp === true ? ('\n货柜温度：' + containerTemp + '\n室外温度：' + outdoorTemp) : '');
    };
    
    var getCarIcon = function(status, isLushu) {
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
        var iconUrl = "assets/images/" + (isLushu ? name + "_lushu" : name) + ".png";
        var size = isLushu ? new BMap.Size(54*0.6, 44*0.6) : new BMap.Size(44*0.6, 54*0.6);
        var icon = new BMap.Icon(iconUrl, size);
        icon.setImageSize(size);
        return icon;
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
    
    var getLushu = function(points, opts) {
        if(!points || points.length === 0) {
            return null;
        }
        if(!opts) {
            var icon = getCarIcon(null, true);
            opts = {
        	  landmarkPois:[],
              speed: 5000,          //路书速度
              icon: icon,           //覆盖物图标，默认是百度的红色地点标注
              autoView: false,      //自动调整路线视野
              enableRotation: false //覆盖物随路线走向
            };
        }
        var lushu = new BMapLib.LuShu(map, points, opts);
        //lushu.routeControl(self.routeControl);
        lushu.treeControl(self.treeControl);
        return lushu;
    };
    
    var playInfoWinAnimation = function(id) {
        var transition1 = d3.transition().duration(500).delay(500).ease(d3.easeExpOut);
        var transition2 = d3.transition().duration(200).delay(100).ease(d3.easeExpOut);
        d3.select("#info_window_content_"+id)
            .style("opacity", 0)
            .style("transform", "translate(100px, 0px)");
        d3.select("#info_window_svg_"+id)
            .style("transform-origin", "left bottom")
            .style("transform", "scale(0, 0)")
            .transition(transition1)
            .style("transform", "scale(1, 1)")
            .on("end", function() {
                d3.select("#info_window_content_"+id)
                    .transition(transition2)
                    .style("opacity", 1)
                    .style("transform", "translate(0px, 0px)");
            });
            
         d3.select("#temp_window_content_"+id)
            .style("opacity", 0)
            .style("transform", "translate(100px, 0px)");
         d3.select("#temp_window_svg_"+id)
            .style("transform-origin", "left top")
            .style("transform", "scale(0, 0)")
            .transition(transition1)
            .style("transform", "scale(1, 1)")
            .on("end", function() {
                d3.select("#temp_window_content_"+id)
                    .transition(transition2)
                    .style("opacity", 1)
                    .style("transform", "translate(0px, 0px)");
            });
    };
    
    this.getValueByKey = function(key, data) {
        return data ? data[key] : null;
    };
    
    this.getLuShuById = function(id) {
        var obj = self.getValueByKey(id, trackMap);
        if(!obj) {
            return null;
        }
        return obj.lushu;
    }
    
    this.visibleCar = function(id, visible) {
    	var obj = self.getValueByKey(id, carMap);
        if(!obj) {
            return;
        }
        var car = obj.car;
        if(car) {
        	visible ? car.show() : car.hide();
        }
    };
    
    this.selectCar = function(id, isMoveCenter, isAutoZoom) {
        var obj = self.getValueByKey(id, carMap);
        if(!obj) {
            return;
        }
        
        var car = obj.car;
        var infoWindow = obj.infoWindow;
        car.setTop(true);
        infoWindow.show();
        playInfoWinAnimation(id);
        
        var data = obj.data;
        var pos = ObjectUtil.filterObj(data.currentPos, "pos");
        var point = new BMap.Point(pos[0], pos[1]);
        if(isMoveCenter) {
            map.panTo(point);
        }
        if(isAutoZoom) {
            map.setZoom(14);
        }
        
        var infoControl = self.infoControl;
        infoControl.setContent(data);
        if(!infoControl.isVisible()) {
            infoControl.show();
        }
        
//        var routeControl = self.routeControl;
//        routeControl.setContent(data);
//        routeControl.show();
        self.resizeUI();
    };
    
    this.addCar = function(data, isPanTo, isShowInfoWin) {
    	var id = ObjectUtil.filterObj(data, "id");
    	var isUpdate = carMap[id] ? true : false;
    	var sectionId = ObjectUtil.filterObj(data, "sectionId", "未知");
    	var pos = ObjectUtil.filterObj(data.currentPos, "pos", "未知");
    	var addr = ObjectUtil.filterObj(data.currentPos, "address", "未知");
    	var status = ObjectUtil.filterObj(data, "status", "未知");
    	var time = ObjectUtil.filterObj(data.currentPos, "time", "未知");
    	var orderTime = ObjectUtil.filterObj(data.posList ? data.posList[0] : null, "time").split(" ")[0];
    	var consignor = ObjectUtil.filterObj(data, "consignor", "未知");
    	var startAddr = ObjectUtil.filterObj(data.startPos, "address", "未知");
    	var consignee = ObjectUtil.filterObj(data, "consignee", "未知");
    	var endAddr = ObjectUtil.filterObj(data.endPos, "address", "未知");
    	var transportType = ObjectUtil.filterObj(data, "transportType", "未知");
    	var containerTemp = ObjectUtil.filterObj(data, "containerTemp", "未知");
    	var outdoorTemp = ObjectUtil.filterObj(data, "outdoorTemp", "未知");
    	var isTemp = ObjectUtil.filterObj(data, "isTemp", false) === 1;
    	var point = new BMap.Point(pos[0], pos[1]);
    	var car = isUpdate ? carMap[id].car : new BMap.Marker();
    	car.setPosition(point);
    	var carIcon = getCarIcon(status);
    	var title = getCarTitle(id, sectionId, status, addr, time, orderTime, consignor, startAddr, consignee, endAddr, transportType, containerTemp, outdoorTemp, isTemp);
    	car.setTitle(title);
    	car.setIcon(carIcon);
        if(isPanTo) {
        	map.setZoom(14);
        	map.panTo(point);
        }
        var html = getInfoWindowContent(id, sectionId, status, addr, pos, time, containerTemp, outdoorTemp, isTemp);
        var infoWindow = isUpdate ? carMap[id].infoWindow : new BMap.Label(html);
        infoWindow.setOffset(new BMap.Size(10, -185));
        infoWindow.setStyle({
        	"padding":"0px",
            "background-color":"rgba(0,0,0,0)", 
            "border-color":"rgba(0,0,0,0)", 
            "color":"#fff",
            "font-size":"13px",
            "font-family":"微软雅黑 宋体"
        });
        infoWindow.hide();
        car.setLabel(infoWindow);
        
        carMap[id] = {car:car, data:data, infoWindow:infoWindow};
        
        //设置方向
        var posList = data.posList;
        if(posList && posList.length > 1) {
            var sp = posList[posList.length-2].pos;
            sp = map.pointToPixel(new BMap.Point(sp[0], sp[1]));
            var ep = posList[posList.length-1].pos;
            ep = map.pointToPixel(new BMap.Point(ep[0], ep[1]));
            var deg = Math.atan2(ep.y-sp.y, ep.x-sp.x)*180/Math.PI+90;
            carMap[id].car.setRotation(deg);
        }
        
        if(isUpdate) {
        	infoWindow.setContent(html);
        	infoWindow.draw();
        	addChartListener(id);
        } else {
        	map.addOverlay(car);
        	car.addEventListener("click", function(){
        		var table = $("#table");
        		var tableData = table.tabulator("getData");
        		var selectedIndex = 0;
        		for(var i = 0, len = tableData.length; i < len; i++) {
        			if(tableData[i].id === id) {
        				selectedIndex = i;
        				break;
        			}
        		}
        		var pageNum = Math.floor(selectedIndex/10) + 1;
        		table.tabulator("setPage", pageNum);
        		table.tabulator("selectRow", id); //select row with id ;
        		var selectedData = table.tabulator("getSelectedData");
        		selectedData = selectedData.length > 0 ? selectedData[0] : null;
        		if(isMutilMode) {
                    if(selectedData.hasOwnProperty("plan")) {
                        self.tableControl.selectRow(selectedData);
                    } else {
                        //请求数据
                        self.tableControl.loadRowData(selectedData);
                    }
                } else {
                    self.tableControl.selectRow(selectedData);
                }
            });
        }
        
//        geoPosToAddr(point, 3, function(addr) {
//        	data.address = addr;
//        	$("#table").tabulator("updateData", [data]);
//        	
//        	html = getInfoWindowContent(id, sectionId, status, addr, pos, time, containerTemp, outdoorTemp, isTemp);
//        	var win = carMap[id].infoWindow;
//        	win.setContent(html);
//            win.draw();
//            
//            title = getCarTitle(id, sectionId, status, addr, time, orderTime, consignor, startAddr, consignee, endAddr, transportType, containerTemp, outdoorTemp, isTemp);
//            car.setTitle(title);
//            
//            addChartListener(id);
//            
//            addChart(id);
//        });
        
    	$("#table").tabulator("updateData", [data]);
        html = getInfoWindowContent(id, sectionId, status, addr, pos, time, containerTemp, outdoorTemp, isTemp);
        var win = carMap[id].infoWindow;
        win.setContent(html);
        win.draw();
        title = getCarTitle(id, sectionId, status, addr, time, orderTime, consignor, startAddr, consignee, endAddr, transportType, containerTemp, outdoorTemp, isTemp);
        car.setTitle(title);
        
        if(isShowInfoWin) {
        	infoWindow.show();
        	playInfoWinAnimation(id);
        }
        $("#table").tabulator("updateData", [data]);
    };
    
    var addChart = function(id) {
    	if(!trackMap[id]) {
            return;
        }
    	if(!chartMap[id]) {
            chartMap[id] = {};
        }
        var timer = setInterval(function(){
        	var node = d3.select("#temp_chart_con_" + id).node();
            if(node && node.clientWidth > 0 && node.clientHeight > 0) {
                clearInterval(timer);
                var chartConId = "temp_chart_con_" + id;
                var ins = trackMap[id].data.tempIns;
                ins.lineConfig().axis.yAxis[0].tick.tickArguments = [2];
                ins.lineConfig().axis.xAxis[0].tick.tickFormat = function(d) {
                    return d3.timeFormat('%H:%M')(d.getTime());
                };
                var graph = new ghca_charts.view.graph(chartConId, ins.lineConfig());
                graph.render();
                chartMap[id].chart = graph;
            }
        }, 10);
    };
    
    var addChartListener = function(id) {
    	if(!chartMap[id]) {
    		chartMap[id] = {};
    	}
    	chartMap[id].isOpen = false;
    	var chartConId = "temp_chart_con_" + id;
        var preBtnId = "temp_chart_pre_" + id;
        var nextBtnId = "temp_chart_next_" + id;
    	$("#temp_chart_" + id).on("click", function() {
            var isOpen = chartMap[id].isOpen === true;
            chartMap[id].isOpen = !isOpen;
            if(isOpen) {//缩小
            	$("#" + preBtnId).css("display", "none");
            	$("#" + nextBtnId).css("display", "none");
                $("#" + chartConId).animate({"width":"200px", "height":"60px"}, 200, "swing", function(){
                	var chart = chartMap[id].chart;
                	chart.setConfigProperty("axis.yAxis[0].tick.tickArguments", [2]);
                	chart.setConfigProperty("axis.xAxis[0].tick.tickFormat", function(d) {
                        return d3.timeFormat('%H:%M')(d.getTime());
                    });
                    chart.update();
                    chart.resize();
                });
            } else {//放大
                $("#" + chartConId).animate({"width":"350px", "height":"200px"}, 200, "swing", function() {
                    var chart = chartMap[id].chart;
                    var ins = trackMap[id].data.tempIns;
                    chart.setConfigProperty("axis.yAxis[0].tick.tickArguments", [5]);
                    chart.setConfigProperty("axis.xAxis[0].tick.tickFormat", function(d) {
                        return d3.timeFormat('%m-%d %H:%M')(d.getTime());
                    });
                    chart.update();
                    chart.resize();
                    self.validatePageBtn(id, ins);
                });
            }
        });
        $("#" + preBtnId).on("click", function() {
        	var chart = chartMap[id].chart;
        	var ins = trackMap[id].data.tempIns;
        	var data = ins.getPrePageTempData();
        	self.validatePageBtn(id, ins);
            chart.setData({data:data[0]}, 0);
            chart.setData({data:data[1]}, 1);
            chart.update();
        });
        $("#" + nextBtnId).on("click", function() {
        	var chart = chartMap[id].chart;
        	var ins = trackMap[id].data.tempIns;
            var data = ins.getNextPageTempData();
            self.validatePageBtn(id, ins);
            chart.setData({data:data[0]}, 0);
            chart.setData({data:data[1]}, 1);
            chart.update();
        });
    };
    
    this.validatePageBtn = function(id, ins) {
    	var preBtnId = "temp_chart_pre_" + id;
        var nextBtnId = "temp_chart_next_" + id;
    	$("#" + preBtnId).css("display", ins.tempPage() === 0 ? "none" : "block");
        $("#" + nextBtnId).css("display", ins.tempPage() === ins.tempTotalPage() ? "none" : "block");
    };
    
    this.updateCar = function(data) {
        self.addCar(data);
    };
    
    this.removeCar = function(id) {
        var obj = carMap[id];
        if(obj) {
        	map.removeOverlay(obj.car);
        	delete carMap[id];
        }
    };
    
    this.addCars = function(data) {
        if(!data) {
        	return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
        	self.addCar(data[i]);
        }
    };
    
    this.updateCars = function(data) {
        if(!data) {
            return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
            self.updateCar(data[i]);
        }
    };
    
    this.removeCars = function(ids) {
        if(!ids) {
            return;
        }
        for(var i = 0, len = ids.length; i < len; i++) {
            self.removeCar(ids[i]);
        }
    };
    
    this.selectTrack = function(id, isViewPlanPath) {
        var obj = self.getValueByKey(id, trackMap);
        if(!obj) {
            return;
        }
        var points = isViewPlanPath ? 
            (obj.planPoints ? obj.planPoints : [obj.startPoint, obj.endPoint]) : 
            obj.points;
        map.setViewport(points);
    };
    
    this.addTrack = function(data, isPanTo) {
    	var id = ObjectUtil.filterObj(data, "id");
    	var oldTrackObj = trackMap[id];
    	var isUpdate = oldTrackObj ? true : false;
    	var posList = data.posList;
    	var points = [];
    	for(var i = 0, len = posList.length; i < len; i++) {
            var posObj = posList[i];
            var pos = posObj.pos;
            points.push(new BMap.Point(pos[0], pos[1]));
        }
        var sections = data.dispatchData;
    	var sectionsPts = [];
    	for(var section, i = 0, len = sections.length; i < len; i++) {
    		var pts = [];
            section = sections[i];
            posList = section.posList;
            for(var pos, j = 0, len1 = posList.length; j < len1; j++) {
                pos = posList[j].pos;
                pts.push(new BMap.Point(pos[0], pos[1]));
            }
            sectionsPts.push(pts);
        }
        
        //添加起点
        var startPos = data.startPos;
        var startPoint = new BMap.Point(startPos.pos[0], startPos.pos[1]);
        var startMarker = isUpdate ? oldTrackObj.startMarker : new BMap.Marker();
        startMarker.setPosition(startPoint);
        if(!isUpdate) {
        	var startIcon = getIcon("assets/images/start_marker.png", [29, 33], [29/2, 33]);
            startMarker.setIcon(startIcon);
            map.addOverlay(startMarker);
        }
//        startMarker.setTitle("[起点]" + "\n运单编号：" + id + "\n地址：" + "解析中...");
//        geoPosToAddr(startPoint, 4, function(addr) {
            startMarker.setTitle("[起点]" + "\n运单编号：" + id + "\n地址：" + startPos.address);
//        });
        
        //添加终点
        var endPos = data.endPos;
        var endPoint = new BMap.Point(endPos.pos[0], endPos.pos[1]);
        var endMarker = isUpdate ? oldTrackObj.endMarker : new BMap.Marker();
        endMarker.setPosition(endPoint);
        if(!isUpdate) {
        	var endIcon = getIcon("assets/images/end_marker.png", [29, 32], [29/2, 32]);
            endMarker.setIcon(endIcon);
            map.addOverlay(endMarker);
        }
//        endMarker.setTitle("[终点]" + "\n运单编号：" + id + "\n地址：" + "解析中...");
//        geoPosToAddr(endPoint, 4, function(addr) {
            endMarker.setTitle("[终点]" + "\n运单编号：" + id + "\n地址：" + endPos.address);
//        });
        
        //添加预定线路
        if(!isUpdate ||　!startPoint.equals(oldTrackObj.startPoint) || !endPoint.equals(oldTrackObj.endPoint)) {
        	var plan = data.plan;
        	var path = plan.path;
        	var planPoints = [];
        	for(var i = 0; i < path.length; i++) {
        		var pos = path[i];
        		planPoints.push(new BMap.Point(pos[0], pos[1]));
        	}
    		var planPath = new BMap.Polyline(planPoints, {strokeColor:'#4caf50', strokeWeight:5, strokeOpacity:0.8});//创建折线
            map.addOverlay(planPath);
        	var trackObj = trackMap[id];
            if(trackObj) {
                trackObj.planPoints = planPoints;
                trackObj.planPath = planPath;
            }
        }
        
        //添加行驶轨迹
        var track = isUpdate ? oldTrackObj.track : new BMap.Polyline(points, {strokeColor:"rgba(0,0,0,0)", strokeWeight:5, strokeOpacity:0.8});//创建折线
        var sectionTracks;
        if(isUpdate) {
            sectionTracks = oldTrackObj.sectionTracks;
        } else {
        	sectionTracks = [];
        	for(var i = 0, len = sectionsPts.length; i < len; i++) {
                sectionTracks.push(new BMap.Polyline(sectionsPts[i], {strokeColor:ColorUtil.getColor(i), strokeWeight:5, strokeOpacity:0.8}));
            }
        }
        if(isUpdate) {
            track.setPath(points);
            for(var i = 0, len = sectionTracks.length; i < len; i++) {
            	sectionTracks[i].setPath(sectionsPts[i]);
            }
        } else {
            map.addOverlay(track);
            for(var i = 0, len = sectionTracks.length; i < len; i++) {
                map.addOverlay(sectionTracks[i]);
            }
        }
        //刷新到达check point的时间
        self.routeControl.checkPath(data, true);
        //创建路书
        var startPos = data.startPos.pos;
        var endPos = data.endPos.pos;
        var icon = getCarIcon(data.status, true);
//        var steps = data.plan.steps;
        var steps = data.posList;
        var landmarkPois = [];
        for(var i = 0; i < steps.length; i++) {
        	var step = steps[i];
        	landmarkPois.push({
                lng:step.pos[0],
                lat:step.pos[1],
                html:'<div style="font-size:13px;font-family:微软雅黑 宋体;">' +
                         '<div style="text-align:left;">到达地点：' + step.address + '</div>' +
                	     '<div style="text-align:left;">到达时间：' + (step.time ? step.time : "未知")+ '</div>' + 
            	     '</div>',
                pauseTime:2
            });
        }
        var lushuOpts = {
            landmarkPois:landmarkPois,  //标记点集合
            defaultContent:"运单编号:" + ObjectUtil.getOrinId(id), //覆盖物内容，这个填上面的特殊点文字才会显示
            speed:5000,                 //路书速度,m/s
            icon:icon,                  //覆盖物图标，默认是百度的红色地点标注
            autoView:true,              //自动调整路线视野
            enableRotation:true         //覆盖物随路线走向
        };
        var lushu = getLushu(points, lushuOpts);
        
        //添加当前车辆位置
        self.addCar(data);
        
        if(isPanTo) {
            map.setViewport([startPoint, endPoint]);
        }
        if(isUpdate) {
        	oldTrackObj.points = points;
            oldTrackObj.lushu = lushu;
            oldTrackObj.startPoint = startPoint;
            oldTrackObj.endPoint = endPoint;
        } else {
        	new Temp().create(data);
        	trackMap[id] = {
                track:track, 
                sectionTracks:sectionTracks,
                startMarker:startMarker, 
                endMarker:endMarker, 
                data:data, 
                points:points, 
                lushu:lushu,
                startPoint:startPoint,
                endPoint:endPoint,
                planPoints:planPoints,
                planPath:planPath
            };
        }
        
         //添加缩略温度显示
        addChartListener(id);
        addChart(id);
    };
    
    this.updateTrack = function(data) {
    	self.addTrack(data);
    };
    
    this.removeTrack = function(id) {
    	var obj = trackMap[id];
        if(obj) {
        	self.destroy(id);
            map.removeOverlay(obj.track);
            if(obj.sectionTracks) {
            	for(var i = 0, len = obj.sectionTracks.length; i < len; i++) {
                    map.removeOverlay(obj.sectionTracks[i]);
                }
            }
            map.removeOverlay(obj.planPath);
            map.removeOverlay(obj.startMarker);
            map.removeOverlay(obj.endMarker);
            self.removeCar(id);
            delete trackMap[id];
        }
    };
    
    this.addTracks = function(data) {
        if(!data) {
            return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
            self.addTrack(data[i]);
        }
    };
    
    this.updateTracks = function(data) {
        if(!data) {
            return;
        }
        for(var i = 0, len = data.length; i < len; i++) {
            self.updateTrack(data[i]);
        }
    };
    
    this.removeTracks = function(ids) {
        if(!ids) {
            return;
        }
        for(var i = 0, len = ids.length; i < len; i++) {
            self.removeTrack(ids[i]);
        }
    };
    
    this.start = function(id) {
        var lushu = self.getLuShuById(id);
        if(lushu) {
        	self.visibleCar(id, false);
        	lushu.start();
        }
    };
    
    this.pause = function(id) {
    	var lushu = self.getLuShuById(id);
        if(lushu) {
            lushu.pause();
        }
    };
    
    this.stop = function(id) {
    	var lushu = self.getLuShuById(id);
        if(lushu) {
        	self.visibleCar(id, true);
        	self.selectCar(id, true);
            lushu.stop();
        }
    };
    
    this.destroy = function(id) {
        var lushu = self.getLuShuById(id);
        if(lushu) {
            lushu.destroy();
        }
    };
};

// --------------------------------------------------------------------------
//
// InfoControl class
//
// --------------------------------------------------------------------------

var InfoControl = function(_data) {
	// 默认停靠位置和偏移量
	this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
	this.defaultOffset = new BMap.Size(50, 15);
	
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
    // contentDiv
    // ------------------------------
    
    var contentDiv = null;
    this.contentDiv = function(value){
        if (!arguments.length) return contentDiv;
        contentDiv = value;
        return this;
    };
    
    // ------------------------------
    // isShowTable
    // ------------------------------
    
    var isShowTable = false;
    this.isShowTable = function(value){
        if (!arguments.length) return isShowTable;
        isShowTable = value;
        return this;
    };
};

// 通过JavaScript的prototype属性继承于BMap.Control
InfoControl.prototype = new BMap.Control();

// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
InfoControl.prototype.initialize = function(map) {
	var self = this;
	// 添加DOM元素到地图中
	var div = self.setContent();
    map.getContainer().appendChild(div);
	return div;
};

InfoControl.prototype.setContent = function(data) {
	var self = this;
	self.data(data);
	var contentDiv = self.contentDiv();
	if(!contentDiv) {
		// 创建一个DOM元素
        contentDiv = document.createElement("div");
        contentDiv.setAttribute("id", "info_control")
        contentDiv.style.border = "1px solid rgba(20,255,255,0.15)";
        contentDiv.style.color = "#fff";
        contentDiv.style.backgroundColor = "rgba(68,123,175,0.75)";
        contentDiv.style.padding = "5px 5px 5px 5px";
        self.contentDiv(contentDiv);
	}
	var portraitUrl     = data && data.portraitUrl ? data.portraitUrl : "http://i03.pic.sogou.com/2f6a423c0406a4fd";
    var name            = ObjectUtil.filterObj(data, "name", "未知");
    var driveTime       = ObjectUtil.filterObj(data, "driveTime", "未知");
    var tel             = ObjectUtil.filterObj(data, "tel", "未知");
    var carNumber       = ObjectUtil.filterObj(data, "carNumber", "未知");
    var company         = ObjectUtil.filterObj(data, "company", "未知");
    var orderTime       = data ? ObjectUtil.filterObj(data.posList[0], "time").split(" ")[0] : "未知";
    var consignor       = ObjectUtil.filterObj(data, "consignor", "未知");
    var startAddr       = data ? ObjectUtil.filterObj(data.startPos, "address", "未知") : "未知";
    var consignee       = ObjectUtil.filterObj(data, "consignee", "未知");
    var endAddr         = data ? ObjectUtil.filterObj(data.endPos, "address", "未知") : "未知";
    var transportType   = ObjectUtil.filterObj(data, "transportType", "未知");
    var htmlStr = 
       '<div class="tl_border"></div>' +
       '<div class="tr_border"></div>' +
       '<div class="bl_border"></div>' +
       '<div class="br_border"></div>' +
       '<div style="min-width:250px;font-size:13px;font-family:微软雅黑 宋体;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
           '<img src=' + portraitUrl + ' style="float:left;width:60px;height:60px;"/>' +
           '<div style="position:relative;width:auto;left:5px;padding-top:10px;">' +
               '<div>姓名：' + name + '</div>' +
               '<div>驾龄：' + driveTime + '</div>' +
               '<div>车牌：' + carNumber + '</div>' +
           '</div>' +
           '<div>' +
               '<div><span style="padding-left:26px;">电话：</span>' + tel + '</div>' +
               '<div><span style="padding-left:0px;">运输公司：</span>' + self.splitByLine(company, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:0px;">运单时间：</span>' + self.splitByLine(orderTime, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:13px;">发货人：</span>' + self.splitByLine(consignor, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:0px;">发货地址：</span>' + self.splitByLine(startAddr, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:13px;">收货人：</span>' + self.splitByLine(consignee, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:0px;">收货地址：</span>' + self.splitByLine(endAddr, 250, 13, 3, 65) + '</div>' +
               '<div><span style="padding-left:0px;">运输类型：</span>' + self.splitByLine(transportType, 250, 13, 3, 65) + '</div>' +
           '</div>' +
           '<div id="infoTableHeader">' +
               '<div id="infoTableHeadText">货物信息</div>' +
               '<div id="infoTableOpenIcon">∨</div>' +
           '</div>' +
           '<div id="infoTable"></div>' +
       '</div>';
       
    contentDiv.innerHTML = htmlStr;
    
    var timer = setInterval(function(){
        if($("#infoTableHeader").length > 0) {
            clearInterval(timer);
            $("#infoTable").css("height", self.isShowTable() ? "317px" : "0px");
            self.addEventListeners();
            self.initTable(data ? data.goods : null);
        }
    }, 10);
    return contentDiv;
};

/**
 * 根据行数切割文本
 * @param text 文本内容
 * @param width 行宽度(px)
 * @param fontsize 文本字号(px)
 * @param textLine 文本行数
 * @param paddingLeft 左偏移像素
 * @return 返回切割后的文本html
 */
InfoControl.prototype.splitByLine = function(text, width, fontsize, textLine, paddingLeft) {
    if (width == 0 || text == undefined)
        return text;
    var curLen = 0, line = 1;
    var result = [];
    var start = 0, end = 0;
    for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        var pixelLen = code > 255 ? fontsize : fontsize / 2;
        curLen += pixelLen;
        if (curLen > width) {
            end = i;
            if (line === textLine) {
                end > 1 ? end -= 2 : end = 1;
                result.push(text.substring(start, end) + "...");
                break;
            }
            result.push(text.substring(start, end));
            start = i;
            curLen = 0;
            line++;
        }
        if (i === text.length - 1) {
            result.push(text.substring(start, text.length));
        }
    }
    paddingLeft = isNaN(paddingLeft) ? 0 : paddingLeft;
    for (var i = 1, len = result.length; i < len; i++) {
    	if(len >= textLine) {
            result[i] = '<div style="padding-left:' + paddingLeft + 'px;"' + ' title="' + text + '">' + result[i] + '</div>';
        } else {
        	result[i] = '<div style="padding-left:' + paddingLeft + 'px;">' + result[i] + '</div>';
        }
    }
    return result.join("");
};

InfoControl.prototype.initTable = function(tableData) {
	var langs = {
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
    };
    
    var tableConfig = {
        langs:langs,//自定义语言
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
            {title:"名称", field:"name", headerSort:false},
            {title:"厂家", field:"factory", width:90},
            {title:"数量", field:"number", width:70}
        ]
    };
    
    $("#infoTable").tabulator(tableConfig);
    $("#infoTable").tabulator("setData", tableData);
    $("#infoTable").tabulator("setPageSize", 10);
    $("#infoTable").tabulator("setPage", 1);
};

InfoControl.prototype.addEventListeners = function() {
    var self = this;
    var tableHeader = document.getElementById("infoTableHeader");
    tableHeader.onmousedown = function() {
        var icon = document.getElementById("infoTableOpenIcon");
        var isShow = self.isShowTable();
        if(isShow) {
            icon.textContent = "∨";
            $("#infoTable").animate({height:"0px"}, 200);
        } else {
            icon.textContent = "∧";
            $("#infoTable").animate({height:"317px"}, 200);
        }
        self.isShowTable(!isShow);
    };
};

// --------------------------------------------------------------------------
//
// RouteControl class
//
// --------------------------------------------------------------------------

var RouteControl = function(_mapControl, _data, _isAdmin) {
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
    // data
    // ------------------------------
    
    var data = _data;
    this.data = function(value){
        if (!arguments.length) return data;
        data = value;
        return this;
    };
    
    // ------------------------------
    // isAdmin
    // ------------------------------
    
    var isAdmin = _isAdmin === true;
    this.isAdmin = function(value){
        if (!arguments.length) return isAdmin;
        isAdmin = value;
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
    // map
    // ------------------------------
    
    var map = null;
    this.map = function(value){
        if (!arguments.length) return map;
        map = value;
        return this;
    };
    
    // ------------------------------
    // driving
    // ------------------------------
    
    var driving = null;
    this.driving = function(value){
        if (!arguments.length) return driving;
        driving = value;
        return this;
    };
    
    // ------------------------------
    // searchData
    // ------------------------------
    
    var searchData = null;
    this.searchData = function(value){
        if (!arguments.length) return searchData;
        searchData = value;
        return this;
    };
    
    // ------------------------------
    // searchPath
    // ------------------------------
    
    var searchPath = [];
    this.searchPath = function(value){
        if (!arguments.length) return searchPath;
        searchPath = value;
        return this;
    };
    
    // ------------------------------
    // geoc
    // ------------------------------
    
    var geoc = new BMap.Geocoder();
    this.geoc = function(value){
        if (!arguments.length) return geoc;
        geoc = value;
        return this;
    };
    
    this.initialize(_mapControl.map());
};

RouteControl.prototype.show = function() {
	var self = this;
	$(self.contentDiv()).css("display", "block");
};

RouteControl.prototype.hide = function() {
	var self = this;
    $(self.contentDiv()).css("display", "none");
};

RouteControl.prototype.initialize = function(map) {
    var self = this;
    self.map(map);
    var driving = new BMap.DrivingRoute(map, {
        renderOptions: {
            map:map,
            enableDragging:true, //起终点可进行拖拽
            autoViewport:true
        }  
    });
    self.driving(driving);
    // 添加DOM元素到地图中
    var div = self.setContent(self.data());
    $("#tableCon")[0].appendChild(div);
    self.show();
    self.mapControl().resizeUI();
    return div;
};

/**
 * 根据行数切割文本
 * @param text 文本内容
 * @param width 行宽度(px)
 * @param fontsize 文本字号(px)
 * @return 返回行数
 */
RouteControl.prototype.getStrLinesNum = function(text, width, fontsize) {
    if (width === 0)
        return 0;
    var totalLen = 0;
    for (var i = 0, len = text.length; i < len; i++) {
        var code = text.charCodeAt(i);
        var pixelLen = code > 255 ? fontsize : fontsize / 2;
        totalLen += pixelLen;
    }
    return Math.ceil(totalLen/width);
};

/**
 * 获取导航路径div字符串内容
 * @param type 节点类型：0.起点；1.终点；2.中间点；
 * @param checkState 节点状态类型：0.check wrong；1.check right；2.未check；
 * @param des 内容描述字符串
 * @param time 如果到达该check point，则为到达时间
 * @return 导航路径div字符串内容
 */
RouteControl.prototype.getPathDiv = function(type, checkState, des, time) {
	var self = this;
	var iconClass = type === 0 ? "start_check_point_icon" : type === 1 ? "end_check_point_icon" : "middle_check_point_icon";
	var verLineDiv = '';
	var checkSymbolDiv = '';
	var marginTop = '';
	if(type !== 0) {
		marginTop = "margin-top:-5px;";
	}
	if(type !== 1) {
		var linesNum = self.getStrLinesNum(des, 253-41, 13);
        var verLineHeight = 20*linesNum;
        var verLineMarginTop = 15 - linesNum*20;
        verLineDiv = '<div style="width:0px;height:' + verLineHeight + 'px;margin-left:9px;margin-top:' + verLineMarginTop + 'px;border-left:solid rgba(20,255,255,0.5) 2px;"></div>';
	}
	if(checkState === 0) {
        checkSymbolDiv = '<div title="未通过" style="width:16px;height:16px;float:left;margin-top:2px;margin-right:5px;background:url(assets/images/check_wrong.png) no-repeat center center;"></div>';
    } else if(checkState === 1) {
		checkSymbolDiv = '<div title="抵达时间：' + (time ? time : "未知") + '" style="width:16px;height:16px;float:left;margin-right:5px;background:url(assets/images/check_ok.png) no-repeat center center;"></div>';
	}
	return  '<div class="check_point" style="padding:0px 10px 0px 10px;' + marginTop + '">' +
	            '<div class="check_point_arrow_hide"></div>' +
    			'<div class="' + iconClass + '"></div>' +
    			checkSymbolDiv +
    			'<div class="check_point_label">' + des + '</div>' +
    			verLineDiv +
			'</div>';
};

RouteControl.prototype.scrollToCheckPoint = function(index) {
	try {
		var cps = $(".check_point");
		if(index < 0) {
			index = 0;
		} else if(index > cps.length - 1) {
			index = cps.length - 1;
		}
		for(var i = 0, len = cps.length; i < len; i++) {
			if(i === index) {
				cps[i].childNodes[0].setAttribute("class", "check_point_arrow");
			} else {
				cps[i].childNodes[0].setAttribute("class", "check_point_arrow_hide");
			}
		}
		s = cps.eq(index).offset().top - cps.eq(0).offset().top;
		if(s > 0) {
			s += 10;
		}
		$("#drive_result_con").animate({scrollTop:s}, 200);
	} catch(e){
		console.log(e);
	}
};


RouteControl.prototype.addEventListeners = function() {
	var self = this;
	self.checkPath();
    $("#lushu_play_btn").on("click", function(){
    	var data = self.data();
        if(this.getAttribute("class") === "play") {
            this.setAttribute("class", "pause");
            this.setAttribute("title", "暂停");
            self.mapControl().start(data.id);
            if(data.dispatchData && data.dispatchData.length > 0 && data.dispatchData[0].isTemp === 1) {
                self.mapControl().addTempControl(data.id);
            }
        } else {
            this.setAttribute("class", "play");
            this.setAttribute("title", "播放");
            self.mapControl().pause(data.id);
        }
    });
    $("#lushu_stop_btn").on("click", function(){
        var playBtn = document.getElementById("lushu_play_btn");
        if(playBtn) {
            playBtn.setAttribute("class", "play");
            playBtn.setAttribute("title", "播放");
            self.mapControl().stop(self.data().id);
            self.mapControl().removeTempControl();
            self.scrollToCheckPoint(self.data().plan.lastArrivedIndex);
        }
    });
    $("#drive_search_box").parent().on("mousewheel", function(event){
        event.stopPropagation();//阻止route control冒泡
    });
    
    if(self.isAdmin()) {
	    var map = self.map();
        $("#drive_search_btn").on("click", function() {
        	var start = $("#drive_start_input")[0].value;
            var end = $("#drive_end_input")[0].value;
            if(start == end) {
            	return;
            }
        	self.searchWayLoadingVisible(true);//显示loading
            var driving = self.driving();
            driving.search(start, end);
            driving.setSearchCompleteCallback(function(results){
            	if(!results) {
            		self.searchWayLoadingVisible(false);//移除loading
            		alert("搜索路线失败。");
            		return;
            	}
                var route = results.getPlan(0).getRoute(0);
                var stepsNum = route.getNumSteps();
                var points = [];
                for(var i = 0; i < stepsNum; i++) {
                    var step = route.getStep(i);
                    var point = step.getPosition();
                    points.push(point);
                }
                var path = route.getPath();
                var planPath = [];
                planPath.length = 0;
                for(var i = 0, len = path.length; i < len; i++) {
                    var p = path[i];
                    planPath.push([p.lng, p.lat]);
                }
                self.searchPath(planPath);
                var callBack = function(result) {
                	self.searchData(result);
                    self.showSearchWay(result);
                }
                self.parseLocaltion(points, callBack);
            });
        });
        $("#search_clear_btn").on("click", function() {
        	self.clearSearchWay();
    	});
    	$("#search_save_btn").on("click", function() {
            self.saveSearchWay();
        });
    }
};

RouteControl.prototype.showSearchWay = function(data) {
	var self = this;
	if(!self.isAdmin()) {
		return;
	}
	self.searchWayControlVisible(true);
	var trackInfo = ObjectUtil.cloneObj(self.data());
    trackInfo.plan.steps = data;
    trackInfo.startPos = data[0];
    trackInfo.endPos = data[data.length-1];
    $("#drive_start_input")[0].value = trackInfo.startPos.address;
    $("#drive_end_input")[0].value = trackInfo.endPos.address;
    self.checkPath(trackInfo);
};

RouteControl.prototype.clearSearchWay = function(isSelectedChange) {
    var self = this;
    if(!self.isAdmin()) {
        return;
    }
    self.driving().clearResults();
    self.searchWayControlVisible(false);
    if(isSelectedChange) {
    	return;
    }
    var data = self.data();
    $("#drive_start_input")[0].value = data && data.startPos && data.startPos.address ? data.startPos.address : "";
    $("#drive_end_input")[0].value = data && data.endPos && data.endPos.address ? data.endPos.address : "";
    self.checkPath(data);
};

RouteControl.prototype.saveSearchWay = function() {
    var self = this;
    if(!self.isAdmin()) {
        return;
    }
    var data = self.searchData();
    if(!data) {
    	return;
    }
    var trackInfo = self.data();
    trackInfo.plan.steps = data;
    trackInfo.plan.path = self.searchPath();
    trackInfo.startPos = data[0];
    trackInfo.endPos = data[data.length-1];
    var tracksInfo = self.mapControl().tracksInfo();
    var id = trackInfo.id;
    for(var i = 0, len = tracksInfo.length; i < len; i++) {
    	if(tracksInfo[i].id === id) {
    		tracksInfo[i] = trackInfo;
    	}
    }
    LocalStorageUtil.saveToDB("tracksInfo", JSON.stringify(tracksInfo));
    self.driving().clearResults();
    self.searchWayControlVisible(false);
    self.checkPath(trackInfo);
    self.mapControl().removeTrack(id);
    self.mapControl().addTrack(trackInfo);
};

RouteControl.prototype.searchWayControlVisible = function(visible) {
	var display = visible ? "block" : "none";
	$("#search_clear_btn").css("display", display);
    $("#search_save_btn").css("display", display);
};

RouteControl.prototype.searchWayLoadingVisible = function(visible) {
    var display = visible ? "block" : "none";
    var h = $("#drive_search_box .input_con").outerHeight(true) + 
        $("#drive_search_box .lushu_control").outerHeight(true) + 
        $("#drive_result_con").outerHeight(true) + 6;
    $("#drive_search_box .loading").css({"display":display, "height":h});
};

RouteControl.prototype.setContent = function(data) {
    var self = this;
    var isAdmin = self.isAdmin();
    self.data(data);
    var contentDiv = self.contentDiv();
    if(!contentDiv) {
        // 创建一个DOM元素
        contentDiv = document.createElement("div");
        contentDiv.setAttribute("id", "route_control")
        contentDiv.style.borderTop = "1px solid rgba(20,255,255,0.5)";
        contentDiv.style.backgroundColor = "none";
        contentDiv.style.padding = "5px 5px 5px 5px";
        self.contentDiv(contentDiv);
    }
    var startAddr = data && data.startPos ? data.startPos.address : "";
    var endAddr = data && data.endPos ? data.endPos.address : "";
    var htmlStr = isAdmin ?
    '<div id="drive_search_box">' +
        '<div class="input_con">' +
            '<div>起点' +
                '<input id="drive_start_input" type="text"  value="' + startAddr + '" placeholder="请输入驾车起点" autocomplete="off" maxlength="256"/>' +
            '</div>' +
            '<div>终点' +
                '<input id="drive_end_input" type="text" value="' + endAddr + '" placeholder="请输入驾车终点" autocomplete="off" maxlength="256"/>' +
            '</div>' +
        '</div>' +
        '<div id="drive_search_btn">搜索</div>' +
        '<div class="lushu_control">' +
            '<div id="lushu_play_btn" class="play" title="播放"></div>' +
            '<div id="lushu_stop_btn" class="stop" title="停止"></div>' +
            '<div id="search_save_btn" class="search_save" title="保存导航结果到本地"></div>' +
            '<div id="search_clear_btn" class="search_clear" title="清除导航搜索结果"></div>' +
        '</div>' +
        '<div id="drive_result_con">' +
            '<div id="drive_result">无规划路径</div>' +
        '</div>' +
        '<div class="loading"></div>' +
    '</div>' :
    '<div id="drive_search_box">' +
        '<div class="lushu_control">' +
            '<div id="lushu_play_btn" class="play" title="播放"></div>' +
            '<div id="lushu_stop_btn" class="stop" title="停止"></div>' +
        '</div>' +
        '<div id="drive_result_con">' +
            '<div id="drive_result">无规划路径</div>' +
        '</div>' +
    '</div>';
    
    contentDiv.innerHTML = htmlStr;
    
    var timer = setInterval(function(){
    	if($("#drive_search_box").length > 0) {
    		clearInterval(timer);
    		if(isAdmin) {
    			self.searchWayControlVisible(false);
    		}
    		self.addEventListeners();
    	}
    }, 50);
    return contentDiv;
};

RouteControl.prototype.checkPath = function(trackData, isOnlySetTime) {
	var self = this;
	var data = trackData ? trackData : self.data();
	if(!data || !data.plan || !data.plan.steps || data.plan.steps.length < 2) {
		$("#drive_result")[0].innerHTML = '无规划路径';
		return;
	}
	
	var ot = new Date().getTime();
	var steps = data.plan.steps;
	var posList = data.posList;
    var map = self.map();
    var k = 0, isRight = false, checkList = [];//0.错过；1.已抵达；-1.还未行驶到
    for(var i = 0, len1 = steps.length; i < len1; i++) {
    	var step = steps[i];
        var pos1 = step.pos;
        var point1 = new BMap.Point(pos1[0], pos1[1]);
        isRight = false;
        for(var j = k, len2 = posList.length; j < len2; j++) {
            var pos2 = posList[j].pos;
            var point2 = new BMap.Point(pos2[0], pos2[1]);
            var distance = map.getDistance(point1, point2);
            if(distance < 100) {
            	k = j;
            	isRight = true;
            	checkList.push(1);
            	step.time = posList[j].time;
            	step.posIndex = j;
            	break;
            }
        }
        if(!isRight) {
        	k = 0;
        	checkList.push(0);
        }
    }
    var lastArrivedIndex = 0;
    for(var i = checkList.length - 1; i >= 0; i--) {
    	if(checkList[i] === 1) {
    		lastArrivedIndex = i;
    		break;
    	}
    	checkList[i] = 2;
    }
    //记录当前成功到达的最后一个check piont index
    data.plan.lastArrivedIndex = lastArrivedIndex;
    if(isOnlySetTime) {
        return;
    }
    var desHtml = '';
    for(var checkState, addr, time, i = 0, len = steps.length, lastIndex=len-1; i < len; i++) {
        addr = steps[i].address;
        time = steps[i].time;
        checkState = checkList[i];
        if(i === 0) {
        	desHtml += self.getPathDiv(0, checkState, addr, time);
        } else if(i === lastIndex) {
            desHtml += self.getPathDiv(1, checkState, addr, time);
        } else {
        	desHtml += self.getPathDiv(2, checkState, addr, time);
        }
    }
    $("#drive_result")[0].innerHTML = desHtml;
    self.scrollToCheckPoint(data.plan.lastArrivedIndex);
    
    //添加点击监听
    $(".check_point .check_point_label").on("click", function() {
    	var nodeIndex = $(".check_point").index(this.parentNode);
    	var lushu = self.mapControl().getLuShuById(data.id);
    	var index = steps[nodeIndex].posIndex;
    	lushu.moveTo(index);
    });
    
    var nt = new Date().getTime();
    console.log("steps " + len1 + " , posNum " + len2 + " , cost time " + (nt-ot) + " ms.");
};

RouteControl.prototype.parseLocaltion = function(points, fn) {
    var self = this;
    if(!points || points.length === 0) {
    	self.searchWayLoadingVisible(false);//移除loading
    	return;
    }
    var result = [];
    var geoc = self.geoc();
    var index = 0;
    var getLocation = function(pts, i) {
    	if(i >= pts.length) {
    		if(fn) {
    			fn.call(null, result);
    			self.searchWayLoadingVisible(false);//移除loading
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
            if(result.length === 0 || addr !== result[result.length-1].address) {
            	var p = pts[i];
            	result.push({addr:addr, pos:[p.lng, p.lat]});
            }
            getLocation(pts, ++i);
        });
    };
    getLocation(points, index);
};

// --------------------------------------------------------------------------
//
// TempControl class
//
// --------------------------------------------------------------------------

var TempControl = function(_id, _mapControl) {
    // 默认停靠位置和偏移量
    this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
    this.defaultOffset = new BMap.Size(50, 50);
    
    // ------------------------------
    // id
    // ------------------------------
    
    var id = _id;
    this.id = function(value){
        if (!arguments.length) return id;
        id = value;
        return this;
    };
    
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
};

// 通过JavaScript的prototype属性继承于BMap.Control
TempControl.prototype = new BMap.Control();

// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
TempControl.prototype.initialize = function(map) {
    var self = this;
    // 添加DOM元素到地图中
    var div = self.setContent(self.id());
    map.getContainer().appendChild(div);
    return div;
};

TempControl.prototype.setContent = function(id) {
    var self = this;
    var contentDiv = self.contentDiv();
    if(!contentDiv) {
        // 创建一个DOM元素
        contentDiv = document.createElement("div");
        contentDiv.setAttribute("id", "temp_control_" + id)
        contentDiv.style.border = "1px solid rgba(20,255,255,0.15)";
        contentDiv.style.color = "#fff";
        contentDiv.style.backgroundColor = "rgba(68,123,175,0.75)";
        contentDiv.style.padding = "5px 5px 5px 5px";
        self.contentDiv(contentDiv);
    }
    var htmlStr = 
       '<div class="tl_border"></div>' +
       '<div class="tr_border"></div>' +
       '<div class="bl_border"></div>' +
       '<div class="br_border"></div>' +
       '<div id="temp_control_con_' + id + '" style="display:none;width:350px;height:0px;"></div>';
       
    contentDiv.innerHTML = htmlStr;
    
    var timer = setInterval(function(){
        if($("#temp_control_" + id).length > 0) {
            clearInterval(timer);
            var chartConId = "temp_control_con_" + id;
            $("#" + chartConId).css("display", "block").animate({height:"200px"}, 200, "swing", function(){
            	var ins = self.mapControl().trackMap()[id].data.tempIns;
                ins.lineConfig().axis.yAxis[0].tick.tickArguments = [5];
                ins.lineConfig().axis.xAxis[0].tick.tickFormat = function(d) {
                    return d3.timeFormat('%m-%d %H:%M')(d.getTime());
                };
                var graph = new ghca_charts.view.graph(chartConId, ins.lineConfig());
                graph.render();
            });
        }
    }, 10);
    
    return contentDiv;
};

// --------------------------------------------------------------------------
//
// TableControl class
//
// --------------------------------------------------------------------------

var TableControl = function(mapControl) {
	var self = this;
	var isShowTable = true;
	var selectedItem = null;
	var oldSelectedData = null;
	
	this.init = function(tableData) {
		var self = this;
        var langs = {
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
        };
        
        var tableConfig = {
            langs:langs,//自定义语言
            locale:"zh-cn",//从自定义语言中选择当前显示的语言
            placeholder:"没有数据",
            height:isMutilMode ? "307px" : "0px",
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
                {title:"运单编号", field:"id", width:90,
                    formatter:function(cell) {
                        return ObjectUtil.getOrinId(cell.getData().id);
                    },
                    tooltip:function(cell){
                        return ObjectUtil.getOrinId(cell.getData().id);
                    }
                },
                {title:"当前位置", headerSort:false, 
                    formatter:function(cell) {
                    	var d = cell.getData();
                        return d.currentPos && d.currentPos.address ? d.currentPos.address : "未知";
                    },
                    tooltip:function(cell){
                        var d = cell.getData();
                        return d.currentPos && d.currentPos.address ? d.currentPos.address : "未知";
                    }
                },
                {title:"状态", field:"status", width:70}
            ],
            rowClick:function(e, row) {
                var selectedData = $("#table").tabulator("getSelectedData");
                selectedData = selectedData.length > 0 ? selectedData[0] : null;
                if(isMutilMode) {
                	if(selectedData) {
                		if(selectedData.hasOwnProperty("plan")) {
                			self.selectRow(selectedData);
                		} else {
                			//请求数据
                			self.loadRowData(selectedData);
                		}
                	} else {
                		self.unselectRow(selectedData);
                	}
                } else {
                	selectedData ? self.selectRow(selectedData) : self.unselectRow(selectedData);
                }
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
                isMutilMode ? $("#table").css({height:"0px"}, 200) : $("#route_control").css({display:"none"}, 200);
            } else {
                tableOpenIcon.textContent = "∧";
                isMutilMode ? $("#table").css({height:"307px"}, 200) : $("#route_control").css({display:"block"}, 200);
            }
            mapControl.resizeUI();
            isShowTable = !isShowTable;
        };
    };
    
    this.loadRowData = function(rowData) {
//    	//显示loading
//    	$('.init-loading').css({"display":"block", "background-color":"rgba(0,0,0,0.4)"});
//    	//发送请求
//    	$.post("http://yao.witnet.cn/cargopc/gis/showOneGis/" + rowData.id, function(data) {
//    		try {
//    			data = JSON.parse(data);
//    		} catch(e) {
//    			//隐藏loading
//    			$('.init-loading').css({"display":"none"});
//                alert("订单数据格式错误，请重试。"); 
//                return;
//    		}
//    		//根据获取的详细数据重新设置该行数据
//    		for(var key in data) {
//    			rowData[key] = data[key];
//    		}
//    		//选择该行数据
//            self.selectRow(rowData);
//            //隐藏loading
//            $('.init-loading').css({"display":"none"});
//        })
        /*
        .error(function() { 
        	//隐藏loading
            $('.init-loading').css({"display":"none"});
            alert("订单数据无法获取，请重试。"); 
        });
        */
        
        //搜索当前点到终点的路径
        if(rowData.currentPos && rowData.endPos) {
        	//显示loading
            $('.init-loading').css({"display":"block", "background-color":"rgba(0,0,0,0.4)"});
            //搜索补全当前点到终点的路径
        	self.searchWay(rowData, rowData.currentPos.address, rowData.endPos.address, function(){
                //选择该行数据
        		try{
        			self.selectRow(rowData);
        		} catch(e) {
        		}
                //隐藏loading
                $('.init-loading').css({"display":"none"});
            });
        } else {
        	//选择该行数据
            self.selectRow(rowData);
        }
    };
    
    this.searchWay = function(trackInfo, startPos, endPos, fn) {
        if(!startPos || !endPos) {
            alert("您的起点或者终点地址有误!");
            if(fn) {
                fn.call(null);
            }
            return;
        }
        var driving = new BMap.DrivingRoute(mapControl.map());
        var start, end, geoc = mapControl.geoc();
        if(Object.prototype.toString.call(startPos) === "[object String]" || Object.prototype.toString.call(startPos) === "[object String]") {
            geoc.getPoint(startPos, function(point){
                if (point) {
                    start = point;
                    geoc.getPoint(endPos, function(point){
                        if (point) {
                            end = point;
                            a(fn);
                        }else{
                            alert("您的终点地址没有解析到结果!");
                            if(fn) {
                                fn.call(null);
                            }
                        }
                    });
                }else{
                    alert("您的起点地址没有解析到结果!");
                    if(fn) {
                        fn.call(null);
                    }
                }
            });
        } else {
            start = new BMap.Point(startPos[0], startPos[1]);
            end = new BMap.Point(endPos[0], endPos[1]);
            a(fn);
        }
        function a(fn) {
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
                var plan = {path:[], steps:[]};
                trackInfo.plan = plan;
                var path = route.getPath();
                for(var i = 0, len = path.length; i < len; i++) {
                    var p = path[i];
                    plan.path.push([p.lng, p.lat]);
                }
                if(fn) {
                	fn.call(null);
                }
            });
        }
    };
    
    this.stopLuShu = function(id) {
    	var playBtn = document.getElementById("lushu_play_btn");
        playBtn.setAttribute("class", "play");
        playBtn.setAttribute("title", "播放");
        var lushu = mapControl.getLuShuById(id);
        if(lushu) {
            lushu.stop();
        }
        mapControl.removeTempControl();
    };
     
    this.selectRow = function(rowData) {
    	if(!rowData) {
    		return;
    	}
    	var tracksData, treeControl = mapControl.treeControl;
        if(!selectedItem) {//第一次选
            selectedItem = rowData;
            //显示运单所有分段信息tree
            treeControl.setContent(selectedItem);
            //显示运单所有分段轨迹
            mapControl.addTrack(selectedItem);
        } else if(selectedItem && selectedItem.id !== rowData.id) {//选中不同项
        	self.stopLuShu(selectedItem.id);
        	mapControl.removeTrack(selectedItem.id);
            selectedItem = rowData;
            //显示运单所有分段信息tree
            treeControl.setContent(selectedItem);
            //显示运单所有分段轨迹
            //mapControl.addCars(tracksData);
            mapControl.addTrack(selectedItem);
        }
        mapControl.selectTrack(selectedItem.id, true);
        var timer = setTimeout(function(){
          clearTimeout(timer);
          mapControl.selectCar(selectedItem.id, true);
        }, 300);
    };
    
    this.unselectRow = function(rowData) {
    	var tracksData, 
    	    treeControl = mapControl.treeControl,
    	    itemData = rowData ? rowData : selectedItem;
        treeControl.setContent(null);
        mapControl.removeTrack(itemData.id);
        self.stopLuShu(itemData.id);
        mapControl.addCar(itemData);
        selectedItem = null;
        var infoControl = mapControl.infoControl;
        if(infoControl) {
            infoControl.hide();
        }
        var treeControl = mapControl.treeControl;
        if(treeControl) {
            treeControl.hide();
        }
    };
    
//    this.selectRow = function(rowData) {
//        if(!selectedItem) {//第一次选
//            selectedItem = rowData;
//            mapControl.addTrack(selectedItem);
//        } else if(selectedItem && selectedItem.id !== rowData.id) {//选中不同项
//            mapControl.removeTrack(selectedItem.id);
//            mapControl.addCar(selectedItem);
//            selectedItem = rowData;
//            mapControl.addTrack(selectedItem);
//        }
//        mapControl.routeControl.clearSearchWay(true);
//        mapControl.selectTrack(selectedItem.id, true);
//        var timer = setTimeout(function(){
//        	clearTimeout(timer);
//        	mapControl.selectCar(selectedItem.id, true);
//        }, 300);
//    };
//    
//    this.unselectRow = function(rowData) {
//    	selectedItem = null;
//        mapControl.removeTrack(rowData.id);
//        mapControl.routeControl.clearSearchWay(true);
//        mapControl.addCar(rowData);
//        mapControl.routeControl.hide();
//        var infoControl = mapControl.infoControl;
//        if(infoControl) {
//            infoControl.hide();
//        }
//    };
};

// --------------------------------------------------------------------------
//
// TreeControl class
//
// --------------------------------------------------------------------------

var TreeControl = function(_mapControl) {
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
    
    var data = null;//当前显示的轨迹数据
    this.data = function(value){
        if (!arguments.length) return data;
        data = value;
        return this;
    };
    
    // ------------------------------
    // treeData
    // ------------------------------
    
    var treeData = null;
    this.treeData = function(value){
        if (!arguments.length) return treeData;
        treeData = value;
        return this;
    };
    
    // ------------------------------
    // setting
    // ------------------------------
    
    var setting = {
        view: {
            showIcon:function(treeId, treeNode) {
                return !treeNode.isParent;
            },
            showLine:false,
            showTitle:true
        },
        data: {
            key:{
                name:function(node) {
                    return node.level === 0 ? "id" : "address";
                },
                title:function(node) {
                    return node.level === 0 ? "装车单号：{#node.id#}" : "抵达地点：{#node.address#}\n抵达时间：{#node.time#}";
                },
                children:"posList"
            },
            simpleData: {
                enable: false
            }
        },
        callback:{
        	onClick:function(event, id, node, isSelected) {
        		if(node.level === 1 && isSelected) {//选择路径节点
        			var data = self.data();
        			var id = data.id;
        			var lushu = self.mapControl().getLuShuById(id);
        			if(lushu) {
                        self.mapControl().visibleCar(id, false);
                        if(data.dispatchData && data.dispatchData.length > 0 && data.dispatchData[0].isTemp === 1) {
                            self.mapControl().addTempControl(id);
                        }
                        lushu.moveTo(node.index);
                        var playBtn = document.getElementById("lushu_play_btn");
                        if(playBtn.getAttribute("class") !== "play") {
                            playBtn.setAttribute("class", "play");
                            playBtn.setAttribute("title", "播放");
                        }
        			}
        		} else if(node.level === 0 && isSelected) {//选择分段节点
        			
        		}
        	}
        }
    };
    this.setting = function(value){
        if (!arguments.length) return setting;
        setting = value;
        return this;
    };
};

// 通过JavaScript的prototype属性继承于BMap.Control
TreeControl.prototype = new BMap.Control();

// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
TreeControl.prototype.initialize = function(map) {
    var self = this;
    // 添加DOM元素到地图中
    var div = self.setContent();
    $(div).on("mousewheel", function(event){
        event.stopPropagation();//阻止tree control冒泡
    });
    map.getContainer().appendChild(div);
    return div;
};

TreeControl.prototype.getTreeData = function(data) {
    if(!data) {
        return null;
    }
    var sections = ObjectUtil.cloneObj(data.dispatchData);
    var index = 0;
    for(var section, i = 0, len = sections.length; i < len; i++) {
    	section = sections[i];
    	section.open = true;
    	var posList = section.posList;
    	if(!posList) {
    		continue;
    	}
    	for(var j = 0, len1 = posList.length; j < len1; j++) {
    		posList[j].index = index;
    		index++;
    	}
    }
    return sections;
};

TreeControl.prototype.setContent = function(d) {
    var self = this;
    self.data(d);
    var treeData = self.getTreeData(d);
    self.treeData(treeData);
    var contentDiv = self.contentDiv();
    if(!contentDiv) {
        // 创建一个DOM元素
        contentDiv = document.createElement("div");
        contentDiv.setAttribute("id", "tree_control")
        contentDiv.style.border = "1px solid rgba(20,255,255,0.15)";
        contentDiv.style.color = "#fff";
        contentDiv.style.backgroundColor = "rgba(68,123,175,0.75)";
        contentDiv.style.padding = "5px 5px 5px 5px";
        contentDiv.style.width = "290px";
        self.contentDiv(contentDiv);
    }
    var htmlStr = 
       '<div class="tl_border"></div>' +
       '<div class="tr_border"></div>' +
       '<div class="bl_border"></div>' +
       '<div class="br_border"></div>' +
       '<div class="lushu_control">' +
            '<div id="lushu_play_btn" class="play" title="播放"></div>' +
            '<div id="lushu_stop_btn" class="stop" title="停止"></div>' +
       '</div>' +
       '<div id="sectionsTree" class="ztree"></div>';
       
    contentDiv.innerHTML = htmlStr;
    
    if(self.data()) {
    	$.fn.zTree.init($("#sectionsTree"), self.setting(), self.treeData());
    } else {
    	//销毁tree
    	$.fn.zTree.destroy();
    }
    
    self.addEventListeners();
    
    self.mapControl().resizeUI();
    contentDiv.style.display = self.treeData() ? "block" : "none";
    
    if(d && d.posList && d.posList.length > 0) {
        var timer = setTimeout(function(){
        	clearTimeout(timer);
        	self.scrollToCheckPoint(d.posList.length-1);
        }, 300);
    }
    
    return contentDiv;
};

TreeControl.prototype.addEventListeners = function() {
    var self = this, data = self.data();
    $("#lushu_play_btn").on("click", function(){
        if(this.getAttribute("class") === "play") {
            this.setAttribute("class", "pause");
            this.setAttribute("title", "暂停");
            self.mapControl().start(data.id);
            if(data.dispatchData && data.dispatchData.length > 0 && data.dispatchData[0].isTemp === 1) {
            	self.mapControl().addTempControl(data.id);
            }
        } else {
            this.setAttribute("class", "play");
            this.setAttribute("title", "播放");
            self.mapControl().pause(data.id);
        }
    });
    $("#lushu_stop_btn").on("click", function(){
        var playBtn = document.getElementById("lushu_play_btn");
        if(playBtn) {
            playBtn.setAttribute("class", "play");
            playBtn.setAttribute("title", "播放");
            self.mapControl().stop(data.id);
            self.mapControl().removeTempControl();
            if(data && data.posList && data.posList.length > 0) {
            	self.scrollToCheckPoint(data.posList.length-1);
            }
        }
    });
};

TreeControl.prototype.scrollToCheckPoint = function(index) {
    try {
        var cps = $("#sectionsTree .play_icon");
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
        $("#sectionsTree").animate({scrollTop:s}, 200);
    } catch(e){
        console.log(e);
    }
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
// ColorUtil class
//
// --------------------------------------------------------------------------

var ColorUtil = {
	PATH_COLOR: ['#ff5722','#ae81db','#fbe38f','#ffffff','#e7b8bb'],
	getColor: function(i) {
		if(i < 0) {
			i = 0;
		}
		return ColorUtil.PATH_COLOR[i%ColorUtil.PATH_COLOR.length];
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
    },
    /**
     * 获取将_替换为@后还原的运单id字符串
     * @param id 要还原的运单id字符串
     * @return 返回原始的运单id字符串
     */
    getOrinId: function(id) {
    	return Object.prototype.toString.call(id) === "[object String]" ? id.replace("_", "@") : "未知";
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
