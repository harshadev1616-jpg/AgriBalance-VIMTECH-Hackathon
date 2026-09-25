from django.db import models


class GovernmentScheme(models.Model):
    name = models.CharField(max_length=200)
    department = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    eligibility = models.TextField()
    state = models.CharField(max_length=80, blank=True, help_text="Blank means applicable across states.")
    crops = models.JSONField(default=list, blank=True)
    farmer_categories = models.JSONField(default=list, blank=True)
    benefits = models.TextField()
    required_documents = models.JSONField(default=list, blank=True)
    application_process = models.TextField()
    deadline = models.DateField(null=True, blank=True)
    official_source_url = models.URLField(blank=True)
    application_url = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["deadline", "name"]

    def __str__(self):
        return self.name
