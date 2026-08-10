package com.enda.backend.selenium;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class ChangerStatusCallCenterTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setup() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get("http://localhost:5173");
    }

    @Test
    void ChangerStatusTest() throws InterruptedException {

        this.driver.findElement(By.id("username"))
                .sendKeys("ahmed.benali@enda.tn");

        this.driver.findElement(By.id("password"))
                .sendKeys("Enda@2026");

        this.driver.findElement(By.id("kc-login"))
                .click();

        Thread.sleep(4000);

        driver.findElement(By.className("status-contact")).click();
        driver.findElement(By.className("status-joinable")).click();
        driver.findElement(By.className("status-interesse")).click();

        Thread.sleep(8000);



    }


    @AfterEach
    void tearDown() {
        driver.quit();
    }
}