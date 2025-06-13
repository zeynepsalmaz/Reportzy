#!/usr/bin/env python3
"""
Test script to verify all API endpoints are working correctly.
Run this after starting the server to check endpoint functionality.
"""

import requests
import json
import os
import sys
from pathlib import Path

BASE_URL = "http://localhost:8003"

def test_endpoint(method, url, data=None, files=None, expected_status=200):
    """Test a single endpoint and return the result."""
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            if files:
                response = requests.post(url, data=data, files=files)
            else:
                response = requests.post(url, json=data)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
        
        if response.status_code == expected_status:
            print(f"✅ {method} {url} - Status: {response.status_code}")
            return True
        else:
            print(f"❌ {method} {url} - Status: {response.status_code}, Expected: {expected_status}")
            print(f"   Response: {response.text[:100]}...")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {url} - Connection Error (Is server running?)")
        return False
    except Exception as e:
        print(f"❌ {method} {url} - Error: {e}")
        return False

def main():
    """Run all endpoint tests."""
    print("🔍 Testing Reportzy API Endpoints")
    print("=" * 50)
    
    # Test basic endpoints
    test_results = []
    
    # Core endpoints
    print("\n📋 Core Endpoints:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/"))
    test_results.append(test_endpoint("GET", f"{BASE_URL}/health"))
    test_results.append(test_endpoint("GET", f"{BASE_URL}/dashboard"))
    
    # File & Data Management
    print("\n📁 File & Data Management:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/datasets"))
    
    # Analytics endpoints
    print("\n📊 Analytics:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/analytics-summary"))
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/query-history"))
    
    # Metadata endpoints
    print("\n🔍 Metadata:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/metadata"))
    
    # AI Insights endpoints
    print("\n🧠 AI Insights:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/insights"))
    
    # Export endpoints
    print("\n📤 Export:")
    test_results.append(test_endpoint("GET", f"{BASE_URL}/api/export-templates"))
    
    # Summary
    print("\n" + "=" * 50)
    passed = sum(test_results)
    total = len(test_results)
    print(f"✅ Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All endpoints are working correctly!")
        return 0
    else:
        print("⚠️  Some endpoints need attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
