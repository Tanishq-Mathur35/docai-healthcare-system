import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '@/services/patient.service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/notificationStore';
import { useTranslation } from '@/store/languageStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useEffect, useState } from 'react';
import { HeartPulse, Plus, X } from 'lucide-react';

const schema = z.object({
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  bloodGroup: z.enum(['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','UNKNOWN']).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { success, error } = useToast();
  const { language, t } = useTranslation();

  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientService.getProfile(),
  });

  const profile = data?.data?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        age: profile.age ?? undefined,
        gender: profile.gender ?? undefined,
        bloodGroup: profile.bloodGroup ?? undefined,
        emergencyContactName: profile.emergencyContactName ?? '',
        emergencyContactPhone: profile.emergencyContactPhone ?? '',
        emergencyContactRelation: profile.emergencyContactRelation ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        country: profile.country ?? '',
      });
      setAllergies(profile.allergies || []);
      setChronicDiseases(profile.chronicDiseases || []);
      setCurrentMedications(profile.currentMedications || []);
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      patientService.updateProfile({
        ...data,
        allergies,
        chronicDiseases,
        currentMedications,
      } as Record<string, unknown>),
    onSuccess: () => {
      success(
        language === 'hi' ? 'प्रोफ़ाइल अपडेट हो गई' : 'Medical Profile Updated',
        language === 'hi'
          ? 'आपका मेडिकल इतिहास और विवरण सुरक्षित कर लिया गया है।'
          : 'Your medical profile, conditions, and allergies have been saved.'
      );
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
    },
    onError: () => error('Update failed', 'Please try again.'),
  });

  const addTag = (val: string, list: string[], setList: (v: string[]) => void, clear: () => void) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    clear();
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{t.profile}</h1>
        <p className="text-muted-foreground">{t.medicalHistorySubtitle}</p>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Past Medical Conditions, Allergies & Current Medications */}
        <Card className="border-sky-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-5 w-5 text-rose-500" />
              {t.healthSummary}
            </CardTitle>
            <CardDescription>
              {language === 'hi'
                ? 'हार्ट अटैक, डायबिटीज, एलर्जी और सर्जरी की जानकारी यहां जोड़ें — AI चैटबॉट और डॉक्टर इसका उपयोग करेंगे।'
                : 'Add past conditions (Heart Attack, Diabetes, Surgeries), Allergies, and Current Medications used by the AI Consultation Chatbot.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Chronic Conditions / Surgeries */}
            <div className="space-y-2">
              <Label>{t.chronicConditions} (e.g., Heart Attack, Diabetes, Past Surgery, Hypertension)</Label>
              <div className="flex gap-2">
                <Input
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add condition or surgery (e.g. Past Heart Attack, Type 2 Diabetes)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newCondition, chronicDiseases, setChronicDiseases, () => setNewCondition(''));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newCondition, chronicDiseases, setChronicDiseases, () => setNewCondition(''))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {chronicDiseases.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setChronicDiseases(chronicDiseases.filter((item) => item !== c))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>{t.allergies} (e.g., Penicillin, Sulfa, Peanuts, Dust)</Label>
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newAllergy, allergies, setAllergies, () => setNewAllergy(''));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newAllergy, allergies, setAllergies, () => setNewAllergy(''))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {allergies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"
                  >
                    {a}
                    <button type="button" onClick={() => setAllergies(allergies.filter((item) => item !== a))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-2">
              <Label>{t.currentMedications}</Label>
              <div className="flex gap-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add ongoing medication..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newMedication, currentMedications, setCurrentMedications, () => setNewMedication(''));
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    addTag(newMedication, currentMedications, setCurrentMedications, () => setNewMedication(''))
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {currentMedications.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => setCurrentMedications(currentMedications.filter((item) => item !== m))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card>
          <CardHeader><CardTitle>{t.personalMedicalDetails}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" {...register('age', { valueAsNumber: true })} placeholder="35" />
                {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select {...register('gender')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <select {...register('bloodGroup')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select blood group</option>
                {['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','O_POSITIVE','O_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','UNKNOWN'].map((bg) => (
                  <option key={bg} value={bg}>{bg.replace('_', ' ').replace('POSITIVE', '+').replace('NEGATIVE', '-')}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register('city')} placeholder="Jodhpur" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input {...register('country')} placeholder="India" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input {...register('address')} placeholder="123 Main St" />
            </div>
          </CardContent>
        </Card>

        {/* Emergency contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t.emergencyContact}</CardTitle>
            <CardDescription>Who should be contacted in an emergency?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input {...register('emergencyContactName')} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input {...register('emergencyContactRelation')} placeholder="Spouse" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input type="tel" {...register('emergencyContactPhone')} placeholder="+91 98765 43210" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t.saving : t.saveChanges}
        </Button>
      </form>
    </div>
  );
}
