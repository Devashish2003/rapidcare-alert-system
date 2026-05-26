from django.core.management.base import BaseCommand

from apps.hospital.models import (
    Hospital, Department, BloodInventory, Equipment,
    EmergencyAlert, PatientReferral
)


class Command(BaseCommand):
    help = (
        'Initialize a hospital with default inventory (blood types + equipment). '
        'Pass --with-sample-data to also seed example departments, alerts, and referrals.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--name', default='City General Hospital', help='Hospital name')
        parser.add_argument('--address', default='', help='Hospital address')
        parser.add_argument('--phone', default='', help='Hospital phone')
        parser.add_argument('--email', default='', help='Hospital email')
        parser.add_argument(
            '--with-sample-data',
            action='store_true',
            help='Also create sample departments, emergency alerts, and patient referrals',
        )

    def handle(self, *args, **options):
        hospital, created = Hospital.objects.get_or_create(
            name=options['name'],
            defaults={
                'address': options['address'],
                'phone': options['phone'],
                'email': options['email'],
                'is_active': True,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created hospital: {hospital.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Hospital already exists: {hospital.name}'))

        # Always initialise blood inventory for all types
        for blood_type, _ in BloodInventory.BLOOD_TYPES:
            _, created = BloodInventory.objects.get_or_create(
                hospital=hospital,
                blood_type=blood_type,
                defaults={'units_available': 0},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Blood inventory: {blood_type}'))

        # Always initialise all equipment types
        for eq_type, _ in Equipment.EQUIPMENT_TYPES:
            _, created = Equipment.objects.get_or_create(
                hospital=hospital,
                equipment_type=eq_type,
                defaults={'is_available': False, 'total_count': 0, 'available_count': 0},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Equipment: {eq_type}'))

        if options['with_sample_data']:
            self._seed_sample_data(hospital)

        self.stdout.write(self.style.SUCCESS('Done.'))

    def _seed_sample_data(self, hospital):
        departments_data = [
            {'name': 'Cardiology', 'available_beds': 8, 'total_beds': 20, 'doctors_on_duty': 5},
            {'name': 'ICU', 'available_beds': 2, 'total_beds': 10, 'doctors_on_duty': 3},
            {'name': 'Emergency', 'available_beds': 12, 'total_beds': 30, 'doctors_on_duty': 6},
            {'name': 'Orthopedics', 'available_beds': 15, 'total_beds': 25, 'doctors_on_duty': 4},
            {'name': 'Neurology', 'available_beds': 6, 'total_beds': 15, 'doctors_on_duty': 3},
        ]
        for dept_data in departments_data:
            _, created = Department.objects.get_or_create(
                hospital=hospital,
                name=dept_data['name'],
                defaults=dept_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Department: {dept_data["name"]}'))

        alerts_data = [
            {
                'patient_name': 'Sample Patient A',
                'patient_age': 45,
                'patient_gender': 'Male',
                'case_description': 'Chest pain - suspected heart attack',
                'priority': 'high',
                'eta': '5 mins',
                'distance': '2.3 km',
                'ambulance_id': 'AMB-001',
                'tags': ['Cardiac', 'Emergency'],
            },
            {
                'patient_name': 'Sample Patient B',
                'patient_age': 32,
                'patient_gender': 'Female',
                'case_description': 'Motor vehicle accident - multiple injuries',
                'priority': 'medium',
                'eta': '8 mins',
                'distance': '3.7 km',
                'ambulance_id': 'AMB-002',
                'tags': ['Trauma', 'Emergency'],
            },
        ]
        for alert_data in alerts_data:
            _, created = EmergencyAlert.objects.get_or_create(
                receiving_hospital=hospital,
                patient_name=alert_data['patient_name'],
                defaults=alert_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Alert: {alert_data["patient_name"]}'))

        other_hospital, _ = Hospital.objects.get_or_create(
            name='Metro Medical Center',
            defaults={
                'address': '',
                'phone': '',
                'email': '',
                'is_active': True,
            }
        )

        referrals_data = [
            {
                'patient_name': 'Sample Referral Patient A',
                'patient_age': 52,
                'current_diagnosis': 'Complex cardiac condition',
                'reason_for_referral': 'Specialized cardiothoracic surgery needed',
                'required_specialty': 'Cardiology',
                'medical_documents': [],
                'referring_hospital': other_hospital,
                'receiving_hospital': hospital,
            },
        ]
        for referral_data in referrals_data:
            _, created = PatientReferral.objects.get_or_create(
                patient_name=referral_data['patient_name'],
                defaults=referral_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Referral: {referral_data["patient_name"]}'))
