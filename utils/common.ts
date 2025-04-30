export const getLast7Days = () => {
    const daysOfWeek = ["Paz", "Pzt", "Salı", "Çar", "Per", "Cuma", "Cmt",];
    const result = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        result.push({
            day: daysOfWeek[date.getDay()],
            date: date.toISOString().split("T")[0],
            income: 0,
            expense: 0,
        });
    }
    return result.reverse();
}