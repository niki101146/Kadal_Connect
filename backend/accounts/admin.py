from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Harbor, User

admin.site.register(Harbor)
admin.site.register(User, UserAdmin)
