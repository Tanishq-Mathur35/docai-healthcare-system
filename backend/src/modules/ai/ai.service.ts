import { prisma } from '../../config/database';
import { consultationGraph } from './langgraph/consultation.graph';
import { generateReportPDF } from './report/pdf.builder';
import { uploadFile, generateStorageKey, getPresignedUrl } from '../../utils/s3';
import { createAuditLog } from '../../middleware/auditLogger';
import { AppError } from '../../middleware/errorHandler';
import { ConsultationStateType } from './langgraph/consultation.state';
import { GeneratedReportData } from './ai.types';
import { signAccessToken } from '../../utils/jwt';
import { Request } from 'express';

export class AiService {
  async startConsultation(userId: string, chiefComplaint: string, req: Request) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: true,
        medicalHistory: {
          orderBy: [{ diagnosedAt: 'desc' }, { createdAt: 'desc' }],
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const consultation = await prisma.consultation.create({
      data: {
        patientId: patient.id,
        chiefComplaint,
        status: 'ACTIVE',
        questionCount: 0,
        collectedSymptoms: [],
      },
    });

    const recordsContextParts: string[] = [];
    if (patient.medicalHistory.length > 0) {
      recordsContextParts.push(
        'Chronological Medical History: ' +
          patient.medicalHistory
            .map(
              (m) =>
                `${m.conditionName} (${m.conditionType}, ${m.isActive ? 'Active' : 'Past/Resolved'}${
                  m.description ? `: ${m.description}` : ''
                }${m.medications?.length ? `, Past meds: ${m.medications.join(', ')}` : ''})`
            )
            .join(' | ')
      );
    }
    if (patient.documents.length > 0) {
      recordsContextParts.push(
        'Uploaded Medical Records & Reports: ' +
          patient.documents
            .map(
              (d) =>
                `[${d.documentType}] ${d.originalName}${
                  d.extractedText ? `: ${d.extractedText.slice(0, 300)}` : ''
                }`
            )
            .join(' | ')
      );
    }
    if (patient.currentMedications?.length > 0) {
      recordsContextParts.push(`Current Medications: ${patient.currentMedications.join(', ')}`);
    }

    // Initial state
    const initialState: ConsultationStateType = {
      patientId: patient.id,
      consultationId: consultation.id,
      chiefComplaint,
      patientProfile: {
        age: patient.age ?? undefined,
        gender: patient.gender ?? undefined,
        bloodGroup: patient.bloodGroup ?? undefined,
        allergies: patient.allergies,
        chronicDiseases: patient.chronicDiseases,
      },
      pastConditions: [
        ...patient.medicalHistory.map((m) => ({
          id: m.id,
          conditionName: m.conditionName,
          conditionType: m.conditionType,
          description: `${m.isActive ? 'Active' : 'Past/Resolved'}${m.description ? ` - ${m.description}` : ''}`,
        })),
        ...patient.documents.map((d) => ({
          id: d.id,
          conditionName: `Uploaded ${d.documentType}: ${d.originalName}`,
          conditionType: d.documentType,
          description: d.extractedText ? d.extractedText.slice(0, 250) : `Document on file (${d.originalName})`,
        })),
      ],
      messages: [
        {
          role: 'user',
          content: chiefComplaint,
          timestamp: new Date().toISOString(),
        },
      ],
      collectedSymptoms: [],
      questionCount: 0,
      maxQuestions: 7,
      isSufficiencyReached: false,
      isEmergencyFlagged: false,
      relatedConditionId: undefined,
      conditionRelevance: undefined,
      relatedConditionContext: recordsContextParts.join('\n') || undefined,
      emergencyReason: undefined,
      currentQuestion: undefined,
      generatedReport: undefined,
      tavilySearchResults: undefined,
      error: undefined,
    };

    // Save initial user message in DB
    await prisma.message.create({
      data: {
        consultationId: consultation.id,
        senderId: userId,
        role: 'USER',
        content: chiefComplaint,
      },
    });

    // Execute first graph turn
    const resultState = (await consultationGraph.invoke(initialState)) as ConsultationStateType;

    // Save assistant message in DB
    if (resultState.currentQuestion) {
      await prisma.message.create({
        data: {
          consultationId: consultation.id,
          role: 'ASSISTANT',
          content: resultState.currentQuestion,
        },
      });
    }

    // Persist consultation state
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        questionCount: resultState.questionCount,
        collectedSymptoms: resultState.collectedSymptoms,
        isEmergencyFlagged: resultState.isEmergencyFlagged,
        langGraphState: resultState as any,
      },
    });

    await createAuditLog({
      userId,
      action: 'CONSULTATION_STARTED',
      entity: 'Consultation',
      entityId: consultation.id,
      req,
    });

    return {
      consultationId: consultation.id,
      question: resultState.currentQuestion,
      isEmergency: resultState.isEmergencyFlagged,
      emergencyReason: resultState.emergencyReason,
      pastConditions: initialState.pastConditions,
      questionCount: resultState.questionCount,
      maxQuestions: resultState.maxQuestions,
    };
  }

  async respondToQuestion(userId: string, consultationId: string, answer: string, req: Request) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, patientId: patient.id },
    });
    if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
    if (consultation.status !== 'ACTIVE') {
      throw new AppError('Consultation has already completed', 400, 'CONSULTATION_INACTIVE');
    }

    // Store user response in DB
    await prisma.message.create({
      data: {
        consultationId,
        senderId: userId,
        role: 'USER',
        content: answer,
      },
    });

    // Restore state
    const currentState = (consultation.langGraphState as unknown as ConsultationStateType) || {
      patientId: patient.id,
      consultationId,
      chiefComplaint: consultation.chiefComplaint || '',
      patientProfile: { allergies: [], chronicDiseases: [] },
      pastConditions: [],
      messages: [],
      collectedSymptoms: consultation.collectedSymptoms,
      questionCount: consultation.questionCount,
      maxQuestions: 7,
      isSufficiencyReached: false,
      isEmergencyFlagged: consultation.isEmergencyFlagged,
    };

    currentState.messages.push({
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString(),
    });

    // Execute next graph step
    const resultState = (await consultationGraph.invoke(currentState)) as ConsultationStateType;

    // Save assistant message if question generated
    if (resultState.currentQuestion) {
      await prisma.message.create({
        data: {
          consultationId,
          role: 'ASSISTANT',
          content: resultState.currentQuestion,
        },
      });
    }

    // If report was generated, persist report & PDF
    let reportRecord = null;
    if (resultState.generatedReport) {
      reportRecord = await this.saveReport(patient.id, consultationId, resultState.generatedReport);
      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          isEmergencyFlagged: resultState.isEmergencyFlagged,
          langGraphState: resultState as any,
        },
      });
      await createAuditLog({
        userId,
        action: 'CONSULTATION_COMPLETED',
        entity: 'Consultation',
        entityId: consultationId,
        req,
      });
    } else {
      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          questionCount: resultState.questionCount,
          collectedSymptoms: resultState.collectedSymptoms,
          isEmergencyFlagged: resultState.isEmergencyFlagged,
          langGraphState: resultState as any,
        },
      });
    }

    return {
      consultationId,
      question: resultState.currentQuestion,
      isCompleted: !!resultState.generatedReport,
      reportId: reportRecord?.id,
      isEmergency: resultState.isEmergencyFlagged,
      emergencyReason: resultState.emergencyReason,
      questionCount: resultState.questionCount,
      maxQuestions: resultState.maxQuestions,
    };
  }

  async setConditionRelevance(
    userId: string,
    consultationId: string,
    conditionId: string,
    relevance: 'RELEVANT' | 'NOT_RELEVANT'
  ) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, patientId: patient.id },
    });
    if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

    let relatedContext = '';
    if (relevance === 'RELEVANT') {
      const condition = await prisma.medicalHistory.findUnique({ where: { id: conditionId } });
      if (condition) {
        relatedContext = `Related condition: ${condition.conditionName} (${condition.conditionType}). Severity: ${condition.severity ?? 'N/A'}. Notes: ${condition.description ?? 'None'}. Medications: ${condition.medications.join(', ') || 'None'}`;
      }
    }

    const state = consultation.langGraphState as unknown as ConsultationStateType;
    if (state) {
      state.relatedConditionId = conditionId;
      state.conditionRelevance = relevance;
      state.relatedConditionContext = relatedContext;
    }

    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        relatedConditionId: conditionId,
        conditionRelevanceAnswered: true,
        conditionRelevance: relevance,
        langGraphState: state as any,
      },
    });

    return { success: true, message: `Condition marked as ${relevance}` };
  }

  async finishConsultation(userId: string, consultationId: string, req: Request) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, patientId: patient.id },
    });
    if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');

    // Force sufficiency and generate report
    const state = consultation.langGraphState as unknown as ConsultationStateType;
    if (state) {
      state.isSufficiencyReached = true;
    }

    const resultState = (await consultationGraph.invoke({
      ...(state || {}),
      isSufficiencyReached: true,
    })) as ConsultationStateType;

    let reportRecord = null;
    if (resultState.generatedReport) {
      reportRecord = await this.saveReport(patient.id, consultationId, resultState.generatedReport);
      await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          langGraphState: resultState as any,
        },
      });
      await createAuditLog({
        userId,
        action: 'REPORT_GENERATED',
        entity: 'Report',
        entityId: reportRecord.id,
        req,
      });
    }

    return {
      message: 'Consultation finished',
      reportId: reportRecord?.id,
    };
  }

  private async saveReport(patientId: string, consultationId: string, reportData: any) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true },
    });
    const patientName = patient ? `${patient.user.firstName} ${patient.user.lastName}` : 'Patient';

    // Generate PDF buffer
    let pdfStorageKey: string | null = null;
    let pdfUrl: string | null = null;

    try {
      const pdfBuffer = await generateReportPDF(reportData, consultationId, patientName);
      pdfStorageKey = generateStorageKey(patientId, `report-${consultationId}.pdf`, 'reports');
      pdfUrl = await uploadFile(pdfBuffer, pdfStorageKey, 'application/pdf');
    } catch {
      // PDF generation error should not prevent saving report record
    }

    const remedyData = (reportData.homeRemedies && reportData.homeRemedies.length > 0)
      ? reportData.homeRemedies
      : (reportData.otcSuggestions || []);

    const isTavilyUsed = Boolean(reportData.tavilyUsed || (reportData.tavilySearchResults && reportData.tavilySearchResults.length > 0));

    return prisma.report.upsert({
      where: { consultationId },
      update: {
        symptoms: reportData.symptoms,
        possibleConditions: reportData.possibleConditions,
        riskLevel: reportData.riskLevel,
        recommendedTests: reportData.recommendedTests,
        precautions: reportData.precautions,
        lifestyleAdvice: reportData.lifestyleAdvice,
        otcSuggestions: remedyData,
        emergencySigns: reportData.emergencySigns,
        referralNotes: reportData.referralNotes,
        confidenceScore: reportData.confidenceScore,
        aiSummary: reportData.aiSummary,
        tavilyUsed: isTavilyUsed,
        tavilySearchResults: reportData.tavilySearchResults ?? [],
        pdfStorageKey,
        pdfUrl,
      },
      create: {
        consultationId,
        patientId,
        patientSummary: reportData.patientSummary,
        symptoms: reportData.symptoms,
        possibleConditions: reportData.possibleConditions,
        riskLevel: reportData.riskLevel,
        recommendedTests: reportData.recommendedTests,
        precautions: reportData.precautions,
        lifestyleAdvice: reportData.lifestyleAdvice,
        otcSuggestions: remedyData,
        emergencySigns: reportData.emergencySigns,
        referralNotes: reportData.referralNotes,
        confidenceScore: reportData.confidenceScore,
        aiSummary: reportData.aiSummary,
        tavilyUsed: isTavilyUsed,
        tavilySearchResults: reportData.tavilySearchResults ?? [],
        pdfStorageKey,
        pdfUrl,
      },
    });
  }

  async getConsultationState(userId: string, consultationId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, patientId: patient.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        report: true,
        relatedCondition: true,
      },
    });

    if (!consultation) throw new AppError('Consultation not found', 404, 'NOT_FOUND');
    return consultation;
  }

  async getReportPdfBuffer(userId: string, reportId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const report = await prisma.report.findFirst({
      where: { id: reportId, patientId: patient.id },
    });
    if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND');

    const rawRemedies = Array.isArray(report.otcSuggestions) ? (report.otcSuggestions as any[]) : [];
    const homeRemedies = rawRemedies.map((r: any) => ({
      remedy: typeof r === 'object' && r ? r.remedy || r.name || 'Supportive Care' : String(r).split(':')[0] || 'Supportive Care',
      preparation: typeof r === 'object' && r ? r.preparation || r.dosageGuide || 'Traditional supportive preparation' : String(r),
      frequency: typeof r === 'object' && r ? r.frequency || 'Twice daily after meals' : 'Daily as needed',
      benefit: typeof r === 'object' && r ? r.benefit || r.purpose || 'Soothing symptom relief' : 'Supportive care',
      precautions: typeof r === 'object' && r ? r.precautions : undefined,
    }));

    const reportData: GeneratedReportData = {
      patientSummary: (report.patientSummary as any) || {},
      symptoms: (report.symptoms as any) || [],
      possibleConditions: (report.possibleConditions as any) || [],
      riskLevel: report.riskLevel,
      recommendedTests: (report.recommendedTests as any) || [],
      precautions: (report.precautions as any) || [],
      lifestyleAdvice: (report.lifestyleAdvice as any) || [],
      homeRemedies,
      otcSuggestions: (report.otcSuggestions as any) || [],
      emergencySigns: (report.emergencySigns as any) || [],
      referralNotes: report.referralNotes || '',
      confidenceScore: report.confidenceScore,
      aiSummary: report.aiSummary,
      disclaimer: report.disclaimerText,
    };

    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;
    const buffer = await generateReportPDF(reportData, report.consultationId, patientName);
    return {
      buffer,
      fileName: `medical-report-${report.consultationId.slice(0, 8)}.pdf`,
    };
  }

  async getReportPdfUrl(userId: string, reportId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const report = await prisma.report.findFirst({
      where: { id: reportId, patientId: patient.id },
    });
    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    if (report.pdfStorageKey) {
      try {
        const downloadUrl = await getPresignedUrl(report.pdfStorageKey, 3600);
        return { downloadUrl };
      } catch {
        // Fallback to streaming download endpoint if MinIO is unreachable
      }
    }

    // Direct streaming download route with authentication token
    const token = signAccessToken({
      id: patient.user.id,
      email: patient.user.email,
      role: patient.user.role,
      firstName: patient.user.firstName,
      lastName: patient.user.lastName,
    });

    const downloadUrl = `/api/v1/ai/reports/${reportId}/download?token=${token}`;
    return { downloadUrl };
  }
}

export const aiService = new AiService();
