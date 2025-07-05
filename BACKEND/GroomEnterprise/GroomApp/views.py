from datetime import timedelta
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, generics, status, pagination
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
import random
from django.core.mail import send_mail
from django.conf import settings
from django.utils.dateparse import parse_datetime

from .models import (
    Employee,
    Report,
    ManagerNotification,
    Task,
    Announcement,
    Suggestion,
    ManagerProfile,
    EmployeeNotification,
    EmailConfirmation,
)
from .serializers import (
    ManagerSignupSerializer,
    EmployeeSerializer,
    ReportSerializer,
    ManagerNotificationSerializer,
    TaskSerializer,
    AnnouncementSerializer,
    SuggestionSerializer,
    EmployeeNotificationSerializer,
)

User = get_user_model()


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'manager_profile')


class TaskPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ManagerSignupView(generics.CreateAPIView):
    serializer_class = ManagerSignupSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        username = serializer.validated_data['username']
        company_name = serializer.validated_data['company_name']
        phone_number = serializer.validated_data['phone_number']
        
        # Create user but mark as inactive
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False  # Inactive until email confirmed
        )
        
        # Create manager profile
        manager_profile = ManagerProfile.objects.create(
            user=user,
            company_name=company_name,
            phone_number=phone_number
        )
        
        # Generate confirmation code (6 digits)
        confirmation_code = str(random.randint(100000, 999999))
        
        # Create confirmation record (valid for 24 hours)
        expires_at = timezone.now() + timedelta(hours=24)
        EmailConfirmation.objects.create(
            user=user,
            code=confirmation_code,
            expires_at=expires_at
        )
        
        # Send email with confirmation code
        try:
            send_mail(
                subject='Confirm Your Email for TeamKonekt',
                message=f'Your confirmation code is: {confirmation_code}\n\n'
                        f'This code will expire in 24 hours.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            # Handle email sending failure
            user.delete()  # Clean up user record
            return Response(
                {'error': f'Failed to send confirmation email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'Confirmation code sent to your email',
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)


class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        code = request.data.get('code')
        
        if not user_id or not code:
            return Response(
                {'error': 'Both user_id and code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            confirmation = EmailConfirmation.objects.get(
                user_id=user_id,
                code=code,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except EmailConfirmation.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Activate user
        user = confirmation.user
        user.is_active = True
        user.save()
        
        # Mark confirmation as used
        confirmation.is_used = True
        confirmation.save()
        
        return Response({'message': 'Email confirmed successfully'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user is active
        if not user.is_active:
            return Response(
                {'error': 'Account not activated. Please confirm your email.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(username=user.username, password=password)

        if user:
            token, _ = Token.objects.get_or_create(user=user)

            if hasattr(user, 'manager_profile'):
                user_type = 'manager'
                company_name = user.manager_profile.company_name
            elif hasattr(user, 'employee_profile'):
                user_type = 'employee'
                company_name = user.employee_profile.manager.manager_profile.company_name
            else:
                user_type = 'unknown'
                company_name = ''

            return Response({
                'token': token.key,
                'user_type': user_type,
                'company_name': company_name
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    data = {
        'id': request.user.id, 
        'username': request.user.username,
        'is_manager': hasattr(request.user, 'manager_profile'),
        'is_employee': hasattr(request.user, 'employee_profile'),
    }

    if hasattr(request.user, 'employee_profile'):
        data['employee_profile_id'] = request.user.employee_profile.id

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_counts(request):
    if hasattr(request.user, 'manager_profile'):
        manager = request.user
        profile = manager.manager_profile
        
        # Reports: count unread notifications OR reports since last seen
        if profile.last_seen_reports:
            reports_count = Report.objects.filter(
                employee__manager=manager,
                created_at__gt=profile.last_seen_reports,
                status='PENDING'
            ).count()
        else:
            reports_count = ManagerNotification.objects.filter(
                manager=manager, 
                report__isnull=False,
                is_read=False
            ).count()
            
        # Suggestions: only count unread notifications
        suggestions_count = ManagerNotification.objects.filter(
            manager=manager, 
            suggestion__isnull=False,
            is_read=False
        ).count()
        
        return Response({
            'reports': reports_count,
            'suggestions': suggestions_count,
            'tasks': 0,
            'announcements': 0
        })
        
    elif hasattr(request.user, 'employee_profile'):
        employee = request.user.employee_profile
        manager = employee.manager
        
        # Reports: count pending reports since last seen
        reports_count = Report.objects.filter(
            employee=employee,
            status='PENDING',
            created_at__gt=employee.last_seen_reports if employee.last_seen_reports else timezone.now()
        ).count()
        
        # Tasks: count pending tasks
        tasks_count = Task.objects.filter(
            assigned_to=employee,
            status__in=['PENDING', 'IN_PROGRESS']
        ).count()
        
        # Announcements: count unread announcements
        announcements_count = Announcement.objects.filter(
            manager=manager
        ).exclude(
            noted_by=employee
        ).count()
        
        return Response({
            'reports': reports_count,
            'tasks': tasks_count,
            'announcements': announcements_count,
            'suggestions': 0
        })
        
    return Response({
        'reports': 0,
        'tasks': 0,
        'announcements': 0,
        'suggestions': 0
    })

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return Employee.objects.filter(manager=self.request.user).order_by('last_name', 'first_name')

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password', User.objects.make_random_password())

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', ''),
        )

        employee = Employee.objects.create(
            user=user,
            manager=request.user,
            first_name=request.data.get('first_name'),
            last_name=request.data.get('last_name'),
            email=email,
            role=request.data.get('role'),
            phone_number=request.data.get('phone_number'),
        )

        serializer = self.get_serializer(employee)
        response_data = serializer.data
        response_data['temporary_password'] = password
        return Response(response_data, status=status.HTTP_201_CREATED)


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            return Report.objects.filter(employee=user.employee_profile).order_by('-created_at')
        elif hasattr(user, 'manager_profile'):
            return Report.objects.filter(employee__manager=user).order_by('-created_at')
        return Report.objects.none()

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'employee_profile'):
            raise PermissionDenied("Only employees can create reports")

        report = serializer.save(employee=self.request.user.employee_profile)
        ManagerNotification.objects.create(
            manager=report.employee.manager,
            report=report,
            is_read=False
        )

    @action(detail=True, methods=['post'])
    def attend(self, request, pk=None):
        report = self.get_object()
        report.status = 'ATTENDED'
        report.attended_by = request.user
        report.attended_at = timezone.now()
        report.save()
        
        response_data = self.get_serializer(report).data
        response_data['attended_by_id'] = request.user.id
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        report = self.get_object()
        report.status = 'RESOLVED'
        report.resolved_at = timezone.now()
        report.save()
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class NotificationCountView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        manager = request.user
        counts = {
            'reports': ManagerNotification.objects.filter(manager=manager, report__isnull=False, is_read=False).count(),
            'suggestions': ManagerNotification.objects.filter(manager=manager, suggestion__isnull=False, is_read=False).count(),
            'tasks': ManagerNotification.objects.filter(manager=manager, task__isnull=False, is_read=False).count(),
        }
        counts['total'] = sum(counts.values())
        return Response(counts)


class UnreadReportsView(generics.ListAPIView):
    serializer_class = ManagerNotificationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        return ManagerNotification.objects.filter(
            manager=self.request.user,
            report__isnull=False,
            is_read=False
        ).select_related('report__employee').order_by('-created_at')


class MarkNotificationReadView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        notif = get_object_or_404(ManagerNotification, pk=pk, manager=request.user)
        notif.is_read = True
        notif.save()
        return Response({'detail': 'Marked as read.'})


class SuggestionViewSet(viewsets.ModelViewSet):
    serializer_class = SuggestionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'manager_profile'):
            return Suggestion.objects.filter(
                manager=self.request.user
            ).order_by('-created_at')
        elif hasattr(self.request.user, 'employee_profile'):
            return Suggestion.objects.filter(
                employee=self.request.user.employee_profile
            ).order_by('-created_at')
        return Suggestion.objects.none()

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsManager()]
        return [IsAuthenticated()]

    def partial_update(self, request, *args, **kwargs):
        if 'status' in request.data:
            return super().partial_update(request, *args, **kwargs)
        return Response(
            {'error': 'Only status can be updated'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def perform_create(self, serializer):
        if hasattr(self.request.user, 'employee_profile'):
            emp = self.request.user.employee_profile
            suggestion = serializer.save(
                manager=emp.manager,
                employee=emp
            )
            ManagerNotification.objects.create(
                manager=emp.manager,
                suggestion=suggestion,
                is_read=False
            )
        else:
            raise PermissionDenied("Only employees can create suggestions")


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    pagination_class = TaskPagination

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'manager_profile'):
            return Task.objects.filter(assigned_to__manager=user).order_by('-created_at')
        return Task.objects.filter(assigned_to__user=user).order_by('-created_at')

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'manager_profile'):
            raise PermissionDenied("Only managers can create tasks")
        serializer.save()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        if hasattr(user, 'employee_profile'):
            new_status = request.data.get('status')
            if not new_status:
                return Response({'error': 'Status is required'}, status=400)

            valid_transitions = {
                'PENDING': ['IN_PROGRESS'],
                'IN_PROGRESS': ['COMPLETED'],
                'COMPLETED': ['IN_PROGRESS']
            }

            if new_status not in valid_transitions.get(instance.status, []):
                return Response(
                    {'error': f'Invalid status transition from {instance.status} to {new_status}'},
                    status=400
                )

            instance.status = new_status
            instance.save()
            return Response(TaskSerializer(instance).data)

        return super().update(request, *args, **kwargs)


class TaskCompletedView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]
    pagination_class = TaskPagination

    def get_queryset(self):
        return Task.objects.filter(
            status='COMPLETED',
            assigned_to__manager=self.request.user
        ).order_by('-created_at')


class TaskPendingView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]
    pagination_class = TaskPagination

    def get_queryset(self):
        return Task.objects.filter(
            status__in=['PENDING', 'IN_PROGRESS'],
            assigned_to__manager=self.request.user
        ).order_by('-created_at')


class TaskOverdueView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]
    pagination_class = TaskPagination

    def get_queryset(self):
        today = timezone.now().date()
        return Task.objects.filter(
            due_date__lt=today,
            status__in=['PENDING', 'IN_PROGRESS'],
            assigned_to__manager=self.request.user
        ).order_by('-created_at')


class TaskDuePeriodView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]
    pagination_class = TaskPagination

    def get_queryset(self):
        today = timezone.now().date()
        period = self.kwargs['period']

        if period == 'day':
            return Task.objects.filter(due_date=today).order_by('-created_at')  
        elif period == 'week':
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return Task.objects.filter(due_date__range=(start, end)).order_by('-created_at')
        elif period == 'month':
            return Task.objects.filter(due_date__year=today.year, due_date__month=today.month).order_by('-created_at')
        return Task.objects.none()


class SendTaskReminderView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        for emp in task.assigned_to.all():
            EmployeeNotification.objects.create(
                employee=emp,
                task=task,
                message=f"Reminder: Task '{task.title}' is due on {task.due_date}",
                is_read=False
            )
        return Response({'detail': 'Reminders sent successfully.'})


class SetDailySummaryTimeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request):
        time_str = request.data.get('time')
        if not time_str:
            return Response({'detail': 'Missing "time" field.'}, status=400)
        manager_profile = request.user.manager_profile
        manager_profile.daily_summary_time = time_str
        manager_profile.save()
        return Response({'detail': 'Daily summary time updated successfully.'})


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    authentication_classes = [TokenAuthentication]
    permission_permissions = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'manager_profile'):
            return Announcement.objects.filter(manager=user).order_by('-created_at')
        return Announcement.objects.filter(manager=user.employee_profile.manager).order_by('-created_at')

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'manager_profile'):
            raise PermissionDenied("Only managers can create announcements")
        serializer.save(manager=self.request.user)


class EmployeeNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeNotificationSerializer
    authentication_classes = [TokenAuthentication]
    permission_permissions = [IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'employee_profile'):
            return EmployeeNotification.objects.filter(employee=self.request.user.employee_profile).order_by('-created_at')
        return EmployeeNotification.objects.none()


class EmployeeTaskView(generics.ListAPIView):
    serializer_class = TaskSerializer
    authentication_classes = [TokenAuthentication]
    permission_permissions = [IsAuthenticated]
    pagination_class = TaskPagination

    def get_queryset(self):
        if not hasattr(self.request.user, 'employee_profile'):
            raise PermissionDenied("Only employees can view tasks")

        employee = self.request.user.employee_profile
        status_filter = self.kwargs.get('status', 'all')

        qs = Task.objects.filter(assigned_to=employee).order_by('-created_at')
        if status_filter == 'pending':
            return qs.filter(status__in=['PENDING', 'IN_PROGRESS'])
        elif status_filter == 'completed':
            return qs.filter(status='COMPLETED')
        return qs


class MarkAnnouncementNotedView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        announcement = get_object_or_404(Announcement, pk=pk)
        employee = request.user.employee_profile
        
        if announcement.noted_by.filter(id=employee.id).exists():
            return Response({'detail': 'Already noted'}, status=status.HTTP_400_BAD_REQUEST)
        
        announcement.noted_by.add(employee)
        return Response({'detail': 'Marked as noted'}, status=status.HTTP_200_OK)


