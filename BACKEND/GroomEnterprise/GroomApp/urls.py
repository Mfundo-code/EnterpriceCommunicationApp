from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ManagerSignupView,
    LoginView,
    LogoutView,
    EmployeeViewSet,
    ReportViewSet,
    notification_counts, 
    ResetNotificationCountView,
    UnreadReportsView,
    MarkNotificationReadView,
    TaskViewSet,
    EmployeeTaskView,
    TaskNotificationViewSet,
    SendTaskReminderView,
    TaskCountView,
    EmployeeNotificationViewSet,
    AnnouncementViewSet,
    SuggestionViewSet,
    ChangePasswordView,
    MarkAnnouncementNotedView,
    NotedEmployeesView,
    current_user,
    ConfirmEmailView,
    mark_report_seen,
    mark_all_reports_seen
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-notifications', TaskNotificationViewSet, basename='task-notification')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'suggestions', SuggestionViewSet, basename='suggestion')
router.register(r'employee-notifications', EmployeeNotificationViewSet, basename='employee-notification')

urlpatterns = [
    # Authentication
    path('auth/user/', current_user, name='current-user'),
    path('signup/', ManagerSignupView.as_view(), name='manager-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('confirm-email/', ConfirmEmailView.as_view(), name='confirm-email'),

    # Notifications
    path('notifications/count/', notification_counts, name='notifications-count'),
    path('reports/unread/', UnreadReportsView.as_view(), name='reports-unread'),
    path('notifications/read/<int:pk>/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('notifications/reset-count/', ResetNotificationCountView.as_view(), name='reset-notification-count'),
    
    # Report seen endpoints
    path('reports/mark-seen/<int:report_id>/', mark_report_seen, name='mark-report-seen'),
    path('reports/mark-all-seen/', mark_all_reports_seen, name='mark-all-reports-seen'),

    # Report actions
    path('reports/<int:pk>/attend/', ReportViewSet.as_view({'post': 'attend'}), name='report-attend'),
    path('reports/<int:pk>/resolve/', ReportViewSet.as_view({'post': 'resolve'}), name='report-resolve'),

    # Tasks
    path('tasks/count/', TaskCountView.as_view(), name='task-count'),
    path('tasks/<int:pk>/remind/', SendTaskReminderView.as_view(), name='task-remind'),
    path('tasks/<int:pk>/mark-read/', TaskViewSet.as_view({'post': 'mark_read'}), name='task-mark-read'),
    path('employee-tasks/', EmployeeTaskView.as_view(), name='employee-tasks'),
    path('task-notifications/mark-all-read/', TaskNotificationViewSet.as_view({'post': 'mark_all_read'}), name='task-notifications-mark-all-read'),

    # Announcement actions
    path('announcements/<int:pk>/mark_noted/', MarkAnnouncementNotedView.as_view(), name='mark-announcement-noted'),
    path('announcements/<int:pk>/noted_employees/', NotedEmployeesView.as_view(), name='noted-employees'),

    # Include other router URLs
    path('', include(router.urls)),
]