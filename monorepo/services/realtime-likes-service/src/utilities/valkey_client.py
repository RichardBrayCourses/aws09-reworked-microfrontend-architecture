import os
import socket
import ssl


class ValkeyClient:
    def __init__(self, connection):
        self.connection = connection

    def read_hash_field(self, key, field):
        return self.command("HGET", key, field)

    def write_hash_field(self, key, field, value):
        return self.command("HSET", key, field, value)

    def expire_key_after_seconds(self, key, seconds):
        return self.command("EXPIRE", key, seconds)

    def delete_all_keys(self):
        return self.command("FLUSHDB")

    def close(self):
        self.connection.close()

    def command(self, *parts):
        self.connection.sendall(valkey_message(parts).encode())
        return valkey_reply_value(self.connection.recv(4096))


def connect_to_valkey():
    host = os.environ["CACHE_HOST"]
    connection = socket.create_connection((host, 6379))
    encrypted_connection = ssl.create_default_context().wrap_socket(
        connection,
        server_hostname=host,
    )
    return ValkeyClient(encrypted_connection)


def valkey_message(parts):
    message = valkey_array_header(parts)

    for part in parts:
        message = message + valkey_bulk_string(part)

    return message


def valkey_array_header(parts):
    return "*" + str(len(parts)) + "\r\n"


def valkey_bulk_string(value):
    value = str(value)
    return "$" + str(len(value)) + "\r\n" + value + "\r\n"


def valkey_reply_value(reply):
    if reply.startswith(b"$-1"):
        return None

    if reply.startswith(b"$"):
        return reply.split(b"\r\n")[1].decode()

    return reply.decode()
