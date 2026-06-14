class CircularBufferSlot:
    def __init__(self, number):
        self.number = number

    def name(self):
        return str(self.number)


class CircularBuffer:
    def __init__(self, slot_count):
        self.slot_count = slot_count
        self.values = [None] * slot_count

    def slot_for_sequence_number(self, sequence_number):
        slot_number = sequence_number % self.slot_count
        return CircularBufferSlot(slot_number)

    def read(self, sequence_number):
        slot = self.slot_for_sequence_number(sequence_number)
        return self.values[slot.number]

    def write(self, sequence_number, value):
        slot = self.slot_for_sequence_number(sequence_number)
        self.values[slot.number] = value
