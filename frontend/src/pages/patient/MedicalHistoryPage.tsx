import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { patientService } from '@/services/patient.service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/notificationStore';
import { useTranslation } from '@/store/languageStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  Plus,
  Trash2,
  ClipboardList,
  Upload,
  FileText,
  HeartPulse,
  RefreshCw,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  conditionName: z.string().min(1, 'Condition name is required'),
  conditionType: z.enum(['CHRONIC', 'ACUTE', 'SURGICAL', 'ALLERGY', 'GENETIC', 'OTHER']).default('OTHER'),
  description: z.string().optional(),
  diagnosedAt: z.string().optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'CRITICAL']).optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

const CONDITION_PRESETS = [
  {
    labelEn: 'Heart Attack (Past MI)',
    labelHi: 'हार्ट अटैक (Heart Attack)',
    conditionName: 'History of Myocardial Infarction (Heart Attack)',
    conditionType: 'CHRONIC' as const,
    severity: 'SEVERE' as const,
    description: 'Past cardiac event requiring ongoing cardiovascular monitoring',
  },
  {
    labelEn: 'Diabetes (Type 2)',
    labelHi: 'मधुमेह / शुगर (Diabetes)',
    conditionName: 'Type 2 Diabetes Mellitus',
    conditionType: 'CHRONIC' as const,
    severity: 'MODERATE' as const,
    description: 'Blood glucose management and regular HbA1c monitoring',
  },
  {
    labelEn: 'Hypertension (High BP)',
    labelHi: 'उच्च रक्तचाप (High BP)',
    conditionName: 'Essential Hypertension (High Blood Pressure)',
    conditionType: 'CHRONIC' as const,
    severity: 'MODERATE' as const,
    description: 'Elevated blood pressure history',
  },
  {
    labelEn: 'Drug / Food Allergy',
    labelHi: 'दवा / खाद्य एलर्जी (Allergy)',
    conditionName: 'Penicillin & Sulfa Drug Allergy',
    conditionType: 'ALLERGY' as const,
    severity: 'SEVERE' as const,
    description: 'Triggers skin rash and hypersensitivity reaction',
  },
  {
    labelEn: 'Major Past Surgery',
    labelHi: 'पुरानी सर्जरी (Past Surgery)',
    conditionName: 'Previous Surgical Procedure (Cardiac / Abdominal)',
    conditionType: 'SURGICAL' as const,
    severity: 'MODERATE' as const,
    description: 'Post-operative recovery completed without complications',
  },
  {
    labelEn: 'Asthma / Breathing Issue',
    labelHi: 'अस्थमा / सांस की समस्या',
    conditionName: 'Bronchial Asthma',
    conditionType: 'CHRONIC' as const,
    severity: 'MODERATE' as const,
    description: 'Seasonal airway sensitivity',
  },
];

