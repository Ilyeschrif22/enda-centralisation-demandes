package com.enda.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EndaApplication {

	public static void main(String[] args) {
		SpringApplication.run(EndaApplication.class, args);
	}

}
