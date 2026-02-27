import jwt, bcrypt
import random
from datetime import datetime, timedelta, timezone
from utils.config import JWT_SECRET_KEY, JWT_EXPIRY_HOURS
from services.db_service import user_collection, chat_collection, report_collection, db
from bson import ObjectId

# Import the proper OTP service functions
from services.otp_service import create_and_send_otp as otp_create_and_send

# Import transactional email helpers
from services.email_service import (
    send_welcome_email,
    send_account_deleted_email,
    send_password_changed_email,
)


def signup_user(email, password, name):
    if user_collection.find_one({"email": email}):
        raise Exception("User already exists")

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    user = {
        "email": email,
        "password": hashed,
        "name": name,
        "profilePicture": "",
        "auth_providers": ["local"],
        "created_at": datetime.utcnow(),
        "last_login": None
    }

    result = user_collection.insert_one(user)
    token = generate_token(str(result.inserted_id))

    # Send welcome email (non-blocking — log on failure)
    try:
        send_welcome_email(to=email, name=name)
    except Exception as e:
        print(f"⚠️ Welcome email failed for {email}: {e}")

    return {
        "user_id": str(result.inserted_id),
        "email": email,
        "name": name,
        "profilePicture": "",
        "auth_providers": ["local"],
        "token": token
    }


def login_user(email, password):
    user = user_collection.find_one({"email": email})
    if not user:
        raise Exception("User not registered")
    
    # Check if user has a password field (regular signup or Google user who created password)
    if "password" not in user or not user["password"]:
        # User might be a Google-only user who hasn't created a password yet
        auth_providers = user.get("auth_providers", [])
        if "google" in auth_providers and "local" not in auth_providers:
            raise Exception("Please sign in with Google or create a password first")
        else:
            raise Exception("No password set for this account")
    
    # Verify password
    if not bcrypt.checkpw(password.encode(), user["password"]):
        raise Exception("Invalid credentials")

    # Update last login timestamp
    user_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    token = generate_token(str(user["_id"]))
    return {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "profilePicture": user.get("profilePicture", ""),
        "token": token
    }


def generate_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def update_user_profile(user_id, name, email, profile_picture=None):
    """Update user's name, email, and profile picture"""
    try:
        # Check if email is already taken by another user
        existing_user = user_collection.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
        if existing_user:
            raise Exception("Email already in use by another account")

        # Prepare update data
        update_data = {
            "name": name,
            "email": email
        }
        
        # Add profile picture if provided
        if profile_picture is not None:
            update_data["profilePicture"] = profile_picture

        # Update user profile
        result = user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0 and result.matched_count == 0:
            raise Exception("User not found")

        return {
            "success": True,
            "message": "Profile updated successfully",
            "name": name,
            "email": email,
            "profilePicture": profile_picture if profile_picture is not None else ""
        }
    except Exception as e:
        raise Exception(str(e))


def change_user_password(user_id, current_password, new_password):
    """Change user's password"""
    try:
        # Get user from database
        user = user_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise Exception("User not found")

        # Verify current password
        if not bcrypt.checkpw(current_password.encode(), user["password"]):
            raise Exception("Current password is incorrect")

        # Hash new password
        hashed_new_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())

        # Update password in database
        result = user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new_password}}
        )

        if result.modified_count == 0:
            raise Exception("Failed to update password")

        # Send password-changed confirmation email (non-blocking)
        try:
            send_password_changed_email(to=user["email"], name=user.get("name", "User"))
        except Exception as e:
            print(f"⚠️ Password changed email failed for {user['email']}: {e}")

        return {
            "success": True,
            "message": "Password changed successfully"
        }
    except Exception as e:
        raise Exception(str(e))


def delete_user_account(user_id):
    """Delete user account and all associated data (chat history and reports)"""
    try:
        # Verify user exists
        user = user_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise Exception("User not found")

        # Delete all chat history for this user
        chat_delete_result = chat_collection.delete_many({"user_id": user_id})
        print(f"✓ Deleted {chat_delete_result.deleted_count} chat records for user: {user_id}")

        # Delete all farming reports for this user
        report_delete_result = report_collection.delete_many({"user_id": user_id})
        print(f"✓ Deleted {report_delete_result.deleted_count} report records for user: {user_id}")

        # Delete the user account
        user_delete_result = user_collection.delete_one({"_id": ObjectId(user_id)})
        if user_delete_result.deleted_count == 0:
            raise Exception("Failed to delete user account")

        print(f"✓ User account deleted successfully: {user_id}")

        # Send goodbye email (non-blocking — account is already gone)
        try:
            send_account_deleted_email(to=user["email"], name=user.get("name", "User"))
        except Exception as e:
            print(f"⚠️ Account deleted email failed for {user['email']}: {e}")

        return {
            "success": True,
            "message": "Account and all associated data deleted successfully",
            "deleted": {
                "chats": chat_delete_result.deleted_count,
                "reports": report_delete_result.deleted_count
            }
        }
    except Exception as e:
        raise Exception(str(e))


def send_otp_email(email):
    """Generate and send OTP to user's email"""
    try:
        # Check if user exists
        user = user_collection.find_one({"email": email})
        if not user:
            raise Exception("No account found with this email")
        
        # Use the proper database-backed OTP service
        result = otp_create_and_send(email, "password_reset")
        
        return {
            "success": True,
            "message": "OTP sent successfully to your email",
            "email": email,
            "otp_id": result["otp_id"],
            "expires_at": result["expires_at"].isoformat()
        }
    except Exception as e:
        raise Exception(str(e))


