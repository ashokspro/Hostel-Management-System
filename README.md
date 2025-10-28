# 🏫 Hostel Management System

A modern Flask-based web application for managing hostel operations efficiently with role-based access for students, wardens, and security staff. The system enables smooth gate pass requests, approval tracking, and security check-ins/outs, all powered by JWT authentication and an SQLite database.

![Hostel Management System](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)


## ✨ Features

### 🧑‍🎓 Student Features
- **Gate Pass Request System** – Submit gate pass requests with reason, destination, and date/time details
- **Dashboard with Statistics** – View total, approved, pending, and rejected gate passes
- **PDF Download** – Download approved gate passes with QR codes
- **Profile Management** – Update personal and guardian information
- **Real-time Status Tracking** – Monitor gate pass status (Pending/Approved/Rejected)

### 🧑‍🏫 Warden Features
- **Approval Dashboard** – Review and manage pending gate pass requests
- **Student Management** – Add, edit, activate/deactivate student accounts
- **Search & Filter** – Quickly find students and gate passes
- **Analytics Dashboard** – View pending requests, today's approvals, and currently out students
- **Remarks System** – Add approval/rejection remarks

### 🛡️ Security Features
- **Entry/Exit Logging** – Mark students as In/Out with approved gate passes
- **QR Code Verification** – Scan gate pass QR codes for validation
- **Currently Out Dashboard** – View all students currently outside the hostel
- **Real-time Updates** – Live tracking of student movements

### 🔐 Authentication & Security
- **JWT-Based Authentication** – Secure token-based login system
- **Role-Based Access Control** – Three user types (Student, Warden, Security)
- **Password Hashing** – Secure password storage with bcrypt
- **Session Management** – Token expiration and refresh mechanisms

### 📄 Gate Pass PDF Generation
- **Modern Design** – Clean, professional single-page PDF layout
- **QR Code Integration** – Embedded QR codes for verification
- **12-Hour Time Format** – User-friendly date and time display
- **Complete Information** – Student, guardian, and authorization details

## 🏗️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript , Bootstrap |
| **Backend** | Python 3.8+, Flask 3.0 |
| **Database** | SQLite with SQLAlchemy ORM |
| **Authentication** | JWT (Flask-JWT-Extended) |
| **PDF Generation** | FPDF2, QRCode |
| **Tools** | Git, GitHub, PyCharm/VS Code |

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/hostel-management-system.git
cd hostel-management-system
```

### 2. Create a Virtual Environment
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```

### 5. Access the Application
Open your browser and navigate to:
👉 **http://127.0.0.1:5000**

## 👥 Default User Roles

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| 🧑‍🎓 **Student** | S101 | password123 | Can request gate passes |
| 🧑‍🏫 **Warden** | W001 | warden123 | Can approve/reject passes |
| 🛡️ **Security** | SEC001 | security123 | Can log entry/exit |



## 📊 Database Schema

### Users Table
- `id` (PK) - User ID
- `name` - Full name
- `email` - Email address
- `phone` - Contact number
- `password` - Hashed password
- `user_type` - Role (student/warden/security)
- `room` - Room number (students only)
- `course` - Course name (students only)
- `year` - Academic year (students only)
- `guardian_name` - Guardian name (students only)
- `guardian_phone` - Guardian contact (students only)
- `is_active` - Account status
- `created_at` - Registration timestamp

