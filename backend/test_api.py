from fastapi import APIRouter

router = APIRouter()

@router.get("/test-data")
async def get_test_data():
    """Test endpoint that returns sample data for API connection testing"""
    return {
        "data": [
            {
                "id": 1,
                "name": "Product A",
                "price": 19.99,
                "category": "Electronics",
                "in_stock": True,
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": 2,
                "name": "Product B", 
                "price": 29.99,
                "category": "Clothing",
                "in_stock": False,
                "created_at": "2024-01-16T14:20:00Z"
            },
            {
                "id": 3,
                "name": "Product C",
                "price": 39.99,
                "category": "Books",
                "in_stock": True,
                "created_at": "2024-01-17T09:15:00Z"
            },
            {
                "id": 4,
                "name": "Product D",
                "price": 49.99,
                "category": "Home & Garden",
                "in_stock": True,
                "created_at": "2024-01-18T16:45:00Z"
            },
            {
                "id": 5,
                "name": "Product E",
                "price": 59.99,
                "category": "Sports",
                "in_stock": False,
                "created_at": "2024-01-19T11:30:00Z"
            }
        ],
        "total": 5,
        "page": 1,
        "has_more": False
    }

@router.get("/users-data")
async def get_users_data():
    """Another test endpoint with user data"""
    return {
        "users": [
            {
                "user_id": 101,
                "username": "john_doe",
                "email": "john@example.com",
                "full_name": "John Doe",
                "registration_date": "2024-01-10",
                "status": "active",
                "subscription_type": "premium"
            },
            {
                "user_id": 102,
                "username": "jane_smith",
                "email": "jane@example.com", 
                "full_name": "Jane Smith",
                "registration_date": "2024-01-12",
                "status": "active",
                "subscription_type": "basic"
            },
            {
                "user_id": 103,
                "username": "bob_wilson",
                "email": "bob@example.com",
                "full_name": "Bob Wilson", 
                "registration_date": "2024-01-14",
                "status": "inactive",
                "subscription_type": "free"
            }
        ],
        "total_users": 3,
        "active_users": 2
    }
