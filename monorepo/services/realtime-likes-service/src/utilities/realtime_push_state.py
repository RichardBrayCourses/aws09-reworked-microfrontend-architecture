import os

import boto3
from botocore.exceptions import ClientError

CURRENT_BUCKET_KEY = "current-realtime-bucket"


def state_table():
    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["PUSH_STATE_TABLE_NAME"]
    return dynamodb.Table(table_name)


def claim_bucket_change(bucket_id):
    table = state_table()

    try:
        table.put_item(
            Item={
                "stateKey": CURRENT_BUCKET_KEY,
                "bucketId": bucket_id,
            },
            ConditionExpression=(
                "attribute_not_exists(bucketId) OR bucketId <> :bucketId"
            ),
            ExpressionAttributeValues={
                ":bucketId": bucket_id,
            },
        )
        return True
    except ClientError as error:
        if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False

        raise


def reset_bucket_state():
    table = state_table()
    table.delete_item(Key={"stateKey": CURRENT_BUCKET_KEY})
