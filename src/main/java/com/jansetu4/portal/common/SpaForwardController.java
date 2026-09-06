package com.jansetu4.portal.common;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to forward Single Page Application (SPA) client routes
 * to /index.html so that page refreshes and direct URL navigation work seamlessly.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/challenges",
            "/challenges/**",
            "/projects",
            "/projects/**",
            "/universities",
            "/universities/**",
            "/industry",
            "/industry/**",
            "/dashboard",
            "/dashboard/**",
            "/knowledge",
            "/knowledge/**",
            "/mentor",
            "/mentor/**",
            "/login",
            "/register",
            "/register/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
