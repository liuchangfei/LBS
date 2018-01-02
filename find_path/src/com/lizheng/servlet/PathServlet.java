/**
 * 
 */
package com.lizheng.servlet;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.lizheng.model.Distance;
import com.lizheng.model.Duration;
import com.lizheng.model.NearestMessage;
import com.lizheng.model.NearestResult;
import com.lizheng.model.Pos;
import com.lizheng.model.ResponseData;
import com.lizheng.util.ResponseUtil;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

/**
 * <p>Title: </p>
 * <p>Description: </p>
 * <p>Company: changhong </p>
 * @author lizheng
 * @date 2017年12月10日
 * @version 1.0
 */
public class PathServlet extends HttpServlet {
    private static final long   serialVersionUID    = 1;
    private static Logger       logger              = Logger.getLogger(PathServlet.class.getName());
    
    private final String mapKey = "Eyl6qk7hFQu40NoVslN3X2RDjxca33fX";
    private int currentIndex = 0;//当前起点索引
    private List<Pos> resultList;
    private int totalNum = 0;
    
    protected void doGet(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
//        this.doPost(request, response);
    }
    
    protected void doPost(HttpServletRequest request,
            HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String servletPath = request.getServletPath();
        //servletPath start with "/"
        String servletName = servletPath == null ? null : servletPath.substring(1, servletPath.length());
        logger.fine(request.getRequestURI());
        if(servletName.equals("findPath")) {
            String postDataStr = readPostData(request);
            if (postDataStr == null || postDataStr.equals("")) {
                ResponseUtil.toSuccessResponse(response, "post data is empty.");
            } else {
                List<Pos> posList = getPosList(postDataStr);
                setStartAndEndList(posList);
                //find nearest posList
                currentIndex = 0;
                totalNum = posList.size();
                if(totalNum > 2) {
                    resultList = new ArrayList<Pos>();
                    Pos startPos = posList.get(0);
                    resultList.add(startPos);
                    sortPosList();
                } else {
                    resultList = posList;
                }
                currentIndex = 0;
                //search way
                wayPath = "";
                startIndex = 0;
                endIndex = 0;
                searchWay();
                
                ResponseData data = new ResponseData(wayPath, resultList);
                ResponseUtil.toSuccessResponse(response, JSONObject.fromObject(data).toString());
            }
        } else {
            ResponseUtil.toSuccessResponse(response, "your request url is wrong.");
        }
    }
    
    private String readPostData(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        try{
            request.setCharacterEncoding("UTF-8");
            BufferedReader reader = request.getReader();
            char[] buff = new char[1024];
            int len;
            while((len = reader.read(buff)) != -1) {
                sb.append(buff, 0, len);
            }
        }catch (IOException e) {
            e.printStackTrace();
        }
        String result = sb.toString().trim();
        return result;
    }
    
    private List<Pos> getPosList(String postDataStr) {
        ArrayList<Pos> posList = new ArrayList<Pos>();
        JSONObject data = JSONObject.fromObject(postDataStr);
        JSONArray jsonArray = JSONArray.fromObject(data.get("posList"));
        for (int i = 0; i < jsonArray.size(); i++) {
            JSONObject object = jsonArray.getJSONObject(i);
            Pos pos = (Pos) JSONObject.toBean(object, Pos.class);
            posList.add(pos);
        }
        return posList;
    }
    
    private String readInputStream(InputStream inStream) throws Exception {
        ByteArrayOutputStream outStream = new ByteArrayOutputStream();
        // 创建一个Buffer字符串
        byte[] buffer = new byte[1024];
        // 每次读取的字符串长度，如果为-1，代表全部读取完毕
        int len = 0;
        // 把输入流从里的数据读取到buffer中
        while ((len = inStream.read(buffer)) != -1) {
            // 把buffer中的数据写入输出流中，中间参数代表从哪个位置开始读，len代表读取的长度
            outStream.write(buffer, 0, len);
        }
        // 关闭输入流
        inStream.close();
        // 把outStream里的数据写入内存
        return outStream.toString("UTF-8");
    }
    
    //--------------------------------------------------------------
    // find nearest pos list methods
    //--------------------------------------------------------------
    
    private List<Pos> startList = new ArrayList<Pos>();
    private List<Pos> endList = new ArrayList<Pos>();
    private List<Pos> passStartList = new ArrayList<Pos>();
    
