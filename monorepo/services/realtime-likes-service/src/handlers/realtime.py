import json

from utilities.valkey_client import connect_to_valkey
from utilities.realtime_like_buckets import AuthorLikeBuckets, ImageLikeBuckets

BUCKET_COUNT = 20
SECONDS_PER_BUCKET = 5


def handler(event, context):
    cache = connect_to_valkey()
    query = event.get("queryStringParameters") or {}
    image_likes = ImageLikeBuckets(cache, BUCKET_COUNT, SECONDS_PER_BUCKET)
    author_likes = AuthorLikeBuckets(cache, BUCKET_COUNT, SECONDS_PER_BUCKET)
    body = {
        "image": image_likes.chart(query["imageId"]),
        "author": author_likes.chart(query["authorUserId"]),
    }
    cache.close()
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(body),
    }
