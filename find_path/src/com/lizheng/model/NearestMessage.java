/**
 * 
 */
package com.lizheng.model;

import java.util.ArrayList;
import java.util.List;

import net.sf.json.JSONObject;

/**
 * <p>Title: </p>
 * <p>Description: </p>
 * <p>Company: changhong </p>
 * @author lizheng
 * @date 2017年12月11日
 * @version 1.0
 */
public class NearestMessage {
    
    /**
     * 状态码
     * 0：成功 1：服务器内部错误 2：参数错误
     */
    private int status = 0;
    
    /**
     * 返回信息 对status的中文描述
     */
    private String message = "";
    
    /**
     * 返回的结果
     * 数组形式。数组中的每个元素代表一个起点和一个终点的检索结果。顺序依次为（以2起点2终点为例）：
     * origin1-destination1,
     * origin1-destination2,
     * origin2-destination1,
     * origin2-destination2
     */
    private List<NearestResult> result = new ArrayList<NearestResult>();
    
    /**
     * @param status
     * @param message
     * @param result
     */
    public NearestMessage(int status, String message, List<NearestResult> result) {
        super();
        
        this.status = status;
        this.message = message;
        this.result = result;
    }
    
    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<NearestResult> getResult() {
        return result;
    }

    public void setResult(List<NearestResult> result) {
        this.result = result;
    }
    
    public String toJson(){
        return JSONObject.fromObject(this).toString();
    }
}
