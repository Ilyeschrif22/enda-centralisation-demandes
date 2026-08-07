package com.enda.backend.selenium;

import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class CreateDemandeDoublonsTest {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setup() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.get("http://localhost:5173");
    }

    @Test
    void createDemandeDoublonsTest() throws InterruptedException {

        this.driver.findElement(By.id("username"))
                .sendKeys("admin");

        this.driver.findElement(By.id("password"))
                .sendKeys("admin");

        this.driver.findElement(By.id("kc-login"))
                .click();


        wait.until(d -> d.findElement(By.id("requests")).isDisplayed());


        this.driver.findElement(By.id("requests"))
                .click();

        Thread.sleep(1000);

        this.driver.findElement(By.id("add-demande-button"))
                .click();


        Select typeDemande = new Select(
                this.driver.findElement(By.id("typeDemande"))
        );
        typeDemande.selectByIndex(1);


        this.driver.findElement(By.id("nomFamille"))
                .sendKeys("test");

        this.driver.findElement(By.id("prenom"))
                .sendKeys("test");

        this.driver.findElement(By.id("dateNaissance"))
                .sendKeys("01/01/2001");


        Select genre = new Select(
                this.driver.findElement(By.id("genre"))
        );
        genre.selectByIndex(1);


        Select situationFamiliale = new Select(
                this.driver.findElement(By.id("situationFamiliale"))
        );
        situationFamiliale.selectByIndex(1);


        this.driver.findElement(By.id("cin"))
                .sendKeys("10010055");

        Thread.sleep(1000);


        this.driver.findElement(By.id("cin-validate-button"))
                .click();


        Select secteurActivite = new Select(
                this.driver.findElement(By.id("secteurActivite"))
        );
        secteurActivite.selectByIndex(1);


        Select activite = new Select(
                this.driver.findElement(By.id("activite"))
        );
        activite.selectByIndex(1);


        this.driver.findElement(By.id("telephone"))
                .sendKeys("123456789");

        this.driver.findElement(By.id("adresse"))
                .sendKeys("123 Main St");


        Select gouvernorat = new Select(
                this.driver.findElement(By.id("gouvernorat"))
        );
        gouvernorat.selectByIndex(1);


        Select delegation = new Select(
                this.driver.findElement(By.id("delegation"))
        );
        delegation.selectByIndex(1);


        this.driver.findElement(By.id("codePostal"))
                .sendKeys("1000");


        Select montantDemande = new Select(
                this.driver.findElement(By.id("montantDemande"))
        );
        montantDemande.selectByIndex(3);


        Select utilisationPret = new Select(
                this.driver.findElement(By.id("utilisationPret"))
        );
        utilisationPret.selectByIndex(1);


        this.driver.findElement(By.id("capaciteRemboursement"))
                .sendKeys("400");


        Select dureePret = new Select(
                this.driver.findElement(By.id("dureePret"))
        );
        dureePret.selectByIndex(1);


        this.driver.findElement(By.id("add-demande-submit"))
                .click();


        Assertions.assertTrue(true);
    }


    @AfterEach
    void tearDown() {
        driver.quit();
    }
}