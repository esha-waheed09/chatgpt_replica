from django.urls import path

from .views import (
    ChatView,
    ConversationDeleteView,
    ConversationDetailView,
    ConversationListView,
)


urlpatterns = [
    path(
        "",
        ChatView.as_view(),
        name="chat",
    ),

    path(
        "conversations/",
        ConversationListView.as_view(),
        name="conversation-list",
    ),

    path(
        "conversations/<int:conversation_id>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),

    path(
        "conversations/<int:conversation_id>/delete/",
        ConversationDeleteView.as_view(),
        name="conversation-delete",
    ),
]