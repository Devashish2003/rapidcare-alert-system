from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import EmergencyAlert, PatientReferral


def _send_to_group(group_name, message):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(group_name, message)


@receiver(post_save, sender=EmergencyAlert)
def push_emergency_alert(sender, instance, created, **kwargs):
    group = f"hospital_{instance.receiving_hospital_id}_alerts"
    event_type = "new_alert" if created else "alert_updated"

    alert_data = {
        "id": instance.id,
        "patient_name": instance.patient_name,
        "patient_age": instance.patient_age,
        "patient_gender": instance.patient_gender,
        "case_description": instance.case_description,
        "priority": instance.priority,
        "status": instance.status,
        "eta": instance.eta,
        "distance": instance.distance,
        "ambulance_id": instance.ambulance_id,
        "tags": instance.tags,
        "created_at": str(instance.created_at),
    }

    _send_to_group(group, {"type": event_type, "data": alert_data})

    # Background push notification (reaches staff even when the tab is closed)
    if created:
        try:
            from apps.users.push import send_push_to_hospital_staff
            priority_label = instance.priority.upper() if instance.priority else "NEW"
            desc = (instance.case_description or "")[:80]
            send_push_to_hospital_staff(
                hospital_id=instance.receiving_hospital_id,
                title=f"🚨 {priority_label} Alert — {instance.patient_name}",
                body=f"Age {instance.patient_age} · {desc}",
                data={"alertId": instance.id, "url": "/alerts"},
            )
        except Exception:
            pass


@receiver(post_save, sender=PatientReferral)
def push_patient_referral(sender, instance, created, **kwargs):
    if not created:
        return
    group = f"hospital_{instance.receiving_hospital_id}_alerts"

    _send_to_group(group, {
        "type": "new_referral",
        "data": {
            "id": instance.id,
            "patient_name": instance.patient_name,
            "patient_age": instance.patient_age,
            "current_diagnosis": instance.current_diagnosis,
            "reason_for_referral": instance.reason_for_referral,
            "required_specialty": instance.required_specialty,
            "referring_hospital": instance.referring_hospital.name,
            "status": instance.status,
            "created_at": str(instance.created_at),
        },
    })
