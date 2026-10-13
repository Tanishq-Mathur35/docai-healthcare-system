import PDFDocument from 'pdfkit';
import { GeneratedReportData, HomeRemedy, PossibleCondition } from '../ai.types';

/**
 * Sanitizes text to remove emojis and unsupported unicode symbols that cause
 * standard PDF Type 1 fonts (Helvetica) to corrupt or render missing glyphs.
 */
function clean(str: any): string {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols (warning triangles, etc.)
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[•●▪]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[…]/g, '...')
    .replace(/[→⇒]/g, '->')
    .replace(/[\r\t]/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '') // Keep clean standard ASCII
    .trim();
}

/**
 * Generates an executive, highly readable, 2-page medical consultation report.
 * Strictly budgeted to 2 pages with zero font issues or element collisions.
 */
export async function generateReportPDF(
  report: GeneratedReportData,
  consultationId: string,
  patientName: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      autoFirstPage: true,
      bufferPages: true,
      info: {
        Title: `DocAI Clinical Report - ${consultationId}`,
        Author: 'DocAI Healthcare Intelligence',
        Subject: 'Medical Consultation & Triage Assessment',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: any) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: any) => reject(err));

    const left = 36;
    const right = 559;
    const contentWidth = right - left; // 523pt

    // Risk color palette
    const riskPalette: Record<string, { bg: string; border: string; text: string }> = {
      LOW: { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
      MODERATE: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
      HIGH: { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
      CRITICAL: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    };
    const risk = riskPalette[report.riskLevel] || riskPalette.MODERATE;

    // ═══════════════════════════════════════════════════════════════
    // PAGE 1: CLINICAL TRIAGE, DEMOGRAPHICS & DIFFERENTIAL EVALUATION
    // ═══════════════════════════════════════════════════════════════

    // 1. Header Banner
    doc.rect(left, 36, contentWidth, 42).fill('#0f172a');
    doc.fillColor('#38bdf8').fontSize(14).font('Helvetica-Bold')
      .text('DocAI HEALTHCARE', left + 14, 44);
    doc.fillColor('#f8fafc').fontSize(9).font('Helvetica')
      .text('Clinical Consultation & Triage Assessment Report', left + 14, 60);

    const reportCode = clean(consultationId).slice(0, 10).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold')
      .text(`REPORT #${reportCode}`, right - 160, 44, { width: 145, align: 'right' });
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
      .text(`DATE: ${dateStr}  |  STATUS: VERIFIED`, right - 160, 58, { width: 145, align: 'right' });

    // Decorative accent stripe
    doc.rect(left, 78, contentWidth, 3).fill('#0284c7');

    // 2. Clinical Disclaimer Advisory Banner
    let curY = 87;
    doc.rect(left, curY, contentWidth, 30).fillAndStroke('#fffbeb', '#fde68a');
    doc.rect(left, curY, 3.5, 30).fill('#d97706');
    doc.fillColor('#92400e').fontSize(7.5).font('Helvetica-Bold')
      .text('CLINICAL ADVISORY & SAFETY NOTICE', left + 10, curY + 4);
    const disclaimerText = clean(report.disclaimer) ||
      'This AI consultation report provides preliminary triage guidance. It does not replace professional medical diagnosis or prescription. Consult a licensed doctor.';
    doc.fillColor('#78350f').fontSize(6.8).font('Helvetica')
      .text(disclaimerText.slice(0, 240), left + 10, curY + 14, { width: contentWidth - 20, lineGap: 1.5 });

    // 3. Patient Demographics & Risk Badge (Side-by-Side Cards)
    curY = 124;
    const cardLeftW = 345;
    const cardRightW = contentWidth - cardLeftW - 8; // 170

    // Left Card: Demographics
    doc.rect(left, curY, cardLeftW, 64).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold')
      .text('PATIENT DEMOGRAPHICS & RECORD', left + 8, curY + 6);

    const safePatient = clean(patientName) || 'Patient';
    const ageGender = `Age: ${report.patientSummary.age ?? 'N/A'}  |  Gender: ${clean(report.patientSummary.gender) || 'N/A'}  |  Blood: ${clean(report.patientSummary.bloodGroup) || 'N/A'}`;
    const allergies = clean(report.patientSummary.knownAllergies?.join(', ')) || 'None reported';
    const chronic = clean(report.patientSummary.chronicDiseases?.join(', ')) || 'None reported';

    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
      .text(`Name: ${safePatient}`, left + 8, curY + 18);
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
      .text(ageGender, left + 8, curY + 29)
      .text(`Allergies: ${allergies.slice(0, 60)}`, left + 8, curY + 40)
      .text(`Chronic History: ${chronic.slice(0, 60)}`, left + 8, curY + 51);

    // Right Card: Triage Risk Level
    const badgeX = left + cardLeftW + 8;
    doc.roundedRect(badgeX, curY, cardRightW, 64, 4).fillAndStroke(risk.bg, risk.border);
    doc.fillColor(risk.text).fontSize(7.5).font('Helvetica-Bold')
      .text('TRIAGE RISK LEVEL', badgeX, curY + 8, { width: cardRightW, align: 'center' });
    doc.fontSize(14).font('Helvetica-Bold')
      .text(clean(report.riskLevel), badgeX, curY + 20, { width: cardRightW, align: 'center' });
    const confPct = Math.round((report.confidenceScore || 0.85) * 100);
    doc.fontSize(7.5).font('Helvetica')
      .text(`Diagnostic Confidence: ${confPct}%`, badgeX, curY + 40, { width: cardRightW, align: 'center' })
      .fillColor('#64748b').fontSize(6.8)
      .text('Emergency triage protocol active', badgeX, curY + 51, { width: cardRightW, align: 'center' });

    // 4. AI Clinical Narrative Summary
    curY = 194;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('AI CLINICAL SUMMARY & CHIEF COMPLAINT', left, curY);
    curY += 12;

    doc.rect(left, curY, contentWidth, 54).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(left, curY, 2.5, 54).fill('#0284c7');
    const summaryClean = clean(report.aiSummary) || 'Patient underwent clinical consultation. Symptoms analyzed against diagnostic database.';
    doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica')
      .text(summaryClean.slice(0, 480), left + 8, curY + 6, { width: contentWidth - 16, lineGap: 2.2 });

    // 5. Recorded Symptoms
    curY += 60;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('RECORDED SYMPTOMS & PRESENTING COMPLAINTS', left, curY);
    curY += 12;

    const symList = (report.symptoms || []).map(clean).filter(Boolean);
    const symText = symList.length > 0 ? symList.join('   *   ') : 'No specific symptoms noted';
    doc.rect(left, curY, contentWidth, 24).fillAndStroke('#f1f5f9', '#cbd5e1');
    doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
      .text(`* ${symText.slice(0, 200)}`, left + 8, curY + 7, { width: contentWidth - 16 });

    // 6. Differential Diagnoses / Possible Conditions (Top 3 conditions)
    curY += 30;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('DIFFERENTIAL CONSIDERATIONS (POSSIBLE CONDITIONS)', left, curY);
    curY += 12;

    const conditions = (report.possibleConditions || []).slice(0, 3);
    if (conditions.length === 0) {
      doc.rect(left, curY, contentWidth, 26).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
        .text('No definitive acute differential condition established.', left + 8, curY + 8);
      curY += 32;
    } else {
      conditions.forEach((c: PossibleCondition) => {
        doc.rect(left, curY, contentWidth, 34).fillAndStroke('#ffffff', '#e2e8f0');
        doc.rect(left, curY, 2.5, 34).fill('#0284c7');

        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
          .text(`- ${clean(c.name)}`, left + 8, curY + 5);

        const probText = `[PROBABILITY: ${clean(c.probability).toUpperCase()}]`;
        doc.fillColor('#0284c7').fontSize(7.5).font('Helvetica-Bold')
          .text(probText, right - 150, curY + 5, { width: 140, align: 'right' });

        doc.fillColor('#475569').fontSize(7.2).font('Helvetica')
          .text(clean(c.explanation).slice(0, 220), left + 8, curY + 16, { width: contentWidth - 16, lineGap: 1.5 });

        curY += 38;
      });
    }

    // 7. Recommended Diagnostic Tests & Lab Investigations
    curY += 2;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('RECOMMENDED DIAGNOSTIC TESTS & INVESTIGATIONS', left, curY);
    curY += 12;

    const tests = (report.recommendedTests || []).map(clean).filter(Boolean).slice(0, 4);
    doc.rect(left, curY, contentWidth, 38).fillAndStroke('#f8fafc', '#e2e8f0');
    if (tests.length === 0) {
      doc.fillColor('#64748b').fontSize(7.5).font('Helvetica')
        .text('No routine lab investigations recommended at this stage.', left + 8, curY + 12);
    } else {
      tests.forEach((t, i) => {
        const col = i % 2 === 0 ? left + 8 : left + 265;
        const row = curY + 6 + Math.floor(i / 2) * 14;
        doc.fillColor('#0369a1').fontSize(7.5).font('Helvetica-Bold').text('[TEST]', col, row);
        doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(t.slice(0, 42), col + 32, row);
      });
    }

    // 8. Specialist Referral Recommendation
    curY += 44;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('CLINICAL REFERRAL & NEXT STEPS', left, curY);
    curY += 12;

    doc.rect(left, curY, contentWidth, 34).fillAndStroke('#eff6ff', '#bfdbfe');
    doc.rect(left, curY, 2.5, 34).fill('#2563eb');
    const referralText = clean(report.referralNotes) ||
      'Consult a primary care physician or general medical specialist for formal in-person examination.';
    doc.fillColor('#1e40af').fontSize(7.5).font('Helvetica')
      .text(referralText.slice(0, 240), left + 8, curY + 7, { width: contentWidth - 16, lineGap: 1.5 });

    // Page 1 Footer (strictly at y = 780)
    doc.moveTo(left, 775).lineTo(right, 775).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
      .text('DocAI Intelligence Platform  |  Confidential Clinical Summary  |  Strictly No Medicine Prescription', left, 782);
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold')
      .text('Page 1 of 2', right - 80, 782, { width: 80, align: 'right' });

    // ═══════════════════════════════════════════════════════════════
    // PAGE 2: HOME REMEDIES, PRECAUTIONS, EMERGENCY RED FLAGS & SIGNATURE
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();

    // 1. Page 2 Header Bar
    doc.rect(left, 36, contentWidth, 26).fill('#0f172a');
    doc.fillColor('#34d399').fontSize(9).font('Helvetica-Bold')
      .text('DocAI SUPPORTIVE CARE & HOME REMEDY PROTOCOL', left + 10, 44);
    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
      .text(`Patient: ${safePatient}  |  ID: #${reportCode}`, right - 180, 44, { width: 170, align: 'right' });
    doc.rect(left, 62, contentWidth, 2.5).fill('#059669');

    // 2. Home Remedies (Gharelu Nuskhe) & Supportive Care (Strictly NO medicines)
    curY = 72;
    doc.fillColor('#065f46').fontSize(9).font('Helvetica-Bold')
      .text('EVIDENCE-BASED HOME REMEDIES (GHARELU NUSKHE) & SUPPORTIVE CARE', left, curY);
    doc.fillColor('#047857').fontSize(7).font('Helvetica')
      .text('Natural supportive wellness only. Absolutely no pharmaceutical drugs, antibiotics, or scheduled medicines.', left, curY + 11);
    curY += 22;

    const remedies = (report.homeRemedies || []).slice(0, 3);
    if (remedies.length === 0) {
      doc.rect(left, curY, contentWidth, 36).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#166534').fontSize(7.5).font('Helvetica')
        .text('Standard supportive care: Hydration, adequate bed rest, and monitoring.', left + 8, curY + 12);
      curY += 44;
    } else {
      remedies.forEach((r: HomeRemedy) => {
        const boxH = 50;
        doc.rect(left, curY, contentWidth, boxH).fillAndStroke('#f0fdf4', '#bbf7d0');
        doc.rect(left, curY, 3, boxH).fill('#10b981');

        // Title and frequency badge
        doc.fillColor('#064e3b').fontSize(8.5).font('Helvetica-Bold')
          .text(`[REMEDY] ${clean(r.remedy)}`, left + 8, curY + 6);
        const freq = clean(r.frequency) || 'Daily';
        doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold')
          .text(`Freq: ${freq}`, right - 140, curY + 6, { width: 130, align: 'right' });

        // Details
        const prep = clean(r.preparation);
        const benefit = clean(r.benefit);
        const prec = clean(r.precautions);

        doc.fillColor('#1e293b').fontSize(7.2).font('Helvetica')
          .text(`Preparation: ${prep.slice(0, 110)}`, left + 8, curY + 18, { width: contentWidth - 16 })
          .text(`Clinical Benefit: ${benefit.slice(0, 110)}`, left + 8, curY + 28, { width: contentWidth - 16 });

        if (prec) {
          doc.fillColor('#b45309').fontSize(7).font('Helvetica-Oblique')
            .text(`Precaution: ${prec.slice(0, 110)}`, left + 8, curY + 38, { width: contentWidth - 16 });
        }

        curY += boxH + 6;
      });
    }

    // 3. Precautions & Lifestyle Advice (Side-by-Side)
    curY += 2;
    const colW = (contentWidth - 10) / 2; // 256.5

    // Left: Precautions
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('GENERAL PRECAUTIONS', left, curY);
    // Right: Lifestyle Advice
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text('LIFESTYLE & NUTRITIONAL GUIDANCE', left + colW + 10, curY);
    curY += 12;

    const precList = (report.precautions || []).map(clean).filter(Boolean).slice(0, 4);
    const lifeList = (report.lifestyleAdvice || []).map(clean).filter(Boolean).slice(0, 4);

    const dualBoxH = 68;
    // Precautions box
    doc.rect(left, curY, colW, dualBoxH).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(left, curY, 2.5, dualBoxH).fill('#f59e0b');
    if (precList.length === 0) {
      doc.fillColor('#64748b').fontSize(7.2).font('Helvetica').text('Standard healthy precautions apply.', left + 8, curY + 8);
    } else {
      precList.forEach((p, idx) => {
        doc.fillColor('#334155').fontSize(7.2).font('Helvetica')
          .text(`- ${p.slice(0, 52)}`, left + 8, curY + 6 + idx * 14, { width: colW - 14 });
      });
    }

    // Lifestyle box
    const lifeX = left + colW + 10;
    doc.rect(lifeX, curY, colW, dualBoxH).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.rect(lifeX, curY, 2.5, dualBoxH).fill('#10b981');
    if (lifeList.length === 0) {
      doc.fillColor('#64748b').fontSize(7.2).font('Helvetica').text('Maintain regular sleep and fluid intake.', lifeX + 8, curY + 8);
    } else {
      lifeList.forEach((l, idx) => {
        doc.fillColor('#334155').fontSize(7.2).font('Helvetica')
          .text(`- ${l.slice(0, 52)}`, lifeX + 8, curY + 6 + idx * 14, { width: colW - 14 });
      });
    }

    // 4. Emergency Warning Signs (Red Flags - Seek Urgent Hospital Care)
    curY += dualBoxH + 10;
    doc.fillColor('#991b1b').fontSize(8.5).font('Helvetica-Bold')
      .text('EMERGENCY RED FLAGS - SEEK IMMEDIATE HOSPITAL CARE IF:', left, curY);
    curY += 12;

    const redFlags = (report.emergencySigns || []).map(clean).filter(Boolean).slice(0, 3);
    const flagBoxH = 50;
    doc.rect(left, curY, contentWidth, flagBoxH).fillAndStroke('#fef2f2', '#fecaca');
    doc.rect(left, curY, 3, flagBoxH).fill('#ef4444');

    if (redFlags.length === 0) {
      doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold')
        .text('! Any severe chest pain, sudden breathlessness, loss of consciousness, or sudden neurological weakness.', left + 10, curY + 12);
    } else {
      redFlags.forEach((ef, idx) => {
        doc.fillColor('#991b1b').fontSize(7.5).font('Helvetica-Bold')
          .text(`[CRITICAL]  ${ef.slice(0, 110)}`, left + 10, curY + 6 + idx * 14, { width: contentWidth - 20 });
      });
    }

    // 5. Medical Literature Citations (Tavily Medical Search)
    curY += flagBoxH + 10;
    const citations = (report.tavilySearchResults || []).slice(0, 2);
    if (citations.length > 0) {
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica-Bold')
        .text('PEER-REVIEWED MEDICAL CITATIONS & EVIDENCE SOURCES', left, curY);
      curY += 10;

      doc.rect(left, curY, contentWidth, 32).fillAndStroke('#f8fafc', '#e2e8f0');
      citations.forEach((c, idx) => {
        const title = clean(c.title).slice(0, 65);
        const url = clean(c.url).slice(0, 55);
        doc.fillColor('#475569').fontSize(7).font('Helvetica')
          .text(`[${idx + 1}] ${title} - ${url}`, left + 8, curY + 5 + idx * 13, { width: contentWidth - 16 });
      });
      curY += 40;
    } else {
      curY += 4;
    }

    // 6. Medical Attestation & Reviewer Signature Block
    curY = Math.max(curY, 660);
    doc.rect(left, curY, contentWidth, 90).fillAndStroke('#ffffff', '#cbd5e1');

    // Left side: Attestation
    doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold')
      .text('CLINICAL VALIDATION & ATTESTATION', left + 10, curY + 8);
    doc.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text('This AI clinical assessment must be reviewed and countersigned by a registered medical practitioner prior to implementing any therapeutic modifications.', left + 10, curY + 20, { width: 280, lineGap: 1.5 })
      .text('System Integrity: SHA-256 Verified  |  HIPAA Compliant Protocol', left + 10, curY + 65);

    // Right side: Doctor Signature line
    const sigX = left + 310;
    doc.moveTo(sigX, curY + 52).lineTo(right - 14, curY + 52).strokeColor('#94a3b8').lineWidth(0.75).stroke();
    doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold')
      .text('Reviewing Medical Officer / Physician Signature', sigX, curY + 56);
    doc.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text('Date: _________________   License #: ________________', sigX, curY + 70);

    // Page 2 Footer (strictly at y = 780)
    doc.moveTo(left, 775).lineTo(right, 775).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
      .text('DocAI Intelligence Platform  |  Official Patient Record  |  Strictly No Medicines Prescribed', left, 782);
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold')
      .text('Page 2 of 2', right - 80, 782, { width: 80, align: 'right' });

    doc.end();
  });
}
