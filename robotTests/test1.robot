*** Settings ***
Library           Selenium2Library

*** Variables ***

${URL}          http://front-end-tuhlari.rahtiapp.fi/
${BROWSER}      headlessfirefox

*** Keywords ***
Setup Page
    Open Browser    ${URL}      ${BROWSER}

*** Test Cases ***
This is a test
    Set Selenium Speed      1
    Setup Page
    Location Should Be      ${URL}
    Close All Browsers