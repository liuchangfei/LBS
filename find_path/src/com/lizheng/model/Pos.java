package com.lizheng.model;

import net.sf.json.JSONObject;

public class Pos {
	private String id = "";
    private double lat = 0d;
    private double lng = 0d;
	private String addr = "";
	private boolean isStart = true;
	
    public Pos() {}
	
	public Pos(String id, double lat, double lng, String addr, boolean isStart) {
		this.id = id;
		this.lat = lat;
		this.lng = lng;
		this.addr = addr;
		this.isStart = isStart;
	}
	
	public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }

    public String getAddr() {
        return addr;
    }

    public void setAddr(String addr) {
        this.addr = addr;
    }
    
    public boolean getIsStart() {
        return isStart;
    }

    public void setIsStart(boolean isStart) {
        this.isStart = isStart;
    }
	
	public String toJson(){
		return JSONObject.fromObject(this).toString();
	}
}
