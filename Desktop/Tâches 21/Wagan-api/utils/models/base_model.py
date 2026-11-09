from django.db import models

class BaseModel(models.Model): 
  created_at = models.DateTimeField(auto_now_add=True, null=True)
  updated_at = models.DateTimeField(auto_now=True)
  archived = models.BooleanField(default=False)

  class Meta:
    abstract = True
