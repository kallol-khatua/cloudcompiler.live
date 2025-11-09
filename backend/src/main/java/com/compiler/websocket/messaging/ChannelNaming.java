package com.compiler.websocket.messaging;

public class ChannelNaming {

    private ChannelNaming() {}

    public static String jobChannel(String jobId) {
        return "job:" + jobId;
    }

    public static String inputChannel(String jobId) {
        return "input:" + jobId;
    }

}