# Generated by Django 4.2.21 on 2025-06-07 05:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('GroomApp', '0010_report_attended_by_alter_employeerequest_status'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='employee',
            options={'ordering': ['last_name', 'first_name']},
        ),
        migrations.AlterModelOptions(
            name='task',
            options={'ordering': ['-created_at']},
        ),
    ]
