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
 * @date 2017年12月11日
 * @version 1.0
 */
public class Duration {
    /**
     * 路线耗时的文本描述 文本描述的单位有分钟、小时两种
     */
    private String text = "";
    
    /**
     * 路线耗时的数值 数值的单位为秒。若没有计算结果，值为0
     */
    private double value = 0;
    
    public Duration() {}
    
    /**
     * @param text
     * @param value
     */
    public Duration(String text, double value) {
        super();
        this.text = text;
        this.value = value;
    }
    
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }

    public String toJson() {
        return JSONObject.fromObject(this).toString();
    }
}
