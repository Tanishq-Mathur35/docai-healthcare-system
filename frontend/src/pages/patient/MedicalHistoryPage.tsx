import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { patientService } from '@/services/patient.service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  conditionName: z.string().min(1, 'Condition name is required'),
  conditionType: z.enum(['CHRONIC','ACUTE','SURGICAL','ALLERGY','GENETIC','OTHER']).default('OTHER'),
  description: z.string().optional(),
  diagnosedAt: z.string().optional(),
  severity: z.enum(['MILD','MODERATE','SEVERE','CRITICAL']).optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function MedicalHistoryPage() {
  const [showForm, setShowForm] = useState(false);
  const { success, error } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['medical-history'],
    queryFn: () => patientService.getMedicalHistory(),
  });

  const items = data?.data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const addMutation = useMutation({
    mutationFn: (d: FormData) => patientService.addMedicalHistory(d as Record<string, unknown>),
    onSuccess: () => {
      success('Added', 'Medical history record added.');
      queryClient.invalidateQueries({ queryKey: ['medical-history'] });
      reset(); setShowForm(false);
    },
    onError: () => error('Error', 'Failed to add record.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.deleteMedicalHistory(id),
    onSuccess: () => {
      success('Deleted', 'Record removed.');
      queryClient.invalidateQueries({ queryKey: ['medical-history'] });
    },
    onError: () => error('Error', 'Failed to delete record.'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medical History</h1>
          <p className="text-muted-foreground">Your past and present medical conditions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />{showForm ? 'Cancel' : 'Add Condition'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Medical Condition</CardTitle></CardHeader>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition Name *</Label>
                  <Input {...register('conditionName')} placeholder="e.g. Hypertension" />
                  {errors.conditionName && <p className="text-xs text-destructive">{errors.conditionName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select {...register('conditionType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {['CHRONIC','ACUTE','SURGICAL','ALLERGY','GENETIC','OTHER'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <select {...register('severity')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select severity</option>
                    {['MILD','MODERATE','SEVERE','CRITICAL'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosed At</Label>
                  <Input type="date" {...register('diagnosedAt')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input {...register('description')} placeholder="Additional details..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register('isActive')} defaultChecked className="h-4 w-4" />
                <Label htmlFor="isActive">Currently active condition</Label>
              </div>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Saving...' : 'Save Condition'}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium">No medical history</p>
            <p className="text-muted-foreground">Add your medical conditions to help the AI consultation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.conditionName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>{item.isActive ? 'Active' : 'Resolved'}</span>
                      {item.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.severity === 'CRITICAL' ? 'bg-red-100 text-red-700'
                          : item.severity === 'SEVERE' ? 'bg-orange-100 text-orange-700'
                          : item.severity === 'MODERATE' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                        }`}>{item.severity}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.conditionType}</p>
                    {item.description && <p className="text-sm mt-1">{item.description}</p>}
                    {item.diagnosedAt && <p className="text-xs text-muted-foreground mt-1">Diagnosed: {formatDate(item.diagnosedAt)}</p>}
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
