from utilities.websocket_connections import save_connection


def handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    save_connection(connection_id)

    return {"statusCode": 200}
