*** Settings ***
Documentation     Resource file for test1.robot
Library           SeleniumLibrary

*** Variables ***
${URL}                          https://front-end-tuhlari.rahtiapp.fi/#/
${BROWSER}                      headlessfirefox

${USER_EMAIL}                   Testiman@Testiman.com
${USER_PASSWORD}                Testiman

${PRODUCT_NAME}                 EeppinenTestiTuote
${PRODUCT_SHORT_DESCRIPTION}    Tämä on EeppinenTestiTuote
${PRODUCT_LICEFYCLE_STATUS}     ?
${PRODUCT_LONG_DESCRIPTION}     Tämä Tämä on EeppinenTestiTuote Tämä on EeppinenTestiTuote Tämä on EeppinenTestiTuote #vainparasta
${PRODUCT_PRODUCT_OWNER}        ?
${PRODUCT_SALES_PERSON}         ?
${PRODUCT_BUSINESS_TYPE}        1001
${PRODUCT_PRICING}              150 000
${PRODUCT_TECHNOLOGIES}         React
${PRODUCT_COMPONENTS}           Testi
${PRODUCT_ENVIRONMENT_REQ}      Internet
${PRODUCT_CUSTOMERS}            Google
${PRODUCT_PARTICIPANTS}         ?
${PRODUCT_LOGO}                 ?

*** Keywords ***
Open Browser To Webpage
    Selenium2Library.Open Browser            ${URL}    ${BROWSER}
    SeleniumLibrary.Title Should Be         Tuhlari

Teardown
    SeleniumLibrary.Close All Browsers


Click Product
    Click Link              xpath:("//span[.='${PRODUCT_NAME}']")
    #https://stackoverflow.com/questions/27798339/how-to-click-on-a-text-in-selenium-webdriver-2-x

Open Product Statistics
    SeleniumLibrary.Click Link              xpath:("//span[.='Statistics']")

Click Product View
    SeleniumLibrary.Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/products

Click Create-Product View
    SeleniumLibrary.Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/create-product

Click Users View
    SeleniumLibrary.Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/users

Click Create-User View
    SeleniumLibrary.Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/create-user

Click Deleted-Products View
    SeleniumLibrary.Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/deleted-products

Enter Product Info


Login
    SeleniumLibrary.Click Element           id:toggle-login-button
    SeleniumLibrary.Input Text              id:auth-email-textfield         ${USER_EMAIL}
    SeleniumLibrary.Input Password          id:auth-password-textfield      ${USER_PASSWORD}
    SeleniumLibrary.Click Element           id:login-button
    SeleniumLibrary.Page Should Contain     id:logout-button

Logout
    SeleniumLibrary.Click-Element           id:logout-button
    SeleniumLibrary.Page Should Contain     id:toggle-login-button


