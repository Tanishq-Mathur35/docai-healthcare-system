import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { appointmentService } from '@/services/appointment.service';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  Calendar, Clock, Search, Star, MapPin, User,
  CheckCircle2, XCircle, Stethoscope, Pill, ArrowRight,
  ShieldCheck, HeartPulse, MessageSquare
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';

export default function AppointmentsPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'search' | 'my_appointments'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [appointmentType, setAppointmentType] = useState('IN_PERSON');

  // Search doctors query
  const { data: doctorsData, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['doctors-search', searchQuery, specialization],
    queryFn: () => appointmentService.searchDoctors({ query: searchQuery, specialization }),
    enabled: activeTab === 'search',
  });
  const doctors = doctorsData?.data?.data || [];

  // Available slots query for selected doctor and date
  const { data: slotsData, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['doctor-slots', selectedDoctor?.id, selectedDate],
    queryFn: () => appointmentService.getSlots(selectedDoctor.id, selectedDate),
    enabled: !!selectedDoctor && !!selectedDate,
  });
  const slots = slotsData?.data?.data?.slots || [];

  // My appointments query
  const { data: myApptsData, isLoading: isMyAppointmentsLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentService.getMyAppointments(),
    enabled: activeTab === 'my_appointments',
  });
  const myAppointments = myApptsData?.data?.data || [];

  // Book mutation
  const bookMutation = useMutation({
    mutationFn: (data: any) => appointmentService.book(data),
    onSuccess: () => {
      success('Appointment Booked!', 'Doctor notification sent. Check My Bookings.');
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setChiefComplaint('');
      setActiveTab('my_appointments');
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err: any) => {
      error('Booking Failed', err.response?.data?.message || 'Slot may have been taken.');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentService.cancel(id, reason),
    onSuccess: () => {
      success('Cancelled', 'Your appointment has been cancelled.');
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err: any) => {
      error('Error', err.response?.data?.message || 'Could not cancel appointment.');
    },
  });

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) return;
    bookMutation.mutate({
      doctorId: selectedDoctor.id,
      appointmentDate: selectedDate,
      slotStart: selectedSlot.start,
      slotEnd: selectedSlot.end,
      type: appointmentType,
      chiefComplaint: chiefComplaint || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Calendar className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctor Appointments</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Find verified medical specialists, schedule clinic or online video visits, and manage bookings.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Find Doctors
          </button>
          <button
            onClick={() => setActiveTab('my_appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'my_appointments'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> My Bookings ({myAppointments.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by physician name or hospital..."
                className="pl-10 rounded-2xl border-sky-200 bg-white text-xs h-11"
              />
            </div>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="h-11 rounded-2xl border border-sky-200 bg-white px-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 w-full sm:w-56"
            >
              <option value="">All Medical Specialties</option>
              <option value="General Physician">General Physician</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
            </select>
          </div>

          {/* Doctor Cards Grid */}
          {isDoctorsLoading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-500">Searching certified physicians...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sky-200 bg-white p-12 text-center space-y-2">
              <Stethoscope className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No doctors found matching filters</p>
              <p className="text-xs text-slate-500">Try clearing filters or search another specialty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc: any) => (
                <div
                  key={doc.id}
                  className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {doc.user?.firstName?.[0]}
                          {doc.user?.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">
                            Dr. {doc.user?.firstName} {doc.user?.lastName}
                          </h3>
                          <p className="text-xs text-sky-700 font-bold">{doc.specialization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{doc.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-[10px] text-amber-700/80 font-normal">({doc.totalRatings || 0})</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      {doc.hospital && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{doc.hospital}{doc.city ? `, ${doc.city}` : ''}</span>
                        </div>
                      )}
                      <p>Experience: {doc.experienceYears || 5} years in medical practice</p>
                      <p className="font-extrabold text-slate-900 text-sm pt-1">
                        Fee: ${Number(doc.consultationFee || 100).toFixed(2)} / visit
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSelectedSlot(null);
                      }}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20"
                    >
                      Book Consultation & View Slots
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Booking Drawer / Panel */}
          {selectedDoctor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border-2 border-sky-400 bg-white shadow-xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-sky-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Book Visit with Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
                  </h3>
                  <p className="text-xs text-sky-700 font-semibold">
                    {selectedDoctor.specialization} — ${Number(selectedDoctor.consultationFee).toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoctor(null)}
                  className="rounded-xl text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </Button>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Select Consultation Date</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="rounded-xl border-sky-200 text-xs h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Consultation Medium</label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-sky-200 bg-white px-3 text-xs font-semibold text-slate-700"
                    >
                      <option value="IN_PERSON">In-Person Hospital Visit</option>
                      <option value="ONLINE">Online Video Consultation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Available Time Slots</label>
                  {isSlotsLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-slate-500">No time slots available on this date. Please pick another date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {slots.map((slot: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                            !slot.isAvailable
                              ? 'bg-slate-100 text-slate-400 border-dashed cursor-not-allowed'
                              : selectedSlot?.start === slot.start
                              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30'
                              : 'bg-white hover:border-sky-400 text-slate-700'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 mx-auto mb-1 opacity-70" />
                          {slot.start}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Consultation (Optional)</label>
                  <Input
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Follow-up on persistent joint pain, medication renewal..."
                    className="rounded-xl border-sky-200 text-xs h-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/20 text-xs"
                  disabled={!selectedSlot || bookMutation.isPending}
                >
                  {bookMutation.isPending
                    ? 'Confirming Booking...'
                    : `Confirm Booking for ${selectedDate} at ${selectedSlot?.start || '...'}`}
                </Button>
              </form>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab 2: My Bookings */}
      {activeTab === 'my_appointments' && (
        <div>
          {isMyAppointmentsLoading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-slate-500">Loading your consultations...</p>
            </div>
          ) : myAppointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sky-200 bg-white p-12 text-center space-y-2">
              <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No appointments booked yet</p>
              <p className="text-xs text-slate-500">Switch to 'Find Doctors' to schedule your first consultation.</p>
              <Button onClick={() => setActiveTab('search')} size="sm" className="mt-2 bg-sky-600 text-white rounded-xl text-xs">
                Browse Doctors
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myAppointments.map((appt: any) => (
                <div
                  key={appt.id}
                  className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          appt.status === 'SCHEDULED'
                            ? 'bg-sky-100 text-sky-800'
                            : appt.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold uppercase">
                        {appt.type}
                      </span>
                    </div>

                    <p className="text-xs text-sky-700 font-semibold">
                      Specialty: {appt.doctor?.specialization}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Calendar className="h-3.5 w-3.5 text-sky-600" /> {formatDate(appt.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-sky-600" /> {appt.slotStart} - {appt.slotEnd}
                      </span>
                    </div>

                    {appt.chiefComplaint && (
                      <p className="text-xs text-slate-500 italic pt-0.5">
                        Note: "{appt.chiefComplaint}"
                      </p>
                    )}

                    {appt.prescription && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <Pill className="h-3 w-3" /> Prescription Issued
                        </span>
                        <Link
                          to="/patient/prescriptions"
                          className="text-xs text-sky-700 font-bold hover:underline flex items-center gap-1"
                        >
                          View Prescription →
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button asChild size="sm" variant="outline" className="gap-1 rounded-xl border-sky-300 text-sky-700 hover:bg-sky-50 text-xs">
                      <Link to="/patient/chat">
                        <MessageSquare className="h-3.5 w-3.5" /> Message Doctor
                      </Link>
                    </Button>
                    {appt.prescription && (
                      <Button asChild size="sm" variant="outline" className="gap-1 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs">
                        <Link to="/patient/prescriptions">
                          <Pill className="h-3.5 w-3.5" /> Rx Pad
                        </Link>
                      </Button>
                    )}
                    {appt.status === 'SCHEDULED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          const reason = prompt('Please enter cancellation reason:');
                          if (reason) cancelMutation.mutate({ id: appt.id, reason });
                        }}
                        className="rounded-xl text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