    private void setStartAndEndList(List<Pos> posList) {
        startList.clear();
        endList.clear();
        passStartList.clear();
        //排除当前位置点
        for (int i = 1; i < posList.size(); i++) {
            Pos pos = posList.get(i);
            if(pos.getIsStart()) {
                startList.add(pos);
            } else {
                endList.add(pos);
            }
        }
    }
    
    private Pos getPosById(String id, List<Pos> posList) {
        if(id.equals("")) {
            return null;
        }
        for (int i = 0; i < posList.size(); i++) {
            Pos pos = posList.get(i);
            if(pos.getId().equals(id)) {
                return pos;
            }
        }
        return null;
    }
    
    private List<Pos> getSortList() {
        List<Pos> sortList = new ArrayList<Pos>();
        Pos startPos = resultList.get(resultList.size() - 1);
        sortList.add(startPos);
        for (int i = 0; i < startList.size(); i++) {
            Pos pos = startList.get(i);
            sortList.add(pos);
        }
        for (int i = 0; i < passStartList.size(); i++) {
            Pos pos = passStartList.get(i);
            String id = pos.getId();
            pos = getPosById(id, endList);
            if(pos != null) {
                sortList.add(pos);
            }
        }
        return sortList;
    }
    
    private void sortPosList() {
        List<Pos> sortList = getSortList();
//        String sortStr = "sort List:";
//        for (int i = 0; i < sortList.size(); i++) {
//            sortStr += sortList.get(i).getAddr() + ",";
//        }
//        System.out.println(sortStr);
        String nearestPosUrl = getNearestPosUrl(sortList, 0);
//        logger.info(nearestPosUrl);
        sendNearestPosRequest(nearestPosUrl, sortList);
    }
    
    private String getPosStr(String prefix, List<Pos> posList) {
        String result = prefix + "=";
        int lastIndex = posList.size() - 1;
        for (int i = 0; i < posList.size(); i++) {
            Pos pos = posList.get(i);
            result += String.valueOf(pos.getLat()) + "," + String.valueOf(pos.getLng());
            if(i < lastIndex) {
                result += "|";
            }
        }
        return result;
    }
    
    private String getNearestPosUrl(List<Pos> posList, int originsIndex) {
        String url = "http://api.map.baidu.com/routematrix/v2/driving?output=json&";
        url += getPosStr("origins", posList.subList(originsIndex, originsIndex + 1));
        url += "&";
        url += getPosStr("destinations", posList.subList(originsIndex + 1, posList.size()));
        url += "&ak=" + mapKey;
        return url;
    }
    
