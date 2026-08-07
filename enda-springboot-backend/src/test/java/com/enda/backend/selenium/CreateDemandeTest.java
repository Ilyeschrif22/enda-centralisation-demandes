package com.enda.backend.selenium;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class CreateDemandeTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setup() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get("http://localhost:5173");
    }

    @Test
    void createDemandeTest() throws InterruptedException {

        driver.findElement(By.id("username"))
                .sendKeys("admin");

        driver.findElement(By.id("password"))
                .sendKeys("admin");

        driver.findElement(By.id("kc-login"))
                .click();


        wait.until(d -> d.findElement(By.id("requests")).isDisplayed());


        driver.findElement(By.id("requests"))
                .click();

        Thread.sleep(1000);

        driver.findElement(By.id("add-demande-button"))
                .click();


        Select typeDemande = new Select(
                driver.findElement(By.id("typeDemande"))
        );
        typeDemande.selectByIndex(1);


        driver.findElement(By.id("nomFamille"))
                .sendKeys("Doe");

        driver.findElement(By.id("prenom"))
                .sendKeys("John");

        driver.findElement(By.id("dateNaissance"))
                .sendKeys("01/01/1990");


        Select genre = new Select(
                driver.findElement(By.id("genre"))
        );
        genre.selectByIndex(1);


        Select situationFamiliale = new Select(
                driver.findElement(By.id("situationFamiliale"))
        );
        situationFamiliale.selectByIndex(1);


        driver.findElement(By.id("cin"))
                .sendKeys("10010055");

        Thread.sleep(1000);


        driver.findElement(By.id("cin-validate-button"))
                .click();


        Select secteurActivite = new Select(
                driver.findElement(By.id("secteurActivite"))
        );
        secteurActivite.selectByIndex(1);


        Select activite = new Select(
                driver.findElement(By.id("activite"))
        );
        activite.selectByIndex(1);


        driver.findElement(By.id("telephone"))
                .sendKeys("123456789");

        driver.findElement(By.id("adresse"))
                .sendKeys("123 Main St");


        Select gouvernorat = new Select(
                driver.findElement(By.id("gouvernorat"))
        );
        gouvernorat.selectByIndex(1);


        Select delegation = new Select(
                driver.findElement(By.id("delegation"))
        );
        delegation.selectByIndex(1);


        driver.findElement(By.id("codePostal"))
                .sendKeys("1000");


        Select montantDemande = new Select(
                driver.findElement(By.id("montantDemande"))
        );
        montantDemande.selectByIndex(2);


        Select utilisationPret = new Select(
                driver.findElement(By.id("utilisationPret"))
        );
        utilisationPret.selectByIndex(1);


        driver.findElement(By.id("capaciteRemboursement"))
                .sendKeys("400");


        Select dureePret = new Select(
                driver.findElement(By.id("dureePret"))
        );
        dureePret.selectByIndex(1);


        driver.findElement(By.id("add-demande-submit"))
                .click();


        Assertions.assertTrue(true);
    }


    @AfterEach
    void tearDown() {
        driver.quit();
    }
}