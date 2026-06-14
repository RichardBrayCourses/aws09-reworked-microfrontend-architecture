from utilities.bucket_window import BucketWindow


class RealtimeCounterBuckets:
    def __init__(self, cache, key_prefix, bucket_count, seconds_per_bucket):
        self.cache = cache
        self.key_prefix = key_prefix
        self.window = BucketWindow(bucket_count, seconds_per_bucket)

    def record_change(self, item_id, event_type):
        key = self.key_for(item_id)
        bucket = self.window.current_bucket()
        current_likes = self.likes_in_bucket(key, bucket)
        new_likes = current_likes + likes_change(event_type)
        self.save_likes_in_bucket(key, bucket, new_likes)

    def chart(self, item_id):
        key = self.key_for(item_id)
        points = []

        for bucket in self.window.recent_buckets():
            point = {
                "likes": self.likes_in_bucket(key, bucket),
            }
            points.append(point)

        return points

    def key_for(self, item_id):
        return self.key_prefix + ":" + item_id

    def likes_in_bucket(self, key, bucket):
        value = self.cache.read_hash_field(key, bucket.field_name())

        if value_matches_bucket(value, bucket):
            return stored_count(value)

        return 0

    def save_likes_in_bucket(self, key, bucket, likes):
        value = bucket_value(bucket, likes)
        self.cache.write_hash_field(key, bucket.field_name(), value)
        self.cache.expire_key_after_seconds(key, 120)


class ImageLikeBuckets:
    def __init__(self, cache, bucket_count, seconds_per_bucket):
        self.buckets = RealtimeCounterBuckets(
            cache,
            "image",
            bucket_count,
            seconds_per_bucket,
        )

    def record_like(self, image_id, event_type):
        self.buckets.record_change(image_id, event_type)

    def chart(self, image_id):
        return self.buckets.chart(image_id)


class AuthorLikeBuckets:
    def __init__(self, cache, bucket_count, seconds_per_bucket):
        self.buckets = RealtimeCounterBuckets(
            cache,
            "author",
            bucket_count,
            seconds_per_bucket,
        )

    def record_like(self, author_user_id, event_type):
        self.buckets.record_change(author_user_id, event_type)

    def chart(self, author_user_id):
        return self.buckets.chart(author_user_id)


def likes_change(event_type):
    if event_type == "like.created":
        return 1

    return -1


def value_matches_bucket(value, bucket):
    if not value:
        return False

    return stored_bucket_id(value) == bucket.bucket_id


def stored_bucket_id(value):
    return int(value.split(":")[0])


def stored_count(value):
    return int(value.split(":")[1])


def bucket_value(bucket, likes):
    return str(bucket.bucket_id) + ":" + str(likes)
