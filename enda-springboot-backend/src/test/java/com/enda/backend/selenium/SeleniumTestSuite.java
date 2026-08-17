package com.enda.backend.selenium;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

@Suite
@SelectClasses({
        CreateDemandeTest.class,
        CreateDemandeDoublonsTest.class,
        ChangerStatusCallCenterTest.class,
})
public class SeleniumTestSuite {
}