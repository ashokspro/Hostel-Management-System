import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

const Student = () => {
  const [gatepasses, setGatepasses] = useState([]);

  useEffect(() => {
    // Fetch gate pass data from backend
    fetch("/api/gatepass/student") // Replace with your actual API
      .then((res) => res.json())
      .then((data) => setGatepasses(data))
      .catch((err) => console.error(err));
  }, []);

  const generateQRCodeData = (gatepass) => {
    return `Gate Pass\nName: ${gatepass.studentName}\nRegister: ${gatepass.registerNumber}\nOut: ${gatepass.outTime}\nIn: ${gatepass.inTime}\nReason: ${gatepass.reason}`;
  };

  const downloadGatePassPDF = async (gatepass) => {
    const doc = new jsPDF();

    const logoUrl = "https://upload.wikimedia.org/wikipedia/en/6/62/Anna_University_Logo.png"; // Change to your logo
    const logoImg = await fetch(logoUrl).then(res => res.blob()).then(blob => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });

    // Add Logo
    doc.addImage(logoImg, "PNG", 15, 10, 25, 25);

    // Add Title
    doc.setFontSize(16);
    doc.text("ABC College of Engineering", 45, 20);
    doc.setFontSize(14);
    doc.text("Hostel Gate Pass", 45, 30);

    doc.setFontSize(12);
    let y = 50;
    doc.text(`Name: ${gatepass.studentName}`, 20, y);
    doc.text(`Register Number: ${gatepass.registerNumber}`, 20, y + 10);
    doc.text(`Out Date & Time: ${gatepass.outTime}`, 20, y + 20);
    doc.text(`In Date & Time: ${gatepass.inTime}`, 20, y + 30);
    doc.text(`Reason: ${gatepass.reason}`, 20, y + 40);
    doc.text(`Status: ${gatepass.status}`, 20, y + 50);

    doc.setFontSize(10);
    doc.text("Authorized by Hostel Management", 20, y + 70);

    // Convert QR code to image
    const qrCanvas = document.getElementById(`qr-${gatepass._id}`);
    const qrDataUrl = qrCanvas.toDataURL("image/png");

    doc.addImage(qrDataUrl, "PNG", 150, y, 40, 40);

    doc.save(`GatePass_${gatepass.registerNumber}.pdf`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">My Gate Passes</h2>
      <div className="row">
        {gatepasses.map((gp) => (
          <div className="col-md-6 mb-4" key={gp._id}>
            <div className="card p-3 shadow-sm">
              <h5>{gp.studentName}</h5>
              <p><strong>Register No:</strong> {gp.registerNumber}</p>
              <p><strong>Out Time:</strong> {gp.outTime}</p>
              <p><strong>In Time:</strong> {gp.inTime}</p>
              <p><strong>Reason:</strong> {gp.reason}</p>
              <p><strong>Status:</strong> <span className={`badge ${gp.status === "Approved" ? "bg-success" : "bg-warning"}`}>{gp.status}</span></p>

              {/* QR Code hidden for export */}
              <QRCodeCanvas
                id={`qr-${gp._id}`}
                value={generateQRCodeData(gp)}
                size={128}
                includeMargin={true}
                style={{ display: "none" }}
              />

              <button onClick={() => downloadGatePassPDF(gp)} className="btn btn-primary mt-2">
                Download Gate Pass (PDF)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Student;
