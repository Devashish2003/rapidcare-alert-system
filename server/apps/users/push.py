import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def send_push_to_hospital_staff(hospital_id, title, body, data=None):
    """Send a Web Push notification to all subscribed staff of the given hospital."""
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed — push notifications disabled")
        return

    from .models import PushSubscription
    from apps.users.models import UserProfile

    staff_user_ids = UserProfile.objects.filter(
        hospital_id=hospital_id
    ).values_list('user_id', flat=True)

    subscriptions = PushSubscription.objects.filter(user_id__in=staff_user_ids)
    payload = json.dumps({"title": title, "body": body, "data": data or {}})

    expired = []
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{settings.VAPID_ADMIN_EMAIL}"},
            )
        except WebPushException as e:
            if e.response is not None and e.response.status_code == 410:
                expired.append(sub.pk)
            else:
                logger.warning("Push failed for sub %s: %s", sub.pk, e)
        except Exception as e:
            logger.warning("Push error for sub %s: %s", sub.pk, e)

    if expired:
        PushSubscription.objects.filter(pk__in=expired).delete()
