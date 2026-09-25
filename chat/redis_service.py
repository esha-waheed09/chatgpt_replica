import json
import os

import redis


CONVERSATION_TTL = 60 * 60 * 24


def get_redis_client():
    redis_url = os.getenv("REDIS_URL")

    if not redis_url:
        raise RuntimeError(
            "REDIS_URL is not configured."
        )

    return redis.from_url(
        redis_url,
        decode_responses=True,
    )


def get_conversation_key(
    user_id,
    conversation_id,
):
    return (
        f"chat:user:{user_id}:"
        f"conversation:{conversation_id}"
    )


def save_message_to_redis(
    user_id,
    conversation_id,
    role,
    content,
):
    redis_client = get_redis_client()

    key = get_conversation_key(
        user_id,
        conversation_id,
    )

    message = {
        "role": role,
        "content": content,
    }

    redis_client.rpush(
        key,
        json.dumps(message),
    )

    redis_client.expire(
        key,
        CONVERSATION_TTL,
    )


def get_messages_from_redis(
    user_id,
    conversation_id,
):
    redis_client = get_redis_client()

    key = get_conversation_key(
        user_id,
        conversation_id,
    )

    stored_messages = redis_client.lrange(
        key,
        0,
        -1,
    )

    if stored_messages:
        redis_client.expire(
            key,
            CONVERSATION_TTL,
        )

    return [
        json.loads(message)
        for message in stored_messages
    ]


def clear_conversation_from_redis(
    user_id,
    conversation_id,
):
    redis_client = get_redis_client()

    key = get_conversation_key(
        user_id,
        conversation_id,
    )

    redis_client.delete(key)