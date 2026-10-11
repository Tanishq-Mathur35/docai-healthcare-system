import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { patientService } from '@/services/patient.service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useEffect } from 'react';

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

  const { data, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientService.getProfile(),
  });

  const profile = data?.data?.data;

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
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
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => patientService.updateProfile(data as Record<string, unknown>),
    onSuccess: () => {
      success('Profile updated', 'Your profile has been saved.');
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
    },
    onError: () => error('Update failed', 'Please try again.'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Keep your medical information up to date</p>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Personal info */}
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
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
                <Input {...register('city')} placeholder="New York" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input {...register('country')} placeholder="USA" />
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
            <CardTitle>Emergency Contact</CardTitle>
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
              <Input type="tel" {...register('emergencyContactPhone')} placeholder="+1 234 567 8900" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
