const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.generate = async (userId, courseId) => {
  const doc = new PDFDocument();
  const filePath = `certificates/${userId}_${courseId}.pdf`;

  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(25).text('Certificate of Completion', { align: 'center' });
  doc.text(`This certifies that User ${userId} has completed Course ${courseId}.`, { align: 'center' });
  doc.end();

  return filePath;
};