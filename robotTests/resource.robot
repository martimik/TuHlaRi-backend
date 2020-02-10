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
    Delete All Cookies
    Set Selenium Speed      0.5seconds
    Open Browser            ${URL}    ${BROWSER}
    Title Should Be         Tuhlari
    
Teardown
    Close All Browsers

Click Product
    Click Link              xpath:("//span[.='${PRODUCT_NAME}']")
    #https://stackoverflow.com/questions/27798339/how-to-click-on-a-text-in-selenium-webdriver-2-x

Open Product Statistics
    Click Link              xpath:("//span[.='Statistics']")

Click Product View
    Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/products

Click Create-Product View
    Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/create-product

Click Users View
    Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/users

Click Create-User View
    Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/create-user

Click Deleted-Products View
    Click Link              link:https://front-end-tuhlari.rahtiapp.fi/#/deleted-products

Enter Product Info


Login
    Click Element           id:toggle-login-button
    Input Text              id:auth-email-textfield         ${USER_EMAIL}
    Input Password          id:auth-password-textfield      ${USER_PASSWORD}
    Click Element           id:login-button
    Page Should Contain     id:logout-button

Logout
    Click-Element           id:logout-button
    Page Should Contain     id:toggle-login-button