class NotedEmployeesView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        announcement = get_object_or_404(Announcement, pk=self.kwargs['pk'])
        return announcement.noted_by.all()
    
class ChangePasswordView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not old_password or not new_password or not confirm_password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({'error': 'New passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully'})

class ResetNotificationCountView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        notification_type = request.data.get('type')
        if not notification_type:
            return Response({'error': 'Type is required'}, status=400)
        
        user = request.user
        
        # For manager notifications
        if hasattr(user, 'manager_profile'):
            if notification_type == 'reports':
                # Get all unread report notifications
                notifications = ManagerNotification.objects.filter(
                    manager=user, 
                    report__isnull=False,
                    is_read=False
                )
                
                # Mark them as read
                notifications.update(is_read=True)
                
                # Also update last seen timestamp for reports
                user.manager_profile.last_seen_reports = timezone.now()
                user.manager_profile.save()
                
            elif notification_type == 'suggestions':
                # Mark suggestion notifications as read
                ManagerNotification.objects.filter(
                    manager=user, 
                    suggestion__isnull=False,
                    is_read=False
                ).update(is_read=True)
        
        # For employee notifications
        elif hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            if notification_type == 'reports':
                # Update last seen timestamp for employee reports
                employee.last_seen_reports = timezone.now()
                employee.save()
                
            elif notification_type == 'tasks':
                # Complete pending tasks
                Task.objects.filter(
                    assigned_to=employee,
                    status__in=['PENDING', 'IN_PROGRESS']
                ).update(status='COMPLETED')
                
            elif notification_type == 'announcements':
                # Mark announcements as noted
                announcements = Announcement.objects.filter(
                    manager=employee.manager
                ).exclude(noted_by=employee)
                for ann in announcements:
                    ann.noted_by.add(employee)

        return Response({'detail': 'Notification count reset'})