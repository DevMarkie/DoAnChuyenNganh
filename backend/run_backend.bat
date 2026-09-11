@echo off
echo ==============================================
echo STARTING SPRING BOOT WITH JAVA 25
echo ==============================================

set "JAVA_HOME=C:\Users\minhn\.jdk\jdk-25\jdk-25.0.2(1)"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo JAVA_HOME is set to: %JAVA_HOME%
java -version

echo.
echo Running spring-boot:run...
call .\mvnw.cmd spring-boot:run
