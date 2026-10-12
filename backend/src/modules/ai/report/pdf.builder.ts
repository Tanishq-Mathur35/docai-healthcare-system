import PDFDocument from 'pdfkit';
import { GeneratedReportData, HomeRemedy } from '../ai.types';

export async function generateReportPDF(
  report: GeneratedReportData,
  consultationId: string,
  patientName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Medical Consultation Report - ${consultationId}`,
        Author: 'DocAI Medical System',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: any) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: any) => reject(err));

    // Header styling
    doc
      .fillColor('#0284c7')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('DocAI — Clinical Consultation & Triage Report', { align: 'left' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Report ID: ${consultationId}  |  Generated: ${new Date().toUTCString()}`, { align: 'left' });

    doc.moveDown(0.5);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.8);

    // Disclaimer Box
    doc
      .rect(40, doc.y, 515, 42)
      .fillAndStroke('#fef3c7', '#f59e0b');

    doc
      .fillColor('#92400e')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('⚠️ CLINICAL DISCLAIMER & SAFETY NOTICE', 50, doc.y - 35)
      .font('Helvetica')
      .text(report.disclaimer, 50, doc.y + 2, { width: 495 });

    doc.moveDown(1.5);

    // Patient Details & Risk Level
    const currentY = doc.y;
    doc
      .fillColor('#0f172a')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PATIENT PROFILE', 40, currentY);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#334155')
      .text(`Name: ${patientName}`, 40, currentY + 16)
      .text(`Age: ${report.patientSummary.age ?? 'N/A'}  |  Gender: ${report.patientSummary.gender ?? 'N/A'}  |  Blood: ${report.patientSummary.bloodGroup ?? 'N/A'}`, 40, currentY + 30)
      .text(`Allergies: ${report.patientSummary.knownAllergies.join(', ') || 'None reported'}`, 40, currentY + 44)
      .text(`Chronic Conditions: ${report.patientSummary.chronicDiseases.join(', ') || 'None reported'}`, 40, currentY + 58);

    // Risk Level Badge on the right
    const riskColors: Record<string, { bg: string; text: string }> = {
      LOW: { bg: '#dcfce7', text: '#15803d' },
      MODERATE: { bg: '#fef9c3', text: '#a16207' },
      HIGH: { bg: '#ffedd5', text: '#c2410c' },
      CRITICAL: { bg: '#fee2e2', text: '#b91c1c' },
    };
    const risk = riskColors[report.riskLevel] || riskColors.LOW;

    doc
      .roundedRect(380, currentY, 175, 60, 6)
      .fillAndStroke(risk.bg, risk.text);

    doc
      .fillColor(risk.text)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('TRIAGE RISK LEVEL', 390, currentY + 12, { align: 'center', width: 155 })
      .fontSize(14)
      .text(report.riskLevel, 390, currentY + 26, { align: 'center', width: 155 })
      .fontSize(8)
      .font('Helvetica')
      .text(`Confidence: ${(report.confidenceScore * 100).toFixed(0)}%`, 390, currentY + 44, { align: 'center', width: 155 });

    doc.y = currentY + 75;
    doc.moveDown(0.8);

    // AI Clinical Summary
    doc
      .fillColor('#0369a1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('AI CLINICAL SUMMARY & TRIAGE');
    doc
      .fillColor('#1e293b')
      .fontSize(9)
      .font('Helvetica')
      .text(report.aiSummary, { width: 515, lineGap: 3 });

    doc.moveDown(0.8);

    // Symptoms Gathered
    doc
      .fillColor('#0369a1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('IDENTIFIED SYMPTOMS');
    doc
      .fillColor('#334155')
      .fontSize(9)
      .font('Helvetica')
      .text(report.symptoms.map((s) => `• ${s}`).join('   ') || 'None recorded', { width: 515 });

    doc.moveDown(0.8);

    // Possible Conditions
    doc
      .fillColor('#0369a1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('POSSIBLE CONDITIONS (DIFFERENTIAL CONSIDERATIONS)');

    report.possibleConditions.forEach((c) => {
      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`• ${c.name} [Probability: ${c.probability}]`, { continued: true })
        .font('Helvetica')
        .fillColor('#475569')
        .text(` — ${c.explanation}`);
    });

    doc.moveDown(0.8);

    // ── EVIDENCE-BASED HOME REMEDIES (GHARELU NUSKHE) & SUPPORTIVE CARE ──
    const remedies = report.homeRemedies || [];
    if (remedies.length > 0) {
      doc
        .fillColor('#047857')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('HOME REMEDIES (GHARELU NUSKHE) & SUPPORTIVE CARE (NO MEDICATIONS)');

      remedies.forEach((r: HomeRemedy) => {
        doc
          .fillColor('#0f172a')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(`🌿 ${r.remedy}`, { continued: true })
          .font('Helvetica')
          .fillColor('#047857')
          .text(` [${r.frequency}]`);

        doc
          .fillColor('#334155')
          .fontSize(8.5)
          .font('Helvetica')
          .text(`   Preparation: ${r.preparation}`)
          .text(`   Benefit: ${r.benefit}`);

        if (r.precautions) {
          doc
            .fillColor('#b45309')
            .fontSize(8)
            .text(`   Precautions: ${r.precautions}`);
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.8);
    }

    // Recommended Tests & Labs
    doc
      .fillColor('#0369a1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('RECOMMENDED TESTS & LABS');
    report.recommendedTests.forEach((t) => {
      doc.fillColor('#334155').fontSize(9).font('Helvetica').text(`• ${t}`);
    });

    doc.moveDown(0.8);

    // Precautions & Lifestyle Advice
    doc
      .fillColor('#0369a1')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PRECAUTIONS & LIFESTYLE ADVICE');
    report.precautions.forEach((p) => {
      doc.fillColor('#334155').fontSize(9).font('Helvetica').text(`• ${p}`);
    });
    report.lifestyleAdvice.forEach((l) => {
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`• Lifestyle: ${l}`);
    });

    doc.moveDown(0.8);

    // Emergency Warning Signs
    if (report.emergencySigns && report.emergencySigns.length > 0) {
      doc
        .fillColor('#b91c1c')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('EMERGENCY RED FLAGS — SEEK IMMEDIATE CARE IF:');
      report.emergencySigns.forEach((e) => {
        doc.fillColor('#991b1b').fontSize(9).font('Helvetica').text(`! ${e}`);
      });
      doc.moveDown(0.8);
    }

    // Tavily Live References
    if (report.tavilySearchResults && report.tavilySearchResults.length > 0) {
      doc
        .fillColor('#475569')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PEER-REVIEWED MEDICAL CITATIONS (TAVILY MEDICAL SEARCH):');
      report.tavilySearchResults.forEach((ref) => {
        doc
          .fillColor('#64748b')
          .fontSize(7.5)
          .font('Helvetica')
          .text(`[${ref.title}] - ${ref.url}`);
      });
      doc.moveDown(0.8);
    }

    // Referral Notes
    if (report.referralNotes) {
      doc
        .fillColor('#0369a1')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('CLINICAL REFERRAL RECOMMENDATION');
      doc.fillColor('#334155').fontSize(9).font('Helvetica').text(report.referralNotes);
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text('Generated by DocAI Clinical Intelligence Platform with Tavily Medical Web Search. For clinical reference only.', 40, 785, {
        align: 'center',
        width: 515,
      });

    doc.end();
  });
}
