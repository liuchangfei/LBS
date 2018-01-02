package com.lizheng.util;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

/**
 * <p>Title: </p>
 * <p>Description: </p>
 * <p>Company: changhong </p>
 * @author lizheng
 * @date 2016Äê10ÔÂ17ÈÕ
 * @version 1.0
 */
public class ResponseUtil {

    public static void toSuccessResponse(HttpServletResponse response, String info) throws IOException {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Programa", "no-cache");
        response.setDateHeader("Expires", -1L);
        response.setContentType("text/html; charset=UTF-8");
        response.getWriter().write(info);
        response.flushBuffer();
        response.getWriter().close();
        response.setStatus(HttpServletResponse.SC_OK);
    }

}
