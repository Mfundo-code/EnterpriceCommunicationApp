# Generated by Django 4.2.21 on 2025-06-12 07:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('GroomApp', '0014_announcement_noted_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='suggestion',
            name='employee',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='suggestions', to='GroomApp.employee'),
        ),
    ]
