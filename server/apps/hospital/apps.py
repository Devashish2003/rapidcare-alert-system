from django.apps import AppConfig


class HospitalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hospital'

    def ready(self):
        import apps.hospital.signals  # noqa: F401
