package com.compiler.websocket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Objects;
import java.util.concurrent.Executor;

@Configuration
public class RedisConfig {

    // TODO: check this
    @Bean
    public RedisConnectionFactory redisConnectionFactory(org.springframework.core.env.Environment env) {
        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(
                Objects.requireNonNull(env.getProperty("spring.data.redis.host")),
                Integer.parseInt(Objects.requireNonNull(env.getProperty("spring.data.redis.port")))
        );

        LettuceClientConfiguration.LettuceClientConfigurationBuilder builder = LettuceClientConfiguration.builder();

        if (Boolean.parseBoolean(env.getProperty("spring.data.redis.ssl.enabled"))) {
            builder.useSsl();
        }

        return new LettuceConnectionFactory(cfg, builder.build());
    }

    /**
     * Executor used by RedisMessageListenerContainer to run callbacks.
     * Keep this separate from JobMessagingService pool to avoid interference.
     */
    @Bean(name = "redisListenerExecutor")
    public Executor redisListenerExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);               // adjust to hardware
        executor.setMaxPoolSize(2);                // handle bursts
        executor.setQueueCapacity(20_000);          // large queue for burst absorption
        executor.setThreadNamePrefix("redis-listener-");
        executor.initialize();
        return executor;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory,
                                                                       Executor redisListenerExecutor) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.setTaskExecutor(redisListenerExecutor);
        container.setTopicSerializer(new StringRedisSerializer());
        return container;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}