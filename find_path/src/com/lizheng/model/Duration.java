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
 * @date 2017��12��11��
 * @version 1.0
 */
public class Duration {
    /**
     * ·�ߺ�ʱ���ı����� �ı������ĵ�λ�з��ӡ�Сʱ����
     */
    private String text = "";
    
    /**
     * ·�ߺ�ʱ����ֵ ��ֵ�ĵ�λΪ�롣��û�м�������ֵΪ0
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
