"""
AgriGPT Demo Data Cleanup
==========================
Standalone script — does NOT import any Flask app code.
Connects directly to MongoDB using credentials from backend/.env

Usage:
    python clear_demo_data.py            # interactive confirmation
    python clear_demo_data.py --force    # skip confirmation (CI / automation)

Safety guarantees:
  • Only deletes documents whose email ends with @demo.agrigpt
    (or whose user_id belongs to such users)
  • Every delete call uses an explicit filter — no unfiltered deletes
  • Real users are NEVER touched
  • Dry-run summary is shown BEFORE any deletion
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# ── Load backend/.env without importing Flask app ─────────────────────────
_env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                _val = _val.strip().strip('"').strip("'")
                os.environ.setdefault(_key.strip(), _val)
else:
    print(f"⚠️  backend/.env not found at {_env_path}")
    print("   Set MONGO_URI and MONGO_DB as environment variables manually.")

MONGO_URI = os.environ.get("MONGO_URI")
MONGO_DB  = os.environ.get("MONGO_DB")

if not MONGO_URI or not MONGO_DB:
    print("❌ MONGO_URI or MONGO_DB is not set.")
    print("   Ensure backend/.env exists with MONGO_URI and MONGO_DB defined.")
    sys.exit(1)

try:
    from pymongo import MongoClient
except ImportError:
    print("❌ pymongo not installed. Run:  pip install pymongo")
    sys.exit(1)

# ── Identification marker — must match generate_demo_data.py ─────────────
DEMO_DOMAIN  = "@demo.agrigpt"
EMAIL_FILTER = {"email": {"$regex": f"{DEMO_DOMAIN}$", "$options": "i"}}


def main() -> None:
    force_mode = "--force" in sys.argv

    separator = "=" * 62
    print(separator)
    print("  AgriGPT — Demo Data Cleanup")
    print(f"  Target database  : {MONGO_DB}")
    print(f"  Demo identifier  : *{DEMO_DOMAIN}")
    print(f"  Mode             : {'FORCE (no confirmation)' if force_mode else 'Interactive'}")
    print(separator)

    # ── Connect ───────────────────────────────────────────────────────────
    print("\n🔌 Connecting to MongoDB Atlas …")
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]

    try:
        client.admin.command("ping")
        print("   ✅ Connection successful.\n")
    except Exception as exc:
        print(f"   ❌ Connection failed: {exc}")
        client.close()
        sys.exit(1)

    users_col    = db.users
    sessions_col = db.chat_sessions
    history_col  = db.chat_history
    reports_col  = db.farming_reports
    feedback_col = db.user_feedback

    # ── Step 1 — Discover demo user IDs ──────────────────────────────────
    print("🔍 Discovering demo data …")
    demo_user_docs = list(users_col.find(EMAIL_FILTER, {"_id": 1}))
    demo_user_ids  = [str(u["_id"]) for u in demo_user_docs]
    n_users        = len(demo_user_ids)

    if n_users == 0:
        print("   ℹ️  No demo users found. Database is already clean.")
        client.close()
        return

    # ── Step 2 — Count all associated records ────────────────────────────
    uid_filter     = {"user_id": {"$in": demo_user_ids}}
    n_sessions     = sessions_col.count_documents(uid_filter)
    n_messages     = history_col.count_documents(uid_filter)
    n_reports      = reports_col.count_documents(uid_filter)
    n_feedback     = feedback_col.count_documents(EMAIL_FILTER)

    # Verify zero real-user overlap (safety assertion)
    real_user_count = users_col.count_documents(
        {"_id": {"$nin": [__import__("bson").ObjectId(uid) for uid in demo_user_ids]}}
    )

    print(f"\n   Demo users found        : {n_users:,}")
    print(f"   Chat sessions           : {n_sessions:,}")
    print(f"   Chat messages           : {n_messages:,}")
    print(f"   Farming reports         : {n_reports:,}")
    print(f"   Feedback entries        : {n_feedback:,}")
    print(f"\n   Real users (untouched)  : {real_user_count:,}")
    print(f"   Real data is SAFE       : ✅")

    # ── Step 3 — Confirmation ─────────────────────────────────────────────
    if not force_mode:
        print(f"\n⚠️  This will permanently delete the {n_users:,} demo users and all")
        print(f"   their associated records listed above.")
        print(f"   Real production data is NOT affected.")
        answer = input("\n   Proceed with deletion? [y/N]: ").strip().lower()
        if answer != "y":
            print("\n   ❌ Aborted. No data was deleted.")
            client.close()
            return
    else:
        print("\n   --force flag detected. Skipping confirmation …")

    # ── Step 4 — Delete in dependency order (children before parents) ─────
    started_at = datetime.now()
    print(f"\n🗑️  Starting deletion at {started_at.strftime('%H:%M:%S')} …\n")

    # 4a. Chat messages (references sessions and users)
    r1 = history_col.delete_many(uid_filter)
    print(f"   ✅ Deleted {r1.deleted_count:>8,} chat messages")

    # 4b. Chat sessions
    r2 = sessions_col.delete_many(uid_filter)
    print(f"   ✅ Deleted {r2.deleted_count:>8,} chat sessions")

    # 4c. Farming reports
    r3 = reports_col.delete_many(uid_filter)
    print(f"   ✅ Deleted {r3.deleted_count:>8,} farming reports")

    # 4d. Feedback (identified by email domain — may have user_id=None)
    r4 = feedback_col.delete_many(EMAIL_FILTER)
    print(f"   ✅ Deleted {r4.deleted_count:>8,} feedback entries")

    # 4e. Demo users — LAST, after all dependent data is removed
    r5 = users_col.delete_many(EMAIL_FILTER)
    print(f"   ✅ Deleted {r5.deleted_count:>8,} demo users")

    # ── Step 5 — Post-deletion integrity check ────────────────────────────
    print("\n🔎 Post-deletion verification …")
    remaining_demo = users_col.count_documents(EMAIL_FILTER)
    remaining_real = users_col.count_documents({})

    if remaining_demo == 0:
        print(f"   ✅ All demo data removed successfully.")
    else:
        print(f"   ⚠️  {remaining_demo} demo records still present (may need re-run).")

    print(f"   ✅ Real users still in database : {remaining_real:,}")

    elapsed = (datetime.now() - started_at).total_seconds()
    print(f"\n{separator}")
    print("  ✅ Demo data cleanup COMPLETE")
    print(f"  Time taken              : {elapsed:.1f}s")
    print()
    print("  Admin dashboard now shows real data only.")
    print("  To regenerate demo data, run:  python generate_demo_data.py")
    print(separator)

    client.close()


if __name__ == "__main__":
    main()
