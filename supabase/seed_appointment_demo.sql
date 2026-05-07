-- Hygieia Appointment Demo Seed Data
-- Run this after supabase/tables_only.sql.
-- It creates realistic users, doctors, existing appointments, payments, and notification rows.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Keep existing projects compatible if notifications were not created yet.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  phone VARCHAR,
  phone_number VARCHAR,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  type VARCHAR NOT NULL DEFAULT 'general',
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}',
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_active_slot
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE cancelled = FALSE AND status <> 'cancelled';

INSERT INTO users (id, email, name, phone, gender, dob, image, address)
VALUES
  (
    '88888888-8888-4888-8888-888888888888',
    'patient@example.com',
    'Test Patient',
    '+919999999999',
    'Not Selected',
    '1998-01-15',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=patient',
    '{"line1": "Salt Lake Sector V", "line2": "Kolkata, West Bengal"}'
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    'aarav.sen@example.com',
    'Aarav Sen',
    '+919888888888',
    'Male',
    '1995-07-22',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=aarav',
    '{"line1": "Park Street", "line2": "Kolkata, West Bengal"}'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  gender = EXCLUDED.gender,
  dob = EXCLUDED.dob,
  image = EXCLUDED.image,
  address = EXCLUDED.address,
  updated_at = NOW();

INSERT INTO doctors (
  id, name, email, image, speciality, degree, experience, about, available, fees, slots_booked, address
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'Dr. Sarah Johnson',
    'sarah.johnson@example.com',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'Cardiology',
    'MD, FACC',
    '10+ years',
    'Board-certified cardiologist specializing in preventive cardiology, hypertension, and heart failure management.',
    TRUE,
    1500,
    jsonb_build_object((CURRENT_DATE + INTERVAL '2 day')::date::text, jsonb_build_array('10:00 AM')),
    '{"line1": "Hygieia Heart Center, Salt Lake Sector V", "city": "Kolkata", "state": "West Bengal", "zip": "700091"}'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Dr. Michael Chen',
    'michael.chen@example.com',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'Neurology',
    'MD, PhD',
    '15+ years',
    'Neurologist focused on migraines, epilepsy, movement disorders, and neurodegenerative disease care.',
    TRUE,
    1800,
    '{}',
    '{"line1": "Hygieia Neuro Clinic, EM Bypass", "city": "Kolkata", "state": "West Bengal", "zip": "700107"}'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Dr. Emily Rodriguez',
    'emily.rodriguez@example.com',
    'https://randomuser.me/api/portraits/women/68.jpg',
    'Pulmonology',
    'MD',
    '8+ years',
    'Pulmonologist with expertise in asthma, COPD, respiratory infections, and sleep medicine.',
    TRUE,
    1300,
    '{}',
    '{"line1": "Hygieia Respiratory Care, New Town", "city": "Kolkata", "state": "West Bengal", "zip": "700156"}'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Dr. Rajiv Sharma',
    'rajiv.sharma@example.com',
    'https://randomuser.me/api/portraits/men/45.jpg',
    'Orthopedics',
    'MBBS, MS Orthopedics',
    '12+ years',
    'Orthopedic surgeon specializing in joint replacements, fracture care, and sports injury rehabilitation.',
    TRUE,
    1600,
    '{}',
    '{"line1": "Hygieia Bone & Joint Center, Ballygunge", "city": "Kolkata", "state": "West Bengal", "zip": "700019"}'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Dr. Nandini Bose',
    'nandini.bose@example.com',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'Endocrinology',
    'DM Endocrinology',
    '11+ years',
    'Endocrinologist treating diabetes, thyroid disorders, PCOS, obesity, and metabolic conditions.',
    TRUE,
    1400,
    '{}',
    '{"line1": "Hygieia Diabetes & Thyroid Clinic, Gariahat", "city": "Kolkata", "state": "West Bengal", "zip": "700029"}'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Dr. Arjun Mehta',
    'arjun.mehta@example.com',
    'https://randomuser.me/api/portraits/men/76.jpg',
    'Gastroenterology',
    'DM Gastroenterology',
    '14+ years',
    'Gastroenterologist specializing in liver disease, acidity, IBS, endoscopy, and digestive health.',
    TRUE,
    1700,
    '{}',
    '{"line1": "Hygieia Digestive Health, Alipore", "city": "Kolkata", "state": "West Bengal", "zip": "700027"}'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'Dr. Meera Iyer',
    'meera.iyer@example.com',
    'https://randomuser.me/api/portraits/women/50.jpg',
    'Dermatology',
    'MD Dermatology',
    '9+ years',
    'Dermatologist treating acne, eczema, hair fall, skin allergies, and suspicious skin lesions.',
    TRUE,
    1200,
    '{}',
    '{"line1": "Hygieia Skin Clinic, Lake Town", "city": "Kolkata", "state": "West Bengal", "zip": "700089"}'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Dr. Priya Kapoor',
    'priya.kapoor@example.com',
    'https://randomuser.me/api/portraits/women/36.jpg',
    'Pediatrics',
    'MD Pediatrics',
    '13+ years',
    'Pediatrician providing child wellness visits, immunization support, growth tracking, and fever care.',
    TRUE,
    1100,
    '{}',
    '{"line1": "Hygieia Child Care, Behala", "city": "Kolkata", "state": "West Bengal", "zip": "700034"}'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Dr. Kabir Khan',
    'kabir.khan@example.com',
    'https://randomuser.me/api/portraits/men/54.jpg',
    'Ophthalmology',
    'MS Ophthalmology',
    '10+ years',
    'Ophthalmologist treating vision problems, cataract screening, dry eye, and diabetic eye checks.',
    TRUE,
    1250,
    '{}',
    '{"line1": "Hygieia Eye Center, Ultadanga", "city": "Kolkata", "state": "West Bengal", "zip": "700067"}'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Dr. Aisha Rahman',
    'aisha.rahman@example.com',
    'https://randomuser.me/api/portraits/women/28.jpg',
    'Oncology',
    'DM Medical Oncology',
    '16+ years',
    'Medical oncologist focused on cancer screening guidance, chemotherapy planning, and survivorship care.',
    TRUE,
    2200,
    '{}',
    '{"line1": "Hygieia Cancer Care, Park Circus", "city": "Kolkata", "state": "West Bengal", "zip": "700017"}'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  image = EXCLUDED.image,
  speciality = EXCLUDED.speciality,
  degree = EXCLUDED.degree,
  experience = EXCLUDED.experience,
  about = EXCLUDED.about,
  available = EXCLUDED.available,
  fees = EXCLUDED.fees,
  slots_booked = EXCLUDED.slots_booked,
  address = EXCLUDED.address,
  updated_at = NOW();

INSERT INTO appointments (
  id, user_id, doctor_id, appointment_date, appointment_time, status, payment, cancelled
)
VALUES
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '88888888-8888-4888-8888-888888888888',
    '11111111-1111-4111-8111-111111111111',
    (CURRENT_DATE + INTERVAL '2 day')::date,
    '10:00 AM',
    'confirmed',
    TRUE,
    FALSE
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '99999999-9999-4999-8999-999999999999',
    '55555555-5555-4555-8555-555555555555',
    (CURRENT_DATE + INTERVAL '4 day')::date,
    '2:30 PM',
    'pending',
    FALSE,
    FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  doctor_id = EXCLUDED.doctor_id,
  appointment_date = EXCLUDED.appointment_date,
  appointment_time = EXCLUDED.appointment_time,
  status = EXCLUDED.status,
  payment = EXCLUDED.payment,
  cancelled = EXCLUDED.cancelled,
  updated_at = NOW();

INSERT INTO payments (id, appointment_id, amount, payment_id, payment_status)
VALUES
  (
    'abababab-abab-4aba-8aba-abababababab',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    1500,
    'pay_demo_confirmed_001',
    'completed'
  )
ON CONFLICT (id) DO UPDATE SET
  appointment_id = EXCLUDED.appointment_id,
  amount = EXCLUDED.amount,
  payment_id = EXCLUDED.payment_id,
  payment_status = EXCLUDED.payment_status,
  updated_at = NOW();

INSERT INTO notifications (
  id, user_id, phone, phone_number, message, scheduled_time, type, status, metadata, sent, sent_at
)
VALUES
  (
    'cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd',
    '88888888-8888-4888-8888-888888888888',
    '+919999999999',
    '+919999999999',
    'Hygieia appointment confirmed with Dr. Sarah Johnson. Please arrive 15 minutes early.',
    NOW(),
    'appointment',
    'sent',
    '{"appointmentId": "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "doctorName": "Dr. Sarah Johnson"}',
    TRUE,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  phone = EXCLUDED.phone,
  phone_number = EXCLUDED.phone_number,
  message = EXCLUDED.message,
  scheduled_time = EXCLUDED.scheduled_time,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  sent = EXCLUDED.sent,
  sent_at = EXCLUDED.sent_at,
  updated_at = NOW();
