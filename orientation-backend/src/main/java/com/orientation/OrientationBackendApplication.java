package com.orientation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication
public class OrientationBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrientationBackendApplication.class, args);
	}

}
