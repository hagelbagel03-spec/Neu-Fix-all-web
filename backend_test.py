import requests
import sys
import json
from datetime import datetime
import io

class StadtwacheAPITester:
    def __init__(self, base_url="https://guard-apply-feedback.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if auth_required and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    # For multipart/form-data (file uploads)
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=10)
                else:
                    # For JSON data
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                if files:
                    response = requests.put(url, data=data, files=files, headers=headers, timeout=10)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

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

    # ADMIN AUTHENTICATION TESTS
    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and isinstance(response, dict) and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✅ Admin token obtained: {self.admin_token[:20]}...")
        return success, response

    def test_admin_me(self):
        """Test admin token validation"""
        return self.run_test("Admin Me", "GET", "admin/me", 200, auth_required=True)

    # PUBLIC API TESTS
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_get_homepage(self):
        """Test getting homepage content"""
        return self.run_test("Get Homepage", "GET", "homepage", 200)

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

    def test_get_latest_news(self):
        """Test getting latest news"""
        return self.run_test("Get Latest News", "GET", "news/latest", 200)

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

    # ONLINE REPORTS TESTS (NEW FUNCTIONALITY)
    def test_get_report_types(self):
        """Test getting incident types for reports"""
        success, response = self.run_test("Get Report Types", "GET", "reports/types", 200)
        if success and isinstance(response, dict):
            incident_types = response.get('incident_types', [])
            expected_count = 10  # Should have 10 incident types
            if len(incident_types) == expected_count:
                print(f"   ✅ Found all {expected_count} incident types")
                print(f"   Types: {', '.join(incident_types[:3])}...")
            else:
                print(f"   ⚠️  Expected {expected_count} types, found {len(incident_types)}")
        return success, response

    def test_create_report(self):
        """Test creating an online report"""
        report_data = {
            "incident_type": "Diebstahl",
            "description": "Test-Meldung: Fahrrad wurde vor dem Supermarkt gestohlen. Das Schloss wurde aufgebrochen.",
            "location": "Hauptstraße 123, 12345 Teststadt",
            "incident_date": "2024-12-19",
            "incident_time": "14:30",
            "reporter_name": "Max Mustermann",
            "reporter_email": "max.mustermann@test.de",
            "reporter_phone": "+49 123 456789",
            "is_witness": True,
            "witnesses_present": False,
            "witness_details": "",
            "evidence_available": True,
            "evidence_description": "Foto vom leeren Fahrradständer und aufgebrochenem Schloss",
            "additional_info": "Das Fahrrad war ein rotes Mountainbike der Marke Trek"
        }
        success, response = self.run_test("Create Report", "POST", "reports", 200, data=report_data)
        if success and isinstance(response, dict):
            report_id = response.get('id')
            status = response.get('status')
            if report_id and status == 'new':
                print(f"   ✅ Report created with ID: {report_id}")
                print(f"   Status: {status}")
                # Store for later admin tests
                self.created_report_id = report_id
            else:
                print(f"   ⚠️  Report creation issue - ID: {report_id}, Status: {status}")
        return success, response

    def test_invalid_report_data(self):
        """Test creating report with invalid data"""
        invalid_report_data = {
            "incident_type": "",  # Empty required field
            "description": "",    # Empty required field
            "location": "Test Location",
            "incident_date": "2024-12-19",
            "incident_time": "14:30",
            "reporter_name": "",  # Empty required field
            "reporter_email": "invalid-email",  # Invalid email
            "reporter_phone": "+49 123 456789"
        }
        return self.run_test("Invalid Report Data", "POST", "reports", 422, data=invalid_report_data)

    # ADMIN API TESTS
    def test_admin_get_news(self):
        """Test admin getting all news"""
        success, response = self.run_test("Admin Get All News", "GET", "admin/news", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} news items (including unpublished)")
        return success, response

    def test_admin_create_news(self):
        """Test admin creating news"""
        news_data = {
            "title": "Test Admin Nachricht",
            "content": "<p>Dies ist eine <strong>Test-Nachricht</strong> vom Admin mit HTML-Inhalt.</p>",
            "priority": "high",
            "published": True
        }
        return self.run_test("Admin Create News", "POST", "admin/news", 200, 
                           data=news_data, auth_required=True)

    def test_admin_get_applications(self):
        """Test admin getting all applications"""
        success, response = self.run_test("Admin Get Applications", "GET", "admin/applications", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} applications")
            for i, app in enumerate(response):
                if isinstance(app, dict):
                    name = app.get('name', 'Unknown')
                    status = app.get('status', 'unknown')
                    position = app.get('position', 'unknown')
                    print(f"   App {i+1}: {name} - {position} - {status}")
        return success, response

    def test_admin_get_feedback(self):
        """Test admin getting all feedback"""
        success, response = self.run_test("Admin Get Feedback", "GET", "admin/feedback", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} feedback entries")
            for i, fb in enumerate(response):
                if isinstance(fb, dict):
                    name = fb.get('name', 'Unknown')
                    rating = fb.get('rating', 0)
                    status = fb.get('status', 'unknown')
                    print(f"   Feedback {i+1}: {name} - {rating}/5 stars - {status}")
        return success, response

    def test_admin_get_homepage(self):
        """Test admin getting homepage content"""
        return self.run_test("Admin Get Homepage", "GET", "admin/homepage", 200, auth_required=True)

    def test_admin_update_homepage(self):
        """Test admin updating homepage content"""
        homepage_data = {
            "hero_title": "Test Stadtwache",
            "hero_subtitle": "Test Untertitel für die API",
            "emergency_number": "110",
            "phone_number": "+49 123 456-789",
            "email": "test@stadtwache.de",
            "show_latest_news": True
        }
        return self.run_test("Admin Update Homepage", "PUT", "admin/homepage", 200, 
                           data=homepage_data, files={}, auth_required=True)

    # ADMIN REPORTS MANAGEMENT TESTS
    def test_admin_get_reports(self):
        """Test admin getting all reports"""
        success, response = self.run_test("Admin Get Reports", "GET", "admin/reports", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} reports")
            for i, report in enumerate(response):
                if isinstance(report, dict):
                    incident_type = report.get('incident_type', 'Unknown')
                    status = report.get('status', 'unknown')
                    reporter = report.get('reporter_name', 'Unknown')
                    print(f"   Report {i+1}: {incident_type} - {reporter} - {status}")
        return success, response

    def test_admin_update_report_status(self):
        """Test admin updating report status"""
        if not hasattr(self, 'created_report_id') or not self.created_report_id:
            print("   ⚠️  No report ID available for status update test")
            return False, {}
        
        # Test updating to 'in_progress'
        status_data = {"status": "in_progress"}
        success, response = self.run_test(
            "Admin Update Report Status", 
            "PUT", 
            f"admin/reports/{self.created_report_id}/status", 
            200, 
            data=status_data, 
            files={},  # Use form data
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            new_status = response.get('status')
            if new_status == 'in_progress':
                print(f"   ✅ Status updated to: {new_status}")
            else:
                print(f"   ⚠️  Status update issue - Expected 'in_progress', got: {new_status}")
        
        return success, response

    def test_admin_get_report_stats(self):
        """Test admin getting report statistics"""
        success, response = self.run_test("Admin Get Report Stats", "GET", "admin/reports/stats", 200, auth_required=True)
        if success and isinstance(response, dict):
            total = response.get('total_reports', 0)
            new = response.get('new_reports', 0)
            urgent = response.get('urgent_reports', 0)
            print(f"   Stats - Total: {total}, New: {new}, Urgent: {urgent}")
        return success, response

    # ERROR HANDLING TESTS
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

    def test_unauthorized_admin_access(self):
        """Test accessing admin endpoints without token"""
        return self.run_test("Unauthorized Admin Access", "GET", "admin/news", 401)

    def test_invalid_admin_login(self):
        """Test admin login with wrong credentials"""
        login_data = {
            "username": "admin",
            "password": "wrongpassword"
        }
        return self.run_test("Invalid Admin Login", "POST", "admin/login", 401, data=login_data)

def main():
    print("🚀 Starting Comprehensive Stadtwache API Tests")
    print("=" * 60)
    
    tester = StadtwacheAPITester()
    
    # Test sequence - order matters for some tests
    print("\n📋 PHASE 1: Authentication Tests")
    print("-" * 40)
    auth_tests = [
        tester.test_invalid_admin_login,
        tester.test_admin_login,
        tester.test_admin_me,
        tester.test_unauthorized_admin_access,
    ]
    
    print("\n📋 PHASE 2: Public API Tests")
    print("-" * 40)
    public_tests = [
        tester.test_root_endpoint,
        tester.test_get_homepage,
        tester.test_get_news,
        tester.test_get_latest_news,
        tester.test_create_application,
        tester.test_create_feedback,
    ]
    
    print("\n📋 PHASE 3: Admin API Tests")
    print("-" * 40)
    admin_tests = [
        tester.test_admin_get_news,
        tester.test_admin_create_news,
        tester.test_admin_get_applications,
        tester.test_admin_get_feedback,
        tester.test_admin_get_homepage,
        tester.test_admin_update_homepage,
    ]
    
    print("\n📋 PHASE 4: Error Handling Tests")
    print("-" * 40)
    error_tests = [
        tester.test_invalid_file_upload,
        tester.test_invalid_rating,
    ]
    
    all_tests = auth_tests + public_tests + admin_tests + error_tests
    
    for test in all_tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        failed_count = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_count} tests failed")
        
        # Provide summary of what works and what doesn't
        success_rate = (tester.tests_passed / tester.tests_run) * 100
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("✅ Most functionality is working - minor issues to fix")
        elif success_rate >= 60:
            print("⚠️  Some major issues need attention")
        else:
            print("❌ Significant problems - major fixes needed")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())