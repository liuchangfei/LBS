/**
 * 
 */
package com.lizheng.model;

import net.sf.json.JSONObject;

/**
 * <p>Title: </p>
 * <p>Description: </p>
 * <p>Company: changhong </p>
 * @author lizheng
 * @date 2017Äê12ÔÂ11ÈÕ
 * @version 1.0
 */
public class NearestResult {
    private Distance distance;
    private Duration duration;
    
    /**
     * @param distance
     * @param duration
     */
    public NearestResult(Distance distance, Duration duration) {
        super();
        this.distance = distance;
        this.duration = duration;
    }
    
    public Distance getDistance() {
        return distance;
    }

    public void setDistance(Distance distance) {
        this.distance = distance;
    }

    public Duration getDuration() {
        return duration;
    }

    public void setDuration(Duration duration) {
        this.duration = duration;
    }

    public String toJson(){
        return JSONObject.fromObject(this).toString();
    }
}
