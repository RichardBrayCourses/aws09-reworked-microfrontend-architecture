import json

from utilities.valkey_client import connect_to_valkey
from utilities.realtime_like_buckets import AuthorLikeBuckets, ImageLikeBuckets

BUCKET_COUNT = 20
SECONDS_PER_BUCKET = 5


def handler(event, context):
    processed = 0
    created = 0
    deleted = 0
    cache = connect_to_valkey()
    image_likes = ImageLikeBuckets(cache, BUCKET_COUNT, SECONDS_PER_BUCKET)
    author_likes = AuthorLikeBuckets(cache, BUCKET_COUNT, SECONDS_PER_BUCKET)

    for record in event.get("Records", []):
        like_event = parse_like_event(record)
        event_type = like_event["eventType"]

        processed = processed + 1

        if event_type == "likes.deleted.all":
            cache.delete_all_keys()
            print(json.dumps({"message": "realtime likes reset", **like_event}))
            continue

        if event_type == "like.created":
            created = created + 1

        if event_type == "like.deleted":
            deleted = deleted + 1

        image_likes.record_like(like_event["imageId"], event_type)
        author_likes.record_like(like_event["authorUserId"], event_type)

        print(json.dumps({"message": "realtime like event consumed", **like_event}))

    cache.close()
    return {"processed": processed, "created": created, "deleted": deleted}


def parse_like_event(record):
    body = json.loads(record["body"])

    if "Message" in body:
        return json.loads(body["Message"])

    return body
