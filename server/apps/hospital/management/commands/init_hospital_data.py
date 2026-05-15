from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.hospital.models import (
    Hospital, Department, BloodInventory, Equipment,
    EmergencyAlert, PatientReferral
)

class Command(BaseCommand):
    help = 'Initialize hospital module with sample data'

    def handle(self, *args, **options):
        # Create sample hospital
        hospital, created = Hospital.objects.get_or_create(
            name="City General Hospital",
            defaults={
                'address': '123 Main St, City, State 12345',
                'phone': '+1-555-0123',
                'email': 'info@citygeneral.com',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created hospital: {hospital.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Hospital already exists: {hospital.name}'))
        
        # Create departments
        departments_data = [
            {'name': 'Cardiology', 'available_beds': 8, 'total_beds': 20, 'doctors_on_duty': 5},
            {'name': 'ICU', 'available_beds': 2, 'total_beds': 10, 'doctors_on_duty': 3},
            {'name': 'Emergency', 'available_beds': 12, 'total_beds': 30, 'doctors_on_duty': 6},
            {'name': 'Orthopedics', 'available_beds': 15, 'total_beds': 25, 'doctors_on_duty': 4},
            {'name': 'Neurology', 'available_beds': 6, 'total_beds': 15, 'doctors_on_duty': 3},
        ]
        
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                hospital=hospital,
                name=dept_data['name'],
                defaults=dept_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created department: {dept.name}'))
        
        # Create blood inventory
        blood_types = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        for blood_type in blood_types:
            inventory, created = BloodInventory.objects.get_or_create(
                hospital=hospital,
                blood_type=blood_type,
                defaults={'units_available': 20}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created blood inventory: {blood_type}'))
        
        # Create equipment
        equipment_data = [
            {'equipment_type': 'ventilators', 'total_count': 10, 'available_count': 8},
            {'equipment_type': 'defibrillators', 'total_count': 15, 'available_count': 15},
            {'equipment_type': 'ct', 'total_count': 2, 'available_count': 2},
            {'equipment_type': 'mri', 'total_count': 1, 'available_count': 1},
            {'equipment_type': 'xray', 'total_count': 3, 'available_count': 3},
            {'equipment_type': 'dialysis', 'total_count': 5, 'available_count': 4},
        ]
        
        for eq_data in equipment_data:
            equipment, created = Equipment.objects.get_or_create(
                hospital=hospital,
                equipment_type=eq_data['equipment_type'],
                defaults={
                    'total_count': eq_data['total_count'],
                    'available_count': eq_data['available_count'],
                    'is_available': eq_data['available_count'] > 0
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created equipment: {equipment.get_equipment_type_display()}'))
        
        # Create sample emergency alerts
        alerts_data = [
            {
                'patient_name': 'John Doe',
                'patient_age': 45,
                'patient_gender': 'Male',
                'case_description': 'Chest pain - suspected heart attack',
                'priority': 'high',
                'eta': '5 mins',
                'distance': '2.3 km',
                'ambulance_id': 'AMB-001',
                'tags': ['Cardiac', 'Emergency', 'Adult']
            },
            {
                'patient_name': 'Jane Smith',
                'patient_age': 32,
                'patient_gender': 'Female',
                'case_description': 'Motor vehicle accident - multiple injuries',
                'priority': 'medium',
                'eta': '8 mins',
                'distance': '3.7 km',
                'ambulance_id': 'AMB-002',
                'tags': ['Trauma', 'Emergency', 'Adult']
            },
            {
                'patient_name': 'Robert Johnson',
                'patient_age': 67,
                'patient_gender': 'Male',
                'case_description': 'Difficulty breathing - COPD exacerbation',
                'priority': 'low',
                'eta': '12 mins',
                'distance': '5.1 km',
                'ambulance_id': 'AMB-003',
                'tags': ['Respiratory', 'Non-Emergency', 'Senior']
            }
        ]
        
        for alert_data in alerts_data:
            alert, created = EmergencyAlert.objects.get_or_create(
                receiving_hospital=hospital,
                patient_name=alert_data['patient_name'],
                defaults=alert_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created emergency alert: {alert.patient_name}'))
        
        # Create sample referrals
        # First create another hospital for referrals
        other_hospital, created = Hospital.objects.get_or_create(
            name="Metro Medical Center",
            defaults={
                'address': '456 Oak Ave, Metro City, State 67890',
                'phone': '+1-555-0456',
                'email': 'info@metromedical.com',
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created hospital: {other_hospital.name}'))
        
        referrals_data = [
            {
                'patient_name': 'David Wilson',
                'patient_age': 52,
                'current_diagnosis': 'Complex cardiac condition',
                'reason_for_referral': 'Specialized cardiothoracic surgery needed',
                'required_specialty': 'Cardiology',
                'medical_documents': ['ecg.pdf', 'chest_xray.jpg', 'blood_test.pdf'],
                'referring_hospital': other_hospital,
                'receiving_hospital': hospital,
            },
            {
                'patient_name': 'Emma Davis',
                'patient_age': 34,
                'current_diagnosis': 'Brain tumor detected',
                'reason_for_referral': 'Neurosurgery consultation required',
                'required_specialty': 'Neurosurgery',
                'medical_documents': ['mri_scan.pdf', 'neuro_report.pdf', 'ct_scan.pdf', 'blood_work.pdf', 'consent_form.pdf'],
                'referring_hospital': other_hospital,
                'receiving_hospital': hospital,
            }
        ]
        
        for referral_data in referrals_data:
            referral, created = PatientReferral.objects.get_or_create(
                patient_name=referral_data['patient_name'],
                defaults=referral_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created patient referral: {referral.patient_name}'))
        
        self.stdout.write(self.style.SUCCESS('Hospital data initialization completed successfully!'))
