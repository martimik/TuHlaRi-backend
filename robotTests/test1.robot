*** Settings ***
Documentation       Tests for team ReLambs project Tuhlari

Library             SeleniumLibrary
Resource            resource.robot
#Suite Setup         Open Browser To Webpage
Suite Teardown      Teardown

*** Test Cases ***

#################################
#           Login               #
#################################

Login With Valid Credentials
    Login
	Logout

Login With Invalid Credentials
    Invalid Login
    Teardown
#################################
#      Create/Edit Product      #
#################################

Open Create Product View Not Logged In
    Open Browser To Webpage
	Page Should Not Contain Element    /create-product
    Teardown

Create Product without Logo
    Login
	Click Create-Product View
    Enter Product Info
    Click Element                       submit-button
    Wait Until Element Is Visible       //span[contains(text(), 'added')]
	Teardown

Edit Product
    Login
    Click Product View
    Click Product
    Wait Until Element Is Visible       edit-toggle-button
    Click Element                       edit-toggle-button
    Input Text                          short-description-textfield        Helloooooo
	Click Element                       submit-button
    Wait Until Element Is Visible       //span[contains(text(), 'edited')]
    Wait Until Element Is Visible       //p[contains(text(), 'Helloooooo')]
    Teardown

Delete Product
    Login
    Click Product View
    Click Product
    Wait Until Element Is Visible       edit-toggle-button
    Click Element                       edit-toggle-button
    Wait Until Element Is Visible       delete-product-button
    Click Element                       delete-product-button
    Click Element                       //span[contains(text(), 'Ok')]
	Teardown

Create Product with Logo
    Login
	Click Create-Product View
    Enter Product Info
    Add Image
    Click Element                       submit-button
    Wait Until Element Is Visible       //span[contains(text(), 'added')]
	Teardown

#################################
#         Products              #
#################################
Open Products View
    Open Browser To Webpage
    Click Product View

Open a Product
    Click Product

Open product Statistics
    Wait Until Element Is Visible       open-statistics-button
    Click Element                       open-statistics-button
    Wait Until Element Is Visible       close-dialog-button
    Click Element                       close-dialog-button
    Teardown

Delete Product With Logo
    Login
    Click Product View
    Click Product
    Wait Until Element Is Visible       edit-toggle-button
    Click Element                       edit-toggle-button
    Wait Until Element Is Visible       delete-product-button
    Click Element                       delete-product-button
    Click Element                       //span[contains(text(), 'Ok')]
	Teardown   

#################################
#            Users              #
#################################
Open Users View Not Logged In
    Open Browser To Webpage
    Page Should Not Contain Element     /users
    Teardown

Create User
    Login
    Click Create-User View
    Input Text                      name-textfield                   MR MERCHANT
    Input Text                      email-textfield                  amerchant@skyrim.com
    Input Password                  password-textfield               password
    Input Password                  password-confirm-textfield       password
    Click Element                   user-group-select
    Click Element                   //li[contains(text(), '(2)')]
    Sleep                           500ms
    Click Element                   create-user-button
    Wait Until Element Is Visible   //span[contains(text(), 'created')]
	Teardown

Remove User
    Login
    Click Users View
    Wait Until Element Is Visible      xpath://html/body/div[1]/div/div[2]/div/div[2]/div/div/table/tbody/tr[1]/td[4]/div/button[2]
    Click Element                       xpath://html/body/div[1]/div/div[2]/div/div[1]/div[3]/div/input
    Input Text                          xpath://html/body/div[1]/div/div[2]/div/div[1]/div[3]/div/input         amerchant@skyrim.com
    Wait Until Element Is Visible       xpath://html/body/div[1]/div/div[2]/div/div[2]/div/div/table/tbody/tr[1]/td[4]/div/button[2]
    Sleep                               100ms
    Click Element                       xpath://html/body/div[1]/div/div[2]/div/div[2]/div/div/table/tbody/tr[1]/td[4]/div/button[2]
	Wait Until Element Is Visible       xpath://html/body/div[1]/div/div[2]/div/div[2]/div/div/table/tbody/tr[1]/td[2]/div/button[1]
    Sleep                               100ms
    Click Element                       xpath://html/body/div[1]/div/div[2]/div/div[2]/div/div/table/tbody/tr[1]/td[2]/div/button[1]
    Wait Until Element Is Visible       //span[contains(text(), 'deleted')]
    Teardown

Create User With Invalid Email
    Login
    Click Create-User View
    Input Text                      name-textfield                   Name
    Input Text                      email-textfield                  pmerchant
    Input Password                  password-textfield               password
    Input Password                  password-confirm-textfield       password
    Click Element                   user-group-select
    Click Element                   //li[contains(text(), '(2)')]
    Sleep                           500ms
    Click Element                   create-user-button 
    Wait Until Element Is Visible   //span[contains(text(), 'Invalid')]
	Teardown

Create User With Non Matching Password
    Login
    Click Create-User View
    Input Text                      name-textfield                   Name
    Input Text                      email-textfield                  smerchant@skyrim.com
    Input Password                  password-textfield               password
    Input Password                  password-confirm-textfield       password213
    Click Element                   user-group-select
    Click Element                   //li[contains(text(), '(2)')]
    Sleep                           500ms
    Click Element                   create-user-button
    Page Should Contain Element     password-confirm-textfield-helper-text
	Teardown
