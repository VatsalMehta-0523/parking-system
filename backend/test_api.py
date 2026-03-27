from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    
    docs_resp = client.get("/docs")
    print("Docs status:", docs_resp.status_code)
    
    search_resp = client.get("/api/locations/search")
    print("Search status:", search_resp.status_code)

if __name__ == "__main__":
    run_tests()
