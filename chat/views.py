import os

from openai import OpenAI

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .redis_service import (
    clear_conversation_from_redis,
    get_messages_from_redis,
    save_message_to_redis,
)
from .serializers import (
    ChatSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
)


class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = serializer.validated_data["message"]
        conversation_id = serializer.validated_data.get(
            "conversation_id"
        )

        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user,
                )
            except Conversation.DoesNotExist:
                return Response(
                    {
                        "error": "Conversation not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            conversation = Conversation.objects.create(
                user=request.user,
                title=message[:50],
            )

        Message.objects.create(
            conversation=conversation,
            role="user",
            content=message,
        )

        try:
            redis_messages = get_messages_from_redis(
                request.user.id,
                conversation.id,
            )
        except Exception as error:
            redis_messages = []

            print(
                "Redis read failed:",
                error,
            )

        if not redis_messages:
            history = conversation.messages.order_by(
                "created_at"
            )

            redis_messages = []

            for chat_message in history:
                redis_message = {
                    "role": chat_message.role,
                    "content": chat_message.content,
                }

                redis_messages.append(
                    redis_message
                )

                try:
                    save_message_to_redis(
                        request.user.id,
                        conversation.id,
                        chat_message.role,
                        chat_message.content,
                    )
                except Exception as error:
                    print(
                        "Redis synchronization failed:",
                        error,
                    )

        else:
            redis_messages.append(
                {
                    "role": "user",
                    "content": message,
                }
            )

            try:
                save_message_to_redis(
                    request.user.id,
                    conversation.id,
                    "user",
                    message,
                )
            except Exception as error:
                print(
                    "Redis save failed:",
                    error,
                )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful AI assistant."
                ),
            }
        ]

        messages.extend(
            redis_messages
        )

        api_key = os.getenv(
            "OPENROUTER_API_KEY"
        )

        if not api_key:
            return Response(
                {
                    "error": (
                        "OPENROUTER_API_KEY is not configured."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
            )

            response = client.chat.completions.create(
                model="openrouter/free",
                messages=messages,
            )

            assistant_message = (
                response.choices[0]
                .message
                .content
            )

            Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=assistant_message,
            )

            try:
                save_message_to_redis(
                    request.user.id,
                    conversation.id,
                    "assistant",
                    assistant_message,
                )
            except Exception as error:
                print(
                    "Redis assistant message save failed:",
                    error,
                )

            return Response(
                {
                    "conversation_id": conversation.id,
                    "message": assistant_message,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            return Response(
                {
                    "error": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            user=request.user
        ).order_by(
            "-updated_at"
        )

        serializer = ConversationSerializer(
            conversations,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "error": "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ConversationDetailSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ConversationDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "error": "Conversation not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            clear_conversation_from_redis(
                request.user.id,
                conversation.id,
            )
        except Exception as error:
            print(
                "Redis conversation deletion failed:",
                error,
            )

        conversation.delete()

        return Response(
            {
                "message": "Conversation deleted permanently."
            },
            status=status.HTTP_200_OK,
        )