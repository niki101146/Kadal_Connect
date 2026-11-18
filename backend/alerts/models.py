from django.db import models


class SeaAlert(models.Model):
    class Severity(models.TextChoices):
        INFO = "INFO"
        WARNING = "WARNING"
        DANGER = "DANGER"

    harbor = models.ForeignKey("accounts.Harbor", null=True, blank=True, on_delete=models.CASCADE,
                               help_text="Leave empty to alert all harbors")
    severity = models.CharField(max_length=7, choices=Severity.choices, default=Severity.INFO)
    title = models.CharField(max_length=120)
    message = models.TextField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
