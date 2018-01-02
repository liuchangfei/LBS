/**
 * 
 */
package com.lizheng.model;

import java.util.ArrayList;
import java.util.List;

/**
 * <p>Title: </p>
 * <p>Description: </p>
 * <p>Company: changhong </p>
 * @author lizheng
 * @date 2017Äê12ÔÂ13ÈÕ
 * @version 1.0
 */
public class ResponseData {
    private String path = "";
    private List<Pos> posList = new ArrayList<Pos>();
    
    public ResponseData() {}
    
    /**
     * @param path
     * @param posList
     */
    public ResponseData(String path, List<Pos> posList) {
        super();
        this.path = path;
        this.posList = posList;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public List<Pos> getPosList() {
        return posList;
    }

    public void setPosList(List<Pos> posList) {
        this.posList = posList;
    }
}
