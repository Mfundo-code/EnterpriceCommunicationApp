from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class EmailConfirmation(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_confirmations'
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Confirmation for {self.user.email} ({'used' if self.is_used else 'active'})"


class ManagerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='manager_profile'
    )
    company_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    daily_summary_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.company_name}"


class Employee(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        null=True
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='employees'
    )
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=False)
    role = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"
    
    class Meta:
        ordering = ['last_name', 'first_name']


class Report(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ATTENDED', 'Attended'),
        ('RESOLVED', 'Resolved'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    message = models.TextField()
    attended_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attended_reports'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    attended_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    def __str__(self):
        return f"Report from {self.employee} - {self.created_at} ({self.get_status_display()})"


class ReportSeen(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='seen_reports'
    )
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='seen_by'
    )
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'report')


class Suggestion(models.Model):
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('UNREAD', 'Unread'),
            ('READ', 'Read'),
            ('ARCHIVED', 'Archived')
        ],
        default='UNREAD'
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='suggestions'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggestions'
    )

    def __str__(self):
        return f"Suggestion for {self.manager.username} - {self.status}"


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_to = models.ManyToManyField(
        Employee,
        related_name='tasks'
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='managed_tasks',
        null=True,  # Allow null for smooth migration
        blank=True
    )
    due_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    class Meta:
        ordering = ['-created_at']


class TaskNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('ASSIGNED', 'Task Assigned'),
        ('UPDATED', 'Task Updated'),
        ('REMINDER', 'Task Reminder'),
    ]
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='task_notifications'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='ASSIGNED'
    )

    def __str__(self):
        return f"Task Notification for {self.employee}"


class ManagerNotification(models.Model):
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    suggestion = models.ForeignKey(
        Suggestion,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Read" if self.is_read else "Unread"
        return f"Notification for {self.manager.username} - {status}"


class EmployeeNotification(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.employee} - {'Read' if self.is_read else 'Unread'}"


class Announcement(models.Model):
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='announcements'
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    seen_by = models.ManyToManyField(
        Employee, 
        related_name='seen_announcements', 
        blank=True
    )
    noted_by = models.ManyToManyField(
        Employee, 
        related_name='noted_announcements', 
        blank=True
    )

    def __str__(self):
        return f"{self.title} by {self.manager.username}"