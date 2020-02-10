*** Settings ***
Documentation       Tests for team ReLambs project Tuhlari

Library             Selenium2Library
Resource            resource.robot
Suite Setup         Open Browser To Webpage
Suite Teardown      Teardown

*** Test Cases ***
#################################
#         Products              #
#################################
Open Products View
    Click Product View

Open a Product
    Click Product

Open product Statistics
    Click Element               id:open-statistics-button


#################################
#      Create/Edit Product      #
#################################
Open Create Prdocut View Not Logged In
    Click Create-Product View
    Page Should Not Contain     id:product-name-textfield

Open Create Product View
    Login
    Click Create-Product View
    Page Should Contain         id:product-name-textfield

Create Product without Logo
    Login
    Enter Product Info

Create Product with Logo
    Login

Edit Product
    Login

Delete Product
    Login

Restore Product
    Login

Delete Prdocut Logo
    Login

Add Product Logo
    Login

Change Product Logo
    Login

#################################
#         Create User           #
#################################
Open Create User View Not Logged In
    Click Create-User View
    Page Should Not Contain     id:name-textfield

Open Create User View
    Login
    Click Create-User View
    Page Should Contain         id:name-textfield

Create User Admin
    Login
    Click Create-User View
    Input Text                  id:name-textfield                   Name
    Input Text                  id:email-textfield                  email
    Input Password              id:password-textfield               password
    Input Password              id:password-confirm-textfield       password
    Select From List By Index   id:user-group-select                2
    Click Element               id:create-user-button

    Page Should contain something fun :)

Create User Salesperson
    Login
    Click Create-User View
    Input Text                  id:name-textfield                   Name
    Input Text                  id:email-textfield                  email
    Input Password              id:password-textfield               password
    Input Password              id:password-confirm-textfield       password
    Select From List By Index   id:user-group-select                0
    Click Element               id:create-user-button

    Page Should contain something fun :)

Create User Product Owner
    Login
    Click Create-User View
    Input Text                  id:name-textfield                   Name
    Input Text                  id:email-textfield                  email
    Input Password              id:password-textfield               password
    Input Password              id:password-confirm-textfield       password
    Select From List By Index   id:user-group-select                1
    Click Element               id:create-user-button 

    Page Should contain something fun :)

#################################
#            Users              #
#################################
Open Users View Not Logged In
    #Should fail

Open Users View
    Login
    Click Users View

Edit User name
    Login

Edit User email
    Login
    
Search User
    Login

Remove User
    Login

#################################
#           Login               #
#################################
TestLogin
    Login

TestLogout
    Login
    Logout