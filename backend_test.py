import requests
import sys
import json
from datetime import datetime
import io

class StadtwacheAPITester:
    def __init__(self, base_url="https://guard-apply-feedback.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    # For multipart/form-data (file uploads)
                    response = requests.post(url, data=data, files=files, timeout=10)
                else:
                    # For JSON data
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                        if response_data:
                            print(f"   First item keys: {list(response_data[0].keys())}")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_news(self):
        """Test getting news items"""
        success, response = self.run_test("Get News", "GET", "news", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} news items")
            for i, news in enumerate(response):
                if isinstance(news, dict):
                    priority = news.get('priority', 'unknown')
                    title = news.get('title', 'No title')[:50]
                    print(f"   News {i+1}: {priority} - {title}")
        return success, response

    def test_create_news(self):
        """Test creating a news item"""
        test_news = {
            "title": "Test Nachricht",
            "content": "Dies ist eine Test-Nachricht für die API.",
            "priority": "normal"
        }
        return self.run_test("Create News", "POST", "news", 200, data=test_news)

    def test_create_application(self):
        """Test creating an application with file upload"""
        # Create a fake PDF file
        fake_pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        
        application_data = {
            "name": "Max Mustermann",
            "email": "max.mustermann@test.de",
            "phone": "+49 123 456789",
            "position": "polizist",
            "message": "Ich möchte mich als Polizist bewerben."
        }
        
        files = {
            'cv_file': ('test_cv.pdf', io.BytesIO(fake_pdf_content), 'application/pdf')
        }
        
        return self.run_test("Create Application", "POST", "applications", 200, 
                           data=application_data, files=files)

    def test_get_applications(self):
        """Test getting all applications"""
        success, response = self.run_test("Get Applications", "GET", "applications", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} applications")
        return success, response

    def test_create_feedback(self):
        """Test creating feedback"""
        feedback_data = {
            "name": "Anna Schmidt",
            "email": "anna.schmidt@test.de",
            "subject": "Sehr guter Service",
            "message": "Ich bin sehr zufrieden mit dem Service der Stadtwache.",
            "rating": 5
        }
        return self.run_test("Create Feedback", "POST", "feedback", 200, data=feedback_data)

    def test_get_feedback(self):
        """Test getting all feedback"""
        success, response = self.run_test("Get Feedback", "GET", "feedback", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} feedback entries")
        return success, response

    def test_invalid_file_upload(self):
        """Test application with invalid file type"""
        application_data = {
            "name": "Test User",
            "email": "test@test.de",
            "phone": "+49 123 456789",
            "position": "polizist",
            "message": "Test message"
        }
        
        # Create a fake .txt file (should be rejected)
        files = {
            'cv_file': ('test.txt', io.BytesIO(b'This is a text file'), 'text/plain')
        }
        
        return self.run_test("Invalid File Upload", "POST", "applications", 400, 
                           data=application_data, files=files)

    def test_invalid_rating(self):
        """Test feedback with invalid rating"""
        feedback_data = {
            "name": "Test User",
            "email": "test@test.de",
            "subject": "Test",
            "message": "Test message",
            "rating": 10  # Invalid rating (should be 1-5)
        }
        return self.run_test("Invalid Rating", "POST", "feedback", 422, data=feedback_data)

def main():
    print("🚀 Starting Stadtwache API Tests")
    print("=" * 50)
    
    tester = StadtwacheAPITester()
    
    # Test all endpoints
    tests = [
        tester.test_root_endpoint,
        tester.test_get_news,
        tester.test_create_news,
        tester.test_create_application,
        tester.test_get_applications,
        tester.test_create_feedback,
        tester.test_get_feedback,
        tester.test_invalid_file_upload,
        tester.test_invalid_rating
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())