export default function MedicalHistoryPage() {
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState<'PRESCRIPTION' | 'LAB_REPORT' | 'MRI' | 'XRAY' | 'OTHER'>('PRESCRIPTION');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { success, error } = useToast();
  const { language, t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['medical-history'],
    queryFn: () => patientService.getMedicalHistory({ limit: 50 }),
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => patientService.getDocuments({ limit: 50 }),
  });

  const { data: profileData } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientService.getProfile(),
  });

  const items: any[] = data?.data?.data || [];
  const documents: any[] = docsData?.data?.data || [];
  const profile = profileData?.data?.data;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      conditionType: 'CHRONIC',
      isActive: true,
    },
  });

  const addMutation = useMutation({
    mutationFn: (d: FormData) => {
      const payload: Record<string, unknown> = {
        ...d,
        diagnosedAt: d.diagnosedAt ? new Date(d.diagnosedAt).toISOString() : undefined,
        severity: d.severity || undefined,
      };
      return patientService.addMedicalHistory(payload);
    },
    onSuccess: () => {
      success(
        language === 'hi' ? 'मेडिकल हिस्ट्री जोड़ी गई' : 'Medical Record Added',
        language === 'hi'
          ? 'यह जानकारी डॉक्टर और AI चैटबॉट के लिए उपलब्ध है।'
          : 'Your chronological medical history and AI context have been updated.'
      );
      queryClient.invalidateQueries({ queryKey: ['medical-history'] });
      reset();
      setShowForm(false);
    },
    onError: () => error('Error', 'Failed to add medical history record.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.deleteMedicalHistory(id),
    onSuccess: () => {
      success('Deleted', 'Record removed.');
      queryClient.invalidateQueries({ queryKey: ['medical-history'] });
    },
    onError: () => error('Error', 'Failed to delete record.'),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', documentType);
      return patientService.uploadDocument(fd);
    },
    onSuccess: () => {
      success(
        language === 'hi' ? 'रिपोर्ट अपलोड हो गई' : 'Medical Record Uploaded',
        language === 'hi'
          ? 'आपका पर्चा/लैब रिपोर्ट टाइमलाइन में जोड़ दिया गया है।'
          : 'Document added to your chronological medical timeline.'
      );
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => error('Upload Failed', 'Please upload a valid PDF or image file.'),
  });

  const syncProfileMutation = useMutation({
    mutationFn: async () => {
      const allergies = Array.from(
        new Set([
          ...(profile?.allergies || []),
          ...items.filter((i) => i.conditionType === 'ALLERGY').map((i) => i.conditionName),
        ])
      );
      const chronicDiseases = Array.from(
        new Set([
          ...(profile?.chronicDiseases || []),
          ...items
            .filter((i) => i.conditionType === 'CHRONIC' || i.conditionType === 'SURGICAL')
            .map((i) => i.conditionName),
        ])
      );
      return patientService.updateProfile({ allergies, chronicDiseases });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      success(
        language === 'hi' ? 'प्रोफ़ाइल सिंक हो गई' : 'Medical Profile Synced!',
        language === 'hi'
          ? 'सभी पुरानी बीमारियां और एलर्जी आपकी मुख्य प्रोफ़ाइल में अपडेट हो गईं।'
          : 'Allergies, heart conditions, diabetes, and surgeries synced with your main profile & AI chatbot.'
      );
    },
  });

  const handleQuickPreset = (preset: (typeof CONDITION_PRESETS)[number]) => {
    setShowForm(true);
    setValue('conditionName', preset.conditionName);
    setValue('conditionType', preset.conditionType);
    setValue('severity', preset.severity);
    setValue('description', preset.description);
    setValue('isActive', true);
  };

  // Build unified chronological timeline combining conditions + uploaded documents
  const chronologicalTimeline = [
    ...items.map((item) => ({
      id: `cond-${item.id}`,
      rawId: item.id,
      kind: 'CONDITION' as const,
      date: item.diagnosedAt || item.createdAt,
      title: item.conditionName,
      category: item.conditionType,
      severity: item.severity,
      isActive: item.isActive,
      description: item.description,
    })),
    ...documents.map((doc) => ({
      id: `doc-${doc.id}`,
      rawId: doc.id,
      kind: 'DOCUMENT' as const,
      date: doc.uploadedAt || doc.createdAt,
      title: doc.originalName,
      category: doc.documentType,
      storageUrl: doc.storageUrl,
      description: doc.extractedText
        ? doc.extractedText.slice(0, 180)
        : language === 'hi'
        ? 'अपलोड किया गया मेडिकल रिकॉर्ड (डॉक्टर और AI के लिए उपलब्ध)'
        : 'Uploaded clinical record accessible to your consulting doctor and AI assistant.',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            {language === 'hi' ? 'AI और डॉक्टर के साथ सिंक किया गया' : 'AI-Connected Clinical History'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.medicalHistoryTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.medicalHistorySubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => syncProfileMutation.mutate()}
            disabled={syncProfileMutation.isPending}
            className="rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncProfileMutation.isPending ? 'animate-spin' : ''}`} />
            {t.syncToProfile}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold">
            <Plus className="h-4 w-4 mr-1.5" />
            {showForm ? (language === 'hi' ? 'बंद करें' : 'Cancel') : t.addRecord}
          </Button>
        </div>
      </div>

      {/* Quick-Add Past Conditions Bar (Heart Attack, Diabetes, Allergies, Surgeries) */}
      <Card className="border-sky-100 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-500" />
            {t.quickAddCondition} (Heart Attack, Diabetes, Allergies, Surgeries)
          </CardTitle>
          <CardDescription className="text-xs">
            {language === 'hi'
              ? 'अपनी पुरानी बीमारी या सर्जरी पर क्लिक करके तुरंत जोड़ें ताकि AI चैटबॉट सही सवाल पूछ सके।'
              : 'Click any preset below to pre-fill and record your past conditions for accurate AI follow-up questions and reports.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CONDITION_PRESETS.map((preset) => (
            <button
              key={preset.conditionName}
              type="button"
              onClick={() => handleQuickPreset(preset)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-slate-700 hover:bg-sky-100 transition inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5 text-sky-600" />
              {language === 'hi' ? preset.labelHi : preset.labelEn}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Upload Previous Prescriptions / Lab Reports / Diagnostic Records */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Upload className="h-4 w-4 text-sky-600" />
            {t.uploadPastRecord}
          </CardTitle>
          <CardDescription className="text-xs">
            {language === 'hi'
              ? 'पुराने डॉक्टर के पर्चे, ब्लड टेस्ट रिपोर्ट या एक्स-रे/एमआरआई अपलोड करें।'
              : 'Upload previous prescriptions, laboratory reports, or diagnostic records (PDF/Image).'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as any)}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold"
          >
            <option value="PRESCRIPTION">Previous Prescription (पुराना पर्चा)</option>
            <option value="LAB_REPORT">Laboratory Report (लैब रिपोर्ट)</option>
            <option value="MRI">MRI / Diagnostic Scan</option>
            <option value="XRAY">X-Ray Record</option>
            <option value="OTHER">Other Medical Record</option>
          </select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadDocMutation.mutate({ file, documentType: docType });
                e.target.value = '';
              }
            }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={uploadDocMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl text-xs font-semibold border-sky-200 text-sky-700 hover:bg-sky-50"
          >
            <Upload className="h-3.5 w-3.5 mr-2" />
            {uploadDocMutation.isPending
              ? 'Uploading Record...'
              : language === 'hi'
              ? 'फ़ाइल चुनें और अपलोड करें'
              : 'Select & Upload File (PDF / JPG / PNG)'}
          </Button>
        </CardContent>
      </Card>

      {/* Add Condition Form */}
      {showForm && (
        <Card className="border-sky-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{t.addRecord}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition / Surgery / Allergy Name *</Label>
                  <Input {...register('conditionName')} placeholder="e.g. Heart Attack, Diabetes, Penicillin Allergy" />
                  {errors.conditionName && <p className="text-xs text-destructive">{errors.conditionName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select {...register('conditionType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {['CHRONIC', 'ACUTE', 'SURGICAL', 'ALLERGY', 'GENETIC', 'OTHER'].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <select {...register('severity')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select severity</option>
                    {['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosed / Surgery Date</Label>
                  <Input type="date" {...register('diagnosedAt')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Clinical Notes & Details</Label>
                <Input {...register('description')} placeholder="Include hospital details, stent/surgery notes, or reaction details..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register('isActive')} defaultChecked className="h-4 w-4" />
                <Label htmlFor="isActive">Currently active / ongoing condition</Label>
              </div>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? t.saving : t.saveChanges}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Unified Chronological Medical Timeline */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-600" />
          {t.chronologicalTimeline} ({chronologicalTimeline.length})
        </h2>

        {isLoading || docsLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : chronologicalTimeline.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No medical history or records yet</p>
              <p className="text-muted-foreground text-sm">
                Use the quick-add buttons above or upload a past prescription/lab report.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative pl-6 border-l-2 border-sky-200 dark:border-slate-700 space-y-4">
            {chronologicalTimeline.map((entry: any) => (
              <div key={entry.id} className="relative">
                <span
                  className={`absolute -left-[31px] top-4 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    entry.kind === 'DOCUMENT' ? 'bg-teal-500' : 'bg-sky-600'
                  }`}
                />
                <Card className="border-slate-200/80 dark:border-slate-800">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-slate-400">
                            {entry.date ? formatDate(entry.date) : 'Recorded'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              entry.kind === 'DOCUMENT'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {entry.category}
                          </span>
                          {entry.kind === 'CONDITION' && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                entry.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {entry.isActive ? t.active : t.resolved}
                            </span>
                          )}
                          {entry.severity && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700">
                              {entry.severity}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                          {entry.kind === 'DOCUMENT' && <FileText className="h-4 w-4 text-teal-600 shrink-0" />}
                          {entry.title}
                        </h3>

                        {entry.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {entry.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {entry.kind === 'DOCUMENT' && entry.storageUrl && (
                          <a
                            href={entry.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-sky-600 hover:underline inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {entry.kind === 'CONDITION' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => deleteMutation.mutate(entry.rawId)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
