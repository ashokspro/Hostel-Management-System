import os

structure = [
    "backend/app/__init__.py",
    "backend/app/models/__init__.py",
    "backend/app/models/user.py",
    "backend/app/models/gatepass.py",
    "backend/app/models/notification.py",
    "backend/app/routes/__init__.py",
    "backend/app/routes/auth.py",
    "backend/app/routes/gatepass.py",
    "backend/app/routes/user.py",
    "backend/app/routes/admin.py",
    "backend/app/utils/__init__.py",
    "backend/app/utils/decorators.py",
    "backend/app/utils/helpers.py",
    "backend/app/config.py",
    "backend/migrations/.gitkeep",
    "backend/requirements.txt",
    "backend/run.py",
    "backend/README.md",
]

for path in structure:
    # create directories if they don't exist
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # create empty file if not exists
    if not os.path.exists(path):
        with open(path, "w") as f:
            pass

print("✅ Project structure created successfully!")