### Gate Passes Table
- `pass_id` (PK) - Unique pass identifier
- `student_id` (FK) - Student user ID
- `reason` - Purpose of leave
- `going_place` - Destination
- `from_date` - Departure date
- `return_date` - Return date
- `out_time` - Departure time
- `return_time` - Expected return time
- `status` - Pending/Approved/Rejected
- `approved_by_id` (FK) - Warden user ID
- `approved_at` - Approval timestamp
- `remarks` - Approval/rejection remarks
- `exit_status` - In/Out status
- `actual_out_time` - Actual exit time
- `actual_return_time` - Actual return time
- `created_at` - Request timestamp

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login              # User login
POST   /api/auth/register           # User registration
```

### Gate Pass Management
```
GET    /api/gatepass/student        # Get student's gate passes
POST   /api/gatepass/create         # Create new gate pass
GET    /api/gatepass/pending        # Get pending requests (Warden)
POST   /api/gatepass/approve/:id    # Approve gate pass
POST   /api/gatepass/reject/:id     # Reject gate pass
GET    /api/gatepass/download/:id   # Download gate pass PDF
```

### Student Management
```
GET    /api/admin/students          # Get all students
POST   /api/admin/students          # Add new student
PUT    /api/admin/students/:id      # Update student
DELETE /api/admin/students/:id      # Delete student
POST   /api/admin/students/:id/activate    # Activate student
POST   /api/admin/students/:id/deactivate  # Deactivate student
```

### Security Operations
```
POST   /api/security/mark-exit/:id  # Mark student exit
POST   /api/security/mark-entry/:id # Mark student entry
```

### User Profile
```
GET    /api/user/profile            # Get user profile
PUT    /api/user/profile            # Update profile
GET    /api/user/dashboard          # Get dashboard stats
```

## 🎨 Screenshots

### Student Dashboard
![Student Dashboard](screenshots/student-dashboard.png)
*Modern interface with gate pass request form and history*

### Warden Dashboard
![Warden Dashboard](screenshots/warden-dashboard.png)
*Comprehensive approval system with search and filtering*

### Security Dashboard
![Security Dashboard](screenshots/security-dashboard.png)
*Real-time entry/exit logging with currently out students*

### Gate Pass PDF
![Gate Pass PDF](screenshots/gate-pass-pdf.png)
*Professional PDF with QR code verification*

## 🧠 Future Enhancements

- [ ] 📧 **Email Notifications** – Automated emails for gate pass status updates
- [ ] 📱 **Mobile App** – Native Android/iOS applications
- [ ] 📊 **Advanced Analytics** – Charts and reports for admin dashboard
- [ ] ☁️ **Cloud Database** – Migration to PostgreSQL or MongoDB
- [ ] 🪪 **Biometric Integration** – Fingerprint/face recognition for entry/exit
- [ ] 🔔 **Push Notifications** – Real-time alerts for important updates
- [ ] 📅 **Calendar Integration** – Google Calendar sync for gate passes
- [ ] 💬 **Chat System** – In-app messaging between users
- [ ] 🌐 **Multi-language Support** – Internationalization (i18n)
- [ ] 🔍 **Advanced Search** – Full-text search with filters
- [ ] 📤 **Bulk Operations** – Import/export students via CSV/Excel
- [ ] 🔐 **Two-Factor Authentication** – Enhanced security with 2FA

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

1. **Fork the repository**
2. **Create a new branch**
```bash
   git checkout -b feature/your-feature-name
```
3. **Make your changes**
4. **Commit your changes**
```bash
   git commit -m "Add: your feature description"
```
5. **Push to your fork**
```bash
   git push origin feature/your-feature-name
```
6. **Open a Pull Request**

### Contribution Guidelines
- Follow PEP 8 style guide for Python code
- Write clear commit messages
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly

## 🐛 Known Issues

- [ ] QR code scanning not implemented in mobile view
- [ ] Large PDF files may take time to generate
- [ ] Limited to SQLite database (single user access)

## 📝 Changelog

### Version 1.0.0 
- ✨ Initial release
- 🔐 JWT authentication system
- 🪪 Gate pass management
- 👥 User role management
- 📄 PDF generation with QR codes
- 🎨 Modern UI with Bootstrap 5

```

```

## 💬 Contact & Support

### 👨‍💻 Developer
**Ashokkumar S**  
📍 Tamil Nadu, India  
📧 ashokshanmugam2006@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/ashokkumar0306/) | [GitHub](https://github.com/ashokspro)

### 🆘 Support
If you encounter any issues or have questions:
- 📝 Open an [Issue](https://github.com/ashokspro/hostel-management-system/issues)
- 💬 Start a [Discussion](https://github.com/ashokspro/hostel-management-system/discussions)
- 📧 Email me directly [Mail](mailto:ashokshanmugam2006@gmail.com)

## ⭐ Show Your Support

If you found this project helpful, please give it a ⭐ on GitHub!

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/ashokspro">Ashokkumar S</a>
</p>

<p align="center">
  <sub>Built with Flask • Powered by Python • Designed for Efficiency</sub>
</p>
