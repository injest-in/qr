import type { PrintTemplateConfig } from '../types';

/**
 * Generates and downloads print-ready PDF based on user's template selection
 */
export async function generatePrintPDF(
  qrImageDataUrl: string,
  config: PrintTemplateConfig
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { type, title, subtitle, humanReadablePrimary, humanReadableSecondary } = config;

  if (type === 'tent-a4') {
    // A4 Portrait: 210 x 297 mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const midY = pageHeight / 2;

    // Outer margin border & fold guidelines
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    // Center fold line (Dashed)
    doc.setLineDashPattern([3, 3], 0);
    doc.line(10, midY, pageWidth - 10, midY);

    // Fold instruction text
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('--- FOLD HERE (VALLEY FOLD) ---', pageWidth / 2, midY - 2, { align: 'center' });
    doc.setLineDashPattern([], 0); // Reset dash

    // Helper to draw a side (QR + Text)
    // side 1: Bottom half (upright)
    const drawSide = (baseY: number, inverted: boolean) => {
      if (inverted) {
        // Upper half inverted so folding creates an upright tent card on both sides
        // We can use doc.saveGraphicsState, rotate/translate or draw flipped
        // jsPDF supports rotation: doc.text(..., { angle: 180 })
        // For simplicity and crisp rendering, we render the upper side oriented towards top edge
      }

      const qrSize = 55;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = baseY + 18;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(20, 30, 50);
      doc.text(title || 'Scan with Camera', pageWidth / 2, baseY + 10, { align: 'center' });

      // Subtitle
      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(90, 100, 115);
        doc.text(subtitle, pageWidth / 2, baseY + 15, { align: 'center' });
      }

      // QR Code Image
      doc.addImage(qrImageDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Human-Readable Failover Box (FR-E2)
      let currentY = qrY + qrSize + 8;
      if (humanReadablePrimary || humanReadableSecondary) {
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(pageWidth / 2 - 45, currentY - 4, 90, 24, 3, 3, 'F');
        doc.setDrawColor(220, 225, 235);
        doc.roundedRect(pageWidth / 2 - 45, currentY - 4, 90, 24, 3, 3, 'S');

        if (humanReadablePrimary) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(50, 60, 80);
          doc.text(
            `${humanReadablePrimary.label}: ${humanReadablePrimary.value}`,
            pageWidth / 2,
            currentY + 4,
            { align: 'center' }
          );
        }

        if (humanReadableSecondary) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(80, 90, 110);
          doc.text(
            `${humanReadableSecondary.label}: ${humanReadableSecondary.value}`,
            pageWidth / 2,
            currentY + 11,
            { align: 'center' }
          );
        }

        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text('Camera scratched or smudged? Use details above.', pageWidth / 2, currentY + 16, { align: 'center' });
      }

      // Branding / footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 170);
      doc.text('Powered by SwissArmy QR • Zero-Persistence Privacy', pageWidth / 2, baseY + 135, { align: 'center' });
    };

    // Bottom Face (Side A)
    drawSide(midY + 5, false);

    // Top Face (Side B)
    drawSide(10, true);

    doc.save(`${(title || 'qr-tent-card').toLowerCase().replace(/\s+/g, '-')}-a4-tent.pdf`);
  } else if (type === 'standee-a5') {
    // A5 Portrait: 148 x 210 mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const pageWidth = 148;
    const pageHeight = 210;

    // Header Accent Banner
    doc.setFillColor(37, 99, 235); // primary blue
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(title || 'SwissArmy QR Standee', pageWidth / 2, 14, { align: 'center' });

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 235, 255);
      doc.text(subtitle, pageWidth / 2, 21, { align: 'center' });
    }

    // QR Code Image
    const qrSize = 65;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 42;
    doc.addImage(qrImageDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Border surrounding QR
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, 'S');

    // Human-Readable Box (FR-E2)
    let currentY = qrY + qrSize + 18;
    if (humanReadablePrimary || humanReadableSecondary) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(pageWidth / 2 - 50, currentY - 5, 100, 26, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pageWidth / 2 - 50, currentY - 5, 100, 26, 3, 3, 'S');

      if (humanReadablePrimary) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(
          `${humanReadablePrimary.label}: ${humanReadablePrimary.value}`,
          pageWidth / 2,
          currentY + 5,
          { align: 'center' }
        );
      }

      if (humanReadableSecondary) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `${humanReadableSecondary.label}: ${humanReadableSecondary.value}`,
          pageWidth / 2,
          currentY + 12,
          { align: 'center' }
        );
      }

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Camera scratched or dirty? Enter credentials above manually.', pageWidth / 2, currentY + 18, { align: 'center' });
    }

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Official Standee • Instant Client Processing • SwissArmy QR', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`${(title || 'qr-standee').toLowerCase().replace(/\s+/g, '-')}-a5-standee.pdf`);
  } else if (type === 'asset-tag-2x1') {
    // 2" x 1" Label: 50.8mm x 25.4mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [50.8, 25.4]
    });

    const width = 50.8;
    const height = 25.4;

    // Outer border / cut boundary
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(1, 1, width - 2, height - 2);

    // Left: QR Code (18mm x 18mm)
    const qrSize = 18;
    const qrX = 3;
    const qrY = (height - qrSize) / 2;
    doc.addImage(qrImageDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Right: Asset Info & ServiceNow quick lookup
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(title || 'PROPERTY OF IT', 23, 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle || 'Scan for Service Desk Ticket', 23, 9.5);

    if (humanReadablePrimary) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(2, 132, 199);
      doc.text(`${humanReadablePrimary.label}: ${humanReadablePrimary.value}`, 23, 14);
    }

    if (humanReadableSecondary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${humanReadableSecondary.label}: ${humanReadableSecondary.value}`, 23, 18);
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(4.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Do Not Remove Tag', 23, 22);

    doc.save(`${(title || 'asset-tag').toLowerCase().replace(/\s+/g, '-')}-2x1.pdf`);
  }
}