def verify_otp_code(email, otp):
    """Verify OTP code"""
    try:
        print(f"🔍 Verifying OTP for email: {email}")
        
        # Find OTP in database
        record = db.otp_verifications.find_one({
            "email": email,
            "otp": otp,
            "verified": False
        })

        if not record:
            print(f"❌ No matching OTP found for {email}")
            raise Exception("Invalid OTP. Please try again.")

        # Check if OTP has expired
        if record["expires_at"] < datetime.utcnow():
            print(f"⏰ OTP expired for {email}")
            raise Exception("OTP has expired. Please request a new one.")

        # Mark OTP as verified
        db.otp_verifications.update_one(
            {"_id": record["_id"]},
            {"$set": {"verified": True}}
        )
        
        print(f"✅ OTP verified successfully for {email}")
        
        return {
            "success": True,
            "message": "OTP verified successfully",
            "email": email
        }
    except Exception as e:
        raise Exception(str(e))


def sync_firebase_user_with_mongodb(firebase_user_info):
    """
    Sync Firebase user with MongoDB users collection
    
    Args:
        firebase_user_info (dict): User info from Firebase (firebase_uid, email, name, picture, provider)
        
    Returns:
        dict: User data with token
    """
    firebase_uid = firebase_user_info["firebase_uid"]
    email = firebase_user_info["email"]
    name = firebase_user_info.get("name", "")
    picture = firebase_user_info.get("picture", "")
    provider = firebase_user_info["provider"]
    
    # First check if user already exists with this firebase_uid
    user = user_collection.find_one({"firebase_uid": firebase_uid})
    
    if not user:
        # Check if user exists with this email (but different firebase_uid or no firebase_uid)
        existing_user_with_email = user_collection.find_one({"email": email})
        
        if existing_user_with_email:
            # User exists with email/password — auto-link the Google account and log them in
            print(f"🔗 Linking Google account to existing email/password account for: {email}")
            user_collection.update_one(
                {"_id": existing_user_with_email["_id"]},
                {
                    "$set": {
                        "firebase_uid": firebase_uid,
                        "last_login": datetime.utcnow()
                    },
                    "$addToSet": {"auth_providers": provider}
                }
            )
            user = user_collection.find_one({"_id": existing_user_with_email["_id"]})
            user_id = str(user["_id"])
            token = generate_token(user_id)
            return {
                "user_id": user_id,
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "profilePicture": user.get("profilePicture", ""),
                "auth_providers": user.get("auth_providers", []),
                "token": token
            }

        # User doesn't exist, create new user
        print(f"🆕 Creating new user for Firebase UID: {firebase_uid}")
        
        user_data = {
            "firebase_uid": firebase_uid,
            "email": email,
            "name": name,
            "profilePicture": "",
            "auth_providers": [provider],
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow()
        }
        
        result = user_collection.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        print(f"✅ User created successfully with ID: {user_id}")

        # Send welcome email to new Google user
        try:
            send_welcome_email(to=email, name=name or "User")
            print(f"📧 Welcome email sent to {email}")
        except Exception as email_err:
            print(f"⚠️ Welcome email failed: {email_err}")
        
        # Fetch the newly created user document
        user = user_collection.find_one({"_id": result.inserted_id})
    else:
        # User exists, update last login and add provider if new
        user_id = str(user["_id"])
        
        print(f"👤 User found with Firebase UID: {firebase_uid}")
        
        update_data = {
            "$set": {
                "last_login": datetime.utcnow()
            },
            "$addToSet": {"auth_providers": provider}
        }
        
        user_collection.update_one(
            {"firebase_uid": firebase_uid},
            update_data
        )
        
        # Get updated user data
        user = user_collection.find_one({"_id": ObjectId(user_id)})
    
    # Generate JWT token for our backend
    token = generate_token(user_id)
    
    return {
        "user_id": user_id,
        "firebase_uid": firebase_uid,
        "email": email,
        "name": user.get("name", name),
        "profilePicture": user.get("profilePicture", ""),
        "auth_providers": user.get("auth_providers", [provider]),
        "token": token
    }


def create_password_for_google_user(user_id, new_password):
    """
    Create/set password for a Google user (allows them to login with password later)
    This is handled by Firebase linkWithCredential on frontend,
    but we track it in MongoDB by adding 'local' to auth_providers
    
    Args:
        user_id (str): MongoDB user ID
        new_password (str): New password to set
        
    Returns:
        dict: Success message
    """
    print(f"🔐 Creating password for user_id: {user_id}")
    
    user = user_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        print(f"❌ User not found: {user_id}")
        raise Exception("User not found")
    
    print(f"👤 User found: {user.get('email')}, auth_providers: {user.get('auth_providers', [])}")
    
    # Check if user has Google as auth provider
    if "google" not in user.get("auth_providers", []):
        print(f"❌ User is not a Google user")
        raise Exception("This feature is only for Google sign-in users")
    
    # Hash the password
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())
    print(f"✅ Password hashed successfully")
    
    # Update user with password and add 'local' to auth_providers
    result = user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {"password": hashed},
            "$addToSet": {"auth_providers": "local"}
        }
    )
    
    print(f"✅ Database update - Modified count: {result.modified_count}")
    
    # Verify the update
    updated_user = user_collection.find_one({"_id": ObjectId(user_id)})
    print(f"✅ Verified - Has password: {'password' in updated_user}, auth_providers: {updated_user.get('auth_providers', [])}")
    
    return {
        "success": True,
        "message": "Password created successfully. You can now login with email and password.",
        "auth_providers": ["google", "local"]
    }
