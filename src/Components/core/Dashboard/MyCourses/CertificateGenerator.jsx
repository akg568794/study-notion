import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-hot-toast";
import certificateBg from "../../../../../src/assets/Images/certificate.png";

const CertificateGenerator = ({
  userId,
  courseId,
  userName,
  courseName,
  completionDate,
}) => {
  const certificateRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(certificateRef.current);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 300; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [imgWidth, imgHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`certificate_${userId}_${courseId}.pdf`);
    } catch (error) {
      console.error("Certificate generation error:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center mt-5 mb-10">
  {/* Certificate */}
  <div
    ref={certificateRef}
    style={{
      width: "650px", // Decreased size to fit in modal
      height: "460px",
      backgroundImage: `url(${certificateBg})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      fontFamily: "serif",
      position: "relative",
      marginTop: "0px", // Removes extra top spacing
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "130px", // Adjusted for new size
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "16px",
        fontWeight: "bold",
        color: "#1a3c6c",
      }}
    >
      This certificate is presented to
    </div>

    <div
      style={{
        position: "absolute",
        top: "165px",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "24px",
        fontWeight: "bold",
        color: "#1a3c6c",
      }}
    >
      {userName}
    </div>

    <div
      style={{
        position: "absolute",
        top: "210px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "75%",
        textAlign: "center",
        fontSize: "14px",
        color: "#1a3c6c",
        lineHeight: "1.4",
      }}
    >
      for successfully completing the <strong>{courseName}</strong> on{" "}
      <strong>{completionDate}</strong>.<br />
      This certificate is awarded in recognition of outstanding commitment,
      consistent performance, and the pursuit of professional growth.
    </div>
  </div>

  {/* Download Button */}
  <button
  onClick={handleDownload}
  disabled={isGenerating}
  type="button"
  className={`mt-10 px-6 py-2 bg-green-600 text-white bg-caribbeangreen-400 rounded ${
    isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
  }`}
>
  {isGenerating ? "Generating..." : "Download Certificate"}
</button>
</div>

  );
};

export default CertificateGenerator;
