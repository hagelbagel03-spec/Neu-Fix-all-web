import requests
import sys
import json
from datetime import datetime

class ComprehensiveCMSTest:
    def __init__(self, base_url="https://guard-apply-feedback.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.missing_features = []
        self.working_features = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
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
                headers['Content-Type'] = 'application/json'
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.working_features.append(name)
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                if response.status_code == 404:
                    self.missing_features.append(name)

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.missing_features.append(name)
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, data=login_data)
        if success and isinstance(response, dict) and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✅ Admin token obtained")
        return success, response

    # Test Services Management APIs
    def test_services_apis(self):
        """Test all Services management APIs"""
        print("\n🏢 TESTING SERVICES MANAGEMENT")
        print("-" * 50)
        
        # Test public services endpoint
        self.run_test("Get Public Services", "GET", "services", 200)
        
        # Test admin services endpoints
        self.run_test("Admin Get Services", "GET", "admin/services", 200, auth_required=True)
        
        # Test create service
        service_data = {
            "title": "Test Service",
            "description": "Test service description",
            "icon": "Shield",
            "order": 0,
            "active": True
        }
        success, response = self.run_test("Admin Create Service", "POST", "admin/services", 200, 
                                        data=service_data, auth_required=True)
        
        service_id = None
        if success and isinstance(response, dict):
            service_id = response.get('id')
        
        # Test update service
        if service_id:
            update_data = {"title": "Updated Test Service"}
            self.run_test("Admin Update Service", "PUT", f"admin/services/{service_id}", 200, 
                         data=update_data, auth_required=True)
            
            # Test delete service
            self.run_test("Admin Delete Service", "DELETE", f"admin/services/{service_id}", 200, 
                         auth_required=True)

    # Test Team Management APIs
    def test_team_apis(self):
        """Test all Team management APIs"""
        print("\n👥 TESTING TEAM MANAGEMENT")
        print("-" * 50)
        
        # Test public team endpoint
        self.run_test("Get Public Team", "GET", "team", 200)
        
        # Test admin team endpoints
        self.run_test("Admin Get Team", "GET", "admin/team", 200, auth_required=True)
        
        # Test create team member
        member_data = {
            "name": "Test Member",
            "position": "Test Position",
            "description": "Test description",
            "email": "test@example.com",
            "phone": "+49 123 456789",
            "order": 0,
            "active": True
        }
        success, response = self.run_test("Admin Create Team Member", "POST", "admin/team", 200, 
                                        data=member_data, auth_required=True)
        
        member_id = None
        if success and isinstance(response, dict):
            member_id = response.get('id')
        
        # Test update team member
        if member_id:
            update_data = {"name": "Updated Test Member"}
            self.run_test("Admin Update Team Member", "PUT", f"admin/team/{member_id}", 200, 
                         data=update_data, auth_required=True)
            
            # Test delete team member
            self.run_test("Admin Delete Team Member", "DELETE", f"admin/team/{member_id}", 200, 
                         auth_required=True)

    # Test Statistics Management APIs
    def test_statistics_apis(self):
        """Test all Statistics management APIs"""
        print("\n📊 TESTING STATISTICS MANAGEMENT")
        print("-" * 50)
        
        # Test public statistics endpoint
        self.run_test("Get Public Statistics", "GET", "statistics", 200)
        
        # Test admin statistics endpoints
        self.run_test("Admin Get Statistics", "GET", "admin/statistics", 200, auth_required=True)
        
        # Test create statistic
        stat_data = {
            "title": "Test Statistic",
            "value": "100+",
            "description": "Test statistic description",
            "icon": "TrendingUp",
            "color": "blue",
            "order": 0,
            "active": True
        }
        success, response = self.run_test("Admin Create Statistic", "POST", "admin/statistics", 200, 
                                        data=stat_data, auth_required=True)
        
        stat_id = None
        if success and isinstance(response, dict):
            stat_id = response.get('id')
        
        # Test update statistic
        if stat_id:
            update_data = {"title": "Updated Test Statistic"}
            self.run_test("Admin Update Statistic", "PUT", f"admin/statistics/{stat_id}", 200, 
                         data=update_data, auth_required=True)
            
            # Test delete statistic
            self.run_test("Admin Delete Statistic", "DELETE", f"admin/statistics/{stat_id}", 200, 
                         auth_required=True)

    # Test Database Management APIs
    def test_database_apis(self):
        """Test Database management APIs"""
        print("\n🗄️ TESTING DATABASE MANAGEMENT")
        print("-" * 50)
        
        # Test get collections
        self.run_test("Get Database Collections", "GET", "admin/database/collections", 200, auth_required=True)
        
        # Test database stats
        self.run_test("Get Database Stats", "GET", "admin/database/stats", 200, auth_required=True)
        
        # Test database query
        query_data = {
            "collection": "news",
            "query": {},
            "limit": 10
        }
        self.run_test("Database Query", "POST", "admin/database/query", 200, 
                     data=query_data, auth_required=True)

    # Test Navigation Management APIs
    def test_navigation_apis(self):
        """Test Navigation management APIs"""
        print("\n🧭 TESTING NAVIGATION MANAGEMENT")
        print("-" * 50)
        
        # Test public navigation endpoint
        self.run_test("Get Public Navigation", "GET", "navigation", 200)
        
        # Test admin navigation endpoints
        self.run_test("Admin Get Navigation", "GET", "admin/navigation", 200, auth_required=True)
        
        # Test update navigation
        nav_data = {
            "items": [
                {
                    "label": "Startseite",
                    "section": "home",
                    "order": 0,
                    "active": True
                },
                {
                    "label": "Aktuelles",
                    "section": "news",
                    "order": 1,
                    "active": True
                }
            ]
        }
        self.run_test("Admin Update Navigation", "PUT", "admin/navigation", 200, 
                     data=nav_data, auth_required=True)

    # Test Enhanced Homepage Features
    def test_enhanced_homepage(self):
        """Test enhanced homepage features"""
        print("\n🏠 TESTING ENHANCED HOMEPAGE FEATURES")
        print("-" * 50)
        
        # Test homepage with all new fields
        success, response = self.run_test("Get Homepage Content", "GET", "homepage", 200)
        
        if success and isinstance(response, dict):
            required_fields = [
                'show_services', 'show_team', 'show_statistics', 
                'footer_text', 'hero_image'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ⚠️ Missing homepage fields: {missing_fields}")
            else:
                print(f"   ✅ All enhanced homepage fields present")

    def test_featured_news_endpoint(self):
        """Test featured news endpoint for homepage"""
        print("\n📰 TESTING FEATURED NEWS")
        print("-" * 50)
        
        self.run_test("Get Featured News", "GET", "news/featured", 200)

    def run_all_tests(self):
        """Run all comprehensive CMS tests"""
        print("🚀 Starting Comprehensive CMS Feature Tests")
        print("=" * 60)
        
        # Login first
        if not self.test_admin_login()[0]:
            print("❌ Cannot proceed without admin login")
            return 1
        
        # Test all CMS features
        self.test_services_apis()
        self.test_team_apis()
        self.test_statistics_apis()
        self.test_database_apis()
        self.test_navigation_apis()
        self.test_enhanced_homepage()
        self.test_featured_news_endpoint()
        
        # Print comprehensive results
        print("\n" + "=" * 60)
        print(f"📊 Final Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        print(f"\n✅ WORKING FEATURES ({len(self.working_features)}):")
        for feature in self.working_features:
            print(f"   • {feature}")
        
        if self.missing_features:
            print(f"\n❌ MISSING/BROKEN FEATURES ({len(self.missing_features)}):")
            for feature in self.missing_features:
                print(f"   • {feature}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        # Categorize the implementation status
        if success_rate >= 90:
            print("🎉 Excellent! CMS is nearly complete")
            return 0
        elif success_rate >= 70:
            print("✅ Good progress! Some features need implementation")
            return 0
        elif success_rate >= 50:
            print("⚠️ Partial implementation - significant work needed")
            return 1
        else:
            print("❌ Major implementation gaps - extensive work required")
            return 1

def main():
    tester = ComprehensiveCMSTest()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())