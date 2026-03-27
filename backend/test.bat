@echo off
cd /d d:\project\parking-system\backend
call venv\Scripts\activate.bat
python -c "import app.main; print('Success')" > out.txt 2>&1
echo Done >> out.txt
