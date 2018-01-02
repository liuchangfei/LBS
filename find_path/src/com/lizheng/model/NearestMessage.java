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
 * @date 2017��12��11��
 * @version 1.0
 */
public class NearestMessage {
    
    /**
     * ״̬��
     * 0���ɹ� 1���������ڲ����� 2����������
     */
    private int status = 0;
    
    /**
     * ������Ϣ ��status����������
     */
    private String message = "";
    
    /**
     * ���صĽ��
     * ������ʽ�������е�ÿ��Ԫ�ش���һ������һ���յ�ļ��������˳������Ϊ����2���2�յ�Ϊ������
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
