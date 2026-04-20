import requests

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing GET / ...")
    response = requests.get(f"{BASE_URL}/")
    print(response.json())

def test_classify(text):
    print(f"Testing POST /classify with text: '{text}' ...")
    response = requests.post(f"{BASE_URL}/classify", json={"text": text})
    print(response.json())

if __name__ == "__main__":
    test_health()
    test_classify("fire in building")
    test_classify("someone is bleeding and has an injury")
    test_classify("car crash and collision")
    test_classify("bank robbery with a gun")
    test_classify("earthquake and flood")
    test_classify("ordinary day")
