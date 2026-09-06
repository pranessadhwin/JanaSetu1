package com.jansetu4.portal;

import com.jansetu4.portal.config.AiConfig;
import com.jansetu4.portal.config.FileStorageConfig;
import com.jansetu4.portal.config.JwtConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({JwtConfig.class, FileStorageConfig.class, AiConfig.class})
public class Jansetu4Application {

    public static void main(String[] args) {
        SpringApplication.run(Jansetu4Application.class, args);
    }
}
