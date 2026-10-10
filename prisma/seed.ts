/**
 * Fictional demonstration data only — per the brief, never copy real
 * patient records into this environment. Every name/address/phone here is
 * made up for development and demo purposes.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "DemoPass123!";

async function main() {
  await prisma.$executeRaw`INSERT INTO "RequestNumberCounter" (id, value) VALUES (1, 100) ON CONFLICT (id) DO NOTHING`;

  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "[DEMO] Piedmont Regional Health Partners",
      status: "ACTIVE",
    },
  });

  const snf = await prisma.facility.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      organizationId: org.id,
      name: "[DEMO] Forsyth Skilled Nursing & Rehab",
      facilityType: "SKILLED_NURSING",
      addressLine1: "100 Demo Care Lane",
      city: "Winston-Salem",
      state: "NC",
      zip: "27101",
      phone: "336-555-0101",
      billingEmail: "billing@forsythsnf.demo",
      accountStatus: "ACTIVE",
    },
  });

  const hospital = await prisma.facility.upsert({
    where: { id: "00000000-0000-0000-0000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000012",
      organizationId: org.id,
      name: "[DEMO] Piedmont Triad Medical Center",
      facilityType: "HOSPITAL",
      addressLine1: "200 Demo Hospital Drive",
      city: "Winston-Salem",
      state: "NC",
      zip: "27103",
      phone: "336-555-0102",
      billingEmail: "billing@piedmonttriadmc.demo",
      accountStatus: "ACTIVE",
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const facilityAdmin = await prisma.user.upsert({
    where: { email: "admin@forsythsnf.demo" },
    update: {},
    create: {
      name: "[DEMO] Dana Admin",
      email: "admin@forsythsnf.demo",
      passwordHash,
      status: "ACTIVE",
    },
  });

  const facilityScheduler = await prisma.user.upsert({
    where: { email: "scheduler@piedmonttriadmc.demo" },
    update: {},
    create: {
      name: "[DEMO] Sam Scheduler",
      email: "scheduler@piedmonttriadmc.demo",
      passwordHash,
      status: "ACTIVE",
    },
  });

  // Dana administers the SNF and can also view (as scheduler) at the
  // hospital — demonstrates the multi-facility membership support.
  await prisma.facilityMembership.upsert({
    where: { userId_facilityId: { userId: facilityAdmin.id, facilityId: snf.id } },
    update: {},
    create: { userId: facilityAdmin.id, facilityId: snf.id, role: "FACILITY_ADMIN", status: "ACTIVE" },
  });
  await prisma.facilityMembership.upsert({
    where: { userId_facilityId: { userId: facilityAdmin.id, facilityId: hospital.id } },
    update: {},
    create: { userId: facilityAdmin.id, facilityId: hospital.id, role: "FACILITY_SCHEDULER", status: "ACTIVE" },
  });
  await prisma.facilityMembership.upsert({
    where: { userId_facilityId: { userId: facilityScheduler.id, facilityId: hospital.id } },
    update: {},
    create: { userId: facilityScheduler.id, facilityId: hospital.id, role: "FACILITY_SCHEDULER", status: "ACTIVE" },
  });

  // Internal Allegiance staff (modeled now; dispatch UI is a later phase).
  await prisma.user.upsert({
    where: { email: "dispatcher@rideallegiance.demo" },
    update: {},
    create: {
      name: "[DEMO] Dispatch Dana",
      email: "dispatcher@rideallegiance.demo",
      passwordHash,
      status: "ACTIVE",
      internalRole: "DISPATCHER",
    },
  });

  const eleanor = await prisma.patient.upsert({
    where: { id: "00000000-0000-0000-0000-000000000021" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000021",
      facilityId: snf.id,
      name: "[DEMO] Eleanor H.",
      authorizedContactName: "[DEMO] Karen H. (daughter)",
      authorizedContactPhone: "336-555-0201",
      mobilityRequirements: "WHEELCHAIR",
      assistanceNotes: "Uses a manual wheelchair; needs securement during transport.",
    },
  });

  const walter = await prisma.patient.upsert({
    where: { id: "00000000-0000-0000-0000-000000000022" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000022",
      facilityId: hospital.id,
      name: "[DEMO] Walter B.",
      authorizedContactName: "[DEMO] Nurse Unit 4",
      authorizedContactPhone: "336-555-0102",
      mobilityRequirements: "AMBULATORY",
    },
  });

  const margaret = await prisma.patient.upsert({
    where: { id: "00000000-0000-0000-0000-000000000023" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000023",
      facilityId: snf.id,
      name: "[DEMO] Margaret T.",
      authorizedContactName: "[DEMO] Front Desk",
      authorizedContactPhone: "336-555-0101",
      mobilityRequirements: "WHEELCHAIR",
    },
  });

  async function nextNumber() {
    const rows = await prisma.$queryRaw<{ value: number }[]>`
      UPDATE "RequestNumberCounter" SET value = value + 1 WHERE id = 1 RETURNING value
    `;
    return `ATS-${String(rows[0].value).padStart(6, "0")}`;
  }

  const inTwoDays = new Date();
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  inTwoDays.setHours(10, 0, 0, 0);

  const inFiveDays = new Date();
  inFiveDays.setDate(inFiveDays.getDate() + 5);
  inFiveDays.setHours(13, 30, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  // 1. Hospital discharge request — wheelchair, SUBMITTED.
  const discharge = await prisma.rideRequest.create({
    data: {
      publicRequestNumber: await nextNumber(),
      facilityId: hospital.id,
      patientId: walter.id,
      createdByUserId: facilityScheduler.id,
      serviceType: "WHEELCHAIR",
      tripType: "ONE_WAY",
      appointmentDateTime: inTwoDays,
      status: "SUBMITTED",
      urgency: "ROUTINE",
      submissionKey: crypto.randomUUID(),
      legs: {
        create: [
          {
            sequence: 1,
            pickupAddressLine1: "200 Demo Hospital Drive",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27103",
            destinationAddressLine1: "100 Demo Care Lane",
            destinationCity: "Winston-Salem",
            destinationState: "NC",
            destinationZip: "27101",
            requestedPickupTime: inTwoDays,
          },
        ],
      },
      statusEvents: {
        create: [{ previousStatus: null, newStatus: "SUBMITTED", actorUserId: facilityScheduler.id }],
      },
    },
  });

  // 2. Wheelchair transportation, CONFIRMED with a pickup time set.
  const confirmedPickup = new Date(inFiveDays);
  await prisma.rideRequest.create({
    data: {
      publicRequestNumber: await nextNumber(),
      facilityId: snf.id,
      patientId: eleanor.id,
      createdByUserId: facilityAdmin.id,
      serviceType: "WHEELCHAIR",
      tripType: "ROUND_TRIP",
      appointmentDateTime: inFiveDays,
      status: "CONFIRMED",
      urgency: "ROUTINE",
      externalDispatchReference: "MR-DEMO-48213",
      submissionKey: crypto.randomUUID(),
      legs: {
        create: [
          {
            sequence: 1,
            pickupAddressLine1: "100 Demo Care Lane",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27101",
            destinationAddressLine1: "350 Demo Specialty Clinic Rd",
            destinationCity: "Winston-Salem",
            destinationState: "NC",
            destinationZip: "27104",
            requestedPickupTime: inFiveDays,
            confirmedPickupTime: confirmedPickup,
            status: "CONFIRMED",
          },
          {
            sequence: 2,
            pickupAddressLine1: "350 Demo Specialty Clinic Rd",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27104",
            destinationAddressLine1: "100 Demo Care Lane",
            destinationCity: "Winston-Salem",
            destinationState: "NC",
            destinationZip: "27101",
            requestedPickupTime: new Date(inFiveDays.getTime() + 2 * 60 * 60 * 1000),
          },
        ],
      },
      statusEvents: {
        create: [
          { previousStatus: null, newStatus: "SUBMITTED", actorUserId: facilityAdmin.id },
          { previousStatus: "SUBMITTED", newStatus: "UNDER_REVIEW", actorUserId: facilityAdmin.id },
          { previousStatus: "UNDER_REVIEW", newStatus: "CONFIRMED", actorUserId: facilityAdmin.id },
        ],
      },
    },
  });

  // 3. Transitional care request (companion, hospital discharge type).
  const transitional = await prisma.rideRequest.create({
    data: {
      publicRequestNumber: await nextNumber(),
      facilityId: hospital.id,
      patientId: walter.id,
      createdByUserId: facilityScheduler.id,
      serviceType: "AMBULATORY",
      tripType: "ONE_WAY",
      appointmentDateTime: nextWeek,
      status: "UNDER_REVIEW",
      urgency: "ROUTINE",
      companionRequested: true,
      estimatedCompanionDuration: 90,
      submissionKey: crypto.randomUUID(),
      legs: {
        create: [
          {
            sequence: 1,
            pickupAddressLine1: "200 Demo Hospital Drive",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27103",
            destinationAddressLine1: "45 Demo Residential Ct",
            destinationCity: "Clemmons",
            destinationState: "NC",
            destinationZip: "27012",
            requestedPickupTime: nextWeek,
          },
        ],
      },
      statusEvents: {
        create: [
          { previousStatus: null, newStatus: "SUBMITTED", actorUserId: facilityScheduler.id },
          { previousStatus: "SUBMITTED", newStatus: "UNDER_REVIEW", actorUserId: facilityScheduler.id },
        ],
      },
    },
  });
  await prisma.companionRequest.create({
    data: {
      rideRequestId: transitional.id,
      companionServiceType: "TRANSITIONAL_CARE",
      requestedAssistance: "Hospital-to-home discharge; accompany into residence and confirm safe handoff.",
      estimatedDurationMinutes: 90,
      pickupHandoffContactName: "[DEMO] Discharge Nurse, Unit 4",
      pickupHandoffContactPhone: "336-555-0102",
      destinationHandoffContactName: "[DEMO] Karen H. (family)",
      destinationHandoffContactPhone: "336-555-0201",
      postArrivalAssistanceRequested: true,
      postArrivalAssistanceNotes: "Assist into home and confirm family member present before departing.",
      reviewStatus: "PENDING",
    },
  });

  // 4. Companion-supported outpatient appointment (infusion).
  const infusionDate = new Date();
  infusionDate.setDate(infusionDate.getDate() + 3);
  infusionDate.setHours(8, 30, 0, 0);
  const infusion = await prisma.rideRequest.create({
    data: {
      publicRequestNumber: await nextNumber(),
      facilityId: snf.id,
      patientId: margaret.id,
      createdByUserId: facilityAdmin.id,
      serviceType: "WHEELCHAIR",
      tripType: "ROUND_TRIP",
      appointmentDateTime: infusionDate,
      status: "SUBMITTED",
      urgency: "ROUTINE",
      companionRequested: true,
      estimatedCompanionDuration: 180,
      submissionKey: crypto.randomUUID(),
      legs: {
        create: [
          {
            sequence: 1,
            pickupAddressLine1: "100 Demo Care Lane",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27101",
            destinationAddressLine1: "80 Demo Infusion Center Pkwy",
            destinationCity: "Winston-Salem",
            destinationState: "NC",
            destinationZip: "27105",
            requestedPickupTime: infusionDate,
          },
          {
            sequence: 2,
            pickupAddressLine1: "80 Demo Infusion Center Pkwy",
            pickupCity: "Winston-Salem",
            pickupState: "NC",
            pickupZip: "27105",
            destinationAddressLine1: "100 Demo Care Lane",
            destinationCity: "Winston-Salem",
            destinationState: "NC",
            destinationZip: "27101",
            requestedPickupTime: new Date(infusionDate.getTime() + 3 * 60 * 60 * 1000),
          },
        ],
      },
      statusEvents: { create: [{ previousStatus: null, newStatus: "SUBMITTED", actorUserId: facilityAdmin.id }] },
    },
  });
  await prisma.companionRequest.create({
    data: {
      rideRequestId: infusion.id,
      companionServiceType: "APPOINTMENT_ESCORT",
      requestedAssistance: "Infusion appointment — wait during treatment and escort back to vehicle.",
      estimatedDurationMinutes: 180,
      reviewStatus: "PENDING",
    },
  });

  // 5. Recurring dialysis schedule.
  await prisma.recurringSchedule.create({
    data: {
      facilityId: snf.id,
      patientId: eleanor.id,
      frequency: "SELECTED_WEEKDAYS",
      weekdays: ["MON", "WED", "FRI"],
      startDate: new Date(),
      appointmentTime: "09:00",
      serviceType: "WHEELCHAIR",
      tripType: "ROUND_TRIP",
      companionRequested: false,
      status: "ACTIVE",
    },
  });

  console.log("Seed complete:");
  console.log(`  Facility admin login: admin@forsythsnf.demo / ${DEMO_PASSWORD}`);
  console.log(`  Facility scheduler login: scheduler@piedmonttriadmc.demo / ${DEMO_PASSWORD}`);
  console.log(`  Ride requests created: discharge=${discharge.publicRequestNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
