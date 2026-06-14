import json
import os

from utilities.bucket_window import current_bucket_id
from utilities.realtime_push_state import claim_bucket_change, reset_bucket_state
from utilities.websocket_connections import list_connections, send_to_connection

SECONDS_PER_BUCKET = int(os.environ["REALTIME_SECONDS_PER_BUCKET"])


def handler(event, context):
    sent = 0

    for record in event.get("Records", []):
        like_event = parse_like_event(record)
        message = push_message_for(like_event)

        if not message:
            continue

        for connection in list_connections():
            send_to_connection(connection["connectionId"], message)
            sent = sent + 1

    return {"sent": sent}


def parse_like_event(record):
    sns = record["Sns"]
    return json.loads(sns["Message"])


def push_message_for(like_event):
    if like_event["eventType"] == "likes.deleted.all":
        reset_bucket_state()
        return json.dumps(
            {
                "type": "likes-reset",
            },
        )

    bucket_id = current_bucket_id(SECONDS_PER_BUCKET)

    if not claim_bucket_change(bucket_id):
        return None

    return json.dumps(
        {
            "type": "realtime-bucket-changed",
        },
    )
