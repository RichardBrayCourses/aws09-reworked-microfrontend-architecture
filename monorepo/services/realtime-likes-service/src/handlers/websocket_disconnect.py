from utilities.websocket_connections import delete_connection


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    delete_connection(connection_id)

    return {"statusCode": 200}
