*** Settings ***
Documentation     Resource file for test1.robot
Library           SeleniumLibrary

*** Variables ***
${URL}                          http://front-test-tuhlari.rahtiapp.fi/#/
${BROWSER}                      headlessfirefox

${USER_EMAIL}                   Testiman@Testiman.com
${USER_PASSWORD}                Testiman

${INVALID_USER_EMAIL}           Testiman@Testiman.com
${INVALID_USER_PASSWORD}        notValidPassWord

${PRODUCT_NAME}                 The epic test product
${PRODUCT_SHORT_DESCRIPTION}    Tämä on EeppinenTestiTuote
${PRODUCT_LICEFYCLE_STATUS}     2
${PRODUCT_LONG_DESCRIPTION}     Tämä Tämä on EeppinenTestiTuote Tämä on EeppinenTestiTuote Tämä on EeppinenTestiTuote #vainparasta
${PRODUCT_PRODUCT_OWNER}        Testiman@Testiman.com
${PRODUCT_SALES_PERSON}         Testiman@Testiman.com
${PRODUCT_BUSINESS_TYPE}        1001
${PRODUCT_PRICING}              150 000
${PRODUCT_TECHNOLOGIES}         React
${PRODUCT_COMPONENTS}           Testi
${PRODUCT_ENVIRONMENT_REQ}      Internet
${PRODUCT_CUSTOMERS}            Google
${PRODUCT_PARTICIPANTS}         Testiman@Testiman.com
${PRODUCT_LOGO}                 ?

*** Keywords ***
Open Browser To Webpage
    Set Selenium Speed      0.0seconds
    Open Browser            ${URL}    ${BROWSER}
    Delete All Cookies
    Title Should Be         Tuhlari
    
Teardown
    Close All Browsers

Click Product
    Wait Until Element Is Visible       //h2[contains(text(), 'The epic')]
    Click Element                       //h2[contains(text(), 'The epic')]
    Sleep                               1000ms

Open Product Statistics
    Click Element              xpath:("//span[.='Statistics']")

Click Product View
    Click Element              /products
    Sleep                      2000ms
   
Click Create-Product View
    Click Element              /create-product

Click Users View
    Click Element              /users

Click Create-User View
    Click Element              /create-user

Click Deleted-Products View
    Click Element              /deleted-products

Enter Product Info
    Wait Until Element Is Visible          product-name-textfield 
    Input Text              product-name-textfield             ${PRODUCT_NAME}
	Input Text              short-description-textfield        ${PRODUCT_SHORT_DESCRIPTION}
    Click Element           demo-customized-select-native
    Click Element           //li[contains(text(), '(2)')]
	Input Text              long-description-textfield         ${PRODUCT_LONG_DESCRIPTION}
    Input Text              product-owner-textfield            ${PRODUCT_PRODUCT_OWNER}
    Input Text              sales-person-textfield             ${PRODUCT_SALES_PERSON}
    Input Text              business-type-textfield            ${PRODUCT_BUSINESS_TYPE}
    Input Text              pricing-textfield                  ${PRODUCT_PRICING}

    Input Text              technology-textfield               ${PRODUCT_TECHNOLOGIES}
    Press Keys              technology-textfield               ENTER

    Input Text              component-textfield                ${PRODUCT_COMPONENTS}
    Press Keys              component-textfield                ENTER

    Input Text              env-req-textfield                  ${PRODUCT_ENVIRONMENT_REQ}
    Press Keys              env-req-textfield                  ENTER

    Input Text              customer-textfield                 ${PRODUCT_CUSTOMERS}
    Press Keys              customer-textfield                 ENTER

    Input Text              participant-textfield              ${PRODUCT_PARTICIPANTS}
    Press Keys              participant-textfield              ENTER

Add Image
    Choose File             contained-button-file              ${CURDIR}/index.jpg

Login
	Open Browser To Webpage
    Wait Until Element Is Visible       toggle-login-button
    Click Element                       toggle-login-button
    Input Text                          auth-email-textfield         ${USER_EMAIL}
    Input Password                      auth-password-textfield      ${USER_PASSWORD}
    Sleep                               250ms
    Click Element                       login-button
    Wait Until Element Is Visible       logout-button

Invalid Login
	Open Browser To Webpage
    Wait Until Element Is Visible       toggle-login-button
    Click Element                       toggle-login-button
    Input Text                          auth-email-textfield         ${INVALID_USER_EMAIL}
    Input Password                      auth-password-textfield      ${INVALID_USER_PASSWORD}
    Sleep                               250ms
    Click Element                       login-button
    Wait Until Element Is Visible       //span[contains(text(), 'Failed')]

Logout
    Wait Until Element Is Visible     logout-button
    Sleep                             250ms
    Click Element                     logout-button
    Wait Until Element Is Visible     toggle-login-button