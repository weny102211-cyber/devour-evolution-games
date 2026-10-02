@echo off
chcp 65001 >nul
echo ========================================================
echo   正在启动抖音小游戏《吞噬进化》本地极速运行环境...
echo ========================================================
echo.
echo 正在打开默认浏览器畅玩游戏...
start http://localhost:8080/index.html
echo.
echo 正在启动本地游戏服务器 (端口: 8080)...
echo [提示] 按 Ctrl + C 可随时退出服务器
echo.
node -e "import('./test_server.js').then(m => m.startServer(8080))"
pause
