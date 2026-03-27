import sys
import traceback
try:
    import app.main
    print("Success")
except Exception as e:
    with open("crash.log", "w") as f:
        traceback.print_exc(file=f)
