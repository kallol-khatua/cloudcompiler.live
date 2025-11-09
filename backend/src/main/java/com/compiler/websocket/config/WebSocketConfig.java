package com.compiler.websocket.config;

import com.compiler.websocket.websocket.CompilerWebSocketHandler;
import com.compiler.websocket.websocket.CompilerWebSocketHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final CompilerWebSocketHandler wsHandler;
    private final CompilerWebSocketHandshakeInterceptor wsInterceptor;

    @Value("${app.ws.path}")
    private String wsPath;

    @Value("${app.ws.allowed-origins:*}")
    private String[] allowedOrigins;

    public WebSocketConfig(CompilerWebSocketHandler wsHandler, CompilerWebSocketHandshakeInterceptor wsInterceptor) {
        this.wsHandler = wsHandler;
        this.wsInterceptor = wsInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(wsHandler, wsPath)
                .addInterceptors(wsInterceptor)
                .setAllowedOrigins(allowedOrigins);
    }
}