    private void sendNearestPosRequest(String spec, List<Pos> posList) {
        try {
            // new一个URL对象
            URL url = new URL(spec);
            // 打开链接
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            // 设置请求方式为"GET"
            conn.setRequestMethod("GET");
            // 超时响应时间为15秒
            conn.setConnectTimeout(15 * 1000);
            // 通过输入流获取数据
            InputStream inStream = conn.getInputStream();
            //读取json字符串
            String result = readInputStream(inStream);
            //依次找到所有点的最近的下一个点
            findNearestPos(result, posList);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void findNearestPos(String result, List<Pos> posList) throws Exception {
        NearestMessage message = parseNearestMessage(result);
        if(message == null) {
            return;
        }
        //获取最近点在sortList的索引值
        int index = findNearestPosIndex(message.getResult());
        //判断是否找到最近点
        if(index == -1) {
            return;
        }
        Pos nearestPos = posList.get(index);
//        System.out.println("nearestPos:" + nearestPos.getAddr());
        refresh(nearestPos);
        currentIndex++;
        if(currentIndex < totalNum - 1) {
            sortPosList();
        } else {
            resultList.addAll(startList);
            resultList.addAll(endList);
        }
    }
    
    private void refresh(Pos pos) {
        if(pos.getIsStart()) {
            startList.remove(pos);
            passStartList.add(pos);
        } else {
            endList.remove(pos);
        }
        resultList.add(pos);
    }
    
    private NearestMessage parseNearestMessage(String jsonStr) throws Exception {
        JSONObject data = JSONObject.fromObject(jsonStr);
        int status = data.getInt("status");
        if(status == 1) {
            throw new Exception("服务器内部错误");
        } else if(status == 2) {
            throw new Exception("参数错误");
        } else if(status != 0) {
            throw new Exception("未知错误");
        }
        String msg = data.getString("message");
        JSONArray jsonArray = JSONArray.fromObject(data.get("result"));
        ArrayList<NearestResult> resultList = new ArrayList<NearestResult>();
        for (int i = 0; i < jsonArray.size(); i++) {
            JSONObject object = jsonArray.getJSONObject(i);
            Distance distance = (Distance) JSONObject.toBean(JSONObject.fromObject(object.get("distance")), Distance.class);
            Duration duration = (Duration) JSONObject.toBean(JSONObject.fromObject(object.get("duration")), Duration.class);
            NearestResult result = new NearestResult(distance, duration);
            resultList.add(result);
        }
        NearestMessage message = new NearestMessage(status, msg, resultList);
        return message;
    }
    
    private int findNearestPosIndex(List<NearestResult> resultList) {
        int index = -1;
        double value = 0d, minValue = Double.MAX_VALUE;
        for (int i = 0; i < resultList.size(); i++) {
            value = resultList.get(i).getDistance().getValue();
            if(value < minValue) {
                minValue = value;
                index = i + 1;//多加一个起点位置
            }
        }
        return index;
    }
    
    //--------------------------------------------------------------
    // search way points methods
    //--------------------------------------------------------------
    
    private int startIndex = 0;
    private int endIndex = 0;
    private int maxNum = 7;
    private String wayPath = "";
    
    private void searchWay() {
        int total = resultList.size();
        endIndex = startIndex + maxNum;
        if(endIndex > total) {
            endIndex = total;
        }
        wayPath += search(resultList.subList(startIndex, endIndex));
        if(endIndex < total) {
            startIndex = endIndex;
            searchWay();
        }
    }
    
    private String search(List<Pos> posList) {
//        http://api.map.baidu.com/direction/v1?mode=driving&origin=清华大学&destination=北京大学&origin_region=北京&destination_region=北京&output=json&ak=您的ak
        String searchUrl = getSearchUrl(posList);
        if(searchUrl == null) {
            return "";
        }
        logger.info(searchUrl);
        return sendSearchWayRequest(searchUrl);
    }
    
    private String sendSearchWayRequest(String spec) {
        String path = "";
        try {
            // new一个URL对象
            URL url = new URL(spec);
            // 打开链接
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            // 设置请求方式为"GET"
            conn.setRequestMethod("GET");
            // 超时响应时间为15秒
            conn.setConnectTimeout(15 * 1000);
            // 通过输入流获取数据
            InputStream inStream = conn.getInputStream();
            //读取json字符串
            String result = readInputStream(inStream);
            path += getPath(result);
//            System.out.println(path);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return path;
    }
    
    private String getSearchUrl(List<Pos> posList) {
        int total = posList.size();
        if(total < 2) {
            return null;
        }
        String url = "http://api.map.baidu.com/direction/v1?mode=driving&output=json&";
        url += getPosStr("origin", posList.get(0)) + "&";
        url += getPosStr("destination", posList.get(total-1)) + "&";
        url += "origin_region=" + posList.get(0).getAddr().split("市")[0] + "&";
        url += "destination_region=" + posList.get(total-1).getAddr().split("市")[0] + "&";
        if(total > 2) {
            url += getPosStr("waypoints", posList.subList(1, total-1)) + "&";
        }
        url += "ak=" + mapKey;
        return url;
    }
    
    private String getPosStr(String prefix, Pos pos) {
        String result = prefix + "=";
        result += String.valueOf(pos.getLat()) + "," + String.valueOf(pos.getLng());
        return result;
    }
    
    private String getPath(String jsonStr) throws Exception {
        String path = "";
        JSONObject data = JSONObject.fromObject(jsonStr);
        int status = data.getInt("status");
        if(status == 2) {
            throw new Exception("参数错误");
        } else if(status == 5) {
            throw new Exception("权限或配额校验失败");
        } else if(status != 0) {
            throw new Exception("未知错误");
        }
        int type = data.getInt("type");
        if(type == 1) {
            throw new Exception("起终点是模糊的");
        }
        JSONObject result = JSONObject.fromObject(data.get("result"));
        JSONArray routes = JSONArray.fromObject(result.get("routes"));
        for (int i = 0; i < routes.size(); i++) {
            JSONObject route = routes.getJSONObject(i);
            JSONArray steps = JSONArray.fromObject(route.get("steps"));
            for (int j = 0; j < steps.size(); j++) {
                JSONObject step = steps.getJSONObject(j);
                path += step.get("path") + ";";
            }
        }
        return path;
    }
    
}
