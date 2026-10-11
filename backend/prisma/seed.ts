import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@docai.com' },
    update: {},
    create: {
      email: 'admin@docai.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Demo patient
  const patientHash = await bcrypt.hash('Patient@123456', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@docai.com' },
    update: {},
    create: {
      email: 'patient@docai.com',
      passwordHash: patientHash,
      role: Role.PATIENT,
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: true,
      isActive: true,
    },
  });
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      age: 35,
      gender: 'MALE',
      bloodGroup: 'O_POSITIVE',
      allergies: ['Penicillin'],
      chronicDiseases: ['Hypertension'],
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1234567890',
      emergencyContactRelation: 'Spouse',
    },
  });
  console.log('✅ Demo patient created:', patientUser.email);

  // Demo doctor
  const doctorHash = await bcrypt.hash('Doctor@123456', 12);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@docai.com' },
    update: {},
    create: {
      email: 'doctor@docai.com',
      passwordHash: doctorHash,
      role: Role.DOCTOR,
      firstName: 'Sarah',
      lastName: 'Johnson',
      isEmailVerified: true,
      isActive: true,
    },
  });
  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: 'General Physician',
      licenseNumber: 'MD-2024-001',
      experienceYears: 10,
      hospital: 'City Medical Center',
      city: 'New York',
      country: 'USA',
      rating: 4.8,
      totalRatings: 120,
      consultationFee: 100,
      isVerified: true,
      isAvailable: true,
      qualifications: ['MBBS', 'MD Internal Medicine'],
    },
  });
  console.log('✅ Demo doctor created:', doctorUser.email);

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
