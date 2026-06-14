import time

from utilities.circular_buffer import CircularBuffer


class Bucket:
    def __init__(self, slot, bucket_id):
        self.slot = slot
        self.bucket_id = bucket_id

    def field_name(self):
        return self.slot.name()


class BucketWindow:
    def __init__(self, bucket_count, seconds_per_bucket):
        self.seconds_per_bucket = seconds_per_bucket
        self.buffer = CircularBuffer(bucket_count)

    def current_bucket(self):
        return self.bucket_for_id(current_bucket_id(self.seconds_per_bucket))

    def recent_buckets(self):
        current_id = current_bucket_id(self.seconds_per_bucket)
        first_id = current_id - self.buffer.slot_count + 1

        return [
            self.bucket_for_id(bucket_id)
            for bucket_id in range(first_id, current_id + 1)
        ]

    def bucket_for_id(self, bucket_id):
        slot = self.buffer.slot_for_sequence_number(bucket_id)
        return Bucket(slot, bucket_id)


def current_bucket_id(seconds_per_bucket):
    return int(time.time() / seconds_per_bucket)
