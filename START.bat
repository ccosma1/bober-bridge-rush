@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:8792/?v=br23"
python -m http.server 8792
