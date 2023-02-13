import { prisma } from "@/config";

async function getBooking(bookingId: number) {
    return prisma.booking.findFirst({
        where: {
            id: bookingId
        }
    })
}

async function getBookingsInGivenRoom(roomId: number) {
    return prisma.booking.findMany({
        where: {
            roomId
        }
    })
}


async function getBookingByuserId(userId: number) {
    return prisma.booking.findFirst({
        where: {
            userId
        },
        include:{
            Room: true
        }
    })
}

async function insertBooking(roomId: number, userId: number) {
    return prisma.booking.create({
        data:{
            roomId,
            userId
        }
    })
}

async function updateBooking(roomId: number,  bookingId: number) {
    return prisma.booking.update({
        where:{
            id: bookingId
        },
        data:{
            roomId,
        }
    })
}

const bookingRepository = {
    insertBooking, 
    updateBooking,
    getBooking,
    getBookingByuserId,
    getBookingsInGivenRoom
};
  
export default bookingRepository;