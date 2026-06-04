@echo off
setlocal enabledelayedexpansion

:: Get the HTML file path in this folder
set "HTML=%~dp0take-command-tracker.html"

:: Build a file:/// URL (replace backslashes with forward slashes)
set "URL=%HTML:\=/%"
set "URL=file:///%URL%"

:: Find Chrome
set "BROWSER="
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else if exist "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"
) else if exist "%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%PROGRAMFILES(X86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%PROGRAMFILES(X86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%PROGRAMFILES%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%PROGRAMFILES%\Microsoft\Edge\Application\msedge.exe"
)

if defined BROWSER (
    start "" "!BROWSER!" --app="!URL!" --window-size=1280,820
) else (
    start "" "!HTML!"
)
