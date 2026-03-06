export const generateSlots = ( startTime, endTime, slotDuration ) => {
    if (slotDuration <= 0) return [];
    const slots = [];

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    let start = new Date(0);
    start.setUTCHours(startHour, startMinute, 0);

    let end = new Date(0);
    end.setUTCHours(endHour, endMinute, 0);

    while(start < end) {
        const hours = String(start.getUTCHours()).padStart(2, "0");
        const minutes = String(start.getUTCMinutes()).padStart(2, "0");

        slots.push(`${hours}:${minutes}`);
        start.setUTCMinutes(start.getUTCMinutes() + slotDuration);

    }
    return slots;
};