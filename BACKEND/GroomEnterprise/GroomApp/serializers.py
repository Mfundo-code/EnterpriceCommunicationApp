from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    ManagerProfile,
    Employee,
    Report,
    Suggestion,
    ManagerNotification,
    EmployeeNotification,
    Task,
    Announcement,
)

class ManagerSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'company_name', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        ManagerProfile.objects.create(
            user=user,
            company_name=validated_data['company_name'],
            phone_number=validated_data['phone_number']
        )
        return user

class EmployeeSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    temporary_password = serializers.CharField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'role',
            'phone_number',
            'tasks',
            'temporary_password',
        ]

    def get_tasks(self, obj):
        qs = Task.objects.filter(assigned_to=obj)
        return TaskSerializer(qs, many=True).data

class ReportSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    attended_by_name = serializers.SerializerMethodField()
    attended_by = serializers.PrimaryKeyRelatedField(read_only=True)
    attended_by_id = serializers.IntegerField(
        source='attended_by.id', 
        read_only=True
    )
    employee_phone = serializers.CharField(
        source='employee.phone_number', 
        read_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Report
        fields = [
            'id',
            'employee',
            'employee_name',
            'message',
            'attended_by',
            'attended_by_id',
            'attended_by_name',
            'created_at',
            'attended_at',
            'resolved_at',
            'status',
            'employee_phone'
        ]
        read_only_fields = ['employee', 'created_at', 'attended_at', 'resolved_at', 'status']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_attended_by_name(self, obj):
        if obj.attended_by:
            return f"{obj.attended_by.first_name} {obj.attended_by.last_name}"
        return None

class SuggestionSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = ['id', 'message', 'created_at', 'status', 'employee_name', 'employee']
        # Removed 'status' from read_only_fields to allow status updates
        read_only_fields = ['id', 'created_at', 'manager', 'employee_name', 'employee']

    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        return None

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Employee.objects.all()
    )
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'assigned_to',
            'employee_name',
            'due_date',
            'status',
            'priority',
            'created_at',
            'completed_at',
        ]
        read_only_fields = ['created_at', 'completed_at', 'employee_name']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request.user, 'manager_profile'):
            self.fields['assigned_to'].queryset = Employee.objects.filter(manager=request.user)

    def get_employee_name(self, obj):
        names = [f"{e.first_name} {e.last_name}" for e in obj.assigned_to.all()]
        return ", ".join(names)

class ManagerNotificationSerializer(serializers.ModelSerializer):
    report = ReportSerializer(read_only=True)
    suggestion = SuggestionSerializer(read_only=True)
    task = TaskSerializer(read_only=True)

    class Meta:
        model = ManagerNotification
        fields = ['id', 'report', 'suggestion', 'task', 'is_read', 'created_at']
        read_only_fields = ['created_at']

class EmployeeNotificationSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)

    class Meta:
        model = EmployeeNotification
        fields = ['id', 'task', 'message', 'is_read', 'created_at']
        read_only_fields = ['created_at']

class AnnouncementSerializer(serializers.ModelSerializer):
    manager = serializers.StringRelatedField(read_only=True)
    noted_by = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    noted_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'manager', 
            'created_at', 'updated_at', 'noted_by', 'noted_count'
        ]
        read_only_fields = [
            'manager', 'created_at', 'updated_at', 
            'noted_by', 'noted_count'
        ]

    def get_noted_count(self, obj):
        return obj.noted_by.count()