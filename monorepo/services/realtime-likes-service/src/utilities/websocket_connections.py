import os

import boto3
from botocore.exceptions import ClientError


def connections_table():
    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["CONNECTIONS_TABLE_NAME"]
    return dynamodb.Table(table_name)


def save_connection(connection_id):
    table = connections_table()
    table.put_item(Item={"connectionId": connection_id})


def delete_connection(connection_id):
    table = connections_table()
    table.delete_item(Key={"connectionId": connection_id})


def list_connections():
    table = connections_table()
    response = table.scan(ProjectionExpression="connectionId")
    connections = response.get("Items", [])

    while "LastEvaluatedKey" in response:
        response = table.scan(
            ProjectionExpression="connectionId",
            ExclusiveStartKey=response["LastEvaluatedKey"],
        )
        connections.extend(response.get("Items", []))

    return connections


def web_socket_client():
    endpoint_url = os.environ["WEBSOCKET_ENDPOINT"]
    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)


def send_to_connection(connection_id, message):
    client = web_socket_client()

    try:
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=message.encode("utf-8"),
        )
    except ClientError as error:
        status_code = error.response.get("ResponseMetadata", {}).get(
            "HTTPStatusCode",
        )
        if status_code == 410:
            delete_connection(connection_id)
            return

        raise
