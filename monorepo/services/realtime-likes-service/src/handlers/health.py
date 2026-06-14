import json
from typing import Any


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Public health endpoint for the realtime likes service.    """

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(
            {
                "status": "ok",
                "service": "realtime-likes-service",
                "runtime": "python",
            }
        ),
    }
