from rest_framework import serializers

from .models import Conversation, Message


class ChatSerializer(serializers.Serializer):
    message = serializers.CharField(
        required=True,
        allow_blank=False,
    )

    conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    resume_mode = serializers.BooleanField(
        required=False,
        default=False,
    )


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "role",
            "content",
            "created_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
        ]


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
        ]