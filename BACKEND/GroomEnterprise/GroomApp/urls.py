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
    TaskCompletedView,
    TaskPendingView,
    TaskOverdueView,
    TaskDuePeriodView,
    SendTaskReminderView,
    SetDailySummaryTimeView,
    EmployeeNotificationViewSet,
    AnnouncementViewSet,
    SuggestionViewSet,
    ChangePasswordView,
    EmployeeTaskView,
    MarkAnnouncementNotedView,
    NotedEmployeesView,
    current_user,
    ConfirmEmailView,
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'employee-notifications', EmployeeNotificationViewSet, basename='employee-notification')

urlpatterns = [
    # Authentication
    path('auth/user/', current_user, name='current-user'),
    path('signup/', ManagerSignupView.as_view(), name='manager-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('confirm-email/', ConfirmEmailView.as_view(), name='confirm-email'),

    # Notifications - UPDATED
    path('notifications/count/', notification_counts, name='notifications-count'),  # Changed to function view
    path('reports/unread/', UnreadReportsView.as_view(), name='reports-unread'),
    path('notifications/read/<int:pk>/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
    path('notifications/reset-count/', ResetNotificationCountView.as_view(), name='reset-notification-count'),

    # Report actions
    path('reports/<int:pk>/attend/', ReportViewSet.as_view({'post': 'attend'}), name='report-attend'),
    path('reports/<int:pk>/resolve/', ReportViewSet.as_view({'post': 'resolve'}), name='report-resolve'),

    # Tasks
    path('tasks/completed/', TaskCompletedView.as_view(), name='completed-tasks'),
    path('tasks/pending/', TaskPendingView.as_view(), name='pending-tasks'),
    path('tasks/overdue/', TaskOverdueView.as_view(), name='overdue-tasks'),
    path('tasks/due/<str:period>/', TaskDuePeriodView.as_view(), name='due-period-tasks'),
    path('tasks/<int:pk>/remind/', SendTaskReminderView.as_view(), name='task-remind'),

    # Manager features
    path('manager/set-summary-time/', SetDailySummaryTimeView.as_view(), name='set-summary-time'),

    # Announcement actions
    path('announcements/<int:pk>/mark_noted/', MarkAnnouncementNotedView.as_view(), name='mark-announcement-noted'),
    path('announcements/<int:pk>/noted_employees/', NotedEmployeesView.as_view(), name='noted-employees'),

    # Suggestion endpoints
    path('suggestions/', SuggestionViewSet.as_view({'get': 'list', 'post': 'create'}), name='suggestion-list'),
    path('suggestions/<int:pk>/', SuggestionViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='suggestion-detail'),
    path('suggestions/status/<str:status>/', SuggestionViewSet.as_view({'get': 'list'}), name='suggestion-by-status'),

    # Employee task views
    path('employee-tasks/', EmployeeTaskView.as_view(), name='employee-tasks'),
    path('employee-tasks/<str:status>/', EmployeeTaskView.as_view(), name='employee-tasks-filtered'),

    # Include other router URLs
    path('', include(router.urls)),
]